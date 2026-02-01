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

export default function CuttingJobPage() {
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
      file: null,
    });
  };

  const resetForm = () => {
    setEditingJob(null);
    form.resetFields();
  };

  const onFinish = async (values) => {
    try {
      const formData = new FormData();
      for (const key in values) {
        if (key === "file" && values.file?.length > 0) {
          formData.append("file", values.file[0].originFileObj);
        } else {
          formData.append(key, values[key]);
        }
      }

      if (editingJob) {
        await updateJob({ id: editingJob.id, data: formData }).unwrap();
        message.success("Cutting Job обновлен!");
      } else {
        await createJob(formData).unwrap();
        message.success("Cutting Job создан!");
      }
      resetForm();
    } catch (err) {
      message.error("Ошибка при сохранении");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteJob(id).unwrap();
      message.success("Cutting Job удален");
    } catch (err) {
      message.error("Ошибка при удалении");
      console.error(err);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 50 },
    { title: "Материал", dataIndex: ["material", "name"], key: "material", width: 120 },
    { title: "Тип резки", dataIndex: ["armorType", "name"], key: "armorType", width: 120 },
    { title: "Устройство", dataIndex: ["deviceType", "name"], key: "deviceType", width: 120 },
    { title: "Кол-во", dataIndex: "quantity", key: "quantity", width: 70 },
    { title: "Примечание", dataIndex: "notes", key: "notes", ellipsis: true },
    {
      title: "Действия",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" onClick={() => openEditModal(record)}>
            Ред.
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Уд.
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ margin: "20px auto" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ quantity: 1 }}
        style={{ padding: 10, border: "1px solid #f0f0f0", borderRadius: 6 }}
      >
        <Space align="top" wrap size="small" style={{ }}>
          <Form.Item
            label="Материал"
            name="materialId"
            rules={[{ required: true, message: "Выберите материал" }]}
          >
            <Select placeholder="Выберите материал" size="middle">
              {materials?.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Тип резки"
            name="cuttingTypeId"
            rules={[{ required: true, message: "Выберите тип резки" }]}
          >
            <Select placeholder="Выберите тип резки" size="middle">
              {cuttingTypes?.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Устройство"
            name="deviceTypeId"
            rules={[{ required: true, message: "Выберите устройство" }]}
          >
            <Select placeholder="Выберите устройство" size="middle">
              {deviceTypes?.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Файл"
            name="file"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>
                {editingJob ? "Заменить файл" : "Загрузить файл"}
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item label="Примечание" name="notes">
            <Input.TextArea rows={2} placeholder="Введите примечание" />
          </Form.Item>

          <Form.Item
            label="Количество"
            name="quantity"
            rules={[{ type: "number", min: 1, message: "Минимум 1" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={creating || updating}
              >
                {editingJob ? "Сохранить" : "Создать"}
              </Button>
              {editingJob && <Button onClick={resetForm}>Отмена</Button>}
            </Space>
          </Form.Item>
        </Space>
      </Form>

      <Table
        rowKey="id"
        dataSource={jobs}
        columns={columns}
        loading={isLoading}
        style={{ marginTop: 20 }}
        scroll={{ x: 800 }}
        size="middle"
        bordered
      />
    </div>
  );
}
