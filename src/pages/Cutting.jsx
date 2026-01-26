import React, { useState } from "react";
import { Table, Button, Modal, Input, message } from "antd";

export default function CuttingFiles() {
  const [dataSource, setDataSource] = useState([
    { key: "1", fileName: "banner1.eps", customName: "banner1" },
    { key: "2", fileName: "sticker_logo.eps", customName: "sticker_logo" },
    { key: "3", fileName: "poster.eps", customName: "poster" },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleCutClick = (record) => {
    setSelectedFile(record);
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    message.success(
      `Файл "${selectedFile.fileName}" отправлен на резку как "${selectedFile.customName}"!`
    );
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleNameChange = (key, value) => {
    setDataSource((prev) =>
      prev.map((item) => (item.key === key ? { ...item, customName: value } : item))
    );
  };

  const columns = [
    {
      title: "Исходный файл",
      dataIndex: "fileName",
      key: "fileName",
    },
    {
      title: "Название для резки",
      dataIndex: "customName",
      key: "customName",
      render: (_, record) => (
        <Input
          placeholder="Введите название"
          value={record.customName}
          onChange={(e) => handleNameChange(record.key, e.target.value)}
        />
      ),
    },
    {
      title: "Действие",
      key: "action",
      render: (_, record) => (
        <Button type="primary" onClick={() => handleCutClick(record)}>
          Резать
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Table dataSource={dataSource} columns={columns} pagination={false} bordered />

      <Modal
        title="Подтверждение резки"
        open={isModalOpen}
        onOk={handleConfirm}
        onCancel={handleCancel}
        okText="Подтвердить"
        cancelText="Отмена"
      >
        {selectedFile && (
          <p>
            Вы уверены, что хотите отправить файл{" "}
            <strong>{selectedFile.fileName}</strong> на резку с названием{" "}
            <strong>{selectedFile.customName}</strong>?
          </p>
        )}
      </Modal>
    </div>
  );
}
