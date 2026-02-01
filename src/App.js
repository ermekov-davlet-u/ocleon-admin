import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ScissorOutlined,
  TeamOutlined,
  BankOutlined,
  TagsOutlined,
  SkinOutlined,
} from "@ant-design/icons";
import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Materials from "./pages/Materials";
import IncomingInvoices from "./pages/IncomingInvoices";
import CuttingFiles from "./pages/Cutting";
import Employees from "./pages/Employee";
import Branches from "./pages/Filials";
import Types from "./pages/Types";
import Products from "./pages/Product";
import LoginPage from "./pages/Login"; // 👈 страница логина
import DeviceTypeTable from "./pages/DeviceTypeTable";

const { Header, Content, Footer, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [isAuth, setIsAuth] = useState(false); // 👈 авторизация

  if (isAuth) {
    return <LoginPage onSuccess={() => setIsAuth(true)} />;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: "rgba(255,255,255,0.2)" }} />
        <Menu
          theme="dark"
          selectedKeys={[page]}
          mode="inline"
          onClick={(e) => setPage(e.key)}
          items={[
            { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "users", icon: <UserOutlined />, label: "Clients" },
            { key: "materials", icon: <AppstoreOutlined />, label: "Materials" },
            { key: "invoices", icon: <FileTextOutlined />, label: "Invoices" },
            { key: "cutting", icon: <ScissorOutlined />, label: "Cutting" },
            { key: "employee", icon: <TeamOutlined />, label: "Employees" },
            { key: "branches", icon: <BankOutlined />, label: "Branches" },
            { key: "types", icon: <TagsOutlined />, label: "Types" },
            { key: "products", icon: <SkinOutlined />, label: "Products" },
            { key: "devices", icon: <SkinOutlined />, label: "Device Type" },
          ]}
        />
      </Sider>

      <Layout>
        {/* <Header style={{ padding: 0, background: "#fff" }} /> */}
        <div style={{overflow: "auto"}}>

          <Content style={{ margin: 16 }}>
            {page === "dashboard" && <Dashboard />}
            {page === "users" && <Users />}
            {page === "materials" && <Materials />}
            {page === "invoices" && <IncomingInvoices />}
            {page === "cutting" && <CuttingFiles />}
            {page === "employee" && <Employees />}
            {page === "branches" && <Branches />}
            {page === "types" && <Types />}
            {page === "products" && <Products />}
            {page === "devices" && <DeviceTypeTable />}
          </Content>
        </div>

        <Footer style={{ textAlign: "center" }}>Admin ©2026</Footer>
      </Layout>
    </Layout>
  );
}

export default App;
