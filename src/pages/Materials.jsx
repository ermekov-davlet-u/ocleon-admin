import React, { useState } from "react";
import {
  Table, Tag, Spin, Button, Modal, Form, Input,
  InputNumber, Switch, message, Grid, Upload, Image,
  Space, Popconfirm, Tooltip,
} from "antd";
import {
  UploadOutlined, DeleteOutlined, EyeOutlined, PlusOutlined,
} from "@ant-design/icons";
import {
  useGetMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialFileMutation,
} from "../store/api/materialsApi";
import { imageURL } from "../config";

const { useBreakpoint } = Grid;

// ── Хелпер: строим URL для файла ─────────────────────────────────────────────
const fileUrl = (filePath) => {
  if (!filePath) return "";
  // убираем leading "./" если есть
  const clean = filePath.replace(/^\.\//, "");
  return `${imageURL}/${clean}`;
};

// ── Компонент: превью файлов материала ───────────────────────────────────────
function MaterialFiles({ material, onDeleteFile }) {
  if (!material?.files?.length) {
    return <span style={{ color: "#bbb", fontSize: 12 }}>Нет файлов</span>;
  }

  return (
    <Space wrap size={4}>
      {material.files.map((f) => {
        const url  = fileUrl(f.filePath);
        const isImg = f.mimeType?.startsWith("image/");

        return (
          <div key={f.id} style={{ position: "relative", display: "inline-block" }}>
            {isImg ? (
              <Image
                src={url}
                width={48}
                height={48}
                style={{ objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                preview={{ mask: <EyeOutlined /> }}
              />
            ) : (
              <Tooltip title={f.originalName}>
                <a href={url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: "#6c5ce7" }}>
                  📄 {f.originalName?.slice(0, 12)}…
                </a>
              </Tooltip>
            )}

            {/* Кнопка удаления файла */}
            <Popconfirm
              title="Удалить файл?"
              onConfirm={() => onDeleteFile(material.id, f.id)}
              okText="Да" cancelText="Нет"
            >
              <Button
                size="small" danger type="text"
                icon={<DeleteOutlined style={{ fontSize: 10 }} />}
                style={{
                  position: "absolute", top: -6, right: -6,
                  width: 18, height: 18, minWidth: 18, padding: 0,
                  borderRadius: "50%", background: "#fff", border: "1px solid #ffa39e",
                }}
              />
            </Popconfirm>
          </div>
        );
      })}
    </Space>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function Materials() {
  const { data, error, isLoading } = useGetMaterialsQuery();
  const [createMaterial]     = useCreateMaterialMutation();
  const [updateMaterial]     = useUpdateMaterialMutation();
  const [deleteMaterialFile] = useDeleteMaterialFileMutation();

  const screens  = useBreakpoint();
  const isMobile = !screens.md;

  const [modalVisible,     setModalVisible]     = useState(false);
  const [editingMaterial,  setEditingMaterial]  = useState(null);
  const [fileList,         setFileList]         = useState([]);
  const [form] = Form.useForm();

  // ── Открыть модалку редактирования ────────────────────────────────────────
  const openEdit = (record) => {
    setEditingMaterial(record);
    form.setFieldsValue({
      name:      record.name,
      barcode:   record.barcode,
      type:      record.type,
      price:     record.price,
      thickness: record.thickness,
      isActive:  record.isActive,
    });
    setFileList([]);
    setModalVisible(true);
  };

  const openCreate = () => {
    setEditingMaterial(null);
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };

  // ── Сохранение (create / update) ──────────────────────────────────────────
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Собираем FormData чтобы передать файлы
      const fd = new FormData();
      fd.append("name",     values.name ?? "");
      fd.append("barcode",  values.barcode ?? "");
      if (values.type)      fd.append("type",      values.type);
      if (values.price)     fd.append("price",     values.price);
      if (values.thickness) fd.append("thickness", values.thickness);
      fd.append("isActive", values.isActive ?? true);

      // Прикрепляем все выбранные файлы
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

      setModalVisible(false);
      setEditingMaterial(null);
      setFileList([]);
      form.resetFields();
    } catch (err) {
      console.error(err);
      message.error("Ошибка при сохранении");
    }
  };

  // ── Удалить файл материала ─────────────────────────────────────────────────
  const handleDeleteFile = async (materialId, fileId) => {
    try {
      await deleteMaterialFile({ materialId, fileId }).unwrap();
      message.success("Файл удалён");
    } catch {
      message.error("Ошибка при удалении файла");
    }
  };

  // ── Колонки таблицы ────────────────────────────────────────────────────────
  const columns = [
    {
      title: "Штрих-код",
      dataIndex: "barcode",
      key: "barcode",
      ellipsis: true,
      responsive: ["md"],
    },
    {
      title: "Название",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Цена",
      dataIndex: "price",
      key: "price",
      render: (price) => `${price ?? 0} сом`,
    },
    {
      title: "Категория",
      dataIndex: "type",
      key: "type",
      responsive: ["sm"],
      render: (type) => type ? <Tag>{type}</Tag> : "—",
    },
    {
      title: "Активен",
      dataIndex: "isActive",
      key: "isActive",
      responsive: ["lg"],
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Да" : "Нет"}
        </Tag>
      ),
    },
    {
      // ✅ Превью файлов прямо в таблице
      title: "Файлы",
      key: "files",
      render: (_, record) => (
        <MaterialFiles
          material={record}
          onDeleteFile={handleDeleteFile}
        />
      ),
    },
    {
      title: "Действия",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          size={isMobile ? "small" : "middle"}
          onClick={() => openEdit(record)}
        >
          Редактировать
        </Button>
      ),
    },
  ];

  if (isLoading) return <Spin style={{ margin: 50 }} />;
  if (error)     return <div>Ошибка загрузки данных</div>;

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Button
        type="primary"
        block={isMobile}
        style={{ marginBottom: 16 }}
        onClick={openCreate}
      >
        Создать материал
      </Button>

      <Table
        dataSource={data?.map((item) => ({ ...item, key: item.id }))}
        columns={columns}
        bordered
        scroll={{ x: true }}
        size="small"
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />

      {/* ── Модалка создания / редактирования ─────────────────────────────── */}
      <Modal
        title={editingMaterial ? "Редактировать материал" : "Создать материал"}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => {
          setModalVisible(false);
          setEditingMaterial(null);
          setFileList([]);
          form.resetFields();
        }}
        okText="Сохранить"
        width={isMobile ? "100%" : 620}
        style={isMobile ? { top: 0 } : {}}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="barcode"
            label="Штрих-код"
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: "Введите название" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="type" label="Категория">
            <Input />
          </Form.Item>

          <Form.Item
            name="price"
            label="Цена"
            rules={[{ required: true, message: "Введите цену" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} addonAfter="сом" />
          </Form.Item>

          <Form.Item name="thickness" label="Толщина">
            <InputNumber min={0} step={0.01} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="isActive" label="Активен" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          {/* ── Загрузка файлов ────────────────────────────────────────── */}
          <Form.Item label="Файлы / Изображения">
            <Upload
              multiple
              beforeUpload={() => false}    // не отправлять сразу
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              listType="picture-card"
              accept="image/*,.pdf,.svg"
            >
              {fileList.length < 10 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Добавить</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          {/* ── Существующие файлы при редактировании ─────────────────── */}
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