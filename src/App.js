import { Layout, Menu, Badge, Avatar, Tooltip, Dropdown, Button, message, Space, Typography } from "antd";
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
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useState, useEffect } from "react";
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
import DiscountsPage from "./pages/DiscountsPage";
import CuttingOrdersVisual from "./pages/CuttingOrdersVisual";

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

// ─── Page title map ───────────────────────────────────────────────
const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/users": "Клиенты",
  "/materials": "Материалы",
  "/invoices": "Накладная",
  "/invoiceForm": "Приход товара",
  "/order-visual": "Резка 2",
  "/cutting": "Резка",
  "/employee": "Работники",
  "/branches": "Филиалы",
  "/discount": "Скидки",
  "/types": "Вид резки",
  "/products": "Для резки",
  "/devices": "Типы устройств",
  "/preview": "Предварительный просмотр",
};

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notifCount] = useState(3); // заглушка

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setIsAuth(false); setCheckingAuth(false); return; }
    setIsAuth(true);
    setCheckingAuth(false);
  }, []);

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#0f172a", color: "#fff", fontSize: 16,
      }}>
        Проверка авторизации...
      </div>
    );
  }

  if (!isAuth) {
    return (
      <LoginPage
        onSuccess={(token) => {
          localStorage.setItem("token", token);
          setIsAuth(true);
          navigate("/dashboard");
          message.success("Вы успешно вошли!");
        }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuth(false);
    navigate("/");
    message.info("Вы вышли из системы");
  };

  const userMenuItems = [
    { key: "profile", icon: <UserOutlined />, label: "Профиль" },
    { key: "settings", icon: <SettingOutlined />, label: "Настройки" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Выйти", danger: true, onClick: handleLogout },
  ];

  const notifMenuItems = [
    { key: "1", label: "📦 Новый приход товара поступил" },
    { key: "2", label: "✂️ Заказ на резку #4821 готов" },
    { key: "3", label: "👤 Новый клиент зарегистрирован" },
  ];

  const currentTitle = PAGE_TITLES[location.pathname] || "Admin Panel";

  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* ─── SIDER ─────────────────────────────────────── */}
      <Sider
        width={260}
        collapsible
        collapsed={collapsed}
        trigger={null}
        breakpoint="lg"
        collapsedWidth={mobile ? 0 : 72}
        onBreakpoint={(broken) => { setMobile(broken); setCollapsed(broken); }}
        style={{
          position: "fixed",
          left: 0, top: 0, bottom: 0,
          zIndex: 1000,
          overflow: "hidden",
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
          boxShadow: "2px 0 12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          padding: collapsed ? "0" : "0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          gap: 10,
          transition: "all 0.3s",
        }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            fontSize: 16, color: "#fff", fontWeight: 700,
          }}>A</div>
          {!collapsed && (
            <span style={{
              color: "#fff", fontWeight: 700, fontSize: 16,
              letterSpacing: "0.5px", whiteSpace: "nowrap",
            }}>
              AdminPanel
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          onClick={(e) => {
            navigate(e.key);
            if (mobile) setCollapsed(true);
          }}
          style={{
            background: "transparent",
            border: "none",
            marginTop: 8,
          }}
          items={[
            { key: "/dashboard",   icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "/users",       icon: <UserOutlined />,      label: "Клиенты" },
            { key: "/materials",   icon: <AppstoreOutlined />,  label: "Материалы" },
            { key: "/invoices",    icon: <FileTextOutlined />,  label: "Накладная" },
            { key: "/invoiceForm", icon: <FileTextOutlined />,  label: "Приход товара" },
            { key: "/cutting",     icon: <ScissorOutlined />,   label: "Резка" },
            { key: "/employee",    icon: <TeamOutlined />,      label: "Работники" },
            { key: "/branches",    icon: <BankOutlined />,      label: "Филиалы" },
            { key: "/discount",    icon: <BankOutlined />,      label: "Скидки" },
            { key: "/types",       icon: <TagsOutlined />,      label: "Вид резки" },
            { key: "/products",    icon: <SkinOutlined />,      label: "Для резки" },
            { key: "/devices",     icon: <SkinOutlined />,      label: "Типы устройств" },
            { key: "/preview",     icon: <SkinOutlined />,      label: "Предварительный просмотр" },
          ]}
        />
      </Sider>

      {/* ─── MAIN LAYOUT ───────────────────────────────── */}
      <Layout style={{
        marginLeft: mobile ? 0 : collapsed ? 72 : 260,
        transition: "margin-left 0.2s",
      }}>
        {/* ─── HEADER ──────────────────────────────────── */}
        <Header style={{
          position: "sticky",
          top: 0,
          zIndex: 999,
          padding: "0 20px",
          background: "#ffffff",
          boxShadow: "0 1px 8px rgba(0,0,0,0.10)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
        }}>
          {/* Left: collapse btn + page title */}
          <Space size={16} align="center">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: 18,
                width: 40, height: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#475569",
              }}
            />
            <Text style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#1e293b",
              letterSpacing: "0.2px",
            }}>
              {currentTitle}
            </Text>
          </Space>

          {/* Right: action buttons */}
          <Space size={8} align="center">
            {/* Cutting shortcut */}
            <Tooltip title="Резка" placement="bottom">
              <Button
                type="text"
                icon={<ScissorOutlined style={{ fontSize: 18 }} />}
                onClick={() => navigate("/order-visual")}
                style={{
                  width: 40, height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#6366f1",
                  borderRadius: 8,
                  background: location.pathname === "/order-visual"
                    ? "rgba(99,102,241,0.1)" : "transparent",
                }}
              />
            </Tooltip>

            {/* Notifications */}
            <Dropdown
              menu={{ items: notifMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
              arrow
            >
              <Tooltip title="Уведомления" placement="bottom">
                <Button
                  type="text"
                  style={{
                    width: 40, height: 40,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8,
                    color: "#475569",
                  }}
                >
                  <Badge count={notifCount} size="small" offset={[2, -2]}>
                    <BellOutlined style={{ fontSize: 18 }} />
                  </Badge>
                </Button>
              </Tooltip>
            </Dropdown>

            {/* Divider */}
            <div style={{
              width: 1, height: 28,
              background: "#e2e8f0",
              margin: "0 4px",
            }} />

            {/* User dropdown */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
              arrow
            >
              <Space
                align="center"
                style={{
                  cursor: "pointer",
                  padding: "4px 10px",
                  borderRadius: 8,
                  transition: "background 0.2s",
                  userSelect: "none",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <Avatar
                  size={32}
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    fontWeight: 700, fontSize: 13,
                  }}
                  icon={<UserOutlined />}
                />
                {!mobile && (
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Администратор</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>admin@ocleon.com</div>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* ─── CONTENT ─────────────────────────────────── */}
        <Content style={{
          margin: 20,
          minHeight: "calc(100vh - 64px - 56px)",
          overflow: "auto",
        }}>
          <Routes>
            <Route path="/"             element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/users"        element={<Users />} />
            <Route path="/materials"    element={<Materials />} />
            <Route path="/invoices"     element={<IncomingInvoices />} />
            <Route path="/discount"     element={<DiscountsPage />} />
            <Route path="/order-visual" element={<CuttingOrdersVisual />} />
            <Route path="/cutting"      element={<CuttingFiles />} />
            <Route path="/employee"     element={<Employees />} />
            <Route path="/branches"     element={<Branches />} />
            <Route path="/types"        element={<Types />} />
            <Route path="/products"     element={<Products />} />
            <Route path="/devices"      element={<DeviceTypeTable />} />
            <Route path="/invoiceForm"  element={<IncomingInvoiceForm />} />
            <Route path="/preview"      element={<PhoneCasePreview />} />
          </Routes>
        </Content>

        {/* ─── FOOTER ──────────────────────────────────── */}
        <Footer style={{
          textAlign: "center",
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          padding: "14px 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Text style={{ fontSize: 12, color: "#94a3b8" }}>
            © 2026 <strong style={{ color: "#6366f1" }}>Ocleon Admin</strong>. Все права защищены.
          </Text>
          <Space size={16}>
            <Text
              style={{ fontSize: 12, color: "#94a3b8", cursor: "pointer" }}
              onClick={() => navigate("/cutting")}
            >
              <ScissorOutlined style={{ marginRight: 4 }} />Резка
            </Text>
            <Text style={{ fontSize: 12, color: "#cbd5e1" }}>v2.0.0</Text>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default App;