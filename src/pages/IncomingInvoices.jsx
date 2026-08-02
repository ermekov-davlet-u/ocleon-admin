import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Tag, Space, message, Modal, Grid, Card, Form, Input, InputNumber,
  Switch, Divider, Select, DatePicker, Row, Col, Empty, Tooltip,
} from 'antd';
import { EditOutlined, SafetyCertificateOutlined, ScissorOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useChangeOrderStatusMutation,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
  useUseWarrantyMutation,
} from '../store/api/orderApi';
import { useAllOrders } from '../hooks/useAllOrders';
import { useGetDeviceTypesQuery } from '../store/api/cuttingApi';
import { useGetMaterialsQuery } from '../store/api/materialsApi';
import { useGetDiscountsQuery } from '../store/api/discountApi';

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;
const { Option } = Select;

export const CuttingOrderStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  REWORK: 'REWORK',
  DEFECT: 'DEFECT',
};

const statusColors = {
  NEW: 'blue',
  IN_PROGRESS: 'orange',
  DONE: 'green',
  REWORK: 'red',
  DEFECT: 'volcano',
};

const statusLabels = {
  NEW: 'Новый',
  IN_PROGRESS: 'В работе',
  DONE: 'Готово',
  REWORK: 'Переклейка',
  DEFECT: 'Брак',
};

const RULE_LABEL = {
  SECOND_WRAPPING: 'Вторая оклейка',
  REFERRAL: 'Привёл друга',
  SECOND_DEVICE: 'Второе устройство',
  MANUAL: 'Ручная',
};

function calcDiscountedAmount(base, discount) {
  if (!discount || !base) return base ?? 0;
  switch (discount.type) {
    case 'PERCENT':
    case 'PERCENTAGE':
      return Math.max(0, base - (base * discount.value) / 100);
    case 'FIXED':
      return Math.max(0, base - discount.value);
    case 'PRICE_OVERRIDE':
      return discount.value;
    default:
      return base;
  }
}

const canUseWarranty = (record) => {
  if (!record?.createdAt) return false;

  // нет клиента — нельзя
  if (!record.client) return false;

  // нет телефона — тоже нельзя
  if (!record.client.phone) return false;

  // гарантийная оклейка сама гарантию не имеет
  if (record.isWarrantyOrder) return false;

  // гарантия уже использована
  if (record.warrantyUsed) return false;

  // брак не может идти в гарантию
  if (record.status === CuttingOrderStatus.DEFECT) return false;

  const daysSince = Math.floor(
    (Date.now() - new Date(record.createdAt)) / 86400000
  );

  return daysSince <= 365;
};



// TODO: подставьте реальное поле с URL файла чертежа, если оно отличается.
// Здесь я предполагаю, что cuttingJob.file либо уже содержит готовый url,
// либо просто имя файла, которое лежит в корне диска.
function getCuttingFileUrl(record) {
  const file = record?.file || record?.cuttingJob?.file;
  if (!file) return null;
  if (file.url) return file.url;
  if (file.name) return `https://ocleon.333.kg/${record?.file?.path}`;
  return null;
}

// Разбирает record.file.path (полный относительный путь вида "folder/sub/name.eps")
// на директорию и базовое имя файла без расширения.
function parseCuttingFilePath(filePath) {
  const lastSlash = filePath.lastIndexOf('/');
  const dirPath = lastSlash >= 0 ? filePath.substring(0, lastSlash) : '';
  const fileNameWithExt = lastSlash >= 0 ? filePath.substring(lastSlash + 1) : filePath;
  const dotIndex = fileNameWithExt.lastIndexOf('.');
  const baseName = dotIndex >= 0 ? fileNameWithExt.substring(0, dotIndex) : fileNameWithExt;
  return { dirPrefix: dirPath ? `/${dirPath}` : '', baseName };
}

// Ищет на диске файл .eps/.cdr по базовому имени, конвертирует его в цепочке
// cdr -> eps -> plt (при необходимости) и отправляет итоговый .plt на локальный станок.
async function runCuttingJob(filePath) {
  if (!filePath) {
    throw new Error('Не найден путь к файлу чертежа для резки');
  }

  const host = 'https://ocleon.333.kg';
  const { dirPrefix, baseName } = parseCuttingFilePath(filePath);

  let fileBlob = null;
  let finalFileName = '';
  let foundExt = '';

  const extensions = ['eps', 'cdr'];

  // 1. Перебираем расширения, пока не найдем рабочий файл
  for (const ext of extensions) {
    const currentFileName = `${baseName}.${ext}`;
    const currentFileUrl = `${host}${dirPrefix}/${currentFileName}`;

    try {
      const response = await fetch(currentFileUrl);
      if (response.ok) {
        fileBlob = await response.blob();
        finalFileName = currentFileName;
        foundExt = ext;
        break;
      }
    } catch (fetchError) {
      console.warn(`Ошибка сети при запросе ${currentFileName}`);
    }
  }

  if (!fileBlob) {
    throw new Error('На сервере не найден подходящий файл (.eps или .cdr)');
  }

  // 1.1. Если нашли .cdr — сначала конвертируем его в .eps,
  // после чего файл "падает" в общий блок конвертации .eps -> .plt ниже
  // (итоговая цепочка: cdr -> eps -> plt -> резка).
  if (foundExt === 'cdr') {
    const cdrFormData = new FormData();
    cdrFormData.append('file', fileBlob, finalFileName);

    const cdrResponse = await fetch(`${host}/folder/cdr-to-eps`, {
      method: 'POST',
      body: cdrFormData,
      redirect: 'follow'
    });

    if (!cdrResponse.ok) {
      throw new Error('Не удалось сконвертировать .cdr файл в .eps на сервере');
    }

    // ВАЖНО: подстройте под реальный формат ответа /folder/cdr-to-eps,
    // если сервер отдаёт не бинарный файл, а JSON/текст со ссылкой.
    fileBlob = await cdrResponse.blob();
    finalFileName = finalFileName.replace(/\.cdr$/i, '.eps');
    foundExt = 'eps';
  }

  // 1.2. Если это .eps (изначально или после конвертации из .cdr) — конвертируем в .plt
  if (foundExt === 'eps') {
    const convertFormData = new FormData();
    convertFormData.append('file', fileBlob, finalFileName);

    const convertResponse = await fetch(`${host}/folder/convert`, {
      method: 'POST',
      body: convertFormData,
      redirect: 'follow'
    });

    if (!convertResponse.ok) {
      throw new Error('Не удалось сконвертировать .eps файл на сервере');
    }

    // ВАЖНО: подстройте под реальный формат ответа /folder/convert,
    // если сервер отдаёт не бинарный файл, а JSON со ссылкой.
    fileBlob = await convertResponse.blob();
    finalFileName = finalFileName.replace(/\.eps$/i, '.plt');
    foundExt = 'plt';
  }

  // 2. Отправляем итоговый .plt на локальный станок
  const formdata = new FormData();
  formdata.append('file', fileBlob, finalFileName);

  const localResponse = await fetch('http://localhost:5000/cut', {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
  });

  if (!localResponse.ok) throw new Error('Локальный станок отклонил файл резки');

  return finalFileName;
}

const CuttingOrdersTable = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Прогрессивная подгрузка заказов по 100 записей за раз (см. hooks/useAllOrders.js)
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    isFetching,
    refetch: reload,
  } = useGetOrdersQuery(
    { page, limit: 100 },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;

  const [changeStatus] = useChangeOrderStatusMutation();
  const { data: deviceTypes = [] } = useGetDeviceTypesQuery();
  const { data: materials = [] } = useGetMaterialsQuery();
  const { data: discounts = [] } = useGetDiscountsQuery();
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderMutation();
  const [warrantys, { isLoading: isWarrantyLoading }] = useUseWarrantyMutation();

  // ── Фильтры ──────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState([]);
  const [warrantyFilter, setWarrantyFilter] = useState('all'); // all | warrantyOrders | available | used
  const [deviceFilter, setDeviceFilter] = useState(null);

  // Состояния для модалки редактирования
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // Состояния для модалки гарантийной оклейки
  const [warrantyRecord, setWarrantyRecord] = useState(null);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [isWarrantyCuttingLoading, setIsWarrantyCuttingLoading] = useState(false);

  // ── Состояния для модалки брака + повторной оклейки со скидкой ────────────
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectRecord, setDefectRecord] = useState(null);
  const [repeatDiscount, setRepeatDiscount] = useState(null);
  const [repeatSumma, setRepeatSumma] = useState(undefined);
  const [manualRepeatSumma, setManualRepeatSumma] = useState(false);

  // Автопересчёт суммы повторной оклейки при выборе скидки
  useEffect(() => {
    if (!defectRecord || manualRepeatSumma) return;
    const base = defectRecord.totalAmount ?? defectRecord.finalAmount ?? 0;
    setRepeatSumma(calcDiscountedAmount(base, repeatDiscount));
  }, [defectRecord, repeatDiscount, manualRepeatSumma]);

  const repeatBaseSumma = defectRecord?.totalAmount ?? defectRecord?.finalAmount ?? 0;
  const repeatDiscountAmount = useMemo(() => {
    if (!repeatBaseSumma || !repeatDiscount) return 0;
    if (repeatDiscount.type === 'PRICE_OVERRIDE') return repeatBaseSumma - repeatDiscount.value;
    return repeatBaseSumma - calcDiscountedAmount(repeatBaseSumma, repeatDiscount);
  }, [repeatBaseSumma, repeatDiscount]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const q = searchText.trim().toLowerCase();

    return orders.filter((o) => {
      // Поиск по клиенту / номеру заказа
      if (q) {
        const matchesSearch =
          o.client?.phone?.toLowerCase().includes(q) ||
          o.client?.name?.toLowerCase().includes(q) ||
          String(o.id).includes(q);
        if (!matchesSearch) return false;
      }

      // Диапазон дат
      if (dateRange && dateRange[0] && dateRange[1] && o.createdAt) {
        const created = dayjs(o.createdAt);
        if (created.isBefore(dateRange[0], 'day') || created.isAfter(dateRange[1], 'day')) {
          return false;
        }
      }

      // Статус
      if (statusFilter.length > 0 && !statusFilter.includes(o.status)) {
        return false;
      }

      // Устройство
      if (deviceFilter && o.cuttingJob?.deviceType?.id !== deviceFilter) {
        return false;
      }

      // Гарантия
      if (warrantyFilter === 'warrantyOrders' && !o.isWarrantyOrder) return false;
      if (warrantyFilter === 'available' && !canUseWarranty(o)) return false;
      if (warrantyFilter === 'used' && (o.isWarrantyOrder || !o.warrantyUsed)) return false;

      return true;
    });
  }, [orders, searchText, dateRange, statusFilter, deviceFilter, warrantyFilter]);

  const handleStatusChange = async (id, status) => {
    try {
      await changeStatus({ id, status }).unwrap();
      message.success('Статус обновлен');
      reload();
    } catch {
      message.error('Ошибка при обновлении статуса');
    }
  };

  // Открытие модалки и предзаполнение формы данными.
  // Редактирование недоступно после того, как заказ переведён в статус "Готово".
  const handleOpenEditModal = (record) => {
    if (record.status === CuttingOrderStatus.DONE) {
      message.warning('Заказ уже выполнен — редактирование недоступно');
      return;
    }

    setEditingRecord(record);
    form.setFieldsValue({
      clientPhone: record.client?.phone || '',
      clientName: record.client?.name || '',
      clientEmail: record.client?.email || '',
      quantity: record.quantity || 1,
      isWarrantyOrder: record.isWarrantyOrder || false,
      totalAmount: record.totalAmount,
      materialId: record.cuttingJob?.material?.id,
      discountId: record.discount?.id,
    });
    setIsEditModalOpen(true);
  };

  // Сохранение отредактированных данных
  const handleSaveEdit = async () => {
    try {
      const values = await form.validateFields();

      // Формируем DTO для бэкенда @Patch(':id')
      const dto = {
        clientPhone: values.clientPhone,
        clientName: values.clientName || 'Не указано',
        clientEmail: values.clientEmail || undefined,
        quantity: values.quantity,
        isWarrantyOrder: values.isWarrantyOrder,
        totalAmount: values.totalAmount ?? 0,
        // TODO: подтвердите, что бэкенд ожидает именно materialId в PATCH заказа
        // (если материал хранится на cuttingJob, возможно эндпоинт другой)
        materialId: values.materialId,
        discountId: values.discountId ?? null,
      };

      await updateOrder({ id: editingRecord.id, ...dto }).unwrap();
      message.success('Заказ успешно обновлен');
      setIsEditModalOpen(false);
      setEditingRecord(null);
      reload();
    } catch (err) {
      console.error(err);
      message.error('Ошибка при сохранении изменений');
    }
  };

  // Открытие модалки гарантийной оклейки
  const handleOpenWarrantyModal = (record) => {
    if (!record.client?.phone) {
      message.warning('Нельзя поставить на гарантию без клиента');
      return;
    }

    setWarrantyRecord(record);
    setIsWarrantyModalOpen(true);
  };

  // Подтверждение гарантийной оклейки:
  // 1) создаёт новую (гарантийную) накладную в CRM
  // 2) затем отправляет файл чертежа на резку (cdr -> eps -> plt -> localhost:5000/cut)
  // Если шаг резки не удался — накладная в CRM всё равно остаётся созданной,
  // пользователю просто показывается ошибка.
  const handleConfirmWarranty = async () => {
    if (!warrantyRecord) return;

    try {
      await warrantys(warrantyRecord.id).unwrap();
      message.success('Гарантийная оклейка создана');
    } catch (err) {
      message.error(err?.data?.message || 'Ошибка применения гарантии');
      return;
    }

    setIsWarrantyCuttingLoading(true);
    try {
      const filePath = warrantyRecord?.file?.path;
      const finalFileName = await runCuttingJob(filePath);
      message.success(`Задание "${finalFileName}" успешно отправлено на станок!`);
      setIsWarrantyModalOpen(false);
      setWarrantyRecord(null);
    } catch (error) {
      console.error(error);
      message.error(
        error?.message || 'Гарантийная накладная создана, но отправить файл на резку не удалось'
      );
      // Модалку не закрываем — накладная уже создана, пользователь может
      // разобраться с файлом и не потерять контекст заказа.
    } finally {
      setIsWarrantyCuttingLoading(false);
      reload();
    }
  };

  // ── Брак + повторная оклейка со скидкой ────────────────────────────────────
  const handleOpenDefectModal = (record) => {
    setDefectRecord(record);
    setRepeatDiscount(null);
    setRepeatSumma(undefined);
    setManualRepeatSumma(false);
    setIsDefectModalOpen(true);
  };

  const handleMarkDefect = async () => {
    if (!defectRecord) return;
    try {
      await changeStatus({ id: defectRecord.id, status: CuttingOrderStatus.DEFECT }).unwrap();
      message.success('Заказ помечен как брак');
      setIsDefectModalOpen(false);
      setDefectRecord(null);
      reload();
    } catch {
      message.error('Ошибка');
    }
  };

  const handleRepeatFromDefect = async () => {
    if (!defectRecord) return;
    try {
      await changeStatus({ id: defectRecord.id, status: CuttingOrderStatus.DEFECT }).unwrap();

      const payload = {
        cuttingJobId: defectRecord.cuttingJob?.id,
        quantity: defectRecord.quantity ?? 1,
        notes: defectRecord.notes || 'Повторная оклейка после брака',
        clientName: defectRecord.client?.name || undefined,
        clientPhone: defectRecord.client?.phone || '',
        clientEmail: defectRecord.client?.email || undefined,
        materialId: defectRecord.cuttingJob?.material?.id,
        discountId: repeatDiscount?.id || undefined,
        isDefectReworkOrder: true,
        parentOrderId: defectRecord.id,
        ...(manualRepeatSumma || repeatDiscount?.type === 'PRICE_OVERRIDE' ? { summa: repeatSumma } : {}),
      };

      await createOrder(payload).unwrap();

      message.success('Создана повторная оклейка');
      setIsDefectModalOpen(false);
      setDefectRecord(null);
      reload();
    } catch (e) {
      message.error(e?.data?.message || 'Ошибка при создании повторной оклейки');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderActions = (record) => {
    const isDone = record.status === CuttingOrderStatus.DONE;
    const isDefect = record.status === CuttingOrderStatus.DEFECT;
    const clientId = record.client?.id || null;

    return (
      <Space direction={isMobile ? "vertical" : "horizontal"} style={{ width: isMobile ? '100%' : 'auto' }} wrap={!isMobile} size={8}>
        {!isDone && !isDefect && clientId && (
          <Button
            block={isMobile}
            size="small"
            type="primary"
            onClick={() => handleStatusChange(record.id, CuttingOrderStatus.DONE)}
          >
            Готово
          </Button>
        )}

        {canUseWarranty(record) && isDone && (
          <Button
            block={isMobile}
            size="small"
            style={{ background: '#6c5ce7', color: '#fff', border: 'none' }}
            icon={<SafetyCertificateOutlined />}
            onClick={() => handleOpenWarrantyModal(record)}
          >
            Гарантийная оклейка
          </Button>
        )}

        {!isDone && !isDefect && canMarkDefect(record) && (
          <Button
            danger
            size="small"
            onClick={() => handleOpenDefectModal(record)}
          >
            Брак
          </Button>
        )}

        {/* Редактировать можно только пока заказ не переведён в "Готово" */}
        {!isDone && (
          <Button
            block={isMobile}
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(record)}
          >
            Поставить на гарантию
          </Button>
        )}
      </Space>
    );
  };

  const mobileColumns = [
    {
      title: 'Заказ',
      key: 'mobileOrder',
      render: (_, record) => (
        <Card
          size="small"
          bodyStyle={{ padding: 12 }}
          style={{ borderRadius: 12 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <b>Заказ #{record.id}</b>
            <Space>
              {record.isWarrantyOrder && <Tag color="purple">Гарантия</Tag>}
              <Tag color={statusColors[record.status]}>
                {statusLabels[record.status] || record.status}
              </Tag>
            </Space>
          </div>

          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
            <div><b>Телефон:</b> {record.client?.phone || '-'}</div>
            <div><b>Клиент:</b> {record.client?.name || '-'}</div>
            <div><b>Материал:</b> {record.cuttingJob?.material?.name || '-'}</div>
            <div><b>Тип брони:</b> {record?.file?.folder?.name || '-'}</div>
            <div><b>Устройство:</b> {record?.file?.name || '-'}</div>
            {record.file && <div><b>ID Файла:</b> #{record.file.id}</div>}
            <div><b>Кол-во:</b> {record.quantity ?? '-'}</div>
            <div><b>Сумма:</b> {record.totalAmount ?? '-'}</div>
            <div><b>Итог:</b> {record.finalAmount ?? '-'}</div>
            {record.discount && (
              <div>
                <b>Скидка:</b>{' '}
                <Tag color="volcano" style={{ marginLeft: 2 }}>
                  {RULE_LABEL[record.discount.rule] ?? record.discount.name}
                </Tag>
              </div>
            )}
            <div><b>Дата:</b> {formatDate(record.createdAt)}</div>
          </div>

          <div style={{ marginTop: 12 }}>{renderActions(record)}</div>
        </Card>
      ),
    },
  ];

  const canMarkDefect = (record) => {
    if (!record.createdAt) return false;

    const hours =
      (Date.now() - new Date(record.createdAt).getTime()) / 3600000;

    return hours <= 24;
  };

  const desktopColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id, width: 70 },
    {
      title: 'Клиент',
      key: 'client',
      render: (_, r) => (
        <div>
          <div>{r.client?.phone || '-'}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.client?.name}</div>
        </div>
      )
    },
    {
      title: 'Материал',
      key: 'material',
      render: (_, record) => record.cuttingJob?.material?.name || '-',
    },
    {
      title: 'Тип брони',
      key: 'armorType',
      render: (_, record) => record?.file?.folder?.name || '-',
    },
    {
      title: 'Устройство',
      key: 'deviceType',
      render: (_, record) => record?.file?.name || '-',
    },
    { title: 'Кол-во', dataIndex: 'quantity', key: 'quantity', width: 80 },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status, r) => (
        <Space direction="vertical" size={2}>
          <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
          {r.isWarrantyOrder && <Tag color="purple" size="small">Гарантийный</Tag>}
        </Space>
      ),
      width: 130,
    },
    {
      title: 'Скидка',
      key: 'discount',
      render: (_, r) =>
        r.discount ? (
          <Tooltip title={r.discount.description}>
            <Tag color="volcano">{RULE_LABEL[r.discount.rule] ?? r.discount.name}</Tag>
          </Tooltip>
        ) : '—',
      width: 130,
    },
    { title: 'Сумма', dataIndex: 'totalAmount', key: 'totalAmount', width: 90 },
    { title: 'Итого', dataIndex: 'finalAmount', key: 'finalAmount', width: 90 },
    { title: 'Дата создания', dataIndex: 'createdAt', key: 'createdAt', render: formatDate, width: 140 },
    { title: 'Действия', key: 'actions', render: (_, record) => renderActions(record), width: 320, fixed: 'right' },
  ];

  const warrantyFileUrl = getCuttingFileUrl(warrantyRecord);

  return (
    <>
      {/* ФИЛЬТРЫ */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Input
            allowClear
            placeholder="Поиск: телефон, имя, № заказа"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <RangePicker
            style={{ width: '100%' }}
            value={dateRange}
            onChange={(v) => setDateRange(v)}
            placeholder={['Дата от', 'Дата до']}
          />
        </Col>

        <Col xs={24} sm={12} md={5}>
          <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            placeholder="Статус"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {Object.keys(statusLabels).map((key) => (
              <Option key={key} value={key}>{statusLabels[key]}</Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={4}>
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder="Устройство"
            value={deviceFilter}
            onChange={setDeviceFilter}
          >
            {deviceTypes.map((d) => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={3}>
          <Select
            style={{ width: '100%' }}
            value={warrantyFilter}
            onChange={setWarrantyFilter}
          >
            <Option value="all">Все заказы</Option>
            <Option value="available">Доступна гарантия</Option>
            <Option value="used">Гарантия использована</Option>
            <Option value="warrantyOrders">Гарантийные оклейки</Option>
          </Select>
        </Col>
      </Row>

      {/* {isLoadingMore && (
        <div style={{ marginBottom: 12, fontSize: 12, color: '#888' }}>
          Догружаем оставшиеся заказы (по 100 записей за раз)... Сейчас загружено: {orders.length}
        </div>
      )} */}

      <Table
        key={page}
        rowKey="id"
        loading={isLoading || isFetching}
        dataSource={filteredOrders}
        columns={desktopColumns}
        pagination={{
          current: page,
          pageSize: 100,
          total,
          showTotal: (total) => `Всего: ${total}`,
          onChange: (newPage) => {
            console.log('CHANGE PAGE', newPage);
            setPage(newPage);
          }
        }}
      />

      {/* Модальное окно редактирования */}
      <Modal
        title={`Редактирование заказа #${editingRecord?.id}`}
        open={isEditModalOpen}
        onOk={handleSaveEdit}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>

          <h3>Данные клиента</h3>
          <Form.Item
            name="clientPhone"
            label="Номер телефона"
            rules={[{ required: true, message: 'Введите телефон клиента' }]}
          >
            <Input placeholder="Например, +996..." />
          </Form.Item>

          <Form.Item name="clientName" label="Имя клиента">
            <Input placeholder="Имя (если пусто, запишется 'Не указано')" />
          </Form.Item>

          <Form.Item name="clientEmail" label="Email клиента">
            <Input type="email" placeholder="example@mail.com" />
          </Form.Item>

          <Divider style={{ margin: '12px 0' }} />
          <h3>Параметры заказа</h3>

          <Form.Item
            name="quantity"
            label="Количество"
            rules={[{ required: true, message: 'Укажите количество' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="materialId" label="Материал">
            <Select
              showSearch
              allowClear
              placeholder="Выберите материал"
              optionFilterProp="children"
            >
              {materials.map((m) => (
                <Option key={m.id} value={m.id}>{m.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="discountId" label="Скидка">
            <Select
              showSearch
              allowClear
              placeholder="Без скидки"
              optionFilterProp="children"
            >
              {discounts.filter((d) => d.isActive).map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name ?? RULE_LABEL[d.rule]}{' '}
                  <span style={{ color: '#999', fontSize: 12 }}>
                    {d.type === 'PERCENT'
                      ? `−${d.value}%`
                      : d.type === 'PRICE_OVERRIDE'
                        ? `= ${d.value} сом`
                        : `−${d.value} сом`}
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="totalAmount" label="Сумма">
            <Input type={"number"} placeholder="Сумма" />
          </Form.Item>

          <Form.Item
            name="isWarrantyOrder"
            label="Гарантийная оклейка"
            valuePropName="checked"
          >
            <Switch checkedChildren="Да" unCheckedChildren="Нет" />
          </Form.Item>

        </Form>
      </Modal>

      {/* Модальное окно подтверждения гарантийной оклейки */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#6c5ce7' }} />
            <span>Гарантийная оклейка — заказ #{warrantyRecord?.id}</span>
          </Space>
        }
        open={isWarrantyModalOpen}
        onCancel={() => {
          setIsWarrantyModalOpen(false);
          setWarrantyRecord(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsWarrantyModalOpen(false);
              setWarrantyRecord(null);
            }}
          >
            Отмена
          </Button>,
          <Button
            key="cut"
            type="primary"
            danger
            icon={<ScissorOutlined />}
            loading={isWarrantyLoading || isWarrantyCuttingLoading}
            onClick={handleConfirmWarranty}
          >
            Начать резку и создать накладную
          </Button>,
        ]}
        destroyOnClose
      >
        {warrantyRecord && (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <div style={{
              width: '100%', height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden',
            }}>
              {warrantyFileUrl ? (
                <img
                  src={warrantyFileUrl}
                  alt="Чертёж"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <Empty description="Файл чертежа недоступен" />
              )}
            </div>

            <Space wrap>
              <Tag color="purple">📱 {warrantyRecord.cuttingJob?.deviceType?.name || '-'}</Tag>
              <Tag color="green">🛡 {warrantyRecord.cuttingJob?.material?.name || '-'}</Tag>
              <Tag color="gold">✂️ {warrantyRecord.cuttingJob?.armorType?.name || '-'}</Tag>
            </Space>

            <div>Клиент: <b>{warrantyRecord.client?.phone}</b> {warrantyRecord.client?.name ? `(${warrantyRecord.client.name})` : ''}</div>
            <div>Количество: <b>{warrantyRecord.quantity ?? 1}</b></div>

            <Tooltip title="Нажимая «Начать резку», вы создаёте новую гарантийную накладную по этому же файлу, а исходный заказ помечается как использовавший гарантию. Затем файл автоматически отправляется на станок.">
              <span style={{ fontSize: 12, color: '#999' }}>ⓘ Что произойдёт при подтверждении</span>
            </Tooltip>
          </Space>
        )}
      </Modal>

      {/* Модальное окно брака + повторной оклейки со скидкой */}
      <Modal
        title={<span style={{ color: '#f5222d' }}>⚠️ Пометить как брак — заказ #{defectRecord?.id}</span>}
        open={isDefectModalOpen}
        onCancel={() => {
          setIsDefectModalOpen(false);
          setDefectRecord(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsDefectModalOpen(false);
              setDefectRecord(null);
            }}
          >
            Отмена
          </Button>,
          <Button
            key="repeat"
            style={{ background: '#6c5ce7', color: '#fff', border: 'none' }}
            onClick={handleRepeatFromDefect}
          >
            Повторить оклейку
          </Button>,
          <Button key="defect" danger type="primary" onClick={handleMarkDefect}>
            Подтвердить брак
          </Button>,
        ]}
        destroyOnClose
      >
        {defectRecord && (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <p>Вы уверены, что хотите пометить этот заказ как <b>брак</b>?</p>

            <Space wrap>
              <Tag color="purple">📱 {defectRecord.cuttingJob?.deviceType?.name || '-'}</Tag>
              <Tag color="green">🛡 {defectRecord.cuttingJob?.material?.name || '-'}</Tag>
              <Tag color="gold">✂️ {defectRecord.cuttingJob?.armorType?.name || '-'}</Tag>
            </Space>

            <div>Клиент: <b>{defectRecord.client?.phone}</b></div>
            <div>Сумма заказа: <b>{defectRecord.finalAmount ?? defectRecord.totalAmount ?? '-'} сом</b></div>

            <Divider style={{ margin: '8px 0' }} orientation="left">
              Повторная оклейка (опционально)
            </Divider>

            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder="Скидка на повторную оклейку (опционально)"
              value={repeatDiscount?.id ?? null}
              onChange={(id) => {
                setRepeatDiscount(id ? discounts.find((d) => d.id === id) ?? null : null);
                setManualRepeatSumma(false);
              }}
            >
              {discounts.filter((d) => d.isActive).map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name ?? RULE_LABEL[d.rule]}{' '}
                  <span style={{ color: '#999', fontSize: 12 }}>
                    {d.type === 'PERCENT'
                      ? `−${d.value}%`
                      : d.type === 'PRICE_OVERRIDE'
                        ? `= ${d.value} сом`
                        : `−${d.value} сом`}
                  </span>
                </Option>
              ))}
            </Select>

            <InputNumber
              style={{ width: '100%' }}
              value={repeatSumma}
              onChange={(v) => {
                setRepeatSumma(v);
                setManualRepeatSumma(true);
              }}
              placeholder="Итоговая сумма повторной оклейки"
              addonAfter="сом"
            />

            {repeatDiscount && repeatDiscountAmount > 0 && (
              <div style={{ fontSize: 12, color: '#f5222d' }}>
                −{Math.round(repeatDiscountAmount)} сом (было {repeatBaseSumma} сом)
              </div>
            )}

            <p style={{ color: '#888', fontSize: 12 }}>
              «Повторить оклейку» пометит текущий заказ как брак и создаст новую накладную
              с тем же устройством, материалом и типом резки — при желании со скидкой.
              «Подтвердить брак» просто отметит заказ как брак без создания новой оклейки.
            </p>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default CuttingOrdersTable;