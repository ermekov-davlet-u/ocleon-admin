import { Table, Button, Tag, Space, message, Modal } from 'antd';
import { useGetOrdersQuery, useDeleteOrderMutation, useChangeOrderStatusMutation, useCreateOrderMutation } from '../store/api/orderApi';

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

const CuttingOrdersTable = () => {
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
        cuttingJobId: record.cuttingJob.id,
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
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      responsive: ['md'],
    },
    {
      title: 'Клиент',
      dataIndex: ['client', 'name'],
      key: 'client',
      filters: Array.from(new Set(orders?.map(o => o.client?.name || '-'))).map(n => ({ text: n, value: n })),
      onFilter: (value, record) => (record.client?.name || '-') === value,
    },
    {
      title: 'Телефон',
      dataIndex: ['client', 'phone'],
      key: 'phone',
      responsive: ['md'],
    },
    {
      title: 'Материал',
      key: 'material',
      render: (_, record) => record.cuttingJob?.material?.name || '-',
      filters: Array.from(new Set(orders?.map(o => o.cuttingJob?.material?.name || '-'))).map(n => ({ text: n, value: n })),
      onFilter: (value, record) => (record.cuttingJob?.material?.name || '-') === value,
    },
    {
      title: 'Тип брони',
      key: 'armorType',
      render: (_, record) => record.cuttingJob?.armorType?.name || '-',
      filters: Array.from(new Set(orders?.map(o => o.cuttingJob?.armorType?.name || '-'))).map(n => ({ text: n, value: n })),
      onFilter: (value, record) => (record.cuttingJob?.armorType?.name || '-') === value,
    },
    {
      title: 'Устройство',
      key: 'deviceType',
      render: (_, record) => record.cuttingJob?.deviceType?.name || '-',
      filters: Array.from(new Set(orders?.map(o => o.cuttingJob?.deviceType?.name || '-'))).map(n => ({ text: n, value: n })),
      onFilter: (value, record) => (record.cuttingJob?.deviceType?.name || '-') === value,
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>,
      filters: Object.values(CuttingOrderStatus).map(s => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Итоговая сумма',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
      sorter: (a, b) => a.finalAmount - b.finalAmount,
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md'],
      render: formatDate,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => {
        const isDone = record.status === CuttingOrderStatus.DONE;
        const isDefect = record.status === CuttingOrderStatus.DEFECT;

        return (
          <Space>
            {!isDone && !isDefect && (
              <>
                <Button size="small" onClick={() => handleStatusChange(record.id, CuttingOrderStatus.IN_PROGRESS)}>
                  В работе
                </Button>
                <Button size="small" onClick={() => handleStatusChange(record.id, CuttingOrderStatus.DONE)}>
                  Готово
                </Button>
              </>
            )}

            {isDefect && (
              <Button size="small" type="dashed" onClick={() => handleRecreateOrder(record)}>
                Повторить
              </Button>
            )}

            <Button size="small" danger onClick={() => handleDelete(record.id)}>
              Удалить
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={isLoading}
      dataSource={orders}
      columns={columns}
      scroll={{ x: true }}
      size="small"
      responsive
    />
  );
};

export default CuttingOrdersTable;