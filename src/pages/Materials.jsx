import React from "react";
import { Table, Tag } from "antd";

const dataSource = [
  {
    key: "1",
    barcode: "4601234567890",
    name: "Пленка матовая",
    price: 250,
    category: "Пленка",
    color: "Белый",
  },
  {
    key: "2",
    barcode: "4609876543210",
    name: "Баннер литой",
    price: 480,
    category: "Баннер",
    color: "Прозрачный",
  },
];

const columns = [
  {
    title: "Штрих-код",
    dataIndex: "barcode",
    key: "barcode",
  },
  {
    title: "Название",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Цена",
    dataIndex: "price",
    key: "price",
    render: (price) => `${price} сом`,
  },
  {
    title: "Категория",
    dataIndex: "category",
    key: "category",
    render: (category) => <Tag>{category}</Tag>,
  },
  {
    title: "Цвет",
    dataIndex: "color",
    key: "color",
    render: (color) => <Tag color="blue">{color}</Tag>,
  },
];

export default function Materials() {
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
