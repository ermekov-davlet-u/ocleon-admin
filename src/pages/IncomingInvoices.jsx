import React, { useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, InputNumber, Space } from 'antd';
import { useGetReceiptsQuery, useCreateReceiptMutation } from '@/store/api/materialReceiptApi';

export default function IncomingInvoices() {
  const { data: receipts, isLoading } = useGetReceiptsQuery();
  const [createReceipt] = useCreateReceiptMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    { title: '№ накладной', dataIndex: 'number', key: 'number' },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => new Date(d).toLocaleDateString()
    },
    {
      title: 'Сумма',
      key: 'total',
      render: (_, record) => {
        const total = record.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        return total.toLocaleString() + ' сом';
      }
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="green">Проведена</Tag>
    },
  ];

  const handleCreate = async (values) => {
    const dto = {
      number: values.number,
      items: values.items.map((i) => ({
        materialId: i.materialId,
        quantity: i.quantity,
        price: i.price,
      })),
    };
    await createReceipt(dto).unwrap();
    setModalOpen(false);
    form.resetFields();
  };

  return (
    <div style={{ padding: 24 }}>
      <Button type="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>
        Создать накладную
      </Button>

      <Table
        dataSource={receipts ? receipts.map(r => ({ ...r, key: r.id })) : []}
        columns={columns}
        loading={isLoading}
        bordered
      />

      <Modal
        title="Создать накладную"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="number" label="№ накладной" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <Space key={field.key} align="baseline">
                    <Form.Item
                      name={[field.name, 'materialId']}
                      label="ID материала"
                      rules={[{ required: true }]}
                    >
                      <InputNumber />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'quantity']}
                      label="Количество"
                      rules={[{ required: true }]}
                    >
                      <InputNumber />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'price']}
                      label="Цена"
                      rules={[{ required: true }]}
                    >
                      <InputNumber />
                    </Form.Item>
                    <Button onClick={() => remove(field.name)} danger>
                      Удалить
                    </Button>
                  </Space>
                ))}
                <Button onClick={() => add()} type="dashed" style={{ marginTop: 8 }}>
                  Добавить материал
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
