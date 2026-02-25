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
  Grid
} from 'antd';

import {
  useGetDeviceTypesQuery,
  useCreateDeviceTypeMutation,
  useUpdateDeviceTypeMutation,
  useDeleteDeviceTypeMutation
} from '../store/api/deviceTypeApi';

const { useBreakpoint } = Grid;

export default function DeviceTypeTable() {
  const { data: deviceTypes, refetch } = useGetDeviceTypesQuery();
  const [createDeviceType] = useCreateDeviceTypeMutation();
  const [updateDeviceType] = useUpdateDeviceTypeMutation();
  const [deleteDeviceType] = useDeleteDeviceTypeMutation();

  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
    } catch {
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
    } catch {
      message.error('Ошибка сохранения');
    }
  };

  const filteredData = deviceTypes?.filter((dt) =>
    dt.name.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Бренд',
      dataIndex: 'brand',
      key: 'brand',
      responsive: ['md'], // скрывается на мобильных
    },
    {
      title: 'Активно',
      dataIndex: 'isActive',
      key: 'isActive',
      responsive: ['sm'],
      render: (val) => (val ? 'Да' : 'Нет'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button
            type="link"
            size={isMobile ? 'small' : 'middle'}
            onClick={() => handleEdit(record)}
          >
            Редактировать
          </Button>
          <Button
            type="link"
            danger
            size={isMobile ? 'small' : 'middle'}
            onClick={() => handleDelete(record.id)}
          >
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 8 : 0 }}>
      <Space
        direction={isMobile ? 'vertical' : 'horizontal'}
        style={{ marginBottom: 16, width: '100%' }}
      >
        <Input.Search
          placeholder="Поиск устройства"
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
          Добавить устройство
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        scroll={{ x: true }} // горизонтальный скролл
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
        }}
        size={'small'}
      />

      <Modal
        title={editingDevice ? 'Редактировать устройство' : 'Создать устройство'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
        width={isMobile ? '100%' : 500}
        style={isMobile ? { top: 0 } : {}}
        bodyStyle={isMobile ? { padding: 16 } : {}}
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

          <Form.Item
            label="Активно"
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
