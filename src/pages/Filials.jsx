import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Tag, Space, message } from 'antd';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation
} from '../store/api/branchesApi';

export default function Branches() {
  const { data: branches, refetch } = useGetBranchesQuery();
  const [createBranch] = useCreateBranchMutation();
  const [updateBranch] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingBranch(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingBranch(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteBranch(id).unwrap();
      message.success('Филиал удалён');
      refetch();
    } catch (err) {
      message.error('Ошибка удаления');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingBranch) {
        await updateBranch({ id: editingBranch.id, data: values }).unwrap();
        message.success('Филиал обновлён');
      } else {
        await createBranch(values).unwrap();
        message.success('Филиал создан');
      }
      setIsModalVisible(false);
      refetch();
    } catch (err) {
      message.error('Ошибка сохранения');
    }
  };

  const filteredData = branches?.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.address && b.address.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    { title: 'Название', dataIndex: 'name', key: 'name' },
    { title: 'Адрес', dataIndex: 'address', key: 'address' },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone ? <a href={`tel:${phone}`}>{phone}</a> : '-',
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'status',
      render: (val) => <Tag color={val ? 'green' : 'red'}>{val ? 'Работает' : 'Закрыт'}</Tag>,
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
          placeholder="Поиск филиала"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Button type="primary" onClick={handleAdd}>Добавить филиал</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        bordered
      />

      <Modal
        title={editingBranch ? 'Редактировать филиал' : 'Создать филиал'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Адрес"
            name="address"
            rules={[{ required: true, message: 'Введите адрес' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Телефон" name="phone">
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
