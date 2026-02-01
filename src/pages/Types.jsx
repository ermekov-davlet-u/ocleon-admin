import React, { useState } from "react";
import { Table, Button, Modal, Input, Space, message, Switch } from "antd";
import {
  useGetArmorTypesQuery,
  useCreateArmorTypeMutation,
  useUpdateArmorTypeMutation,
  useDeleteArmorTypeMutation,
} from "../store/api/armorTypesApi";

export default function Types() {
  const { data, isLoading } = useGetArmorTypesQuery();
  const [createArmorType] = useCreateArmorTypeMutation();
  const [updateArmorType] = useUpdateArmorTypeMutation();
  const [deleteArmorType] = useDeleteArmorTypeMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Открыть модалку (создание / редактирование)
  const openModal = (record) => {
    if (record) {
      setEditingRecord(record);
      setName(record.name);
      setDescription(record.description || "");
      setIsActive(record.isActive ?? true);
    } else {
      setEditingRecord(null);
      setName("");
      setDescription("");
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingRecord) {
        await updateArmorType({ id: editingRecord.id, data: { name, description, isActive } }).unwrap();
        message.success("Запись обновлена");
      } else {
        await createArmorType({ name, description, isActive }).unwrap();
        message.success("Запись создана");
      }
      setIsModalOpen(false);
    } catch (err) {
      message.error(err?.data?.message || "Ошибка при сохранении");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteArmorType(id).unwrap();
      message.success("Запись удалена");
    } catch (err) {
      message.error(err?.data?.message || "Ошибка при удалении");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Название вида", dataIndex: "name", key: "name" },
    { title: "Описание", dataIndex: "description", key: "description" },
    {
      title: "Активен",
      dataIndex: "isActive",
      key: "isActive",
      render: (val) => (val ? "Да" : "Нет"),
    },
    {
      title: "Действия",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button onClick={() => openModal(record)}>Редактировать</Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Справочник видов</h2>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => openModal()}>
        Создать вид
      </Button>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        bordered
      />

      <Modal
        title={editingRecord ? "Редактировать вид" : "Создать вид"}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          placeholder="Название вида"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Input.TextArea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ marginBottom: 12 }}
        />
        <div>
          Активен: <Switch checked={isActive} onChange={setIsActive} />
        </div>
      </Modal>
    </div>
  );
}
