import { Card, Row, Col } from "antd";

export default function Dashboard() {
    return (
        <Row gutter={16}>
            <Col span={8}>
                <Card title="Users" bordered={false}>
                    120
                </Card>
            </Col>
            <Col span={8}>
                <Card title="Orders" bordered={false}>
                    45
                </Card>
            </Col>
            <Col span={8}>
                <Card title="Revenue" bordered={false}>
                    $3,200
                </Card>
            </Col>
        </Row>
    );
}
