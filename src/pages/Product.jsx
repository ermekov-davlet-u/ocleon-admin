import React, { useState } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
  Space,
  Grid,
  Row,
  Col,
  Modal,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import {
  useGetCuttingJobsQuery,
  useCreateCuttingJobMutation,
  useUpdateCuttingJobMutation,
  useDeleteCuttingJobMutation,
} from "../store/api/cuttingJobApi";
import { useGetMaterialsQuery } from "../store/api/materialsApi";
import { useGetArmorTypesQuery } from "../store/api/armorTypesApi";
import { useGetDeviceTypesQuery } from "../store/api/deviceTypeApi";

const { Option } = Select;
const { useBreakpoint } = Grid;

export default function CuttingJobPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data: jobs, isLoading } = useGetCuttingJobsQuery();
  const { data: materials } = useGetMaterialsQuery();
  const { data: cuttingTypes } = useGetArmorTypesQuery();
  const { data: deviceTypes } = useGetDeviceTypesQuery();

  const [createJob] = useCreateCuttingJobMutation();
  const [updateJob] = useUpdateCuttingJobMutation();
  const [deleteJob] = useDeleteCuttingJobMutation();

  const [editingJob, setEditingJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // --- открываем модалку для создания/редактирования ---
  const openModal = (job = null) => {
    setEditingJob(job);
    if (job) {
      form.setFieldsValue({
        materialId: job.material?.id,
        cuttingTypeId: job.armorType?.id,
        deviceTypeId: job.deviceType?.id,
        price: job.price,
        notes: job.notes,
        file: [], // файл для редактирования пустой
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ price: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingJob(null);
    form.resetFields();
    setIsModalOpen(false);
  };

  // --- отправка формы ---
  const onFinish = async (values) => {
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (key === "file" && values.file?.length > 0) {
          formData.append("file", values.file[0].originFileObj);
        } else {
          formData.append(key, values[key]);
        }
      });

      if (editingJob) {
        await updateJob({ id: editingJob.id, data: formData }).unwrap();
        message.success("Задание обновлено");
      } else {
        await createJob(formData).unwrap();
        message.success("Задание создано");
      }

      closeModal();
    } catch {
      message.error("Ошибка при сохранении");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJob(id).unwrap();
      message.success("Удалено");
    } catch {
      message.error("Ошибка при удалении");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60, responsive: ["lg"] },
    { title: "Тип резки", dataIndex: ["armorType", "name"] },
    { title: "Устройство", dataIndex: ["deviceType", "name"] },
    { title: "Файл", dataIndex: ["filePath"] },
    { title: "Цена", dataIndex: "price", width: 100 },
    { title: "Примечание", dataIndex: "notes", ellipsis: true, responsive: ["lg"] },
    {
      title: "Действия",
      render: (_, record) => (
        <Space direction={isMobile ? "vertical" : "horizontal"}>
          <Button size="small" type="link" onClick={() => openModal(record)}>
            Ред.
          </Button>
          <Button size="small" type="link" danger onClick={() => handleDelete(record.id)}>
            Уд.
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      <Button
        type="primary"
        onClick={() => openModal(null)}
        style={{ marginBottom: 16 }}
      >
        Создать задание
      </Button>

      <Table
        rowKey="id"
        dataSource={jobs}
        columns={columns}
        loading={isLoading}
        scroll={{ x: true }}
        size={"small"}
        bordered
      />

      {/* --- Модалка с формой --- */}
      <Modal
        title={editingJob ? "Редактирование задания" : "Создание задания"}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editingJob ? "Сохранить" : "Создать"}
        width={isMobile ? "95%" : 600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Row gutter={8}>
            <Col xs={24}>
              <Form.Item
                label="Материал"
                name="materialId"
                rules={[{ required: true, message: "Выберите материал" }]}
              >
                <Select placeholder="Материал">
                  {materials?.map((m) => (
                    <Option key={m.id} value={m.id}>
                      {m.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Тип резки"
                name="cuttingTypeId"
                rules={[{ required: true, message: "Выберите тип резки" }]}
              >
                <Select placeholder="Тип резки">
                  {cuttingTypes?.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Устройство"
                name="deviceTypeId"
                rules={[{ required: true, message: "Выберите устройство" }]}
              >
                <Select placeholder="Устройство">
                  {deviceTypes?.map((d) => (
                    <Option key={d.id} value={d.id}>
                      {d.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Цена" name="price">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={16}>
              <Form.Item label="Примечание" name="notes">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label="Файл"
                name="file"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload beforeUpload={() => false} maxCount={1}>
                  <Button icon={<UploadOutlined />} block={isMobile}>
                    Загрузить файл
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
