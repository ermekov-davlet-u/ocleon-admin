import React from 'react';
import { Table, Button, Tag, Space, message, Modal, Grid, Card } from 'antd';
import {
  useGetOrdersQuery,
  useDeleteOrderMutation,
  useChangeOrderStatusMutation,
  useCreateOrderMutation,
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

  const handleRecreateOrder = async (record) => {
    try {
      await createOrder({
        cuttingJobId: record.cuttingJob?.id,
        quantity: record.quantity,
        notes: record.notes,
        clientName: record.client?.name,
        clientPhone: record.client?.phone,
        clientEmail: record.client?.email,
        discountId: record.discount?.id,
        summa: record.finalAmount,
      }).unwrap();

      message.success('Заказ повторно создан!');
      refetch();
    } catch (err) {
      console.error(err);
      message.error('Ошибка при повторном создании');
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

    if (isMobile) {
      return (
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          {!isDone && !isDefect && (
            <>
              <Button
                block
                size="small"
                type="primary"
                onClick={() =>
                  handleStatusChange(record.id, CuttingOrderStatus.DONE)
                }
              >
                Готово
              </Button>
            </>
          )}

          <Button
            block
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
            Удалить
          </Button>
        </Space>
      );
    }

    return (
      <Space wrap>
        {!isDone && !isDefect && (
          <>
            <Button
              size="small"
              type="primary"
              onClick={() =>
                handleStatusChange(record.id, CuttingOrderStatus.DONE)
              }
            >
              Готово
            </Button>
          </>
        )}

        <Button size="small" danger onClick={() => handleDelete(record.id)}>
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
          style={{
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <b>Заказ #{record.id}</b>
            <Tag color={statusColors[record.status]}>
              {statusLabels[record.status] || record.status}
            </Tag>
          </div>

          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
            <div>
              <b>Телефон:</b> {record.client?.phone || '-'}
            </div>
            <div>
              <b>Материал:</b> {record.cuttingJob?.material?.name || '-'}
            </div>
            <div>
              <b>Тип брони:</b> {record.cuttingJob?.armorType?.name || '-'}
            </div>
            <div>
              <b>Устройство:</b> {record.cuttingJob?.deviceType?.name || '-'}
            </div>
            <div>
              <b>Кол-во:</b> {record.quantity ?? '-'}
            </div>
            <div>
              <b>Сумма:</b> {record.totalAmount ?? '-'}
            </div>
            <div>
              <b>Итог:</b> {record.finalAmount ?? '-'}
            </div>
            <div>
              <b>Дата:</b> {formatDate(record.createdAt)}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>{renderActions(record)}</div>
        </Card>
      ),
    },
  ];

  const desktopColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      responsive: ['md'],
      width: 80,
    },
    {
      title: 'Клиент',
      dataIndex: ['client', 'phone'],
      key: 'phone',
      responsive: ['md'],
    },
    {
      title: 'Материал',
      key: 'material',
      render: (_, record) => record.cuttingJob?.material?.name || '-',
      filters: Array.from(
        new Set(orders?.map((o) => o.cuttingJob?.material?.name || '-') || [])
      ).map((n) => ({ text: n, value: n })),
      onFilter: (value, record) =>
        (record.cuttingJob?.material?.name || '-') === value,
    },
    {
      title: 'Тип брони',
      key: 'armorType',
      render: (_, record) => record.cuttingJob?.armorType?.name || '-',
      filters: Array.from(
        new Set(orders?.map((o) => o.cuttingJob?.armorType?.name || '-') || [])
      ).map((n) => ({ text: n, value: n })),
      onFilter: (value, record) =>
        (record.cuttingJob?.armorType?.name || '-') === value,
    },
    {
      title: 'Устройство',
      key: 'deviceType',
      render: (_, record) => record.cuttingJob?.deviceType?.name || '-',
      filters: Array.from(
        new Set(orders?.map((o) => o.cuttingJob?.deviceType?.name || '-') || [])
      ).map((n) => ({ text: n, value: n })),
      onFilter: (value, record) =>
        (record.cuttingJob?.deviceType?.name || '-') === value,
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
      width: 90,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status] || status}
        </Tag>
      ),
      filters: Object.values(CuttingOrderStatus).map((s) => ({
        text: statusLabels[s] || s,
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
      width: 130,
    },
    {
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      width: 100,
    },
    {
      title: 'Итоговая сумма',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      sorter: (a, b) => (a.finalAmount || 0) - (b.finalAmount || 0),
      width: 130,
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md'],
      render: formatDate,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      width: 160,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => renderActions(record),
      width: 220,
      fixed: 'right',
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={isLoading}
      dataSource={orders || []}
      columns={isMobile ? mobileColumns : desktopColumns}
      scroll={isMobile ? undefined : { x: 1200 }}
      size={isMobile ? 'middle' : 'small'}
      pagination={{
        pageSize: isMobile ? 5 : 10,
        showSizeChanger: !isMobile,
      }}
    />
  );
};

export default CuttingOrdersTable;