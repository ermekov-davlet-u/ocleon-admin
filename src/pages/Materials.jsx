import React, { useState } from "react";
import { Table, Tag, Spin, Button, Modal, Form, Input, InputNumber, Switch, message } from "antd";
import { 
  useGetMaterialsQuery, 
  useCreateMaterialMutation, 
  useUpdateMaterialMutation 
} from "../store/api/materialsApi";

export default function Materials() {
  const { data, error, isLoading } = useGetMaterialsQuery();
  const [createMaterial] = useCreateMaterialMutation();
  const [updateMaterial] = useUpdateMaterialMutation();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null); // null — создание, объект — редактирование

  const [form] = Form.useForm();

  const columns = [
    {
      title: "Штрих-код",
      dataIndex: "barcode",
      key: "barcode",
    },
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Цена",
      dataIndex: "price",
      key: "price",
      render: (price) => `${price} сом`,
    },
    {
      title: "Категория",
      dataIndex: "type",
      key: "type",
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: "Активен",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Да" : "Нет"}
        </Tag>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setEditingMaterial(record);
            form.setFieldsValue(record);
            setModalVisible(true);
          }}
        >
          Редактировать
        </Button>
      ),
    },
  ];

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingMaterial) {
        // редактирование
        await updateMaterial({ id: editingMaterial.id, ...values }).unwrap();
        message.success("Материал обновлён");
      } else {
        // создание
        await createMaterial(values).unwrap();
        message.success("Материал создан");
      }
      setModalVisible(false);
      setEditingMaterial(null);
      form.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Ошибка при сохранении");
    }
  };

  if (isLoading) return <Spin style={{ margin: 50 }} />;
  if (error) return <div>Ошибка загрузки данных</div>;

  return (
    <div style={{ padding: 24 }}>
      <Button
        type="primary"
        style={{ marginBottom: 16 }}
        onClick={() => {
          setEditingMaterial(null);
          form.resetFields();
          setModalVisible(true);
        }}
      >
        Создать материал
      </Button>

      <Table
        dataSource={data?.map((item) => ({ ...item, key: item.id }))}
        columns={columns}
        pagination={false}
        bordered
      />

      <Modal
  title={editingMaterial ? "Редактировать материал" : "Создать материал"}
  open={modalVisible} // ✅ новый проп
  onOk={handleOk}
  onCancel={() => {
    setModalVisible(false);
    setEditingMaterial(null);
    form.resetFields();
  }}
>

        <Form form={form} layout="vertical">
          <Form.Item name="barcode" label="Штрих-код" rules={[{ required: true, message: "Введите штрих-код" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Название" rules={[{ required: true, message: "Введите название" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Категория">
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Цена" rules={[{ required: true, message: "Введите цену" }]}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="isActive" label="Активен" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
