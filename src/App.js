import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ScissorOutlined,
  TeamOutlined,
  BankOutlined,
  TagsOutlined, // для Types
  SkinOutlined, // для Products (или другая иконка для товаров)
} from "@ant-design/icons";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Materials from "./pages/Materials";
import IncomingInvoices from "./pages/IncomingInvoices";
import CuttingFiles from "./pages/Cutting";
import Employees from "./pages/Employee";
import Branches from "./pages/Filials";
import Types from "./pages/Types"; // справочник "Виды"
import Products from "./pages/Product"; // продукты / броне-оклейка

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
            { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "users", icon: <UserOutlined />, label: "Clients" },
            { key: "materials", icon: <AppstoreOutlined />, label: "Materials" },
            { key: "invoices", icon: <FileTextOutlined />, label: "Invoices" },
            { key: "cutting", icon: <ScissorOutlined />, label: "Cutting" },
            { key: "employee", icon: <TeamOutlined />, label: "Employees" },
            { key: "branches", icon: <BankOutlined />, label: "Branches" },
            { key: "types", icon: <TagsOutlined />, label: "Types" },       // Виды
            { key: "products", icon: <SkinOutlined />, label: "Products" }, // Продукты / броне-оклейка
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: 0, background: "#fff" }} />
        <Content style={{ margin: "16px" }}>
          {page === "dashboard" && <Dashboard />}
          {page === "users" && <Users />}
          {page === "materials" && <Materials />}
          {page === "invoices" && <IncomingInvoices />}
          {page === "cutting" && <CuttingFiles />}
          {page === "employee" && <Employees />}
          {page === "branches" && <Branches />}
          {page === "types" && <Types />}         {/* Справочник "Виды" */}
          {page === "products" && <Products />}   {/* Продукты / броне-оклейка */}
        </Content>
        <Footer style={{ textAlign: "center" }}>Admin ©2026</Footer>
      </Layout>
    </Layout>
  );
}

export default App;
