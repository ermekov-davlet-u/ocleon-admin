import { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  InputNumber,
  Select,
  Modal,
  message,
  Input,
  Row,
  Col,
  Space,
  Upload,
  Tag,
  Tooltip,
} from "antd";
import { UploadOutlined, PlusOutlined, PercentageOutlined, TagOutlined } from "@ant-design/icons";

import {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useChangeOrderStatusMutation,
} from "../store/api/orderApi";
import { useCreateArmorTypeMutation, useGetArmorTypesQuery } from "../store/api/armorTypesApi";
import { useCreateCuttingJobMutation } from "../store/api/cuttingApi";
import { usePreviewCuttingJobQuery } from "../store/api/cuttingJobApi";
import { useCreateMaterialMutation, useGetMaterialsQuery } from "../store/api/materialsApi";
import { useCreateDeviceTypeMutation, useGetDeviceTypesQuery } from "../store/api/deviceTypeApi";
import { useGetDiscountsQuery } from "../store/api/discountApi";

const { Option } = Select;

// ── Цвета статусов ──────────────────────────────────────────────────────────
const STATUS_COLOR = {
  NEW: "blue",
  IN_PROGRESS: "orange",
  DONE: "green",
  DEFECT: "red",
  REWORK: "purple",
};

const STATUS_LABEL = {
  NEW: "Новый",
  IN_PROGRESS: "В работе",
  DONE: "Выполнен",
  DEFECT: "Брак",
  REWORK: "Переделка",
};

// ── Метки правил скидок ─────────────────────────────────────────────────────
const RULE_LABEL = {
  SECOND_WRAPPING: "Вторая оклейка",
  REFERRAL: "Привёл друга",
  SECOND_DEVICE: "Второе устройство",
  MANUAL: "Другая",
};

// ── Утилита расчёта скидки на фронте (для предпросмотра) ───────────────────
function calcDiscountedAmount(baseAmount, discount) {
  if (!discount || !baseAmount) return baseAmount ?? 0;
  switch (discount.type) {
    case "PERCENT":
      return Math.max(0, baseAmount - (baseAmount * discount.value) / 100);
    case "FIXED":
      return Math.max(0, baseAmount - discount.value);
    case "PRICE_OVERRIDE":
      return discount.value;
    default:
      return baseAmount;
  }
}

export default function CuttingOrders() {
  // ── Справочники ────────────────────────────────────────────────────────────
  const { data: materials = [] } = useGetMaterialsQuery();
  const { data: armorTypes = [] } = useGetArmorTypesQuery();
  const { data: deviceTypes = [] } = useGetDeviceTypesQuery();
  // ✅ Скидки из API
  const { data: discounts = [] } = useGetDiscountsQuery();

  const [createMaterial] = useCreateMaterialMutation();
  const [createArmorType] = useCreateArmorTypeMutation();
  const [createDeviceType] = useCreateDeviceTypeMutation();

  // ── Заказы ─────────────────────────────────────────────────────────────────
  const { data: cuttingJobs, isLoading } = useGetOrdersQuery();
  const [createCuttingJob] = useCreateCuttingJobMutation();
  const [createOrder] = useCreateOrderMutation();
  const [changeOrderStatus] = useChangeOrderStatusMutation();

  // ── Форма ──────────────────────────────────────────────────────────────────
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedArmor, setSelectedArmor] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null); // ✅ объект скидки
  const [quantity, setQuantity] = useState(1);
  const [summa, setSumma] = useState(undefined);
  const [notes, setNotes] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [manualSumma, setManualSumma] = useState(false);
  const [price, setPrice] = useState(0);

  // ── Создание новых типов ───────────────────────────────────────────────────
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceIsActive, setDeviceIsActive] = useState(true);
  const [materialBarcode, setMaterialBarcode] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [materialThickness, setMaterialThickness] = useState(undefined);
  const [materialPrice, setMaterialPrice] = useState(undefined);
  const [materialIsActive, setMaterialIsActive] = useState(true);
  const [armorDescription, setArmorDescription] = useState("");
  const [armorIsActive, setArmorIsActive] = useState(true);

  // ── Модалки ────────────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [currentType, setCurrentType] = useState("");

  // ── Preview (проверка существующего job) ───────────────────────────────────
  const { data: cuttingJobPreview } = usePreviewCuttingJobQuery(
    {
      materialId: selectedMaterial?.id,
      cuttingTypeId: selectedArmor?.id,
      deviceTypeId: selectedDevice?.id,
    },
    {
      skip: !selectedMaterial?.id || !selectedArmor?.id || !selectedDevice?.id,
    }
  );

  // ── Авторасчёт суммы ───────────────────────────────────────────────────────
  // ✅ Единый useEffect — убран конфликт двух эффектов
  useEffect(() => {
    if (manualSumma) return; // пользователь вручную ввёл — не перезаписываем

    const basePrice = cuttingJobPreview?.price;
    if (!basePrice) {
      setSumma(undefined);
      return;
    }

    const base = basePrice * quantity;
    // ✅ Если выбрана скидка — сразу считаем на фронте для предпросмотра
    const discounted = calcDiscountedAmount(base, selectedDiscount);
    setSumma(discounted);
  }, [cuttingJobPreview, quantity, selectedDiscount, manualSumma]);

  // ── Базовая сумма (без скидки) для отображения в модалке ──────────────────
  const baseSumma = useMemo(() => {
    if (!cuttingJobPreview?.price) return undefined;
    return cuttingJobPreview.price * quantity;
  }, [cuttingJobPreview, quantity]);

  const discountAmount = useMemo(() => {
    if (!baseSumma || !selectedDiscount) return 0;
    return baseSumma - calcDiscountedAmount(baseSumma, selectedDiscount);
  }, [baseSumma, selectedDiscount]);

  // ── Сброс ручного режима при смене параметров резки ───────────────────────
  useEffect(() => {
    setManualSumma(false);
  }, [selectedMaterial, selectedArmor, selectedDevice, selectedDiscount]);

  // ── Создание новых типов ───────────────────────────────────────────────────
  const openCreateTypeModal = (type) => {
    setCurrentType(type);
    setNewTypeName("");
    setIsCreateTypeModalOpen(true);
  };

  const handleCreateType = async () => {
    try {
      if (currentType === "material") {
        await createMaterial({
          name: newTypeName,
          barcode: materialBarcode || "",
          type: materialType || undefined,
          thickness: materialThickness || undefined,
          price: materialPrice || 0,
          isActive: true,
        }).unwrap();
      } else if (currentType === "armor") {
        await createArmorType({
          name: newTypeName,
          description: armorDescription || undefined,
          isActive: true,
        }).unwrap();
      } else if (currentType === "device") {
        await createDeviceType({
          name: newTypeName,
          brand: deviceBrand || undefined,
          isActive: true,
        }).unwrap();
      }
      message.success(`${currentType} успешно создано!`);
      setIsCreateTypeModalOpen(false);
    } catch (err) {
      console.error(err);
      message.error("Ошибка при создании типа");
    }
  };

  // ── Хелпер Select с кнопкой "Добавить" ────────────────────────────────────
  const renderSelectWithCreate = (data, value, onChange, placeholder, type) => (
    <Select
      showSearch
      placeholder={placeholder}
      style={{ width: "100%" }}
      value={value?.id}
      optionFilterProp="children"
      onChange={(id) => onChange(data.find((d) => d.id === id))}
      filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
      dropdownRender={(menu) => (
        <>
          {menu}
          <div style={{ display: "flex", padding: 8 }}>
            <Button type="link" icon={<PlusOutlined />} onClick={() => openCreateTypeModal(type)}>
              Добавить новый
            </Button>
          </div>
        </>
      )}
    >
      {data.map((item) => (
        <Option key={item.id} value={item.id}>
          {item.name}
        </Option>
      ))}
    </Select>
  );

  // ── Кнопка «Начать» ────────────────────────────────────────────────────────
  const handleCreateClick = () => {
    if (!selectedMaterial || !selectedArmor || !selectedDevice || !clientPhone) {
      return message.error("Заполните все обязательные поля!");
    }
    if (!cuttingJobPreview?.id) {
      setIsFileModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  // ── Общий payload заказа ───────────────────────────────────────────────────
  // ✅ discountRule берём из объекта скидки, если это не MANUAL
  const buildOrderPayload = (cuttingJobId) => ({
    cuttingJobId,
    quantity,
    notes: notes || undefined,
    clientName: clientName || undefined,
    clientPhone,
    clientEmail: clientEmail || undefined,
    // ✅ Если у скидки есть rule (SECOND_WRAPPING, REFERRAL, SECOND_DEVICE) — передаём rule
    // иначе — передаём discountId (MANUAL или просто по ID)
    ...(selectedDiscount?.rule && selectedDiscount.rule !== "MANUAL"
      ? { discountRule: selectedDiscount.rule }
      : selectedDiscount?.id
        ? { discountId: selectedDiscount.id }
        : {}),
    // ✅ summa передаём только если пользователь вручную ввёл или выбрал PRICE_OVERRIDE
    ...(manualSumma || selectedDiscount?.type === "PRICE_OVERRIDE"
      ? { summa }
      : {}),
  });

  // ── Создание через существующий job ────────────────────────────────────────
  const handleConfirmOrder = async () => {
    try {
      await createOrder(buildOrderPayload(cuttingJobPreview.id)).unwrap();
      message.success("Резка создана!");
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      message.error("Ошибка создания резки");
    }
  };

  // ── Создание с загрузкой файла (новый job) ─────────────────────────────────
  const handleCreateCuttingJobWithFile = async () => {
    try {
      const formData = new FormData();
      formData.append("materialId", selectedMaterial?.id);
      formData.append("cuttingTypeId", selectedArmor?.id);
      formData.append("deviceTypeId", selectedDevice?.id);
      formData.append("price", price);
      if (fileList.length > 0) {
        formData.append("file", fileList[0].originFileObj);
      }

      const newCuttingJob = await createCuttingJob(formData).unwrap();
      message.success("Задание на резку создано!");
      setIsFileModalOpen(false);
      setFileList([]);

      await createOrder(buildOrderPayload(newCuttingJob.id)).unwrap();
      message.success("Резка создана!");
      resetForm();
    } catch (err) {
      console.error(err);
      message.error("Ошибка создания задания или резки");
    }
  };

  // ── Повтор заказа при браке ────────────────────────────────────────────────
  const handleRecreateOrder = async (record) => {
    try {
      await createOrder({
        cuttingJobId: record.cuttingJob.id,
        quantity: 1,
        clientName: record.client?.name,
        clientPhone: record.client?.phone,
        clientEmail: record.client?.email,
        // ✅ сохраняем скидку из оригинального заказа
        ...(record.discount?.rule && record.discount.rule !== "MANUAL"
          ? { discountRule: record.discount.rule }
          : record.discount?.id
            ? { discountId: record.discount.id }
            : {}),
        summa: record.finalAmount,
      }).unwrap();
      message.success("Заказ повторно создан!");
    } catch (err) {
      console.error(err);
      message.error("Ошибка при повторном создании");
    }
  };

  // ── Статус ─────────────────────────────────────────────────────────────────
  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await changeOrderStatus({ id: jobId, status: newStatus }).unwrap();
      message.success(`Статус обновлён: ${STATUS_LABEL[newStatus] ?? newStatus}`);
    } catch (err) {
      console.error(err);
      message.error("Ошибка обновления статуса");
    }
  };

  // ── Сброс формы после создания ─────────────────────────────────────────────
  const resetForm = () => {
    setSelectedMaterial(null);
    setSelectedArmor(null);
    setSelectedDevice(null);
    setSelectedDiscount(null);
    setQuantity(1);
    setSumma(undefined);
    setNotes("");
    setClientPhone("");
    setClientName("");
    setClientEmail("");
    setManualSumma(false);
    setPrice(0);
  };

  // ── Колонки таблицы ────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Телефон",
      dataIndex: ["client", "phone"],
      key: "phone",
    },
    {
      title: "Тип резки",
      dataIndex: ["cuttingJob", "armorType", "name"],
    },
    {
      title: "Устройство",
      dataIndex: ["cuttingJob", "deviceType", "name"],
    },
    {
      title: "Кол-во",
      dataIndex: "quantity",
      width: 70,
    },
    {
      title: "Сумма",
      key: "amount",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.discount && (
            <span style={{ textDecoration: "line-through", color: "#999", fontSize: 12 }}>
              {record.totalAmount} сом
            </span>
          )}
          <strong>{record.finalAmount} сом</strong>
        </Space>
      ),
    },
    {
      title: "Скидка",
      key: "discount",
      render: (_, record) =>
        record.discount ? (
          <Tooltip title={record.discount.description || record.discount.name}>
            <Tag color="volcano" icon={<TagOutlined />}>
              {RULE_LABEL[record.discount.rule] ?? record.discount.name}
            </Tag>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    {
      title: "Статус",
      key: "status",
      render: (_, record) => (
        <Tag color={STATUS_COLOR[record.status] ?? "default"}>
          {STATUS_LABEL[record.status] ?? record.status}
        </Tag>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status !== "DONE" && record.status !== "DEFECT" && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleStatusChange(record.id, "DONE")}
              >
                Провести
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleStatusChange(record.id, "DEFECT")}
              >
                Брак
              </Button>
            </>
          )}
          {record.status === "DEFECT" && (
            <Button
              type="dashed"
              size="small"
              onClick={() => handleRecreateOrder(record)}
            >
              Повторить
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // ── Рендер ─────────────────────────────────────────────────────────────────
  return (
    <div >
      <h2>Создать резку</h2>

      {/* ── Параметры резки ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} md={6}>
          {renderSelectWithCreate(materials, selectedMaterial, setSelectedMaterial, "Материал", "material")}
        </Col>
        <Col xs={24} sm={12} md={6}>
          {renderSelectWithCreate(armorTypes, selectedArmor, setSelectedArmor, "Тип резки", "armor")}
        </Col>
        <Col xs={24} sm={12} md={6}>
          {renderSelectWithCreate(deviceTypes, selectedDevice, setSelectedDevice, "Устройство", "device")}
        </Col>

        {/* ✅ Скидка — правильно обёрнута в Col и подключена к реальным данным */}
        <Col xs={24} sm={12} md={6}>
          <Select
            showSearch
            allowClear
            placeholder="Скидка (опционально)"
            style={{ width: "100%" }}
            value={selectedDiscount?.id ?? null}
            optionFilterProp="children"
            onChange={(id) => {
              if (!id) {
                setSelectedDiscount(null);
              } else {
                setSelectedDiscount(discounts.find((d) => d.id === id) ?? null);
              }
              setManualSumma(false); // сбрасываем ручной режим при смене скидки
            }}
          >
            {discounts
              .filter((d) => d.isActive)
              .map((d) => (
                <Option key={d.id} value={d.id}>
                  {/* ✅ Показываем rule-метку + тип скидки */}
                  <Space>
                    <TagOutlined />
                    {RULE_LABEL[d.rule] ?? d.name}
                    <span style={{ color: "#999", fontSize: 12 }}>
                      {d.type === "PERCENT"
                        ? `−${d.value}%`
                        : d.type === "PRICE_OVERRIDE"
                          ? `= ${d.value} сом`
                          : `−${d.value} сом`}
                    </span>
                  </Space>
                </Option>
              ))}
          </Select>
        </Col>
      </Row>

      {/* ── Количество, сумма, кнопка ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={6} md={3}>
          <InputNumber
            min={1}
            value={quantity}
            onChange={(v) => setQuantity(v ?? 1)}
            placeholder="Кол-во"
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={12} sm={6} md={4}>
          <InputNumber
            value={summa}
            onChange={(value) => {
              setSumma(value);
              setManualSumma(true);
            }}
            placeholder="Итого (сом)"
            style={{ width: "100%" }}
            // ✅ Показываем подсказку если есть скидка
            addonAfter={
              selectedDiscount && baseSumma && discountAmount > 0 ? (
                <Tooltip title={`Скидка: −${Math.round(discountAmount)} сом`}>
                  <PercentageOutlined style={{ color: "#f5222d" }} />
                </Tooltip>
              ) : null
            }
          />
          {/* ✅ Отображаем базовую сумму и размер скидки */}
          {selectedDiscount && baseSumma && discountAmount > 0 && (
            <div style={{ fontSize: 11, color: "#f5222d", marginTop: 2 }}>
              Скидка: −{Math.round(discountAmount)} сом (было {baseSumma} сом)
            </div>
          )}
        </Col>
        <Col xs={24} sm={6} md={4}>
          <Button type="primary" onClick={handleCreateClick} block>
            Начать
          </Button>
        </Col>
      </Row>

      {/* ── Клиент ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Телефон клиента *"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Input
            placeholder="Имя клиента (опционально)"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </Col>
      </Row>

      {/* ── Таблица ── */}
      <Table
        dataSource={cuttingJobs}
        columns={columns}
        rowKey="id"
        size="small"
        loading={isLoading}
        bordered
        scroll={{ x: true }}
      />

      {/* ── Модалка: подтверждение (job существует) ── */}
      <Modal
        title="Подтвердите создание резки"
        open={isModalOpen}
        onOk={handleConfirmOrder}
        onCancel={() => setIsModalOpen(false)}
        okText="Создать"
        cancelText="Отмена"
      >
        <p>
          <strong>{selectedMaterial?.name}</strong> /{" "}
          <strong>{selectedArmor?.name}</strong> /{" "}
          <strong>{selectedDevice?.name}</strong>
        </p>
        <p>Количество: {quantity}</p>
        <p>
          Сумма:{" "}
          {selectedDiscount && discountAmount > 0 ? (
            <>
              <span style={{ textDecoration: "line-through", color: "#999" }}>
                {baseSumma} сом
              </span>{" "}
              <strong style={{ color: "#f5222d" }}>{summa} сом</strong>
              {" "}
              <Tag color="volcano">
                {RULE_LABEL[selectedDiscount.rule] ?? selectedDiscount.name}
              </Tag>
            </>
          ) : (
            <strong>{summa} сом</strong>
          )}
        </p>
        <p>Телефон: {clientPhone}</p>
        {clientName && <p>Имя: {clientName}</p>}
      </Modal>

      {/* ── Модалка: создание job с файлом ── */}
      <Modal
        title="Создать задание на резку"
        open={isFileModalOpen}
        onOk={handleCreateCuttingJobWithFile}
        onCancel={() => { setIsFileModalOpen(false); setFileList([]); }}
        okText="Создать и резать"
        cancelText="Отмена"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
            >
              <Button icon={<UploadOutlined />}>Выберите файл (опционально)</Button>
            </Upload>
          </Col>
          <Col xs={24} sm={12}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Цена за единицу"
              value={price}
              onChange={setPrice}
            />
          </Col>
          <Col xs={24}>
            {selectedDiscount && (
              <Tag color="volcano" icon={<TagOutlined />}>
                {RULE_LABEL[selectedDiscount.rule] ?? selectedDiscount.name}:{" "}
                {selectedDiscount.type === "PERCENT"
                  ? `−${selectedDiscount.value}%`
                  : selectedDiscount.type === "PRICE_OVERRIDE"
                    ? `= ${selectedDiscount.value} сом`
                    : `−${selectedDiscount.value} сом`}
              </Tag>
            )}
          </Col>
        </Row>
      </Modal>

      {/* ── Модалка: создание нового типа ── */}
      <Modal
        title={`Создать новый: ${currentType}`}
        open={isCreateTypeModalOpen}
        onOk={handleCreateType}
        onCancel={() => setIsCreateTypeModalOpen(false)}
        okText="Создать"
        cancelText="Отмена"
      >
        <Input
          placeholder="Название *"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        {currentType === "device" && (
          <>
            <Input
              placeholder="Бренд (опционально)"
              value={deviceBrand}
              onChange={(e) => setDeviceBrand(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <Select
              value={deviceIsActive}
              onChange={setDeviceIsActive}
              style={{ width: "100%" }}
            >
              <Option value={true}>Активен</Option>
              <Option value={false}>Неактивен</Option>
            </Select>
          </>
        )}
        {currentType === "material" && (
          <>
            <Input
              placeholder="Штрихкод"
              value={materialBarcode}
              onChange={(e) => setMaterialBarcode(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <Input
              placeholder="Тип (опционально)"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <InputNumber
              placeholder="Толщина"
              value={materialThickness}
              onChange={setMaterialThickness}
              style={{ width: "100%", marginBottom: 12 }}
            />
            <InputNumber
              placeholder="Цена"
              value={materialPrice}
              onChange={setMaterialPrice}
              style={{ width: "100%", marginBottom: 12 }}
            />
            <Select
              value={materialIsActive}
              onChange={setMaterialIsActive}
              style={{ width: "100%" }}
            >
              <Option value={true}>Активен</Option>
              <Option value={false}>Неактивен</Option>
            </Select>
          </>
        )}
        {currentType === "armor" && (
          <>
            <Input
              placeholder="Описание (опционально)"
              value={armorDescription}
              onChange={(e) => setArmorDescription(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <Select
              value={armorIsActive}
              onChange={setArmorIsActive}
              style={{ width: "100%" }}
            >
              <Option value={true}>Активен</Option>
              <Option value={false}>Неактивен</Option>
            </Select>
          </>
        )}
      </Modal>
    </div>
  );
}