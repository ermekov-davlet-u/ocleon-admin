import React from "react";
import { Table, Tag } from "antd";

const dataSource = [
  {
    key: "1",
    number: "PN-001",
    date: "2026-01-20",
    supplier: "ОсОО Реклама Плюс",
    total: 12500,
    status: "Проведена",
  },
  {
    key: "2",
    number: "PN-002",
    date: "2026-01-22",
    supplier: "ИП Снабжение",
    total: 8400,
    status: "Черновик",
  },
];

const columns = [
  {
    title: "№ накладной",
    dataIndex: "number",
    key: "number",
  },
  {
    title: "Дата",
    dataIndex: "date",
    key: "date",
  },
  {
    title: "Поставщик",
    dataIndex: "supplier",
    key: "supplier",
  },
  {
    title: "Сумма",
    dataIndex: "total",
    key: "total",
    render: (value) => `${value.toLocaleString()} сом`,
  },
  {
    title: "Статус",
    dataIndex: "status",
    key: "status",
    render: (status) => (
      <Tag color={status === "Проведена" ? "green" : "orange"}>
        {status}
      </Tag>
    ),
  },
];

export default function IncomingInvoices() {
  return (
    <div style={{ padding: 24 }}>
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        bordered
      />
    </div>
  );
}
