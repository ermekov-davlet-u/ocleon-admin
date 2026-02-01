import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, message } from 'antd';
import {
  useGetDeviceTypesQuery,
  useCreateDeviceTypeMutation,
  useUpdateDeviceTypeMutation,
  useDeleteDeviceTypeMutation
} from '../store/api/deviceTypeApi';

export default function DeviceTypeTable() {
  const { data: deviceTypes, refetch } = useGetDeviceTypesQuery();
  const [createDeviceType] = useCreateDeviceTypeMutation();
  const [updateDeviceType] = useUpdateDeviceTypeMutation();
  const [deleteDeviceType] = useDeleteDeviceTypeMutation();

  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingDevice(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeviceType(id).unwrap();
      message.success('Устройство удалено');
      refetch();
    } catch (err) {
      message.error('Ошибка удаления');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingDevice) {
        await updateDeviceType({ id: editingDevice.id, data: values }).unwrap();
        message.success('Устройство обновлено');
      } else {
        await createDeviceType(values).unwrap();
        message.success('Устройство создано');
      }

      setIsModalVisible(false);
      refetch();
    } catch (err) {
      message.error('Ошибка сохранения');
    }
  };

  const filteredData = deviceTypes?.filter((dt) =>
    dt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Поиск устройства"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
        <Button type="primary" onClick={handleAdd}>
          Добавить устройство
        </Button>
      </Space>

      <Table
        columns={[
          { title: 'Название', dataIndex: 'name', key: 'name' },
          { title: 'Бренд', dataIndex: 'brand', key: 'brand' },
          {
            title: 'Активно',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (val) => (val ? 'Да' : 'Нет')
          },
          {
            title: 'Действия',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button type="link" onClick={() => handleEdit(record)}>
                  Редактировать
                </Button>
                <Button type="link" danger onClick={() => handleDelete(record.id)}>
                  Удалить
                </Button>
              </Space>
            )
          }
        ]}
        dataSource={filteredData}
        rowKey="id"
      />

      <Modal
  title={editingDevice ? 'Редактировать устройство' : 'Создать устройство'}
  open={isModalVisible}           // ✅ теперь модалка откроется
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

    <Form.Item label="Бренд" name="brand">
      <Input />
    </Form.Item>

    <Form.Item label="Активно" name="isActive" valuePropName="checked">
      <Switch />
    </Form.Item>
  </Form>
</Modal>

    </div>
  );
}
