import { Table } from "antd";

const dataSource = [
    { key: "1", name: "John", email: "john@example.com" },
    { key: "2", name: "Jane", email: "jane@example.com" },
];

const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
];

export default function Users() {
    return <Table dataSource={dataSource} columns={columns} />;
}
