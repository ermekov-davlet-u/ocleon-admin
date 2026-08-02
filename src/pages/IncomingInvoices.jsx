import React, { useState, useMemo } from 'react';
import {
  Table, Button, Tag, Space, message, Modal, Grid, Card, Form, Input, InputNumber,
  Switch, Divider, Select, DatePicker, Row, Col, Empty, Tooltip,
} from 'antd';
import { EditOutlined, SafetyCertificateOutlined, ScissorOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  useGetOrdersQuery,
  useDeleteOrderMutation,
  useChangeOrderStatusMutation,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useUseWarrantyMutation,
} from '../store/api/orderApi';
import { useGetDeviceTypesQuery } from '../store/api/cuttingApi';
import { useGetMaterialsQuery } from '../store/api/materialsApi';

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

// Заказ считается доступным для гарантийной переоклейки, если:
// - сам он НЕ является гарантийной оклейкой (у гарантийных оклеек своей гарантии нет)
// - гарантия по нему ещё не использована
// - прошло не больше 365 дней с момента создания
// - он не в статусе "Брак"
function canUseWarranty(record) {
  if (!record?.createdAt) return false;
  if (record.isWarrantyOrder) return false;
  if (record.warrantyUsed) return false;
  if (record.status === CuttingOrderStatus.DEFECT) return false;
  const daysSince = Math.floor((Date.now() - new Date(record.createdAt)) / 86400000);
  return daysSince <= 365;
}

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

  const { data: orders, isLoading, refetch } = useGetOrdersQuery();
  const [deleteOrder] = useDeleteOrderMutation();
  const [changeStatus] = useChangeOrderStatusMutation();
  const { data: deviceTypes = [] } = useGetDeviceTypesQuery();
  const { data: materials = [] } = useGetMaterialsQuery();
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

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Подтверждение удаления',
      content: 'Вы уверены, что хотите удалить этот заказ?',
      okText: 'Да',
      cancelText: 'Отмена',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteOrder(id).unwrap();
          message.success('Заказ удален');
          refetch();
        } catch {
          message.error('Ошибка при удалении');
        }
      },
    });
  };

  const handleStatusChange = async (id, status) => {
    try {
      await changeStatus({ id, status }).unwrap();
      message.success('Статус обновлен');
      refetch();
    } catch {
      message.error('Ошибка при обновлении статуса');
    }
  };

  // Открытие модалки и предзаполнение формы данными
  const handleOpenEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      clientPhone: record.client?.phone || '',
      clientName: record.client?.name || '',
      clientEmail: record.client?.email || '',
      quantity: record.quantity || 1,
      isWarrantyOrder: record.isWarrantyOrder || false,
      totalAmount: record.totalAmount,
      materialId: record.cuttingJob?.material?.id,
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
      };

      await updateOrder({ id: editingRecord.id, ...dto }).unwrap();
      message.success('Заказ успешно обновлен');
      setIsEditModalOpen(false);
      setEditingRecord(null);
      refetch();
    } catch (err) {
      console.error(err);
      message.error('Ошибка при сохранении изменений');
    }
  };

  // Открытие модалки гарантийной оклейки
  const handleOpenWarrantyModal = (record) => {
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
      refetch();
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

    return (
      <Space direction={isMobile ? "vertical" : "horizontal"} style={{ width: isMobile ? '100%' : 'auto' }} wrap={!isMobile} size={8}>
        {!isDone && !isDefect && (
          <Button
            block={isMobile}
            size="small"
            type="primary"
            onClick={() => handleStatusChange(record.id, CuttingOrderStatus.DONE)}
          >
            Готово
          </Button>
        )}

        {canUseWarranty(record) && (
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

        <Button
          block={isMobile}
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenEditModal(record)}
        >
          Редактировать
        </Button>

        <Button block={isMobile} size="small" danger onClick={() => handleDelete(record.id)}>
          Удалить
        </Button>
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
            <div><b>Дата:</b> {formatDate(record.createdAt)}</div>
          </div>

          <div style={{ marginTop: 12 }}>{renderActions(record)}</div>
        </Card>
      ),
    },
  ];

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

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={filteredOrders}
        columns={isMobile ? mobileColumns : desktopColumns}
        scroll={isMobile ? undefined : { x: 1400 }}
        size={isMobile ? 'middle' : 'small'}
        pagination={{ pageSize: isMobile ? 5 : 10, showTotal: (t) => `Всего: ${t}` }}
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
    </>
  );
};

export default CuttingOrdersTable;