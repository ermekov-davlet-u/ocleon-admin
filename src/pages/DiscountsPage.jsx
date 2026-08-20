// pages/DiscountsPage.tsx
import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  DatePicker,
  Tag,
  Space,
  Popconfirm,
  message,
  Typography,
  Badge,
  Tooltip,
  Row,
  Col,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PercentageOutlined,
  DollarOutlined,
  TagOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  useGetDiscountsQuery,
  useCreateDiscountMutation,
  useUpdateDiscountMutation,
  useDeleteDiscountMutation,
} from '../store/api/discountApi';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// ------- константы -------
const DISCOUNT_TYPE_LABELS = {
  PERCENTAGE: { label: 'Процент', color: 'blue', icon: <PercentageOutlined /> },
  FIXED: { label: 'Фикс. сумма', color: 'green', icon: <DollarOutlined /> },
};

const DISCOUNT_RULE_LABELS = {
  SECOND_WRAPPING: { label: 'Вторая оклейка', color: 'purple' },
  REFERRAL: { label: 'Реферал', color: 'orange' },
  SECOND_DEVICE: { label: 'Второе устройство', color: 'cyan' },
  MANUAL: { label: 'Другая', color: 'default' },
};

const EMPTY_FORM = {
  name: '',
  type: 'PERCENTAGE',
  value: 0,
  rule: 'MANUAL',
  description: '',
  isActive: true,
  dateRange: null,
  clientId: undefined,
};

export default function DiscountsPage() {
  const { data: discounts = [], isLoading } = useGetDiscountsQuery();
  const [createDiscount] = useCreateDiscountMutation();
  const [updateDiscount] = useUpdateDiscountMutation();
  const [deleteDiscount] = useDeleteDiscountMutation();

  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null); // null = создание

  // ------- открытие модалки -------
  const openCreate = () => {
    setEditingDiscount(null);
    form.resetFields();
    form.setFieldsValue(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingDiscount(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      value: record.value,
      rule: record.rule ?? 'MANUAL',
      description: record.description ?? '',
      isActive: record.isActive,
      clientId: record.client?.id,
      dateRange:
        record.startDate && record.endDate
          ? [dayjs(record.startDate), dayjs(record.endDate)]
          : null,
    });
    setIsModalOpen(true);
  };

  // ------- сохранение -------
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const { dateRange, ...rest } = values;

      const payload = {
        ...rest,
        startDate: dateRange?.[0]?.toISOString() ?? undefined,
        endDate: dateRange?.[1]?.toISOString() ?? undefined,
      };

      if (editingDiscount) {
        await updateDiscount({ id: editingDiscount.id, body: payload }).unwrap();
        message.success('Скидка обновлена');
      } else {
        await createDiscount(payload).unwrap();
        message.success('Скидка создана');
      }

      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      if (err?.errorFields) return; // ошибки валидации — не показываем message
      message.error('Ошибка сохранения скидки');
      console.error(err);
    }
  };

  // ------- удаление -------
  const handleDelete = async (id) => {
    try {
      await deleteDiscount(id).unwrap();
      message.success('Скидка удалена');
    } catch (err) {
      message.error('Ошибка удаления скидки');
      console.error(err);
    }
  };

  // ------- колонки таблицы -------
  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <TagOutlined style={{ color: record.isActive ? '#1677ff' : '#aaa' }} />
          <Text strong={record.isActive} type={record.isActive ? undefined : 'secondary'}>
            {name}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const meta = DISCOUNT_TYPE_LABELS[type] ?? {};
        return (
          <Tag color={meta.color} icon={meta.icon}>
            {meta.label ?? type}
          </Tag>
        );
      },
    },
    {
      title: 'Значение',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) =>
        record.type === 'PERCENTAGE'
          ? <Text strong>{value}%</Text>
          : <Text strong>{value} сом</Text>,
    },
    {
      title: 'Правило',
      dataIndex: 'rule',
      key: 'rule',
      render: (rule) => {
        if (!rule) return <Text type="secondary">—</Text>;
        const meta = DISCOUNT_RULE_LABELS[rule] ?? {};
        return <Tag color={meta.color}>{meta.label ?? rule}</Tag>;
      },
    },
    {
      title: 'Клиент',
      key: 'client',
      render: (_, record) =>
        record.client ? (
          <Space direction="vertical" size={0}>
            <Text>{record.client.name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.client.phone}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">Общая</Text>
        ),
    },
    {
      title: 'Период',
      key: 'period',
      render: (_, record) => {
        if (!record.startDate && !record.endDate)
          return <Text type="secondary">Без ограничений</Text>;
        return (
          <Text style={{ fontSize: 12 }}>
            {record.startDate ? dayjs(record.startDate).format('DD.MM.YYYY') : '∞'}
            {' — '}
            {record.endDate ? dayjs(record.endDate).format('DD.MM.YYYY') : '∞'}
          </Text>
        );
      },
    },
    {
      title: 'Статус',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) =>
        isActive ? (
          <Badge status="success" text="Активна" />
        ) : (
          <Badge status="default" text="Неактивна" />
        ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Редактировать">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить скидку?"
            description="Это действие нельзя отменить."
            onConfirm={() => handleDelete(record.id)}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Удалить">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ------- статистика -------
  const activeCount = discounts.filter((d) => d.isActive).length;
  const inactiveCount = discounts.length - activeCount;

  return (
    <div style={{ padding: 0 }}>
      {/* Заголовок */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Скидки
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreate}
          >
            Создать скидку
          </Button>
        </Col>
      </Row>

      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} md={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text type="secondary">Всего</Text>
            <Title level={4} style={{ margin: 0 }}>
              {discounts.length}
            </Title>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small" style={{ textAlign: 'center', borderColor: '#52c41a' }}>
            <Text type="secondary">Активных</Text>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
              {activeCount}
            </Title>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Text type="secondary">Неактивных</Text>
            <Title level={4} style={{ margin: 0, color: '#aaa' }}>
              {inactiveCount}
            </Title>
          </Card>
        </Col>
      </Row>

      {/* Таблица */}
      <Table
        dataSource={discounts}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        bordered
        scroll={{ x: true }}
        rowClassName={(record) => (!record.isActive ? 'row-inactive' : '')}
      />

      {/* Модалка создания/редактирования */}
      <Modal
        title={editingDiscount ? `Редактировать: ${editingDiscount.name}` : 'Создать скидку'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={editingDiscount ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={EMPTY_FORM}
          style={{ marginTop: 16 }}
        >
          {/* Название */}
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название скидки' }]}
          >
            <Input placeholder="Например: Скидка постоянного клиента" />
          </Form.Item>

          <Row gutter={16}>
            {/* Тип */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="type"
                label="Тип скидки"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="PERCENTAGE">
                    <Space>
                      <PercentageOutlined /> Процент
                    </Space>
                  </Option>
                  <Option value="FIXED">
                    <Space>
                      <DollarOutlined /> Фикс. сумма (сом)
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Значение */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="value"
                label="Значение"
                rules={[
                  { required: true, message: 'Введите значение' },
                  { type: 'number', min: 0, message: 'Должно быть ≥ 0' },
                ]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Например: 15 или 600"
                  addonAfter={
                    <Form.Item name="type" noStyle>
                      <Select style={{ width: 70 }} size="small" bordered={false}>
                        <Option value="PERCENTAGE">%</Option>
                        <Option value="FIXED">сом</Option>
                      </Select>
                    </Form.Item>
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Правило (rule) */}
          <Form.Item name="rule" label="Правило (автоматическое применение)">
            <Select allowClear placeholder="Без правила (ручной выбор)">
              <Option value="MANUAL">Другая (без автоправила)</Option>
              <Option value="SECOND_WRAPPING">Вторая оклейка</Option>
              <Option value="REFERRAL">Реферальная программа</Option>
              <Option value="SECOND_DEVICE">Второе устройство</Option>
            </Select>
          </Form.Item>

          {/* ID клиента (опционально) */}
          <Form.Item
            name="clientId"
            label="Привязать к клиенту (опционально)"
            tooltip="Если не указан — скидка общая"
          >
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              placeholder="ID клиента (оставьте пустым для общей скидки)"
            />
          </Form.Item>

          {/* Описание */}
          <Form.Item name="description" label="Описание">
            <Input.TextArea
              rows={2}
              placeholder="Подробное описание условий скидки..."
            />
          </Form.Item>

          {/* Период действия */}
          <Form.Item
            name="dateRange"
            label="Период действия"
            tooltip="Оставьте пустым, если скидка бессрочная"
          >
            <RangePicker
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              placeholder={['Начало', 'Конец']}
            />
          </Form.Item>

          {/* Активна */}
          <Form.Item
            name="isActive"
            label="Активна"
            valuePropName="checked"
          >
            <Switch checkedChildren="Да" unCheckedChildren="Нет" />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .row-inactive td {
          opacity: 0.55;
        }
      `}</style>
    </div>
  );
}