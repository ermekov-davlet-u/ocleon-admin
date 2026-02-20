import { Table, Button, Tag, Space, message, Modal } from 'antd';
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
      key: 'cuttingJob',
      render: (_, record) => {
        const job = record.cuttingJob;
        if (!job) return "-";
        const materialName = job.material?.name || "";
        const armorName = job.armorType?.name || "";
        const deviceName = job.deviceType?.name || "";
        return `${materialName} / ${armorName} на ${deviceName}`;
      }
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
      title: 'Сумма',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
    },
    {
      title: 'Итоговая сумма',
      dataIndex: 'finalAmount',
      key: 'finalAmount',
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md'],
      render: (date) => formatDate(date),
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
          <Button size="small" danger onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
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
