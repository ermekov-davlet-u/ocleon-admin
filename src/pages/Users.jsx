import React, { useMemo, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  message,
  Grid,
  Tag,
  Popconfirm,
  Card,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation
} from '../store/api/clientsApi';

const { useBreakpoint } = Grid;

export default function Clients() {
  const { data: clients = [], refetch, isLoading } = useGetClientsQuery();
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingClient(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingClient(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteClient(id).unwrap();
      message.success('Клиент удален');
      refetch();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingClient) {
        await updateClient({ id: editingClient.id, data: values }).unwrap();
        message.success('Клиент обновлен');
      } else {
        await createClient(values).unwrap();
        message.success('Клиент создан');
      }

      setIsModalVisible(false);
      refetch();
    } catch {
      message.error('Ошибка сохранения');
    }
  };

  const filteredData = useMemo(() => {
    return clients.filter((c) => {
      const name = c.name?.toLowerCase() || '';
      const phone = c.phone || '';
      const email = c.email?.toLowerCase() || '';
      const value = search.toLowerCase();

      return (
        name.includes(value) ||
        phone.includes(search) ||
        email.includes(value)
      );
    });
  }, [clients, search]);

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
      title: 'Клиент',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: isMobile ? 15 : 14 }}>
            {record.name || '-'}
          </div>
          {isMobile ? (
            <div style={{ marginTop: 4 }}>
              {record.phone ? (
                <a
                  href={`tel:${record.phone}`}
                  style={{ color: '#1677ff', fontSize: 13 }}
                >
                  {record.phone}
                </a>
              ) : (
                <span style={{ color: '#999', fontSize: 13 }}>Без телефона</span>
              )}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['md'],
      render: (phone) =>
        phone ? <a href={`tel:${phone}`}>{phone}</a> : <span>-</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'],
      ellipsis: true,
      render: (email) =>
        email ? (
          <a href={`mailto:${email}`}>{email}</a>
        ) : (
          <span style={{ color: '#999' }}>—</span>
        ),
    },
    {
      title: 'Создан',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['lg'],
      ellipsis: true,
      render: (date) => formatDate(date),
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      responsive: ['sm'],
      render: (val) => (
        <Tag color={val ? 'green' : 'red'}>
          {val ? 'Активен' : 'Неактивен'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: isMobile ? 110 : 150,
      render: (_, record) => (
        <Space size={isMobile ? 4 : 8}>
          <Button
            type="link"
            size={isMobile ? 'small' : 'middle'}
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ paddingInline: isMobile ? 4 : 8 }}
          >
            {!isMobile ? 'Редактировать' : ''}
          </Button>

          <Popconfirm
            title="Удалить клиента?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              danger
              size={isMobile ? 'small' : 'middle'}
              icon={<DeleteOutlined />}
              style={{ paddingInline: isMobile ? 4 : 8 }}
            >
              {!isMobile ? 'Удалить' : ''}
            </Button>
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <div style={{ padding: isMobile ? 0 : 12 }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: '0 6px 24px rgba(0,0,0,0.06)',
        }}
        bodyStyle={{ padding: isMobile ? 12 : 20 }}
      >
        <Space
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ marginBottom: 16, width: '100%' }}
          size={12}
        >
          <Input.Search
            placeholder="Поиск клиента"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            size={isMobile ? 'large' : 'middle'}
            prefix={<UserOutlined />}
            style={{
              width: isMobile ? '100%' : 320,
            }}
          />

          <Button
            type="primary"
            onClick={handleAdd}
            block={isMobile}
            size={isMobile ? 'large' : 'middle'}
            icon={<PlusOutlined />}
            style={{
              height: isMobile ? 44 : undefined,
              fontWeight: 600,
              borderRadius: 10,
            }}
          >
            Добавить клиента
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          bordered={false}
          loading={isLoading}
          scroll={{ x: 760 }}
          size={isMobile ? 'small' : 'middle'}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
        />
      </Card>

      <Modal
        title={editingClient ? 'Редактировать клиента' : 'Создать клиента'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
        cancelText="Отмена"
        width={isMobile ? '100%' : 520}
        style={isMobile ? { top: 0, paddingBottom: 0 } : {}}
        bodyStyle={isMobile ? { padding: 16 } : { padding: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Имя"
            name="name"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input
              size={isMobile ? 'large' : 'middle'}
              prefix={<UserOutlined />}
              placeholder="Введите имя клиента"
            />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
            rules={[{ required: true, message: 'Введите телефон' }]}
          >
            <Input
              size={isMobile ? 'large' : 'middle'}
              prefix={<PhoneOutlined />}
              placeholder="Введите телефон"
            />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input
              size={isMobile ? 'large' : 'middle'}
              prefix={<MailOutlined />}
              placeholder="Введите email"
            />
          </Form.Item>

          <Form.Item
            label="Активен"
            name="isActive"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}