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
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";

import {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useChangeOrderStatusMutation,
} from "../store/api/orderApi";
import { useCreateArmorTypeMutation, useGetArmorTypesQuery } from "../store/api/armorTypesApi";
import { useCreateCuttingJobMutation } from "../store/api/cuttingApi";
import { usePreviewCuttingJobQuery } from "../store/api/cuttingJobApi";
import { useCreateMaterialMutation, useGetDiscountsQuery, useGetMaterialsQuery } from "../store/api/materialsApi";
import { useCreateDeviceTypeMutation, useGetDeviceTypesQuery } from "../store/api/deviceTypeApi";

const { Option } = Select;

export default function CuttingOrders() {
  // --- Справочники ---
  const { data: materials = [] } = useGetMaterialsQuery();
  const { data: armorTypes = [] } = useGetArmorTypesQuery();
  const { data: deviceTypes = [] } = useGetDeviceTypesQuery();
  const { data: discounts = [] } = useGetDiscountsQuery();

  const [createMaterial] = useCreateMaterialMutation();
  const [createArmorType] = useCreateArmorTypeMutation();
  const [createDeviceType] = useCreateDeviceTypeMutation();
  const [createCuttingJob] = useCreateCuttingJobMutation();
  const [createOrder] = useCreateOrderMutation();
  const [changeOrderStatus] = useChangeOrderStatusMutation();

  // --- Состояния формы ---
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedArmor, setSelectedArmor] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [summa, setSumma] = useState(0);
  const [manualSumma, setManualSumma] = useState(false);
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [fileList, setFileList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // --- Модалки создания типа ---
  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState(""); // 'material' | 'armor' | 'device'
  const [newTypeName, setNewTypeName] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceIsActive, setDeviceIsActive] = useState(true);
  const [materialBarcode, setMaterialBarcode] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [materialThickness, setMaterialThickness] = useState(undefined);
  const [materialPrice, setMaterialPrice] = useState(undefined);
  const [materialIsActive, setMaterialIsActive] = useState(true);
  const [armorDescription, setArmorDescription] = useState("");
  const [armorIsActive, setArmorIsActive] = useState(true);

  // --- Заказы ---
  const { data: cuttingJobs = [], isLoading } = useGetOrdersQuery();

  // --- Preview ---
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

  // --- Обновление суммы ---
  useEffect(() => {
    if (!manualSumma && cuttingJobPreview?.price) {
      setSumma(cuttingJobPreview.price * quantity);
    }
  }, [cuttingJobPreview, quantity, manualSumma]);

  // --- Универсальный селект с поиском и добавлением нового ---
  const renderSelectWithCreate = (data, value, onChange, placeholder, type) => (
    <Select
      placeholder={placeholder}
      style={{ width: "100%" }}
      value={value?.id}
      showSearch
      optionFilterProp="children"
      onChange={(id) => onChange(data.find((d) => d.id === id))}
      filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
      dropdownRender={(menu) => (
        <>
          {menu}
          <div style={{ display: "flex", padding: 8 }}>
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={() => openCreateTypeModal(type)}
            >
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

  // --- Создание нового типа ---
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
          barcode: materialBarcode,
          type: materialType,
          thickness: materialThickness,
          price: materialPrice || 0,
          isActive: materialIsActive,
        }).unwrap();
      } else if (currentType === "armor") {
        await createArmorType({ name: newTypeName, description: armorDescription, isActive: armorIsActive }).unwrap();
      } else if (currentType === "device") {
        await createDeviceType({ name: newTypeName, brand: deviceBrand, isActive: deviceIsActive }).unwrap();
      }
      message.success(`${currentType} создано!`);
      setIsCreateTypeModalOpen(false);
    } catch (err) {
      console.error(err);
      message.error("Ошибка при создании типа");
    }
  };

  // --- Создание резки ---
  const handleCreateClick = () => {
    if (!selectedMaterial || !selectedArmor || !selectedDevice || !clientPhone) {
      return message.error("Заполните все обязательные поля!");
    }
    if (!cuttingJobPreview?.id) setIsFileModalOpen(true);
    else setIsModalOpen(true);
  };

  const handleCreateCuttingJobWithFile = async () => {
    try {
      const formData = new FormData();
      formData.append("materialId", selectedMaterial.id);
      formData.append("cuttingTypeId", selectedArmor.id);
      formData.append("deviceTypeId", selectedDevice.id);
      if (fileList[0]) formData.append("file", fileList[0].originFileObj);
      formData.append("price", price);

      const newCuttingJob = await createCuttingJob(formData).unwrap();
      message.success("Задание на резку создано!");
      setIsFileModalOpen(false);
      setFileList([]);

      await createOrder({
        cuttingJobId: newCuttingJob.id,
        material: selectedMaterial,
        quantity,
        notes,
        clientName,
        clientPhone,
        clientEmail,
        discountId: selectedDiscount?.id,
        summa,
      }).unwrap();

      message.success("Резка создана!");
    } catch (err) {
      console.error(err);
      message.error("Ошибка создания задания или резки");
    }
  };

  const handleConfirmOrder = async () => {
    try {
      await createOrder({
        cuttingJobId: cuttingJobPreview.id,
        material: selectedMaterial,
        quantity,
        notes,
        clientName,
        clientPhone,
        clientEmail,
        summa,
      }).unwrap();
      message.success("Резка создана!");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      message.error("Ошибка создания резки");
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await changeOrderStatus({ id: jobId, status: newStatus }).unwrap();
      message.success(`Статус обновлён: ${newStatus}`);
    } catch (err) {
      console.error(err);
      message.error("Ошибка обновления статуса");
    }
  };

  const handleRecreateOrder = async (record) => {
    try {
      await createOrder({
        cuttingJobId: record.cuttingJob.id,
        material: record.material,
        quantity: 1,
        notes: record.notes,
        clientName: record.client.name,
        clientPhone: record.client.phone,
        clientEmail: record.client.email,
        discountId: record?.discount?.id,
        summa: record.summa,
      }).unwrap();
      message.success("Заказ повторно создан!");
    } catch (err) {
      console.error(err);
      message.error("Ошибка при повторном создании");
    }
  };

  // --- Колонки таблицы ---
  const columns = useMemo(() => [
    { title: "Телефон", dataIndex: ["client", "phone"], key: "phone" },
    { title: "Тип резки", dataIndex: ["cuttingJob", "armorType", "name"], key: "armor" },
    { title: "Устройство", dataIndex: ["cuttingJob", "deviceType", "name"], key: "device" },
    { title: "Кол-во", dataIndex: "quantity", key: "quantity" },
    { title: "Статус", dataIndex: "status", key: "status" },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status !== "DONE" && record.status !== "DEFECT" && (
            <>
              <Button type="primary" onClick={() => handleStatusChange(record.id, "DONE")}>Провести</Button>
              <Button danger onClick={() => handleStatusChange(record.id, "DEFECT")}>Брак</Button>
            </>
          )}
          {record.status === "DEFECT" && <Button type="dashed" onClick={() => handleRecreateOrder(record)}>Повторить</Button>}
        </Space>
      ),
    },
  ], []);

  return (
    <div style={{ padding: 16 }}>
      <h2>Создать резку</h2>

      {/* Форма выбора */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          {renderSelectWithCreate(materials, selectedMaterial, setSelectedMaterial, "Материал", "material")}
        </Col>
        <Col xs={24} sm={12} md={6}>
          {renderSelectWithCreate(armorTypes, selectedArmor, setSelectedArmor, "Тип резки", "armor")}
        </Col>
        <Col xs={24} sm={12} md={6}>
          {renderSelectWithCreate(deviceTypes, selectedDevice, setSelectedDevice, "Устройство", "device")}
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Select
            placeholder="Скидка"
            style={{ width: "100%" }}
            value={selectedDiscount?.id}
            onChange={(id) => setSelectedDiscount(discounts.find(d => d.id === id))}
          >
            {discounts.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
          </Select>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <InputNumber
            value={summa}
            onChange={(value) => { setSumma(value); setManualSumma(true); }}
            placeholder="Сумма"
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Button type="primary" onClick={handleCreateClick} block>Начать</Button>
        </Col>
      </Row>

      {/* Телефон клиента */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input placeholder="Телефон клиента *" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
        </Col>
      </Row>

      {/* Таблица */}
      <Table
        rowKey="id"
        dataSource={cuttingJobs}
        columns={columns}
        size="small"
        loading={isLoading}
        bordered
        scroll={{ x: true }}
      />

      {/* Модалки */}
      <Modal title="Подтвердите создание резки" open={isModalOpen} onOk={handleConfirmOrder} onCancel={() => setIsModalOpen(false)} okText="Создать" cancelText="Отмена">
        <p>Создаётся резка: <strong>{selectedMaterial?.name}</strong> / <strong>{selectedArmor?.name}</strong> на устройстве <strong>{selectedDevice?.name}</strong></p>
        <p>Количество: {quantity}</p>
        {notes && <p>Примечания: {notes}</p>}
        <p>Клиент: {clientName || "-"} / Телефон: {clientPhone} / Email: {clientEmail || "-"}</p>
      </Modal>

      <Modal title="Создать задание на резку (файл отсутствует)" open={isFileModalOpen} onOk={handleCreateCuttingJobWithFile} onCancel={() => setIsFileModalOpen(false)} okText="Создать и резать" cancelText="Отмена">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24}>
            <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)}>
              <Button icon={<UploadOutlined />}>Выберите файл</Button>
            </Upload>
          </Col>
          <Col xs={24} sm={12}>
            <InputNumber min={0} style={{ width: "100%" }} placeholder="Цена" value={price} onChange={setPrice} />
          </Col>
        </Row>
      </Modal>

      <Modal title={`Создать новый ${currentType}`} open={isCreateTypeModalOpen} onOk={handleCreateType} onCancel={() => setIsCreateTypeModalOpen(false)} okText="Создать" cancelText="Отмена">
        <Input placeholder="Название" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} style={{ marginBottom: 12 }} />

        {currentType === "device" && (
          <>
            <Input placeholder="Бренд (опционально)" value={deviceBrand} onChange={e => setDeviceBrand(e.target.value)} style={{ marginBottom: 12 }} />
            <Select placeholder="Активен?" value={deviceIsActive} onChange={setDeviceIsActive} style={{ width: "100%", marginBottom: 12 }}>
              <Option value={true}>Да</Option>
              <Option value={false}>Нет</Option>
            </Select>
          </>
        )}

        {currentType === "material" && (
          <>
            <Input placeholder="Штрихкод" value={materialBarcode} onChange={e => setMaterialBarcode(e.target.value)} style={{ marginBottom: 12 }} />
            <Input placeholder="Тип (опционально)" value={materialType} onChange={e => setMaterialType(e.target.value)} style={{ marginBottom: 12 }} />
            <InputNumber placeholder="Толщина (опционально)" value={materialThickness} onChange={setMaterialThickness} style={{ width: "100%", marginBottom: 12 }} />
            <InputNumber placeholder="Цена (опционально)" value={materialPrice} onChange={setMaterialPrice} style={{ width: "100%", marginBottom: 12 }} />
            <Select placeholder="Активен?" value={materialIsActive} onChange={setMaterialIsActive} style={{ width: "100%", marginBottom: 12 }}>
              <Option value={true}>Да</Option>
              <Option value={false}>Нет</Option>
            </Select>
          </>
        )}

        {currentType === "armor" && (
          <>
            <Input placeholder="Описание (опционально)" value={armorDescription} onChange={e => setArmorDescription(e.target.value)} style={{ marginBottom: 12 }} />
            <Select placeholder="Активен?" value={armorIsActive} onChange={setArmorIsActive} style={{ width: "100%", marginBottom: 12 }}>
              <Option value={true}>Да</Option>
              <Option value={false}>Нет</Option>
            </Select>
          </>
        )}
      </Modal>
    </div>
  );
}