import React, { useMemo, useState } from "react";
import {
    Table,
    Tag,
    Space,
    Button,
    Drawer,
    Form,
    Input,
    Select,
    DatePicker,
    message,
    Popconfirm,
    Card,
    Row,
    Col,
    Statistic,
} from "antd";
import dayjs from "dayjs";
import {
    useDeleteBookingMutation,
    useGetBookingsQuery,
    useUpdateBookingMutation,
} from "../store/api/bookingsApi";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusOptions = [
    { label: "Ожидает", value: "pending" },
    { label: "Подтверждено", value: "confirmed" },
    { label: "Завершено", value: "completed" },
    { label: "Отменено", value: "cancelled" },
];

const statusColorMap = {
    pending: "orange",
    confirmed: "blue",
    completed: "green",
    cancelled: "red",
};

const statusLabelMap = {
    pending: "Ожидает",
    confirmed: "Подтверждено",
    completed: "Завершено",
    cancelled: "Отменено",
};

const BookingsTable = () => {
    const [statusFilter, setStatusFilter] = useState(undefined);
    const [dateRange, setDateRange] = useState(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [form] = Form.useForm();

    const queryParams = useMemo(() => {
        const params = {};

        if (statusFilter) {
            params.status = statusFilter;
        }

        if (dateRange?.[0] && dateRange?.[1]) {
            params.dateFrom = dateRange[0].startOf("day").toISOString();
            params.dateTo = dateRange[1].endOf("day").toISOString();
        }

        return params;
    }, [statusFilter, dateRange]);

    const {
        data: bookings = [],
        isLoading,
        isFetching,
        refetch,
    } = useGetBookingsQuery(queryParams);

    const [updateBooking, { isLoading: isUpdating }] = useUpdateBookingMutation();
    const [deleteBooking, { isLoading: isDeleting }] = useDeleteBookingMutation();

    const handleEdit = (record) => {
        setEditingBooking(record);
        form.setFieldsValue({
            clientName: record.clientName,
            clientPhone: record.clientPhone,
            scheduledAt: dayjs(record.scheduledAt),
            status: record.status,
            notes: record.notes,
        });
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setEditingBooking(null);
        form.resetFields();
    };

    const handleUpdate = async () => {
        if (!editingBooking) return;

        try {
            const values = await form.validateFields();

            await updateBooking({
                id: editingBooking.id,
                body: {
                    status: values.status,
                    scheduledAt: values.scheduledAt
                        ? dayjs(values.scheduledAt).toISOString()
                        : undefined,
                    notes: values.notes ?? null,
                },
            }).unwrap();

            message.success("Бронирование обновлено");
            handleCloseDrawer();
        } catch (error) {
            console.error(error);
            message.error(
                error?.data?.message || "Ошибка при обновлении бронирования"
            );
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteBooking(id).unwrap();
            message.success("Бронирование удалено");
        } catch (error) {
            console.error(error);
            message.error(error?.data?.message || "Ошибка при удалении бронирования");
        }
    };

    const stats = useMemo(() => {
        return {
            total: bookings.length,
            pending: bookings.filter((b) => b.status === "pending").length,
            confirmed: bookings.filter((b) => b.status === "confirmed").length,
            completed: bookings.filter((b) => b.status === "completed").length,
            cancelled: bookings.filter((b) => b.status === "cancelled").length,
        };
    }, [bookings]);

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 70,
        },
        {
            title: "Клиент",
            dataIndex: "clientName",
            key: "clientName",
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{record.clientName}</div>
                    <div style={{ color: "#666" }}>{record.clientPhone}</div>
                </div>
            ),
        },
        {
            title: "Устройство",
            key: "deviceType",
            render: (_, record) => record.deviceType?.name || "-",
        },
        {
            title: "Услуга",
            key: "cuttingJob",
            render: (_, record) => (
                <div>
                    <div>{record.cuttingJob?.name || "-"}</div>
                    <div style={{ color: "#888", fontSize: 12 }}>
                        {record.cuttingJob?.armorType?.name || ""}
                    </div>
                </div>
            ),
        },
        {
            title: "Дата и время",
            dataIndex: "scheduledAt",
            key: "scheduledAt",
            render: (value) => dayjs(value).format("DD.MM.YYYY HH:mm"),
            sorter: (a, b) =>
                dayjs(a.scheduledAt).valueOf() - dayjs(b.scheduledAt).valueOf(),
        },
        {
            title: "Статус",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={statusColorMap[status]}>
                    {statusLabelMap[status]}
                </Tag>
            ),
        },
        {
            title: "Комментарий",
            dataIndex: "notes",
            key: "notes",
            ellipsis: true,
            render: (value) => value || "-",
        },
        {
            title: "Действия",
            key: "actions",
            width: 190,
            render: (_, record) => (
                <Space>
                    <Button type="primary" onClick={() => handleEdit(record)}>
                        Редактировать
                    </Button>

                    <Popconfirm
                        title="Удалить бронирование?"
                        description={`Запись #${record.id} будет удалена`}
                        onConfirm={() => handleDelete(record.id)}
                        okText="Да"
                        cancelText="Нет"
                    >
                        <Button danger loading={isDeleting}>
                            Удалить
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card title="Бронирования" style={{ borderRadius: 16 }}>
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} md={6}>
                    <Statistic title="Всего" value={stats.total} />
                </Col>
                <Col xs={12} sm={6} md={4}>
                    <Statistic title="Ожидает" value={stats.pending} />
                </Col>
                <Col xs={12} sm={6} md={4}>
                    <Statistic title="Подтв." value={stats.confirmed} />
                </Col>
                <Col xs={12} sm={6} md={4}>
                    <Statistic title="Завершено" value={stats.completed} />
                </Col>
                <Col xs={12} sm={6} md={4}>
                    <Statistic title="Отменено" value={stats.cancelled} />
                </Col>
            </Row>

            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={8}>
                    <Select
                        allowClear
                        placeholder="Фильтр по статусу"
                        style={{ width: "100%" }}
                        options={statusOptions}
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value)}
                    />
                </Col>

                <Col xs={24} md={10}>
                    <RangePicker
                        style={{ width: "100%" }}
                        value={dateRange}
                        format="DD.MM.YYYY"
                        onChange={(dates) => setDateRange(dates)}
                    />
                </Col>

                <Col xs={24} md={6}>
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                        <Button
                            onClick={() => {
                                setStatusFilter(undefined);
                                setDateRange(null);
                            }}
                        >
                            Сбросить
                        </Button>
                        <Button type="primary" onClick={() => refetch()} loading={isFetching}>
                            Обновить
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={bookings}
                loading={isLoading || isFetching}
                bordered
                size="middle"
                scroll={{ x: 1200 }}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                }}
            />

            <Drawer
                title={
                    editingBooking
                        ? `Редактирование бронирования #${editingBooking.id}`
                        : ""
                }
                open={drawerOpen}
                onClose={handleCloseDrawer}
                width={480}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item label="Имя клиента" name="clientName">
                        <Input disabled />
                    </Form.Item>

                    <Form.Item label="Телефон" name="clientPhone">
                        <Input disabled />
                    </Form.Item>

                    <Form.Item
                        label="Дата и время"
                        name="scheduledAt"
                        rules={[{ required: true, message: "Выберите дату и время" }]}
                    >
                        <DatePicker
                            showTime={{ format: "HH:mm" }}
                            format="DD.MM.YYYY HH:mm"
                            style={{ width: "100%" }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Статус"
                        name="status"
                        rules={[{ required: true, message: "Выберите статус" }]}
                    >
                        <Select options={statusOptions} />
                    </Form.Item>

                    <Form.Item label="Комментарий" name="notes">
                        <TextArea rows={4} placeholder="Введите комментарий" />
                    </Form.Item>

                    <Space style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={handleCloseDrawer}>Отмена</Button>
                        <Button type="primary" loading={isUpdating} onClick={handleUpdate}>
                            Сохранить
                        </Button>
                    </Space>
                </Form>
            </Drawer>
        </Card>
    );
};

export default BookingsTable;