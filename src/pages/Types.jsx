import React, { useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Switch,
  Popconfirm,
  Tag,
  Grid,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import {
  useGetArmorTypesQuery,
  useCreateArmorTypeMutation,
  useUpdateArmorTypeMutation,
  useDeleteArmorTypeMutation,
} from "../store/api/armorTypesApi";

const { useBreakpoint } = Grid;

export default function Types() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data = [], isLoading } = useGetArmorTypesQuery();
  const [createArmorType] = useCreateArmorTypeMutation();
  const [updateArmorType] = useUpdateArmorTypeMutation();
  const [deleteArmorType] = useDeleteArmorTypeMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  // Открытие модалки
  const openModal = (record = null) => {
    setEditingRecord(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  // Сохранение данных
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        await updateArmorType({
          id: editingRecord.id,
          data: values,
        }).unwrap();
        message.success("Вид обновлён");
      } else {
        await createArmorType(values).unwrap();
        message.success("Вид создан");
      }

      closeModal();
    } catch (err) {
      message.error(err?.data?.message || "Ошибка сохранения");
    }
  };

  // Удаление с подтверждением
  const handleDelete = async (id) => {
    try {
      await deleteArmorType(id).unwrap();
      message.success("Вид удалён");
    } catch (err) {
      message.error(err?.data?.message || "Ошибка удаления");
    }
  };

  // Колонки таблицы
  const columns = [
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      responsive: ["md"],
    },
    {
      title: "Статус",
      dataIndex: "isActive",
      key: "isActive",
      render: (val) =>
        val ? <Tag color="green">Активен</Tag> : <Tag color="red">Неактивен</Tag>,
    },
    {
      title: "Действия",
      key: "action",
      width: isMobile ? 100 : 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
            type="text"
          />
          {/* <Popconfirm
            title="Удалить этот вид?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button danger icon={<DeleteOutlined />} type="text" />
          </Popconfirm> */}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 0 : 12 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Справочник видов</h2>
          <div style={{ color: "#888", fontSize: 13 }}>
            Всего записей: {data.length}
          </div>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
          block={isMobile}
        >
          Создать вид
        </Button>
      </div>

      {/* Таблица */}
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        bordered
        pagination={{ pageSize: 8 }}
        scroll={{ x: true }}
        size="small"
      />

      {/* Модалка */}
      <Modal
        title={editingRecord ? "Редактирование вида" : "Создание вида"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={closeModal}
        okText="Сохранить"
        cancelText="Отмена"
        width={isMobile ? "90%" : 500}
        centered
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input placeholder="Введите название вида" />
          </Form.Item>

          <Form.Item label="Описание" name="description">
            <Input.TextArea
              rows={4}
              placeholder="Введите описание (необязательно)"
            />
          </Form.Item>

          <Form.Item
            label="Активен"
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
