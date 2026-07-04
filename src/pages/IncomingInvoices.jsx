import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, message, Modal, Grid, Card, Form, Input, InputNumber, Switch, Divider } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import {
  useGetOrdersQuery,
  useDeleteOrderMutation,
  useChangeOrderStatusMutation,
  useCreateOrderMutation,
  useUpdateOrderMutation, // <-- Убедитесь, что мутация добавлена в orderApi
} from '../store/api/orderApi';

const { useBreakpoint } = Grid;

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

const CuttingOrdersTable = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data: orders, isLoading, refetch } = useGetOrdersQuery();
  const [deleteOrder] = useDeleteOrderMutation();
  const [changeStatus] = useChangeOrderStatusMutation();
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderMutation(); // <-- Подключаем обновление

  // Состояния для модалки редактирования
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

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
      fileId: record.file?.id || null,
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
        fileId: values.fileId ? Number(values.fileId) : values.fileId === '' ? null : undefined,
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

        {/* Кнопка Редактировать */}
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
            <div><b>Тип брони:</b> {record.cuttingJob?.armorType?.name || '-'}</div>
            <div><b>Устройство:</b> {record.cuttingJob?.deviceType?.name || '-'}</div>
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
      render: (_, record) => record.cuttingJob?.armorType?.name || '-',
    },
    {
      title: 'Устройство',
      key: 'deviceType',
      render: (_, record) => record.cuttingJob?.deviceType?.name || '-',
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
    { title: 'Действия', key: 'actions', render: (_, record) => renderActions(record), width: 260, fixed: 'right' },
  ];

  return (
    <>
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={orders || []}
        columns={isMobile ? mobileColumns : desktopColumns}
        scroll={isMobile ? undefined : { x: 1300 }}
        size={isMobile ? 'middle' : 'small'}
        pagination={{ pageSize: isMobile ? 5 : 10 }}
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

          <Form.Item name="fileId" label="ID прикрепленного файла (опционально)">
            <Input placeholder="Оставьте пустым или введите ID файла" />
          </Form.Item>

          <Form.Item
            name="isWarrantyOrder"
            label="Установить на гарантию (Гарантийная оклейка)"
            valuePropName="checked"
          >
            <Switch checkedChildren="Да" unCheckedChildren="Нет" />
          </Form.Item>

        </Form>
      </Modal>
    </>
  );
};

export default CuttingOrdersTable;