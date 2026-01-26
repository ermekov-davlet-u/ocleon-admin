import React from "react";
import { Table } from "antd";

const dataSource = [
  {
    key: "1",
    name: "Иван Иванов",
    phone: "+996700123456",
  },
  {
    key: "2",
    name: "Анна Петрова",
    phone: "+996555987654",
  },
];

const columns = [
  {
    title: "Имя",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Телефон",
    dataIndex: "phone",
    key: "phone",
    render: (phone) => <a href={`tel:${phone}`}>{phone}</a>,
  },
];

export default function Clients() {
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
