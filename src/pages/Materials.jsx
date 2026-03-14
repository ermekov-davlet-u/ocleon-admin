import React, { useMemo, useState } from "react";
import {
  Table,
  Tag,
  Spin,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Grid,
  Upload,
  Image,
  Space,
  Popconfirm,
  Tooltip,
  Card,
  Row,
  Col,
  Typography,
  Divider,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialFileMutation,
} from "../store/api/materialsApi";
import { imageURL } from "../config";

const { useBreakpoint } = Grid;
const { Text } = Typography;

// ── Хелпер: строим URL для файла ─────────────────────────────────────────────
const fileUrl = (filePath) => {
  if (!filePath) return "";
  const clean = filePath.replace(/^\.\//, "");
  return `${imageURL}/${clean}`;
};

// ── Бейдж активности ─────────────────────────────────────────────────────────
function ActiveTag({ isActive }) {
  return (
    <Tag
      color={isActive ? "green" : "red"}
      style={{
        borderRadius: 999,
        paddingInline: 10,
        fontWeight: 600,
      }}
    >
      {isActive ? "Активен" : "Неактивен"}
    </Tag>
  );
}

// ── Превью файлов материала ──────────────────────────────────────────────────
function MaterialFiles({ material, onDeleteFile, compact = false }) {
  if (!material?.files?.length) {
    return (
      <span style={{ color: "#999", fontSize: 12 }}>
        Нет файлов
      </span>
    );
  }

  return (
    <Space wrap size={compact ? 6 : 10}>
      {material.files.map((f) => {
        const url = fileUrl(f.filePath);
        const isImg = f.mimeType?.startsWith("image/");

        return (
          <div
            key={f.id}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isImg ? (
              <Image
                src={url}
                width={compact ? 56 : 72}
                height={compact ? 56 : 72}
                style={{
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #f0f0f0",
                  background: "#fafafa",
                }}
                preview={{ mask: <EyeOutlined /> }}
              />
            ) : (
              <Tooltip title={f.originalName}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: compact ? 56 : 72,
                    height: compact ? 56 : 72,
                    borderRadius: 10,
                    border: "1px solid #f0f0f0",
                    background: "#fafafa",
                    padding: 6,
                    fontSize: 11,
                    textAlign: "center",
                    color: "#6c5ce7",
                    textDecoration: "none",
                    lineHeight: 1.2,
                  }}
                >
                  📄 {f.originalName?.slice(0, compact ? 10 : 14) || "Файл"}
                </a>
              </Tooltip>
            )}

            <Popconfirm
              title="Удалить файл?"
              onConfirm={() => onDeleteFile(material.id, f.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                size="small"
                danger
                type="primary"
                icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  width: 20,
                  height: 20,
                  minWidth: 20,
                  padding: 0,
                  borderRadius: "50%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              />
            </Popconfirm>
          </div>
        );
      })}
    </Space>
  );
}

// ── Карточка для мобильной версии ────────────────────────────────────────────
function MaterialMobileCard({ record, onEdit, onDeleteFile }) {
  return (
    <Card
      size="small"
      style={{
        borderRadius: 16,
        boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
        border: "1px solid #f0f0f0",
      }}
      bodyStyle={{ padding: 14 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1.3,
              wordBreak: "break-word",
            }}
          >
            {record.name || "Без названия"}
          </div>

          <div style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
            Штрих-код: {record.barcode || "—"}
          </div>
        </div>

        <ActiveTag isActive={record.isActive} />
      </div>

      <Row gutter={[10, 10]} style={{ marginBottom: 10 }}>
        <Col span={12}>
          <div
            style={{
              background: "#fafafa",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <div style={{ color: "#888", fontSize: 12 }}>Цена</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {record.price ?? 0} сом
            </div>
          </div>
        </Col>

        <Col span={12}>
          <div
            style={{
              background: "#fafafa",
              borderRadius: 12,
              padding: "10px 12px",
            }}
          >
            <div style={{ color: "#888", fontSize: 12 }}>Толщина</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {record.thickness ?? "—"}
            </div>
          </div>
        </Col>
      </Row>

      <div style={{ marginBottom: 10 }}>
        <Text style={{ color: "#888", fontSize: 12 }}>Категория</Text>
        <div style={{ marginTop: 4 }}>
          {record.type ? <Tag>{record.type}</Tag> : "—"}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Text style={{ color: "#888", fontSize: 12 }}>Файлы</Text>
        <div style={{ marginTop: 8 }}>
          <MaterialFiles
            material={record}
            onDeleteFile={onDeleteFile}
            compact
          />
        </div>
      </div>

      <Button
        type="primary"
        icon={<EditOutlined />}
        block
        onClick={() => onEdit(record)}
        style={{ borderRadius: 10, height: 40 }}
      >
        Редактировать
      </Button>
    </Card>
  );
}

// ── Основной компонент ───────────────────────────────────────────────────────
export default function Materials() {
  const { data, error, isLoading } = useGetMaterialsQuery();
  const [createMaterial] = useCreateMaterialMutation();
  const [updateMaterial] = useUpdateMaterialMutation();
  const [deleteMaterialFile] = useDeleteMaterialFileMutation();

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const materials = useMemo(
    () => data?.map((item) => ({ ...item, key: item.id })) || [],
    [data]
  );

  const openEdit = (record) => {
    setEditingMaterial(record);
    form.setFieldsValue({
      name: record.name,
      barcode: record.barcode,
      type: record.type,
      price: record.price,
      thickness: record.thickness,
      isActive: record.isActive,
    });
    setFileList([]);
    setModalVisible(true);
  };

  const openCreate = () => {
    setEditingMaterial(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setFileList([]);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingMaterial(null);
    setFileList([]);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const fd = new FormData();
      fd.append("name", values.name ?? "");
      fd.append("barcode", values.barcode ?? "");
      fd.append("type", values.type ?? "");
      fd.append("price", values.price != null ? String(values.price) : "");
      fd.append(
        "thickness",
        values.thickness != null ? String(values.thickness) : ""
      );
      fd.append("isActive", String(values.isActive ?? true));

      fileList.forEach((f) => {
        if (f.originFileObj) {
          fd.append("files", f.originFileObj);
        }
      });

      if (editingMaterial) {
        await updateMaterial({ id: editingMaterial.id, formData: fd }).unwrap();
        message.success("Материал обновлён");
      } else {
        await createMaterial(fd).unwrap();
        message.success("Материал создан");
      }

      closeModal();
    } catch (err) {
      console.error(err);
      message.error("Ошибка при сохранении");
    }
  };

  const handleDeleteFile = async (materialId, fileId) => {
    try {
      await deleteMaterialFile({ materialId, fileId }).unwrap();
      message.success("Файл удалён");
    } catch {
      message.error("Ошибка при удалении файла");
    }
  };

  const columns = [
    {
      title: "Штрих-код",
      dataIndex: "barcode",
      key: "barcode",
      ellipsis: true,
      responsive: ["md"],
      width: 170,
    },
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (value) => <span style={{ fontWeight: 600 }}>{value}</span>,
    },
    {
      title: "Цена",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (price) => (
        <span style={{ fontWeight: 600 }}>{price ?? 0} сом</span>
      ),
    },
    {
      title: "Категория",
      dataIndex: "type",
      key: "type",
      responsive: ["sm"],
      width: 140,
      render: (type) => (type ? <Tag>{type}</Tag> : "—"),
    },
    {
      title: "Толщина",
      dataIndex: "thickness",
      key: "thickness",
      responsive: ["lg"],
      width: 120,
      render: (value) => value ?? "—",
    },
    {
      title: "Активность",
      dataIndex: "isActive",
      key: "isActive",
      responsive: ["lg"],
      width: 130,
      render: (isActive) => <ActiveTag isActive={isActive} />,
    },
    {
      title: "Файлы",
      key: "files",
      render: (_, record) => (
        <MaterialFiles material={record} onDeleteFile={handleDeleteFile} />
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EditOutlined />}
          size="middle"
          onClick={() => openEdit(record)}
          style={{ borderRadius: 10 }}
        >
          Редактировать
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: 260,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ borderRadius: 16 }}>
        <div style={{ color: "#ff4d4f" }}>Ошибка загрузки данных</div>
      </Card>
    );
  }

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Card
        style={{
          borderRadius: 20,
          boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
          border: "1px solid #f0f0f0",
        }}
        bodyStyle={{ padding: isMobile ? 14 : 20 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800 }}>
              Материалы
            </div>
            <div style={{ color: "#888", marginTop: 4, fontSize: 13 }}>
              Управление материалами и файлами
            </div>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            block={isMobile}
            size={isMobile ? "middle" : "large"}
            onClick={openCreate}
            style={{
              borderRadius: 12,
              height: isMobile ? 42 : 44,
              fontWeight: 600,
            }}
          >
            Создать материал
          </Button>
        </div>

        {isMobile ? (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {materials.length ? (
              materials.map((item) => (
                <MaterialMobileCard
                  key={item.id}
                  record={item}
                  onEdit={openEdit}
                  onDeleteFile={handleDeleteFile}
                />
              ))
            ) : (
              <Card
                style={{
                  borderRadius: 16,
                  textAlign: "center",
                  color: "#999",
                }}
              >
                Нет материалов
              </Card>
            )}
          </Space>
        ) : (
          <Table
            dataSource={materials}
            columns={columns}
            bordered
            scroll={{ x: 1100 }}
            size="middle"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            style={{
              borderRadius: 14,
              overflow: "hidden",
            }}
          />
        )}
      </Card>

      <Modal
        title={editingMaterial ? "Редактировать материал" : "Создать материал"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={closeModal}
        okText="Сохранить"
        cancelText="Отмена"
        width={isMobile ? "100%" : 720}
        style={isMobile ? { top: 0, paddingBottom: 0 } : {}}
        bodyStyle={{
          maxHeight: isMobile ? "calc(100vh - 140px)" : "70vh",
          overflowY: "auto",
          padding: isMobile ? 14 : 20,
        }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="barcode" label="Штрих-код">
                <Input placeholder="Введите штрих-код" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Название"
                rules={[{ required: true, message: "Введите название" }]}
              >
                <Input placeholder="Введите название материала" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="type" label="Категория">
                <Input placeholder="Например: гидрогель" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="price"
                label="Цена"
                rules={[{ required: true, message: "Введите цену" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  addonAfter="сом"
                  placeholder="0"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="thickness" label="Толщина">
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="isActive"
                label="Активен"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "8px 0 16px" }} />

          <Form.Item label="Файлы / изображения">
            <Upload
              multiple
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              listType="picture-card"
              accept="image/*,.pdf,.svg"
            >
              {fileList.length < 10 && (
                <div>
                  <InboxOutlined style={{ fontSize: 18 }} />
                  <div style={{ marginTop: 8 }}>
                    {isMobile ? "Добавить" : "Загрузить"}
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>

          {editingMaterial?.files?.length > 0 && (
            <Form.Item label="Текущие файлы">
              <MaterialFiles
                material={editingMaterial}
                onDeleteFile={handleDeleteFile}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}