import React from "react";
import { Form, Input, Button, Card, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const LoginPage = ({ onSuccess }) => {
  const onFinish = (values) => {
    console.log("Login data:", values);

    // TODO: тут будет API логина
    // если логин успешный:
    onSuccess();
  };

  return (
    <div style={styles.wrapper}>
      <Card style={styles.card} bordered={false}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 8 }}>
          Вход в систему
        </Title>

        <Text
          type="secondary"
          style={{ display: "block", textAlign: "center", marginBottom: 24 }}
        >
          Пожалуйста, войдите в аккаунт
        </Text>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Некорректный email" },
            ]}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="example@mail.com"
            />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: "Введите пароль" }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" size="large" block>
              Войти
            </Button>
          </Form.Item>
        </Form>

        <Text type="secondary" style={{ display: "block", textAlign: "center" }}>
          Нет аккаунта? Зарегистрируйтесь
        </Text>
      </Card>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f5222d, #262626)",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
};

export default LoginPage;
