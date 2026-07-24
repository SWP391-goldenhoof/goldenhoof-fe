import { Avatar, Button, Layout, Tooltip, Typography } from "antd";
import {
  DashboardOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  GiftOutlined,
  IdcardOutlined,
  MenuOutlined,
  ProfileOutlined,
  ScheduleOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserAddOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import "antd/dist/reset.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProfile } from "../api/services/auth.service";
import { clearAuthSession, getAuthSession } from "../utils/storage";
import { getInitials } from "../utils/roles";

const { Content, Header, Sider } = Layout;

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      {
        path: "/admin/dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined />,
      },
    ],
  },
  {
    label: "People",
    items: [
      { path: "/admin/users", label: "Users", icon: <TeamOutlined /> },
      {
        path: "/admin/referees/create",
        label: "Create Referee",
        icon: <UserAddOutlined />,
      },
      {
        path: "/admin/jockey-license",
        label: "Jockey Licenses",
        icon: <IdcardOutlined />,
      },
      {
        path: "/admin/contract",
        label: "Contracts",
        icon: <IdcardOutlined />,
      },
    ],
  },
  {
    label: "Competition",
    items: [
      {
        path: "/admin/tournaments",
        label: "Tournaments",
        icon: <TrophyOutlined />,
      },
      {
        path: "/admin/registrations",
        label: "Registrations",
        icon: <ProfileOutlined />,
      },
      { path: "/admin/races", label: "Races", icon: <ScheduleOutlined /> },
      {
        path: "/admin/raceCourse",
        label: "Race Courses",
        icon: <EnvironmentOutlined />,
      },
      {
        path: "/admin/prize",
        label: "Prize Distribution",
        icon: <GiftOutlined />,
      },
    ],
  },
  {
    label: "Finance & Engagement",
    items: [
      { path: "/admin/reward", label: "Rewards", icon: <GiftOutlined /> },
      {
        path: "/admin/withdrawal",
        label: "Withdrawals",
        icon: <WalletOutlined />,
      },
      { path: "/admin/bet", label: "Bets", icon: <DollarOutlined /> },
      { path: "/admin/report", label: "Reports", icon: <FileTextOutlined /> },
    ],
  },
];

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getAuthSession();
  const [user, setUser] = useState(() => session?.user || {});
  const displayName =
    user?.fullName || user?.name || user?.username || "Administrator";
  const accountLabel = user?.role || "Admin account";
  const initials = getInitials(displayName);
  const avatarUrl = user?.avatar || user?.avatarUrl || user?.imageUrl;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  function isActive(path) {
    if (path === "/admin/dashboard") {
      return ["/admin", "/admin/dashboard"].includes(location.pathname);
    }

    return location.pathname === path;
  }

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <Layout
      className={`admin-layout${isMobileMenuOpen ? " admin-layout-menu-open" : ""}`}
    >
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { min-height: 100%; margin: 0; }
        body {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #0d2321;
          background: #f7fffd;
        }

        .admin-layout { min-height: 100dvh; background: #f6fbfa; }
        .admin-mobile-menu-btn,
        .admin-mobile-backdrop {
          display: none;
        }
        .admin-sidebar.ant-layout-sider {
          position: sticky;
          top: 0;
          align-self: flex-start;
          height: 100dvh;
          overflow: hidden;
          border-right: 1px solid rgba(105, 248, 221, 0.12);
          background: linear-gradient(180deg, #052a26 0%, #021b19 100%);
        }

        .admin-sidebar-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
          min-height: 0;
          padding: 0;
          overflow: hidden;
        }

        .admin-brand {
          flex: 0 0 72px;
          height: 72px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 20px;
          color: #f4fffb;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 0;
          text-decoration: none;
        }

        .admin-brand-logo {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          object-fit: contain;
        }
        .admin-nav-scroll {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 0 14px;
          scrollbar-width: thin;
          scrollbar-color: rgba(105, 248, 221, 0.3) transparent;
        }

        .admin-nav-group + .admin-nav-group { margin-top: 10px; }
        .admin-nav-label {
          margin: 14px 20px 6px;
          color: rgba(244, 255, 251, 0.42);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .admin-nav-list { display: grid; gap: 5px; }
        .admin-nav-item {
          min-height: 44px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 12px;
          padding: 0 12px;
          border-radius: 10px;
          color: rgba(244, 255, 251, 0.76);
          font-size: 14px;
          font-weight: 750;
          text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease;
        }

        .admin-nav-item .anticon { width: 18px; font-size: 17px; }
        .admin-nav-item:hover { color: #f4fffb; background: rgba(105, 248, 221, 0.08); }
        .admin-nav-item.active {
          color: #69f8dd;
          background: rgba(105, 248, 221, 0.12);
          font-weight: 900;
        }

        .admin-sidebar-footer {
          flex: 0 0 auto;
          display: grid;
          gap: 10px;
          padding: 16px;
          border-top: 1px solid rgba(105, 248, 221, 0.12);
          background: rgba(2, 27, 25, 0.78);
        }

        .admin-account {
          display: flex;
          gap: 10px;
          align-items: center;
          min-width: 0;
          padding: 0 0 4px;
          color: #f4fffb;
          text-decoration: none;
        }

        .admin-account-avatar.ant-avatar {
          flex: 0 0 auto;
          color: #69f8dd;
          background: #06332e;
          border: 1px solid rgba(105, 248, 221, 0.28);
          font-weight: 900;
        }
        .admin-account-copy {
          min-width: 0;
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        .admin-account-name, .admin-account-email {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-account-name { font-size: 13px; font-weight: 800; }
        .admin-account-email { color: rgba(244, 255, 251, 0.58); font-size: 12px; }
        .admin-footer-actions { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .admin-footer-actions .ant-btn {
          height: 38px;
          color: rgba(244, 255, 251, 0.86) !important;
          border-color: rgba(105, 248, 221, 0.2) !important;
          background: rgba(255, 255, 255, 0.04) !important;
          font-weight: 800;
        }
        .admin-footer-actions .ant-btn:hover {
          color: #69f8dd !important;
          border-color: rgba(105, 248, 221, 0.58) !important;
          background: rgba(105, 248, 221, 0.1) !important;
        }
        .admin-logout-btn.ant-btn {
          flex: 0 0 auto;
          color: #ffb3b3 !important;
          border-color: rgba(255, 120, 117, 0.28) !important;
          background: rgba(255, 120, 117, 0.08) !important;
          font-weight: 800;
        }

        .admin-header.ant-layout-header {
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 24px;
          border-bottom: 1px solid #e7efed;
          background: #fff;
        }

        .admin-header-copy { display: flex; flex-direction: column; }
        .admin-header-title.ant-typography { margin: 0; color: #06332e; }

        .admin-content.ant-layout-content {
          min-width: 0;
          padding: 24px;
          background: #f6fbfa;
        }

        .admin-mobile-header {
          display: none;
        }

        @media (max-width: 920px) {
          .admin-sidebar.ant-layout-sider {
            position: fixed;
            z-index: 40;
            top: 0;
            left: 0;
            max-width: min(280px, 82vw) !important;
            min-width: 0 !important;
            width: min(280px, 82vw) !important;
            height: 100dvh;
            transform: translateX(-100%);
            transition: transform 0.22s ease;
          }
          .admin-layout-menu-open .admin-sidebar.ant-layout-sider {
            transform: translateX(0);
          }
          .admin-mobile-backdrop {
            position: fixed;
            z-index: 35;
            inset: 0;
            display: block;
            border: 0;
            padding: 0;
            background: rgba(0, 24, 22, 0.42);
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.18s ease;
          }
          .admin-layout-menu-open .admin-mobile-backdrop {
            opacity: 1;
            pointer-events: auto;
          }
          .admin-sidebar-inner {
            height: 100%;
            max-height: none;
          }
          .admin-nav-scroll {
            overflow-y: auto;
          }
          .admin-mobile-header {
            min-height: 64px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin: -18px -18px 18px;
            padding: 12px 18px;
            border-bottom: 1px solid #e7efed;
            background: #ffffff;
          }
          .admin-mobile-menu-btn.ant-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 42px;
            height: 42px;
            border: 1px solid #ccefe7;
            color: #06332e;
            background: #ffffff;
          }
          .admin-mobile-header-copy {
            min-width: 0;
            display: grid;
          }
          .admin-mobile-header-copy span {
            color: #6b7f7b;
            font-size: 12px;
            font-weight: 800;
          }
          .admin-mobile-header-copy strong {
            color: #06332e;
            font-size: 18px;
            line-height: 1.2;
          }
          .admin-content.ant-layout-content { padding: 18px; }
        }
      `}</style>

      <button
        className="admin-mobile-backdrop"
        type="button"
        aria-label="Close navigation"
        onClick={closeMobileMenu}
      />

      <Sider className="admin-sidebar" width={250}>
        <div className="admin-sidebar-inner">
          <Link className="admin-brand" to="/admin/dashboard">
            <img
              className="admin-brand-logo"
              src="/goldenhoof-logo.png"
              alt="GoldenHoof"
            />
            <span>GoldenHoof</span>
          </Link>

          <nav className="admin-nav-scroll" aria-label="Admin navigation">
            {NAV_GROUPS.map((group) => (
              <section className="admin-nav-group" key={group.label}>
                <div className="admin-nav-label">{group.label}</div>
                <div className="admin-nav-list">
                  {group.items.map((item) => (
                    <Link
                      className={`admin-nav-item ${isActive(item.path) ? "active" : ""}`}
                      to={item.path}
                      key={item.path}
                      onClick={closeMobileMenu}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </nav>

          <div className="admin-sidebar-footer">
            <Link className="admin-account" to="/profile">
              <Avatar className="admin-account-avatar" src={avatarUrl}>
                {initials}
              </Avatar>
              <div className="admin-account-copy">
                <div className="admin-account-name">{displayName}</div>
                <div className="admin-account-email">
                  {accountLabel}
                </div>
              </div>
              <Button
                className="admin-logout-btn"
                size="small"
                danger
                onClick={(event) => {
                  event.preventDefault();
                  handleLogout();
                }}
              >
                Logout
              </Button>
            </Link>

            <div className="admin-footer-actions">
              <Tooltip title="Open home">
                <Button
                  block
                  onClick={() => navigate("/home")}
                >
                  Home
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </Sider>

      <Layout>
        {/* <Header className="admin-header">
          <div className="admin-header-copy">
            <Typography.Text type="secondary">
              Operations and management
            </Typography.Text>
            <Typography.Title level={4} className="admin-header-title">
              Admin workspace
            </Typography.Title>
          </div>
        </Header> */}

        <Content className="admin-content">
          <div className="admin-mobile-header">
            <Button
              className="admin-mobile-menu-btn"
              type="text"
              icon={<MenuOutlined />}
              aria-label="Open navigation"
              onClick={() => setIsMobileMenuOpen(true)}
            />
            <div className="admin-mobile-header-copy">
              <span>Operations and management</span>
              <strong>Admin workspace</strong>
            </div>
          </div>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
