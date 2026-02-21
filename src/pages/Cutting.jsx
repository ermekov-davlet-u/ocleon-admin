import { useEffect, useState } from "react";
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
import { useCreateMaterialMutation, useGetMaterialsQuery } from "../store/api/materialsApi";
import { useCreateDeviceTypeMutation, useGetDeviceTypesQuery } from "../store/api/deviceTypeApi";

const { Option } = Select;

export default function CuttingOrders() {
  // --- Справочники ---
  const { data: materials = [] } = useGetMaterialsQuery();
  const { data: armorTypes = [] } = useGetArmorTypesQuery();
  const { data: deviceTypes = [] } = useGetDeviceTypesQuery();

  const [createMaterial] = useCreateMaterialMutation();
  const [createArmorType] = useCreateArmorTypeMutation();
  const [createDeviceType] = useCreateDeviceTypeMutation();

  // --- Заказы ---
  const { data: cuttingJobs, isLoading } = useGetOrdersQuery();
  const [createCuttingJob] = useCreateCuttingJobMutation();
  const [createOrder] = useCreateOrderMutation();
  const [changeOrderStatus] = useChangeOrderStatusMutation();

  // DeviceType
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceIsActive, setDeviceIsActive] = useState(true);

  // Material
  const [materialBarcode, setMaterialBarcode] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [materialThickness, setMaterialThickness] = useState(undefined);
  const [materialPrice, setMaterialPrice] = useState(undefined);
  const [materialIsActive, setMaterialIsActive] = useState(true);
  const [discounts, setDiscounts] = useState([]); // список всех скидок
  const [selectedDiscount, setSelectedDiscount] = useState(null); // выбранная скидка
  // ArmorType
  const [armorDescription, setArmorDescription] = useState("");
  const [armorIsActive, setArmorIsActive] = useState(true);
  // --- Состояния ---
  const [price, setPrice] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedArmor, setSelectedArmor] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [summa, setSumma] = useState();
  const [notes, setNotes] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [manualSumma, setManualSumma] = useState(false); // флаг ручного редактирования

  const {
    data: cuttingJobPreview
  } = usePreviewCuttingJobQuery(
    {
      materialId: selectedMaterial?.id,
      cuttingTypeId: selectedArmor?.id,
      deviceTypeId: selectedDevice?.id,
    },
    {
      skip:
        !selectedMaterial?.id ||
        !selectedArmor?.id ||
        !selectedDevice?.id
    }
  );
  // Обновляем сумму когда приходит preview или меняется quantity, только если пользователь не редактировал вручную
  useEffect(() => {
    if (!manualSumma && cuttingJobPreview?.price) {
      setSumma(cuttingJobPreview.price * quantity);
    } else {
      setSumma(0);
    }
  }, [cuttingJobPreview, quantity, manualSumma]);


  // Обновляем сумму когда пришли данные
  useEffect(() => {
    if (cuttingJobPreview?.price) {
      setSumma(cuttingJobPreview.price);
    }
  }, [cuttingJobPreview]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);

  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [currentType, setCurrentType] = useState(""); // 'material' | 'armor' | 'device'

  // --- Создание новых типов ---
  const openCreateTypeModal = (type) => {
    setCurrentType(type);
    setNewTypeName("");
    setIsCreateTypeModalOpen(true);
  };

  const handleCreateType = async () => {
    try {
      let newItem;
      if (currentType === "material") {
        const payload = {
          name: newTypeName,
          barcode: materialBarcode || "",
          type: materialType || undefined,
          thickness: materialThickness || undefined,
          price: materialPrice || 0,
          isActive: true,
        };
        await createMaterial(payload).unwrap();
      } else if (currentType === "armor") {
        const payload = {
          name: newTypeName,
          description: armorDescription || undefined,
          isActive: true,
        };
        await createArmorType(payload).unwrap();
      } else if (currentType === "device") {
        const payload = {
          name: newTypeName,
          brand: deviceBrand || undefined,
          isActive: true,
        };
        await createDeviceType(payload).unwrap();
        setSelectedDevice(newItem);
      }
      message.success(`${currentType} создано!`);
      setIsCreateTypeModalOpen(false);
    } catch (err) {
      console.error(err);
      message.error("Ошибка при создании типа");
    }
  };

  const renderSelectWithCreate = (data, value, onChange, placeholder, type) => (
    <Select
      placeholder={placeholder}
      style={{ width: "100%" }}
      value={value?.id}
      onChange={(id) => onChange(data.find((d) => d.id === id))}
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

  // --- Создание резки ---
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

  const handleCreateCuttingJobWithFile = async () => {
    // if (fileList.length === 0) return message.error("Выберите файл");
    try {
      const formData = new FormData();
      formData.append("materialId", selectedMaterial?.id);
      formData.append("cuttingTypeId", selectedArmor?.id);
      formData.append("deviceTypeId", selectedDevice?.id);
      if (fileList.length != 0) formData.append("file", fileList[0].originFileObj);
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
        summa: summa
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
        quantity,
        notes,
        clientName,
        clientPhone,
        clientEmail,
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
      message.success(`Статус резки обновлён на "${newStatus}"`);
    } catch (err) {
      console.error(err);
      message.error("Ошибка обновления статуса");
    }
  };


  const handleRecreateOrder = async (record) => {
    try {
      console.log(record);
      await createOrder({
        cuttingJobId: record.cuttingJob.id,
        quantity: 1,
        material: selectedMaterial,
        notes,
        clientName: record.client.name,
        clientPhone: record.client.phone,
        clientEmail: record.client.email,
        discountId: record?.discount?.id,
        summa: record.summa
      }).unwrap();

      message.success("Заказ повторно создан!");
    } catch (err) {
      console.error(err);
      message.error("Ошибка при повторном создании");
    }
  };

  const columns = [
    // { title: "Материал", dataIndex: ["material", "name"] },
    // {
    //   title: 'Клиент',
    //   dataIndex: ['client', 'name'],
    //   key: 'client',
    // },
    {
      title: 'Телефон',
      dataIndex: ['client', 'phone'],
      key: 'phone',
      responsive: ['md'],
    },
    { title: "Тип резки", dataIndex: ["cuttingJob", "armorType", "name"] },
    { title: "Устройство", dataIndex: ["cuttingJob", "deviceType", "name"] },
    { title: "Кол-во", dataIndex: "quantity" },
    { title: "Статус", dataIndex: "status" },
    {
      title: "Действия",
      render: (_, record) => (
        <Space>
          {record.status !== "DONE" && record.status !== "DEFECT" && (
            <>
              <Button
                type="primary"
                onClick={() => handleStatusChange(record.id, "DONE")}
              >
                Провести
              </Button>

              <Button
                danger
                onClick={() => handleStatusChange(record.id, "DEFECT")}
              >
                Брак
              </Button>
            </>
          )}

          {record.status === "DEFECT" && (
            <Button
              type="dashed"
              onClick={() => handleRecreateOrder(record)}
            >
              Повторить
            </Button>
          )}
        </Space>
      ),
    }
  ];

  return (
    <div style={{ padding: 16 }}>
      <h2>Создать резку</h2>

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

        <Select
          placeholder="Скидка"
          value={selectedDiscount?.id}
          onChange={(id) => setSelectedDiscount(discounts.find(d => d.id === id))}
        >
          {discounts.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
        </Select>
        <Col xs={24} sm={12} md={3}>
          <InputNumber
            value={summa}
            onChange={(value) => {
              setSumma(value);
              setManualSumma(true); // помечаем, что пользователь редактировал вручную
            }}
            placeholder="Сумма"
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Button type="primary" onClick={handleCreateClick} block>
            Начать
          </Button>
        </Col>
      </Row>

      {/* Клиент */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {/* <Col xs={24} sm={12} md={8}>
          <Input placeholder="Имя клиента" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </Col> */}
        <Col xs={24} sm={12} md={8}>
          <Input placeholder="Телефон клиента *" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
        </Col>
        {/* <Col xs={24} sm={12} md={8}>
          <Input placeholder="Email клиента" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
        </Col> */}
      </Row>

      <Table
        dataSource={cuttingJobs} columns={columns}
        rowKey="id" size="small" loading={isLoading} bordered scroll={{ x: true }} />

      {/* Модалка подтверждения резки */}
      <Modal
        title="Подтвердите создание резки"
        open={isModalOpen}
        onOk={handleConfirmOrder}
        onCancel={() => setIsModalOpen(false)}
        okText="Создать"
        cancelText="Отмена"
      >
        <p>
          Создаётся резка: <strong>{selectedMaterial?.name}</strong> / <strong>{selectedArmor?.name}</strong> на устройстве <strong>{selectedDevice?.name}</strong>
        </p>
        <p>Количество: {quantity}</p>
        {notes && <p>Примечания: {notes}</p>}
        <p>Клиент: {clientName || "-"} / Телефон: {clientPhone} / Email: {clientEmail || "-"}</p>
      </Modal>

      {/* Модалка создания задания на резку с файлом */}
      <Modal
        title="Создать задание на резку (файл отсутствует)"
        open={isFileModalOpen}
        onOk={handleCreateCuttingJobWithFile}
        onCancel={() => setIsFileModalOpen(false)}
        okText="Создать и резать"
        cancelText="Отмена"
      >
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

      {/* Модалка создания нового типа с полями из DTO */}
      <Modal
        title={`Создать новый ${currentType}`}
        open={isCreateTypeModalOpen}
        onOk={handleCreateType}
        onCancel={() => setIsCreateTypeModalOpen(false)}
        okText="Создать"
        cancelText="Отмена"
      >
        {/* Все типы имеют name */}
        <Input
          placeholder="Название"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          style={{ marginBottom: 12 }}
        />

        {/* Дополнительные поля для DeviceType */}
        {currentType === "device" && (
          <>
            <Input
              placeholder="Бренд (опционально)"
              value={deviceBrand || ""}
              onChange={(e) => setDeviceBrand(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <Select
              placeholder="Активен?"
              value={deviceIsActive}
              onChange={setDeviceIsActive}
              style={{ width: "100%", marginBottom: 12 }}
            >
              <Option value={true}>Да</Option>
              <Option value={false}>Нет</Option>
            </Select>
          </>
        )}

        {/* Дополнительные поля для Material */}
        {currentType === "material" && (
          <>
            <Input
              placeholder="Штрихкод"
              value={materialBarcode || ""}
              onChange={(e) => setMaterialBarcode(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <Input
              placeholder="Тип (опционально)"
              value={materialType || ""}
              onChange={(e) => setMaterialType(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <InputNumber
              placeholder="Толщина (опционально)"
              value={materialThickness}
              onChange={setMaterialThickness}
              style={{ width: "100%", marginBottom: 12 }}
            />
            <InputNumber
              placeholder="Цена (опционально)"
              value={materialPrice}
              onChange={setMaterialPrice}
              style={{ width: "100%", marginBottom: 12 }}
            />
            <Select
              placeholder="Активен?"
              value={materialIsActive}
              onChange={setMaterialIsActive}
              style={{ width: "100%", marginBottom: 12 }}
            >
              <Option value={true}>Да</Option>
              <Option value={false}>Нет</Option>
            </Select>
          </>
        )}

        {/* Дополнительные поля для ArmorType */}
        {currentType === "armor" && (
          <>
            <Input
              placeholder="Описание (опционально)"
              value={armorDescription || ""}
              onChange={(e) => setArmorDescription(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <Select
              placeholder="Активен?"
              value={armorIsActive}
              onChange={setArmorIsActive}
              style={{ width: "100%", marginBottom: 12 }}
            >
              <Option value={true}>Да</Option>
              <Option value={false}>Нет</Option>
            </Select>
          </>
        )}
      </Modal>

    </div>
  );
}
