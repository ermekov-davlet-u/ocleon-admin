import React, { useState } from "react";
import { Table, Button, Modal, Input, Select, message, Space, InputNumber, Switch } from "antd";

const { Option } = Select;

export default function Products() {
  // Пример данных для типов и материалов
  const types = ["Пленка", "Баннер", "Самоклейка"];
  const materials = ["Матовая", "Глянцевая", "Прозрачная"];

  const [dataSource, setDataSource] = useState([
    {
      key: "1",
      name: "Броня матовая",
      type: "Пленка",
      material: "Матовая",
      device: "Смартфон",
      availability: true,
      price: 500,
      description: "Матовая защитная пленка для смартфонов",
    },
    {
      key: "2",
      name: "Броня глянцевая",
      type: "Баннер",
      material: "Глянцевая",
      device: "Планшет",
      availability: true,
      price: 700,
      description: "Глянцевая пленка для планшетов",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Поля редактирования
  const [editingName, setEditingName] = useState("");
  const [editingType, setEditingType] = useState(types[0]);
  const [editingMaterial, setEditingMaterial] = useState(materials[0]);
  const [editingDevice, setEditingDevice] = useState("Смартфон");
  const [editingAvailability, setEditingAvailability] = useState(true);
  const [editingPrice, setEditingPrice] = useState(0);
  const [editingDescription, setEditingDescription] = useState("");

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditingName(record.name);
    setEditingType(record.type);
    setEditingMaterial(record.material);
    setEditingDevice(record.device);
    setEditingAvailability(record.availability);
    setEditingPrice(record.price);
    setEditingDescription(record.description);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    setDataSource((prev) =>
      prev.map((item) =>
        item.key === editingRecord.key
          ? {
              ...item,
              name: editingName,
              type: editingType,
              material: editingMaterial,
              device: editingDevice,
              availability: editingAvailability,
              price: editingPrice,
              description: editingDescription,
            }
          : item
      )
    );
    message.success("Товар обновлён!");
    setIsModalOpen(false);
    setEditingRecord(null);
  };

  const handleDelete = (key) => {
    setDataSource((prev) => prev.filter((item) => item.key !== key));
    message.success("Товар удалён!");
  };

  const columns = [
    { title: "ID", dataIndex: "key", key: "key", width: 60 },
    { title: "Название", dataIndex: "name", key: "name" },
    { title: "Тип", dataIndex: "type", key: "type" },
    { title: "Материал", dataIndex: "material", key: "material" },
    { title: "Устройство", dataIndex: "device", key: "device" },
    {
      title: "Наличие",
      dataIndex: "availability",
      key: "availability",
      render: (available) => (available ? "Да" : "Нет"),
    },
    {
      title: "Цена",
      dataIndex: "price",
      key: "price",
      render: (price) => `${price} сом`,
    },
    { title: "Описание", dataIndex: "description", key: "description" },
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
      <h2>Виды броне-оклейки</h2>
      <Table dataSource={dataSource} columns={columns} pagination={false} bordered />

      <Modal
        title="Редактировать товар"
        open={isModalOpen}
        onOk={handleConfirm}
        onCancel={() => setIsModalOpen(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          placeholder="Название"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Select
          value={editingType}
          onChange={(value) => setEditingType(value)}
          style={{ width: "100%", marginBottom: 12 }}
        >
          {types.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Select>
        <Select
          value={editingMaterial}
          onChange={(value) => setEditingMaterial(value)}
          style={{ width: "100%", marginBottom: 12 }}
        >
          {materials.map((m) => (
            <Option key={m} value={m}>
              {m}
            </Option>
          ))}
        </Select>
        <Select
          value={editingDevice}
          onChange={(value) => setEditingDevice(value)}
          style={{ width: "100%", marginBottom: 12 }}
        >
          <Option value="Смартфон">Смартфон</Option>
          <Option value="Планшет">Планшет</Option>
          <Option value="Ноутбук">Ноутбук</Option>
        </Select>
        <div style={{ marginBottom: 12 }}>
          <span>Наличие: </span>
          <Switch
            checked={editingAvailability}
            onChange={(checked) => setEditingAvailability(checked)}
          />
        </div>
        <InputNumber
          style={{ width: "100%", marginBottom: 12 }}
          placeholder="Цена"
          value={editingPrice}
          onChange={(value) => setEditingPrice(value)}
        />
        <Input.TextArea
          placeholder="Описание"
          value={editingDescription}
          onChange={(e) => setEditingDescription(e.target.value)}
          rows={3}
        />
      </Modal>
    </div>
  );
}
