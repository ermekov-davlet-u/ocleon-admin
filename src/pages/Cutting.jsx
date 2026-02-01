import React, { useState, useRef } from "react";
import { Table, Button, InputNumber, Select, Modal, message, Popconfirm } from "antd";
import {
  useGetCuttingJobsQuery,
  useCreateCuttingJobMutation,
  usePreviewCuttingJobMutation,
} from "../store/api/cuttingJobApi";
import { useGetMaterialsQuery } from "../store/api/materialsApi";
import { useGetArmorTypesQuery } from "../store/api/armorTypesApi";
import { useGetDeviceTypesQuery } from "../store/api/deviceTypeApi";
import { useChangeOrderStatusMutation, useCreateOrderMutation, useGetOrdersQuery } from "../store/api/orderApi"; // <- мутация для изменения статуса

const { Option } = Select;

export default function CuttingOrders() {
  // Справочники
  const { data: materials = [] } = useGetMaterialsQuery();
  const { data: armorTypes = [] } = useGetArmorTypesQuery();
  const { data: deviceTypes = [] } = useGetDeviceTypesQuery();

  // Резки
  const { data: cuttingJobs = [], isLoading } = useGetOrdersQuery();
  const [createCuttingJob] = useCreateOrderMutation();
  const [previewCuttingJob, { data: previewData, isLoading: isPreviewLoading }] =
    usePreviewCuttingJobMutation();
  const [changeOrderStatus] = useChangeOrderStatusMutation();

  // Локальное состояние формы
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedArmor, setSelectedArmor] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelayRunning, setIsDelayRunning] = useState(false);
  const delayTimeout = useRef(null);

  // --- Создание резки с задержкой ---
  const handleCreateClick = async () => {
    if (!selectedMaterial || !selectedArmor || !selectedDevice) {
      return message.error("Выберите все справочники!");
    }

    try {
      const res = await previewCuttingJob({
        materialId: selectedMaterial.id,
        cuttingTypeId: selectedArmor.id,
        deviceTypeId: selectedDevice.id,
      }).unwrap();

      if (!res) return message.warning("Для выбранной комбинации нет файла резки");

      // Запуск задержки 5 секунд с возможностью отмены
      setIsDelayRunning(true);
      delayTimeout.current = setTimeout(() => {
        setIsModalOpen(true);
        setIsDelayRunning(false);
      }, 5000);
      message.info("Создание резки через 5 секунд. Можно отменить.");
    } catch (e) {
      console.error(e);
      message.error("Ошибка получения резки");
    }
  };

  const cancelDelay = () => {
    if (delayTimeout.current) {
      clearTimeout(delayTimeout.current);
      setIsDelayRunning(false);
      message.info("Создание резки отменено");
    }
  };

  // --- Подтверждение создания резки ---
  const handleConfirm = async () => {
    try {
      await createCuttingJob({
        materialId: selectedMaterial.id,
        cuttingTypeId: selectedArmor.id,
        deviceTypeId: selectedDevice.id,
        quantity,
        notes,
      }).unwrap();

      message.success("Резка создана!");
      setIsModalOpen(false);
      setQuantity(1);
      setNotes("");
    } catch (err) {
      console.error(err);
      message.error("Ошибка создания резки");
    }
  };

  // --- Изменение статуса резки ---
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await changeOrderStatus({ id: jobId, status: newStatus }).unwrap();
      message.success(`Статус резки обновлён на "${newStatus}"`);
    } catch (err) {
      console.error(err);
      message.error("Ошибка обновления статуса");
    }
  };

  const columns = [
    { title: "Материал", dataIndex: ["material", "name"], key: "material" },
    { title: "Тип резки", dataIndex: ["armorType", "name"], key: "armorType" },
    { title: "Устройство", dataIndex: ["deviceType", "name"], key: "deviceType" },
    { title: "Кол-во", dataIndex: "quantity", key: "quantity" },
    {
      title: "Файл",
      dataIndex: "filePath",
      key: "file",
      render: (filePath) =>
        filePath ? (
          <a href={`https://ocleon-back.onrender.com//${filePath}`} target="_blank" rel="noopener noreferrer">
            Скачать
          </a>
        ) : (
          "Нет файла"
        ),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Popconfirm
          title="Вы уверены, что хотите провести/завершить резку?"
          onConfirm={() => handleStatusChange(record.id, "Выполнено")}
          okText="Да"
          cancelText="Нет"
        >
          <Button type="primary" disabled={record.status === "Выполнено"}>
            Провести
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Создать резку</h2>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Select
          placeholder="Выберите материал"
          style={{ width: 200 }}
          value={selectedMaterial?.id}
          onChange={(id) => setSelectedMaterial(materials.find((m) => m.id === id))}
        >
          {materials.map((m) => (
            <Option key={m.id} value={m.id}>
              {m.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Выберите тип резки"
          style={{ width: 200 }}
          value={selectedArmor?.id}
          onChange={(id) => setSelectedArmor(armorTypes.find((a) => a.id === id))}
        >
          {armorTypes.map((a) => (
            <Option key={a.id} value={a.id}>
              {a.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Выберите устройство"
          style={{ width: 200 }}
          value={selectedDevice?.id}
          onChange={(id) => setSelectedDevice(deviceTypes.find((d) => d.id === id))}
        >
          {deviceTypes.map((d) => (
            <Option key={d.id} value={d.id}>
              {d.name}
            </Option>
          ))}
        </Select>

        <InputNumber min={1} value={quantity} onChange={setQuantity} placeholder="Кол-во" />

        {isDelayRunning ? (
          <Button danger onClick={cancelDelay}>
            Отменить создание
          </Button>
        ) : (
          <Button type="primary" loading={isPreviewLoading} onClick={handleCreateClick}>
            Создать резку
          </Button>
        )}
      </div>

      <h2>Список созданных резок</h2>
      <Table dataSource={cuttingJobs} columns={columns} rowKey="id" loading={isLoading} bordered />

      <Modal
        title="Подтвердите создание резки"
        open={isModalOpen}
        onOk={handleConfirm}
        onCancel={() => setIsModalOpen(false)}
        okText="Создать"
        cancelText="Отмена"
      >
        <p>
          Создаётся резка: <strong>{selectedMaterial?.name}</strong> / <strong>{selectedArmor?.name}</strong> на
          устройстве <strong>{selectedDevice?.name}</strong>
        </p>

        {previewData?.filePath && (
          <div style={{ marginTop: 16 }}>
            <p>
              <strong>Файл резки:</strong>
            </p>
            <a
              href={`https://ocleon-back.onrender.com//${previewData.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Открыть в новой вкладке
            </a>

            {previewData.filePath.endsWith(".pdf") && (
              <iframe
                src={`https://ocleon-back.onrender.com//${previewData.filePath}`}
                style={{ width: "100%", height: 400, border: "1px solid #ddd", marginTop: 12 }}
                title="PDF preview"
              />
            )}

            {previewData.filePath.endsWith(".svg") && (
              <img
                src={`https://ocleon-back.onrender.com//${previewData.filePath}`}
                alt="SVG preview"
                style={{ width: "100%", marginTop: 12 }}
              />
            )}
          </div>
        )}

        <p>Количество: {quantity}</p>
        {notes && <p>Примечания: {notes}</p>}
      </Modal>
    </div>
  );
}
