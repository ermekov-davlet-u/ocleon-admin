import React, { useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select } from 'antd';
import {
  useGetUsersQuery,
  useGetBranchesQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../store/api/userApi';

const { Option } = Select;

export default function Employees() {
  const { data: users, isLoading } = useGetUsersQuery();
  const { data: branches } = useGetBranchesQuery();
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form] = Form.useForm();

  const handleOpenModal = (user) => {
    setEditingUser(user || null);
    form.setFieldsValue(user || { userName: '', password: '', isRole: 'USER', branchId: undefined });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingUser) {
      await updateUser({ id: editingUser.id, body: { ...values, branch: { id: values.branchId } } });
    } else {
      await createUser({ ...values, branch: { id: values.branchId } });
    }
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    await deleteUser(id);
  };

  const columns = [
    {
      title: 'ФИО',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Роль',
      dataIndex: 'isRole',
      key: 'isRole',
      render: (role) => <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag>,
    },
    {
      title: 'Филиал',
      dataIndex: ['branch', 'name'],
      key: 'branch',
      render: (branchName) => branchName || '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => handleOpenModal(record)}>
            Редактировать
          </Button>
          {/* <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Удалить
          </Button> */}
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => handleOpenModal()}>
        Добавить пользователя
      </Button>
      <Table
        dataSource={users?.map((u) => ({ ...u, key: u.id })) || []}
        columns={columns}
        loading={isLoading}
        bordered
      />

      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="userName" label="ФИО" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Пароль" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="isRole" label="Роль" rules={[{ required: true }]}>
            <Select>
              <Option value="USER">USER</Option>
              <Option value="ADMIN">ADMIN</Option>
            </Select>
          </Form.Item>
          <Form.Item name="branchId" label="Филиал" rules={[{ required: true }]}>
            <Select placeholder="Выберите филиал">
              {branches?.map((b) => (
                <Option key={b.id} value={b.id}>
                  {b.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
