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
  Card,
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

  const [createJob, { isLoading: creating }] = useCreateCuttingJobMutation();
  const [updateJob, { isLoading: updating }] = useUpdateCuttingJobMutation();
  const [deleteJob] = useDeleteCuttingJobMutation();

  const [editingJob, setEditingJob] = useState(null);
  const [form] = Form.useForm();

  const openEditModal = (job) => {
    setEditingJob(job);
    form.setFieldsValue({
      materialId: job.material?.id,
      cuttingTypeId: job.armorType?.id,
      deviceTypeId: job.deviceType?.id,
      quantity: job.quantity,
      notes: job.notes,
    });
  };

  const resetForm = () => {
    setEditingJob(null);
    form.resetFields();
  };

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

      resetForm();
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
    { title: "Материал", dataIndex: ["material", "name"] },
    { title: "Тип резки", dataIndex: ["armorType", "name"], responsive: ["md"] },
    { title: "Устройство", dataIndex: ["deviceType", "name"], responsive: ["md"] },
    { title: "Кол-во", dataIndex: "quantity", width: 80 },
    {
      title: "Примечание",
      dataIndex: "notes",
      ellipsis: true,
      responsive: ["lg"],
    },
    {
      title: "Действия",
      render: (_, record) => (
        <Space direction={isMobile ? "vertical" : "horizontal"}>
          <Button size="small" type="link" onClick={() => openEditModal(record)}>
            Ред.
          </Button>
          <Button
            size="small"
            type="link"
            danger
            onClick={() => handleDelete(record.id)}
          >
            Уд.
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Card
        title={editingJob ? "Редактирование" : "Создание задания"}
        style={{ marginBottom: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ quantity: 1 }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Материал"
                name="materialId"
                rules={[{ required: true }]}
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
                rules={[{ required: true }]}
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
                rules={[{ required: true }]}
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
              <Form.Item label="Количество" name="quantity">
                <InputNumber min={1} style={{ width: "100%" }} />
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
                getValueFromEvent={(e) =>
                  Array.isArray(e) ? e : e?.fileList
                }
              >
                <Upload beforeUpload={() => false} maxCount={1}>
                  <Button icon={<UploadOutlined />} block={isMobile}>
                    Загрузить файл
                  </Button>
                </Upload>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Space style={{ width: "100%" }} direction={isMobile ? "vertical" : "horizontal"}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={creating || updating}
                  block={isMobile}
                >
                  {editingJob ? "Сохранить" : "Создать"}
                </Button>

                {editingJob && (
                  <Button onClick={resetForm} block={isMobile}>
                    Отмена
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table
        rowKey="id"
        dataSource={jobs}
        columns={columns}
        loading={isLoading}
        scroll={{ x: true }}
        size={isMobile ? "small" : "middle"}
        bordered
      />
    </div>
  );
}
