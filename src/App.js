import { Layout, Menu } from "antd";
import { DesktopOutlined, UserOutlined } from "@ant-design/icons";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";

const { Header, Content, Footer, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState("dashboard");

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: "rgba(255,255,255,0.2)" }} />
        <Menu
          theme="dark"
          defaultSelectedKeys={["dashboard"]}
          mode="inline"
          onClick={(e) => setPage(e.key)}
          items={[
            { key: "dashboard", icon: <DesktopOutlined />, label: "Dashboard" },
            { key: "users", icon: <UserOutlined />, label: "Users" },
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: 0, background: "#fff" }} />
        <Content style={{ margin: "16px" }}>
          {page === "dashboard" && <Dashboard />}
          {page === "users" && <Users />}
        </Content>
        <Footer style={{ textAlign: "center" }}>Admin ©2026</Footer>
      </Layout>
    </Layout>
  );
}

export default App;
