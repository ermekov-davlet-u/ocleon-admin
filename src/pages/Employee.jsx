import React from "react";
import { Table, Tag } from "antd";

const dataSource = [
  {
    key: "1",
    fullName: "Алиев Бакыт",
    position: "Менеджер",
    phone: "+996700123456",
    status: "Активен",
  },
  {
    key: "2",
    fullName: "Иванова Анна",
    position: "Дизайнер",
    phone: "+996555987654",
    status: "В отпуске",
  },
  {
    key: "3",
    fullName: "Садыков Нурсултан",
    position: "Оператор плоттера",
    phone: "+996777456789",
    status: "Уволен",
  },
];

const columns = [
  {
    title: "ФИО",
    dataIndex: "fullName",
    key: "fullName",
  },
  {
    title: "Должность",
    dataIndex: "position",
    key: "position",
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
    render: (status) => {
      let color = "default";
      if (status === "Активен") color = "green";
      if (status === "В отпуске") color = "orange";
      if (status === "Уволен") color = "red";

      return <Tag color={color}>{status}</Tag>;
    },
  },
];

export default function Employees() {
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
