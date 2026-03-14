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
  Select,
  Popconfirm,
  Tag
} from 'antd';

import {
  useGetDeviceTypesQuery,
  useCreateDeviceTypeMutation,
  useUpdateDeviceTypeMutation,
  useDeleteDeviceTypeMutation,
  useMergeDeviceTypesMutation
} from '../store/api/deviceTypeApi';

const { useBreakpoint } = Grid;

export default function DeviceTypeTable() {
  const { data: deviceTypes = [], refetch, isLoading } = useGetDeviceTypesQuery();
  const [createDeviceType] = useCreateDeviceTypeMutation();
  const [updateDeviceType] = useUpdateDeviceTypeMutation();
  const [deleteDeviceType] = useDeleteDeviceTypeMutation();
  const [mergeDeviceTypes, { isLoading: isMerging }] = useMergeDeviceTypesMutation();

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [search, setSearch] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState(undefined);
  const [mergeSourceIds, setMergeSourceIds] = useState([]);

  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
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

  const handleMerge = async () => {
    if (!mergeTargetId) {
      message.warning('Выбери основное устройство');
      return;
    }

    if (!mergeSourceIds.length) {
      message.warning('Выбери устройства для объединения');
      return;
    }

    if (mergeSourceIds.includes(mergeTargetId)) {
      message.warning('Основное устройство не должно входить в список объединяемых');
      return;
    }

    try {
      await mergeDeviceTypes({
        targetId: mergeTargetId,
        sourceIds: mergeSourceIds,
      }).unwrap();

      message.success('Устройства успешно объединены');
      setIsMergeModalVisible(false);
      setMergeTargetId(undefined);
      setMergeSourceIds([]);
      refetch();
    } catch (e) {
      message.error('Ошибка объединения');
    }
  };

  const filteredData = useMemo(() => {
    return deviceTypes.filter((dt) => {
      const text = `${dt.name || ''} ${dt.brand || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [deviceTypes, search]);

  const activeOptions = deviceTypes
    .filter((d) => d.isActive)
    .map((d) => ({
      label: `${d.name}${d.brand ? ` (${d.brand})` : ''}`,
      value: d.id,
    }));

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.name}</div>
          {isMobile && record.brand ? (
            <div style={{ color: '#888', fontSize: 12 }}>{record.brand}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Бренд',
      dataIndex: 'brand',
      key: 'brand',
      responsive: ['md'],
    },
    {
      title: 'Активно',
      dataIndex: 'isActive',
      key: 'isActive',
      responsive: ['sm'],
      render: (val) => (
        <Tag color={val ? 'green' : 'red'}>
          {val ? 'Да' : 'Нет'}
        </Tag>
      ),
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

          <Popconfirm
            title="Удалить устройство?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              danger
              size={isMobile ? 'small' : 'middle'}
            >
              Удалить
            </Button>
          </Popconfirm>
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
          style={{ width: isMobile ? '100%' : 280 }}
        />

        <Button
          type="primary"
          onClick={handleAdd}
          block={isMobile}
        >
          Добавить устройство
        </Button>

        <Button
          onClick={() => setIsMergeModalVisible(true)}
          block={isMobile}
        >
          Объединить устройства
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
        }}
        size="small"
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

      <Modal
        title="Объединить устройства"
        open={isMergeModalVisible}
        onOk={handleMerge}
        onCancel={() => {
          setIsMergeModalVisible(false);
          setMergeTargetId(undefined);
          setMergeSourceIds([]);
        }}
        okText="Объединить"
        confirmLoading={isMerging}
        width={isMobile ? '100%' : 700}
        style={isMobile ? { top: 0 } : {}}
      >
        <Form layout="vertical">
          <Form.Item label="Основное устройство">
            <Select
              showSearch
              placeholder="Выбери устройство, в которое будет объединение"
              value={mergeTargetId}
              onChange={setMergeTargetId}
              options={activeOptions}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item label="Какие устройства объединить в него">
            <Select
              mode="multiple"
              showSearch
              placeholder="Выбери дубли"
              value={mergeSourceIds}
              onChange={setMergeSourceIds}
              options={activeOptions.filter((o) => o.value !== mergeTargetId)}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}