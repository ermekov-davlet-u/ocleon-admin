import { Table, Button, Tag, Space, message } from 'antd';
import { useGetOrdersQuery, useDeleteOrderMutation, useChangeOrderStatusMutation } from '../store/api/orderApi';

export const CuttingOrderStatus = {
  NEW: 'NEW',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  REWORK: 'REWORK',
};

const statusColors = {
  NEW: 'blue',
  IN_PROGRESS: 'orange',
  DONE: 'green',
  REWORK: 'red',
};

const CuttingOrdersTable = () => {
  const { data: orders, isLoading, refetch } = useGetOrdersQuery();
  const [deleteOrder] = useDeleteOrderMutation();
  const [changeStatus] = useChangeOrderStatusMutation();

  const handleDelete = async (id) => {
    try {
      await deleteOrder(id).unwrap();
      message.success('Заказ удален');
      refetch();
    } catch {
      message.error('Ошибка при удалении');
    }
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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      responsive: ['md'],
    },
    {
      title: 'Клиент',
      dataIndex: ['client', 'name'],
      key: 'client',
    },
    {
      title: 'Телефон',
      dataIndex: ['client', 'phone'],
      key: 'phone',
      responsive: ['md'],
    },
    {
      title: 'Резка',
      dataIndex: ['cuttingJob', 'name'],
      key: 'cuttingJob',
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status !== CuttingOrderStatus.DONE && (
            <Button size="small" onClick={() => handleStatusChange(record.id, CuttingOrderStatus.IN_PROGRESS)}>
              В работе
            </Button>
          )}
          {record.status !== CuttingOrderStatus.DONE && (
            <Button size="small" onClick={() => handleStatusChange(record.id, CuttingOrderStatus.DONE)}>
              Готово
            </Button>
          )}
        </Space>
      ),
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