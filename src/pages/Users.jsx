import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, message } from 'antd';
import {
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation
} from '../store/api/clientsApi';

export default function Clients() {
  const { data: clients, refetch } = useGetClientsQuery();
  const [createClient] = useCreateClientMutation();
  const [updateClient] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();

  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form] = Form.useForm();

  // Открытие модалки для добавления
  const handleAdd = () => {
    setEditingClient(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Редактирование клиента
  const handleEdit = (record) => {
    setEditingClient(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // Удаление
  const handleDelete = async (id) => {
    try {
      await deleteClient(id).unwrap();
      message.success('Клиент удален');
      refetch();
    } catch (err) {
      message.error('Ошибка удаления');
    }
  };

  // Сохранение (создание/редактирование)
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
    } catch (err) {
      message.error('Ошибка сохранения');
    }
  };

  // Фильтрация по поиску
  const filteredData = clients?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  // Колонки таблицы
  const columns = [
    { title: 'Имя', dataIndex: 'name', key: 'name' },
    { 
      title: 'Телефон', 
      dataIndex: 'phone', 
      key: 'phone',
      render: (phone) => <a href={`tel:${phone}`}>{phone}</a>
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Активен', 
      dataIndex: 'isActive', 
      key: 'isActive', 
      render: (val) => val ? 'Да' : 'Нет'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>Редактировать</Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>Удалить</Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Поиск клиента"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Button type="primary" onClick={handleAdd}>Добавить клиента</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        bordered
      />

      <Modal
        title={editingClient ? 'Редактировать клиента' : 'Создать клиента'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
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

          <Form.Item label="Активен" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
