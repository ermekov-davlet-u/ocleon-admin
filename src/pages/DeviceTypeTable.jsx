import React, { useMemo, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  message,
  Grid,
  Select,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Segmented,
  Upload,
  Image,
  Empty,
  Pagination,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  BarsOutlined,
  PlusOutlined,
  UploadOutlined,
  EyeOutlined,
} from '@ant-design/icons';

import {
  useGetDeviceTypesQuery,
  useCreateDeviceTypeMutation,
  useUpdateDeviceTypeMutation,
  useDeleteDeviceTypeMutation,
  useMergeDeviceTypesMutation,
  useUploadDeviceTypeImageMutation,
} from '../store/api/deviceTypeApi';

const { useBreakpoint } = Grid;

const imageBaseUrl = 'https://ocleon.333.kg/';

export default function DeviceTypeTable() {
  const { data: deviceTypes = [], refetch, isLoading } = useGetDeviceTypesQuery();
  const [createDeviceType] = useCreateDeviceTypeMutation();
  const [updateDeviceType] = useUpdateDeviceTypeMutation();
  const [deleteDeviceType] = useDeleteDeviceTypeMutation();
  const [mergeDeviceTypes, { isLoading: isMerging }] = useMergeDeviceTypesMutation();
  const [uploadDeviceTypeImage, { isLoading: isUploadingImage }] =
    useUploadDeviceTypeImageMutation();

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  const [isMergeModalVisible, setIsMergeModalVisible] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState(undefined);
  const [mergeSourceIds, setMergeSourceIds] = useState([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const [cardsPage, setCardsPage] = useState(1);
  const cardsPageSize = isMobile ? 6 : 8;

  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingDevice(record);
    form.setFieldsValue({
      name: record.name,
      brand: record.brand,
      isActive: record.isActive,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeviceType(id).unwrap();
      message.success('Устройство удалено');
      refetch();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingDevice) {
        await updateDeviceType({ id: editingDevice.id, data: values }).unwrap();
        message.success('Устройство обновлено');
      } else {
        await createDeviceType(values).unwrap();
        message.success('Устройство создано');
      }

      setIsModalVisible(false);
      refetch();
    } catch {
      message.error('Ошибка сохранения');
    }
  };

  const handleMerge = async () => {
    if (!mergeTargetId) {
      message.warning('Выбери основное устройство');
      return;
    }

    if (!mergeSourceIds.length) {
      message.warning('Выбери устройства для объединения');
      return;
    }

    if (mergeSourceIds.includes(mergeTargetId)) {
      message.warning('Основное устройство не должно входить в список объединяемых');
      return;
    }

    try {
      await mergeDeviceTypes({
        targetId: mergeTargetId,
        sourceIds: mergeSourceIds,
      }).unwrap();

      message.success('Устройства успешно объединены');
      setIsMergeModalVisible(false);
      setMergeTargetId(undefined);
      setMergeSourceIds([]);
      refetch();
    } catch {
      message.error('Ошибка объединения');
    }
  };

  const handleUploadImage = async ({ file, deviceId }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      await uploadDeviceTypeImage({
        id: deviceId,
        file: formData,
      }).unwrap();

      message.success('Картинка загружена');
      refetch();
    } catch {
      message.error('Ошибка загрузки картинки');
    }
  };

  const filteredData = useMemo(() => {
    return deviceTypes.filter((dt) => {
      const text = `${dt.name || ''} ${dt.brand || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [deviceTypes, search]);

  const activeOptions = deviceTypes
    .filter((d) => d.isActive)
    .map((d) => ({
      label: `${d.name}${d.brand ? ` (${d.brand})` : ''}`,
      value: d.id,
    }));

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${imageBaseUrl}${path}`;
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.name}</div>
          {isMobile && record.brand ? (
            <div style={{ color: '#888', fontSize: 12 }}>{record.brand}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Бренд',
      dataIndex: 'brand',
      key: 'brand',
      responsive: ['md'],
      render: (value) => value || '—',
    },
    {
      title: 'Активно',
      dataIndex: 'isActive',
      key: 'isActive',
      responsive: ['sm'],
      render: (val) => (
        <Tag color={val ? 'green' : 'red'}>
          {val ? 'Да' : 'Нет'}
        </Tag>
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space direction={isMobile ? 'vertical' : 'horizontal'} size={4}>
          <Button
            type="link"
            size={isMobile ? 'small' : 'middle'}
            onClick={() => handleEdit(record)}
          >
            Редактировать
          </Button>

          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              handleUploadImage({ file, deviceId: record.id });
              return false;
            }}
          >
            <Button
              type="link"
              size={isMobile ? 'small' : 'middle'}
              loading={isUploadingImage}
            >
              Фото
            </Button>
          </Upload>

          {/* <Popconfirm
            title="Удалить устройство?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              danger
              size={isMobile ? 'small' : 'middle'}
            >
              Удалить
            </Button>
          </Popconfirm> */}
        </Space>
      ),
    },
  ];

  const pagedCards = useMemo(() => {
    const start = (cardsPage - 1) * cardsPageSize;
    const end = start + cardsPageSize;
    return filteredData.slice(start, end);
  }, [filteredData, cardsPage, cardsPageSize]);

  const renderCards = () => {
    if (!filteredData.length) {
      return <Empty description="Устройства не найдены" />;
    }

    return (
      <>
        <Row gutter={[16, 16]}>
          {pagedCards.map((item) => {
            const img = getImageUrl(item.image);

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    height: '100%',
                  }}
                  bodyStyle={{ padding: 14 }}
                  cover={
                    <div
                      style={{
                        height: 180,
                        background: '#f7f7f7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setPreviewImage(img);
                            setPreviewOpen(true);
                          }}
                        />
                      ) : (
                        <div style={{ color: '#999' }}>Нет изображения</div>
                      )}
                    </div>
                  }
                >
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: 1.3,
                        marginBottom: 6,
                      }}
                    >
                      {item.name}
                    </div>

                    <div style={{ color: '#666', minHeight: 22 }}>
                      {item.brand || 'Без бренда'}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <Tag color={item.isActive ? 'green' : 'red'}>
                      {item.isActive ? 'Активно' : 'Неактивно'}
                    </Tag>
                  </div>

                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    <Button
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(item)}
                      block
                    >
                      Редактировать
                    </Button>

                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => {
                        handleUploadImage({ file, deviceId: item.id });
                        return false;
                      }}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={isUploadingImage}
                        block
                      >
                        Загрузить фото
                      </Button>
                    </Upload>

                    {img ? (
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setPreviewImage(img);
                          setPreviewOpen(true);
                        }}
                        block
                      >
                        Посмотреть фото
                      </Button>
                    ) : null}

                    <Popconfirm
                      title="Удалить устройство?"
                      okText="Да"
                      cancelText="Нет"
                      onConfirm={() => handleDelete(item.id)}
                    >
                      <Button danger icon={<DeleteOutlined />} block>
                        Удалить
                      </Button>
                    </Popconfirm>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            current={cardsPage}
            pageSize={cardsPageSize}
            total={filteredData.length}
            onChange={(page) => setCardsPage(page)}
            showSizeChanger={false}
            size={isMobile ? 'small' : 'default'}
          />
        </div>
      </>
    );
  };

  return (
    <div style={{ padding: isMobile ? 8 : 0 }}>
      <Space
        direction={isMobile ? 'vertical' : 'horizontal'}
        style={{ marginBottom: 16, width: '100%' }}
        size={12}
      >
        <Input.Search
          placeholder="Поиск устройства"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCardsPage(1);
          }}
          allowClear
          size={isMobile ? 'large' : 'middle'}
          style={{
            width: isMobile ? '100%' : 300,
          }}
        />

        <Button
          type="primary"
          onClick={handleAdd}
          block={isMobile}
          size={isMobile ? 'large' : 'middle'}
          icon={<PlusOutlined />}
          style={{
            height: isMobile ? 44 : undefined,
            fontWeight: 600,
            borderRadius: 10,
          }}
        >
          Добавить устройство
        </Button>

        <Button
          onClick={() => setIsMergeModalVisible(true)}
          block={isMobile}
          size={isMobile ? 'large' : 'middle'}
          style={{
            height: isMobile ? 44 : undefined,
            borderRadius: 10,
          }}
        >
          Объединить устройства
        </Button>

        <Segmented
          value={viewMode}
          onChange={(value) => {
            setViewMode(value);
            setCardsPage(1);
          }}
          options={[
            {
              label: (
                <Space size={6}>
                  <BarsOutlined />
                  Таблица
                </Space>
              ),
              value: 'table',
            },
            {
              label: (
                <Space size={6}>
                  <AppstoreOutlined />
                  Карточки
                </Space>
              ),
              value: 'cards',
            },
          ]}
          block={isMobile}
        />
      </Space>

      {viewMode === 'table' ? (
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: true }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          size="small"
        />
      ) : (
        renderCards()
      )}

      <Modal
        title={editingDevice ? 'Редактировать устройство' : 'Создать устройство'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
        cancelText="Отмена"
        width={isMobile ? '100%' : 520}
        style={isMobile ? { top: 0 } : {}}
        bodyStyle={isMobile ? { padding: 16 } : { padding: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Название"
            name="name"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input size={isMobile ? 'large' : 'middle'} />
          </Form.Item>

          <Form.Item label="Бренд" name="brand">
            <Input size={isMobile ? 'large' : 'middle'} />
          </Form.Item>

          <Form.Item
            label="Активно"
            name="isActive"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          {editingDevice ? (
            <Form.Item label="Фото устройства">
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleUploadImage({ file, deviceId: editingDevice.id });
                  return false;
                }}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={isUploadingImage}
                  block={isMobile}
                  size={isMobile ? 'large' : 'middle'}
                >
                  Загрузить изображение
                </Button>
              </Upload>

              {editingDevice?.image ? (
                <div style={{ marginTop: 12 }}>
                  <Image
                    src={getImageUrl(editingDevice.image)}
                    width={120}
                    style={{ borderRadius: 12 }}
                  />
                </div>
              ) : null}
            </Form.Item>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title="Объединить устройства"
        open={isMergeModalVisible}
        onOk={handleMerge}
        onCancel={() => {
          setIsMergeModalVisible(false);
          setMergeTargetId(undefined);
          setMergeSourceIds([]);
        }}
        okText="Объединить"
        cancelText="Отмена"
        confirmLoading={isMerging}
        width={isMobile ? '100%' : 700}
        style={isMobile ? { top: 0 } : {}}
        bodyStyle={isMobile ? { padding: 16 } : { padding: 20 }}
      >
        <Form layout="vertical">
          <Form.Item label="Основное устройство">
            <Select
              showSearch
              placeholder="Выбери устройство, в которое будет объединение"
              value={mergeTargetId}
              onChange={setMergeTargetId}
              options={activeOptions}
              optionFilterProp="label"
              size={isMobile ? 'large' : 'middle'}
            />
          </Form.Item>

          <Form.Item label="Какие устройства объединить в него">
            <Select
              mode="multiple"
              showSearch
              placeholder="Выбери дубли"
              value={mergeSourceIds}
              onChange={setMergeSourceIds}
              options={activeOptions.filter((o) => o.value !== mergeTargetId)}
              optionFilterProp="label"
              size={isMobile ? 'large' : 'middle'}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Image
        preview={{
          visible: previewOpen,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewOpen(visible),
        }}
      />
    </div>
  );
}