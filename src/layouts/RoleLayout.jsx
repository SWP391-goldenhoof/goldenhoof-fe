import { Avatar, Button, ConfigProvider, Layout, Menu, Space, Tooltip, Typography } from "antd";
import { LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../api/services/auth.service";
import { clearAuthSession, getAuthSession } from "../utils/storage";
import { getInitials } from "../utils/roles";

const { Sider, Header, Content } = Layout;

export default function RoleLayout({ role, title, subtitle, navItems }) {
    const navigate = useNavigate();
    const location = useLocation();
    const session = getAuthSession();
    const [user, setUser] = useState(
        () => session?.user || { fullName: role || "GoldenHoof User", role },
    );
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const displayName =
        user?.fullName ||
        user?.name ||
        user?.username ||
        role ||
        "GoldenHoof User";
    const initials = getInitials(displayName);
    const isOwnerRole = String(role).toLowerCase().includes("owner");
    const isJockeyRole = String(role).toLowerCase().includes("jockey");
    const usesGreenActionTheme = isOwnerRole || isJockeyRole;
    const actionTheme = usesGreenActionTheme
        ? {
            token: {
                colorPrimary: "#69f8dd",
                colorPrimaryHover: "#4fe9cf",
                colorPrimaryActive: "#25ceb5",
                colorLink: "#087a6d",
                colorLinkHover: "#065f55",
                controlOutline: "rgba(105, 248, 221, 0.28)",
            },
        }
        : undefined;

    const selectedKey =
        [...navItems]
            .sort((first, second) => second.to.length - first.to.length)
            .find((item) => location.pathname.startsWith(item.to))?.key || navItems[0]?.key;

    useEffect(() => {
        let active = true;

        getProfile()
            .then((profile) => {
                if (active && profile) {
                    setUser((current) => ({ ...current, ...profile }));
                }
            })
            .catch(() => {
                // Keep the session data when the profile endpoint is unavailable.
            });

        return () => {
            active = false;
        };
    }, []);

    function handleLogout() {
        clearAuthSession();
        navigate("/login", { replace: true });
    }

    function closeMobileMenu() {
        setIsMobileMenuOpen(false);
    }

    return (
        <ConfigProvider theme={actionTheme}>
            <Layout
                className={`role-layout${isOwnerRole ? " owner-role-layout" : ""}${isJockeyRole ? " jockey-role-layout" : ""}${isMobileMenuOpen ? " role-layout-menu-open" : ""}`}
            >
                <button
                    className="role-mobile-backdrop"
                    type="button"
                    aria-label="Close navigation"
                    onClick={closeMobileMenu}
                />
                <Sider width={250} className="role-sider">
                    <div className="role-sider-inner">
                        <div className="role-brand">
                            <img className="role-brand-logo" src="/goldenhoof-logo.png" alt="" />
                            <span>GoldenHoof</span>
                        </div>

                        <div className="role-menu-scroll">
                            <Menu
                                mode="inline"
                                selectedKeys={[selectedKey]}
                                className="role-menu"
                                items={navItems.map((item) => ({
                                    key: item.key,
                                    label: (
                                        <NavLink
                                            className="role-link"
                                            to={item.to}
                                            onClick={closeMobileMenu}
                                        >
                                            {item.label}
                                        </NavLink>
                                    ),
                                }))}
                            />
                        </div>

                        <div className="role-sider-footer">
                            <div className="role-account">
                                <Avatar className="role-avatar">
                                    {initials}
                                </Avatar>
                                <div className="role-account-copy">
                                    <span className="role-account-name">{displayName}</span>
                                    <span className="role-account-email">
                                        {user.email || displayName}
                                    </span>
                                </div>
                                <Tooltip title="Logout">
                                    <Button
                                        className="role-logout-icon"
                                        shape="circle"
                                        danger
                                        icon={<LogoutOutlined />}
                                        aria-label="Logout"
                                        onClick={handleLogout}
                                    />
                                </Tooltip>
                            </div>

                            <Button block onClick={() => navigate("/home")}>
                                Home
                            </Button>
                        </div>
                    </div>
                </Sider>

                <Layout>
                    <Header className="role-header">
                        <Button
                            className="role-mobile-menu-btn"
                            type="text"
                            icon={<MenuOutlined />}
                            aria-label="Open navigation"
                            onClick={() => setIsMobileMenuOpen(true)}
                        />
                        <Space orientation="vertical" size={0}>
                            <Typography.Text type="secondary">{subtitle}</Typography.Text>
                            <Typography.Title level={4} className="role-title">
                                {title}
                            </Typography.Title>
                        </Space>
                    </Header>

                    <Content className="role-content">
                        <Outlet />
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
}
