import React, { useState } from 'react';
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
} from 'antd';
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation
} from '../store/api/clientsApi';

const { useBreakpoint } = Grid;

export default function Clients() {
  const { data: clients, refetch } = useGetClientsQuery();
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

  const filteredData = clients?.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const columns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => <a href={`tel:${phone}`}>{phone}</a>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'], // скрываем на мобилке
      ellipsis: true,
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      responsive: ['md'], // скрываем на мобилке
      ellipsis: true,
      render: (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    },
    {
      title: 'Активен',
      dataIndex: 'isActive',
      key: 'isActive',
      responsive: ['lg'],
      render: (val) => val ? 'Да' : 'Нет'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space >
          <Button
            type="link"
            size={isMobile ? 'small' : 'middle'}
            onClick={() => handleEdit(record)}
          >
            Ред.
          </Button>
          <Button
            type="link"
            danger
            size={isMobile ? 'small' : 'middle'}
            onClick={() => handleDelete(record.id)}
          >
            Уд.
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Space
        style={{ marginBottom: 16, width: '100%' }}
      >
        <Input.Search
          placeholder="Поиск клиента"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: isMobile ? '100%' : 250 }}
        />

        <Button
          type="primary"
          onClick={handleAdd}
          block={isMobile}
        >
          Добавить клиента
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        bordered
        scroll={{ x: true }}
        size={'small'}
        pagination={{
          pageSize: 10,
          showSizeChanger: false
        }}
      />

      <Modal
        title={editingClient ? 'Редактировать клиента' : 'Создать клиента'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
        width={isMobile ? '100%' : 500}
        style={isMobile ? { top: 0 } : {}}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Имя"
            name="name"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Телефон"
            name="phone"
            rules={[{ required: true, message: 'Введите телефон' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input />
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
