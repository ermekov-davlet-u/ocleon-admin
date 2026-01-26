import React from "react";
import { Table, Tag } from "antd";

const dataSource = [
  {
    key: "1",
    name: "Главный офис",
    address: "г. Бишкек, ул. Токтогула, 123",
    phone: "+996700123456",
    status: "Работает",
  },
  {
    key: "2",
    name: "Филиал Восток",
    address: "г. Бишкек, ул. Чуй, 45",
    phone: "+996555987654",
    status: "Закрыт",
  },
  {
    key: "3",
    name: "Филиал Юг",
    address: "г. Ош, ул. Советская, 12",
    phone: "+996777456789",
    status: "Работает",
  },
];

const columns = [
  {
    title: "Название",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Адрес",
    dataIndex: "address",
    key: "address",
  },
  {
    title: "Телефон",
    dataIndex: "phone",
    key: "phone",
    render: (phone) => <a href={`tel:${phone}`}>{phone}</a>,
  },
  {
    title: "Статус",
    dataIndex: "status",
    key: "status",
    render: (status) => (
      <Tag color={status === "Работает" ? "green" : "red"}>{status}</Tag>
    ),
  },
];

export default function Branches() {
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
