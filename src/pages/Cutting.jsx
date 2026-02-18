import { useState, useRef } from "react";
import {
  Table,
  Button,
  InputNumber,
  Select,
  Modal,
  message,
  Popconfirm,
  Input,
  Row,
  Col,
} from "antd";

import {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useChangeOrderStatusMutation,
} from "../store/api/orderApi";
import { useGetArmorTypesQuery } from "../store/api/armorTypesApi";
import { useGetDeviceTypesQuery, useGetMaterialsQuery } from "../store/api/cuttingApi";

const { Option } = Select;

export default function CuttingOrders() {
  // --- Справочники ---
  const { data: materials = [] } = useGetMaterialsQuery();
  const { data: armorTypes = [] } = useGetArmorTypesQuery();
  const { data: deviceTypes = [] } = useGetDeviceTypesQuery();

  // --- Резки ---
  const { data: cuttingJobs = [], isLoading } = useGetOrdersQuery();
  const [createCuttingJob] = useCreateOrderMutation();
  const [changeOrderStatus] = useChangeOrderStatusMutation();

  // --- Локальное состояние ---
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedArmor, setSelectedArmor] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDelayRunning, setIsDelayRunning] = useState(false);
  const delayTimeout = useRef(null);

  // --- Создание резки с задержкой ---
  const handleCreateClick = async () => {
    if (
      !selectedMaterial ||
      !selectedArmor ||
      !selectedDevice ||
      !clientPhone
    ) {
      return message.error("Заполните все обязательные поля!");
    }

    setIsDelayRunning(true);
    delayTimeout.current = setTimeout(() => {
      setIsModalOpen(true);
      setIsDelayRunning(false);
    }, 3000); // 3 сек задержка
    message.info("Создание резки через 3 секунды. Можно отменить.");
  };

  const cancelDelay = () => {
    if (delayTimeout.current) {
      clearTimeout(delayTimeout.current);
      setIsDelayRunning(false);
      message.info("Создание резки отменено");
    }
  };

  const handleConfirm = async () => {
    try {
      await createCuttingJob({
        materialId: selectedMaterial.id,
        cuttingTypeId: selectedArmor.id,
        deviceTypeId: selectedDevice.id,
        quantity,
        notes,
        clientName,
        clientPhone,
        clientEmail,
      }).unwrap();

      message.success("Резка создана!");
      setIsModalOpen(false);
      setQuantity(1);
      setNotes("");
      setClientName("");
      setClientPhone("");
      setClientEmail("");
    } catch (err) {
      console.error(err);
      message.error("Ошибка создания резки");
    }
  };

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
  {
    title: "Материал",
    dataIndex: ["cuttingJob", "material", "name"],
    key: "material",
  },
  {
    title: "Тип резки",
    dataIndex: ["cuttingJob", "armorType", "name"],
    key: "armorType",
  },
  {
    title: "Устройство",
    dataIndex: ["cuttingJob", "deviceType", "name"],
    key: "deviceType",
  },
  { title: "Кол-во", dataIndex: "quantity", key: "quantity" },
  { title: "Статус", dataIndex: "status", key: "status" },
  {
    title: "Действия",
    key: "actions",
    render: (_, record) => (
      <Popconfirm
        title="Вы уверены, что хотите провести/завершить резку?"
        onConfirm={() => handleStatusChange(record.id, "DONE")}
        okText="Да"
        cancelText="Нет"
      >
        <Button type="primary" disabled={record.status === "DONE"}>
          Провести
        </Button>
      </Popconfirm>
    ),
  },
];

  return (
    <div style={{ padding: 0 }}>
      <h2>Создать резку</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Материал"
            style={{ width: "100%" }}
            value={selectedMaterial?.id}
            onChange={(id) =>
              setSelectedMaterial(materials.find((m) => m.id === id))
            }
          >
            {materials.map((m) => (
              <Option key={m.id} value={m.id}>
                {m.name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Тип резки"
            style={{ width: "100%" }}
            value={selectedArmor?.id}
            onChange={(id) =>
              setSelectedArmor(armorTypes.find((a) => a.id === id))
            }
          >
            {armorTypes.map((a) => (
              <Option key={a.id} value={a.id}>
                {a.name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Устройство"
            style={{ width: "100%" }}
            value={selectedDevice?.id}
            onChange={(id) =>
              setSelectedDevice(deviceTypes.find((d) => d.id === id))
            }
          >
            {deviceTypes.map((d) => (
              <Option key={d.id} value={d.id}>
                {d.name}
              </Option>
            ))}
          </Select>
        </Col>

        <Col xs={24} sm={12} md={3}>
          <InputNumber
            min={1}
            value={quantity}
            onChange={setQuantity}
            placeholder="Кол-во"
            style={{ width: "100%" }}
          />
        </Col>

        <Col xs={24} sm={12} md={3}>
          {isDelayRunning ? (
            <Button danger onClick={cancelDelay} block>
              Отменить
            </Button>
          ) : (
            <Button type="primary" onClick={handleCreateClick} block>
              Создать
            </Button>
          )}
        </Col>
      </Row>

      {/* --- Клиент --- */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Имя клиента"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Телефон клиента *"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Email клиента"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
        </Col>
      </Row>

      <h2>Список резок</h2>
      <Table
        dataSource={cuttingJobs}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        bordered
        scroll={{ x: 600 }}
      />

      <Modal
        title="Подтвердите создание резки"
        open={isModalOpen}
        onOk={handleConfirm}
        onCancel={() => setIsModalOpen(false)}
        okText="Создать"
        cancelText="Отмена"
      >
        <p>
          Создаётся резка: <strong>{selectedMaterial?.name}</strong> /{" "}
          <strong>{selectedArmor?.name}</strong> на устройстве{" "}
          <strong>{selectedDevice?.name}</strong>
        </p>
        <p>Количество: {quantity}</p>
        {notes && <p>Примечания: {notes}</p>}
        <p>
          Клиент: {clientName || "-"} / Телефон: {clientPhone} / Email:{" "}
          {clientEmail || "-"}
        </p>
      </Modal>
    </div>
  );
}
