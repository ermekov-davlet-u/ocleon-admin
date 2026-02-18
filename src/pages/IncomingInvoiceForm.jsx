import React from 'react';
import {
  Form,
  Input,
  Button,
  Select,
  InputNumber,
  Card,
  Divider,
  message,
  Space,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useGetMaterialsQuery } from '../store/api/cuttingApi';
import { useCreateInvoiceMutation } from '../store/api/invoiceApi';

const { Option } = Select;

const IncomingInvoiceForm = () => {
  const [form] = Form.useForm();
  const { data: materials, isLoading } = useGetMaterialsQuery();
  const [createInvoice, { isLoading: isSaving }] = useCreateInvoiceMutation();

  const items = Form.useWatch('items', form) || [];

  const total = (items || []).reduce(
    (sum, item) =>
      sum + (Number(item?.quantity) || 0) * (Number(item?.price) || 0),
    0
  );

  const onFinish = async (values) => {
    if (!values.items || values.items.length === 0) {
      message.error('Добавьте хотя бы один материал');
      return;
    }
    try {
      await createInvoice({
        type: 'incoming',
        comment: values.comment,
        items: values.items,
      }).unwrap();
      message.success('Приход успешно создан');
      form.resetFields();
    } catch {
      message.error('Ошибка при создании прихода');
    }
  };

  return (
    <Card title="Создание прихода материалов">
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ items: [{}] }}>
        <Form.Item label="Комментарий" name="comment">
          <Input placeholder="Комментарий к накладной" />
        </Form.Item>

        <Divider />

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fields.map(({ key, name }) => (
                  <Space
                    key={key}
                    align="baseline"
                    style={{ display: 'flex', gap: 8 }}
                  >
                    <Form.Item
                      name={[name, 'materialId']}
                      rules={[{ required: true, message: 'Выберите материал' }]}
                      style={{ width: 200 }}
                    >
                      <Select placeholder="Материал" loading={isLoading} style={{ width: '100%' }}>
                        {materials?.map((m) => (
                          <Option key={m.id} value={m.id}>
                            {m.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Введите количество' }]}
                    >
                      <InputNumber min={0} placeholder="Количество" />
                    </Form.Item>

                    <Form.Item
                      name={[name, 'price']}
                      rules={[{ required: true, message: 'Введите цену' }]}
                    >
                      <InputNumber min={0} placeholder="Цена" />
                    </Form.Item>

                    <span>
                      {(Number(form.getFieldValue(['items', name, 'quantity'])) || 0) *
                        (Number(form.getFieldValue(['items', name, 'price'])) || 0)}
                    </span>

                    <Button
                      type="link"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Space>
                ))}
              </div>

              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                style={{ marginTop: 8 }}
              >
                Добавить материал
              </Button>
            </>
          )}
        </Form.List>

        <Divider />

        <div style={{ fontWeight: 600 }}>Итого: {total.toFixed(2)}</div>

        <Button type="primary" htmlType="submit" loading={isSaving} style={{ marginTop: 16 }}>
          Сохранить приход
        </Button>
      </Form>
    </Card>
  );
};

export default IncomingInvoiceForm;
