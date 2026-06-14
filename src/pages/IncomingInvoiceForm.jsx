import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Card,
  Divider,
  message,
  Table,
  Modal,
} from 'antd';
import { useGetMaterialsQuery } from '../store/api/cuttingApi';
import { useCreateInvoiceMutation } from '../store/api/invoiceApi';

const { Option } = Select;

const IncomingInvoiceForm = () => {
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [items, setItems] = useState([]);

  const { data: materials, isLoading } = useGetMaterialsQuery();
  const [createInvoice, { isLoading: isSaving }] = useCreateInvoiceMutation();

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const openModal = () => {
    modalForm.resetFields();
    setModalVisible(true);
  };

  const handleModalOk = () => {
    modalForm.validateFields().then((values) => {
      setItems([...items, values]);
      setModalVisible(false);
      message.success('Материал добавлен');
    });
  };

  const handleRemove = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const onFinish = async (values) => {
    if (items.length === 0) {
      message.error('Добавьте хотя бы один материал');
      return;
    }

    try {
      await createInvoice({
        type: 'incoming',
        comment: values.comment,
        items,
      }).unwrap();
      message.success('Приход успешно создан');
      form.resetFields();
      setItems([]);
    } catch {
      message.error('Ошибка при создании прихода');
    }
  };

  const columns = [
    {
      title: 'Материал',
      dataIndex: 'materialId',
      render: (value) => {
        const material = materials?.find((m) => m.id === value);
        return material?.name || '-';
      },
    },
    {
      title: 'Кол-во',
      dataIndex: 'quantity',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
    },
    {
      title: 'Сумма',
      render: (_, record) => (record.quantity * record.price).toFixed(2),
    },
    {
      title: '',
      render: (_, record, index) => (
        <Button type="link" danger onClick={() => handleRemove(index)}>
          Удалить
        </Button>
      ),
    }, 
  ];

  return (
    <Card title="Создание прихода материалов">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Комментарий" name="comment">
          <Input placeholder="Комментарий к накладной" />
        </Form.Item>

        <Divider />

        <Table
          dataSource={items}
          columns={columns}
          rowKey={(record, index) => index}
          pagination={false}
          size="small"
        />

        <Button type="dashed" onClick={openModal} style={{ marginTop: 12 }}>
          Добавить материал
        </Button>

        <Divider />

        <div style={{ fontWeight: 600 }}>Итого: {total.toFixed(2)}</div>

        <Button type="primary" htmlType="submit" loading={isSaving} style={{ marginTop: 16 }}>
          Сохранить приход
        </Button>
      </Form>

      <Modal
        title="Добавить материал"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={modalForm} layout="vertical">
          <Form.Item
            label="Материал"
            name="materialId"
            rules={[{ required: true, message: 'Выберите материал' }]}
          >
            <Select placeholder="Выберите материал" loading={isLoading}>
              {materials?.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Кол-во"
            name="quantity"
            rules={[{ required: true, message: 'Введите количество' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Цена"
            name="price"
            rules={[{ required: true, message: 'Введите цену' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default IncomingInvoiceForm;
