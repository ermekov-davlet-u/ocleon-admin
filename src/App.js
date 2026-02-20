import { Layout, Menu, Button } from "antd";
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
  MenuOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Materials from "./pages/Materials";
import IncomingInvoices from "./pages/IncomingInvoices";
import CuttingFiles from "./pages/Cutting";
import Employees from "./pages/Employee";
import Branches from "./pages/Filials";
import Types from "./pages/Types";
import Products from "./pages/Product";
import LoginPage from "./pages/Login";
import DeviceTypeTable from "./pages/DeviceTypeTable";
import IncomingInvoiceForm from "./pages/IncomingInvoiceForm";
import PhoneCasePreview from "./pages/PreviewPage";

const { Header, Content, Footer, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("token"));

  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuth) {
    return (
      <LoginPage
        onSuccess={(token) => {
          localStorage.setItem("token", token);
          setIsAuth(true);
          navigate("/dashboard");
        }}
      />
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth={mobile ? 0 : 80}
        onBreakpoint={(broken) => {
          setMobile(broken);
          setCollapsed(broken);
        }}
        style={mobile ? { position: "fixed", zIndex: 1000, height: "100vh" } : {}}
      >
        <div style={{ height: 32 }} />
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          onClick={(e) => {
            navigate(e.key);
            if (mobile) setCollapsed(true);
          }}
          items={[
            { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "/users", icon: <UserOutlined />, label: "Клиенты" },
            { key: "/materials", icon: <AppstoreOutlined />, label: "Материалы" },
            { key: "/invoices", icon: <FileTextOutlined />, label: "Накладная" },
            { key: "/invoiceForm", icon: <FileTextOutlined />, label: "Приход товара" },
            { key: "/cutting", icon: <ScissorOutlined />, label: "Резка" },
            { key: "/employee", icon: <TeamOutlined />, label: "Работники" },
            { key: "/branches", icon: <BankOutlined />, label: "Филиалы" },
            { key: "/types", icon: <TagsOutlined />, label: "Вид резки" },
            { key: "/products", icon: <SkinOutlined />, label: "Для резки" },
            { key: "/devices", icon: <SkinOutlined />, label: "Типы устройств" },
            { key: "/preview", icon: <SkinOutlined />, label: "Предварительный просмотре" },
          ]}
        />
      </Sider>

      <Layout style={{ marginLeft: mobile ? 0 : collapsed ? 0 : 0 }}>
        {/* <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {mobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
            />
          )}
        </Header> */}

        <Content style={{ maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100vh - 80px)", overflow: "auto" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/invoices" element={<IncomingInvoices />} />
            <Route path="/cutting" element={<CuttingFiles />} />
            <Route path="/employee" element={<Employees />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/types" element={<Types />} />
            <Route path="/products" element={<Products />} />
            <Route path="/devices" element={<DeviceTypeTable />} />
            <Route path="/invoiceForm" element={<IncomingInvoiceForm />} />
            <Route path="/preview" element={<PhoneCasePreview />} />
          </Routes>
        </Content>

        <Footer style={{ textAlign: "center" }}>
          Admin ©2026
        </Footer>
      </Layout>
    </Layout>
  );
}

export default App;
