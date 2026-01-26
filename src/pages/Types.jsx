import React, { useState } from "react";
import { Table, Button, Modal, Input, message, Space } from "antd";

export default function Types() {
  const [dataSource, setDataSource] = useState([
    { key: "1", name: "Пленка", description: "Матовая, глянцевая, прозрачная" },
    { key: "2", name: "Баннер", description: "Литой баннер для печати" },
    { key: "3", name: "Самоклейка", description: "Виниловая пленка для наклеек" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  // Открыть модалку для редактирования
  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditingName(record.name);
    setEditingDescription(record.description);
    setIsModalOpen(true);
  };

  // Подтвердить редактирование
  const handleConfirm = () => {
    setDataSource((prev) =>
      prev.map((item) =>
        item.key === editingRecord.key
          ? { ...item, name: editingName, description: editingDescription }
          : item
      )
    );
    message.success("Справочник обновлён!");
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  // Удаление записи
  const handleDelete = (key) => {
    setDataSource((prev) => prev.filter((item) => item.key !== key));
    message.success("Запись удалена!");
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "key",
      key: "key",
      width: 60,
    },
    {
      title: "Название вида",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Действия",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Редактировать</Button>
          <Button danger onClick={() => handleDelete(record.key)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Справочник видов</h2>
      <Table dataSource={dataSource} columns={columns} pagination={false} bordered />

      <Modal
        title="Редактировать вид"
        open={isModalOpen}
        onOk={handleConfirm}
        onCancel={() => setIsModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          placeholder="Название вида"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Input.TextArea
          placeholder="Описание"
          value={editingDescription}
          onChange={(e) => setEditingDescription(e.target.value)}
          rows={4}
        />
      </Modal>
    </div>
  );
}
