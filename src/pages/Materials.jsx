import React, { useState } from "react";
import {
  Table,
  Tag,
  Spin,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Grid,
} from "antd";

import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
} from "../store/api/materialsApi";

const { useBreakpoint } = Grid;

export default function Materials() {
  const { data, error, isLoading } = useGetMaterialsQuery();
  const [createMaterial] = useCreateMaterialMutation();
  const [updateMaterial] = useUpdateMaterialMutation();

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    {
      title: "Штрих-код",
      dataIndex: "barcode",
      key: "barcode",
      ellipsis: true,
      responsive: ["md"], // скрываем на телефоне
    },
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
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
      responsive: ["sm"],
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: "Активен",
      dataIndex: "isActive",
      key: "isActive",
      responsive: ["lg"],
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
          size={isMobile ? "small" : "middle"}
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
        await updateMaterial({ id: editingMaterial.id, ...values }).unwrap();
        message.success("Материал обновлён");
      } else {
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
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Button
        type="primary"
        block={isMobile}
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
        bordered
        scroll={{ x: true }} // горизонтальный скролл
        size={"small"}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
        }}
      />

      <Modal
        title={editingMaterial ? "Редактировать материал" : "Создать материал"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => {
          setModalVisible(false);
          setEditingMaterial(null);
          form.resetFields();
        }}
        okText="Сохранить"
        width={isMobile ? "100%" : 600}
        style={isMobile ? { top: 0 } : {}}
        bodyStyle={isMobile ? { padding: 16 } : {}}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="barcode"
            label="Штрих-код"
            rules={[{ required: true, message: "Введите штрих-код" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="type" label="Категория">
            <Input />
          </Form.Item>

          <Form.Item
            name="price"
            label="Цена"
            rules={[{ required: true, message: "Введите цену" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Активен"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
