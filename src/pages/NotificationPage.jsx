import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Typography,
  message,
  Spin,
  Empty,
  Card,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  BellOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/services/notification.service";

dayjs.extend(utc);

const { Text, Title, Paragraph } = Typography;

// Đổi tên từ Notification thành NotificationHistory để tránh trùng với Browser Web API
export default function NotificationHistory() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const data = await getMyNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error?.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleReadOne(id) {
    try {
      await markNotificationAsRead(id);
      message.success("Notification marked as read");
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      message.error(error?.message || "Failed to mark notification as read");
    }
  }

  async function handleReadAll() {
    try {
      await markAllNotificationsAsRead();
      message.success("All notifications marked as read");
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
    } catch (error) {
      message.error(
        error?.message || "Failed to mark all notifications as read",
      );
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const typeConfigs = {
    // --- Hệ thống tài chính (Wallet / Payment) ---
    Deposit_success: { text: "Nạp tiền thành công", color: "cyan" },
    Deposit_failed: { text: "Nạp tiền thất bại", color: "volcano" },
    Create_withdraw_success: {
      text: "Tạo đơn rút tiền thành công",
      color: "green",
    },
    Withdraw_success: { text: "Rút tiền thành công", color: "green" },
    Withdraw_failed: { text: "Rút tiền thất bại", color: "red" },
    Contract_paid: { text: "Thanh toán hợp đồng", color: "orange" },
    Reward_received: { text: "Nhận tiền thưởng", color: "gold" },

    // --- Hệ thống giao kèo / Thư mời (Invitation / Contract) ---
    Invitation_received: { text: "Lời mời mới", color: "blue" },
    Invitation_accepted: { text: "Lời mời đã chấp nhận", color: "green" },
    Invitation_rejected: { text: "Lời mời bị từ chối", color: "magenta" },
    Contract_cancelled: { text: "Hợp đồng bị hủy", color: "red" },
    Contract_breached: { text: "Vi phạm hợp đồng", color: "red" },
    Contract_completed: { text: "Hợp đồng hoàn thành", color: "lime" },

    // --- Hệ thống giải đấu / Vận hành (Tournament) ---
    Tournament_registered: { text: "Đăng ký giải đấu", color: "green" },
    Tournament_waitlist: { text: "Hàng chờ giải đấu", color: "warning" },
    Tournament_rejected: { text: "Đăng ký bị từ chối", color: "error" },
    Race_reminder: { text: "Lịch đua sắp tới", color: "processing" },
    Jockey_injured: { text: "Nài ngựa chấn thương", color: "error" },

    // --- Hệ thống Cá cược & Trực tiếp (Betting & Broadcast) ---
    Place_bet_success: { text: "Đặt cược thành công", color: "cyan" },
    Update_bet_success: { text: "Cập nhật cược thành công", color: "blue" },
    Bet_win: { text: "Thắng cược", color: "gold" },
    Bet_lose: { text: "Thua cược", color: "red" },
    Refund: { text: "Hoàn tiền cược", color: "green" },
    Contract_breached_sent: {
      text: "Tố cáo vi phạm hợp đồng đã gửi",
      color: "orange",
    },
    Contract_breached_sent_rejected: {
      text: "Tố cáo vi phạm bị từ chối",
      color: "red",
    },
    "Race_broadcast-started": {
      text: "Trận đua đang phát sóng",
      color: "magenta",
    },
    "Race_broadcast-end": {
      text: "Trận đua đã kết thúc",
      color: "lightgray",
    },

    // --- Tài khoản & Hệ thống (Account / System) ---
    Account_locked: { text: "Tài khoản bị khóa", color: "volcano" },
    Profile_verified: { text: "Xác minh hồ sơ", color: "success" },
    Balance_not_enough: { text: "Số dư không đủ", color: "warning" },
    System_alert: { text: "Cảnh báo hệ thống", color: "default" },
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 180,
      render: (type) => {
        // Tìm cấu hình phù hợp, nếu không có thì hiển thị text gốc
        const config = typeConfigs[type] || { text: type, color: "default" };
        return (
          <Tag
            color={config.color}
            style={{
              fontWeight: "600",
              backgroundColor: "#002d28",
              textTransform: "none",
              borderRadius: "4px",
            }}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "isRead",
      key: "isRead",
      width: 120,
      render: (isRead) => {
        if (isRead) {
          return (
            <Tag
              style={{
                fontSize: "12px",
                padding: "2px 8px",
                fontWeight: "700",
                background: "rgba(244, 255, 251, 0.05)",
                border: "1px solid rgba(244, 255, 251, 0.3)",
                color: "rgba(244, 255, 251, 0.5)",
              }}
            >
              READ
            </Tag>
          );
        }
        return (
          <Tag
            icon={<BellOutlined />}
            style={{
              fontSize: "12px",
              padding: "2px 8px",
              fontWeight: "700",
              background: "rgba(105, 248, 221, 0.15)",
              border: "1px solid #69f8dd",
              color: "#69f8dd",
            }}
          >
            NEW
          </Tag>
        );
      },
    },
    {
      title: "Notification",
      key: "notification_content",
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: "100%" }}>
          <Text
            style={{
              color: record.isRead ? "rgba(244, 255, 251, 0.7)" : "#69f8dd",
              fontWeight: record.isRead ? "600" : "800",
              fontSize: "15px",
            }}
          >
            {record.title}
          </Text>
          <Paragraph
            style={{
              color: "rgba(226, 241, 236, 0.85)",
              margin: 0,
              fontSize: "13.5px",
            }}
          >
            {record.content}
          </Paragraph>
        </Space>
      ),
    },
    {
      title: "Received At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => (
        <Text style={{ color: "rgba(244, 255, 251, 0.5)" }}>
          {date ? dayjs.utc(date).format("YYYY-MM-DD HH:mm:ss") : "N/A"}
        </Text>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) =>
        !record.isRead && (
          <Button
            type="text"
            icon={<MailOutlined />}
            onClick={() => handleReadOne(record._id)}
            style={{
              color: "#69f8dd",
              fontWeight: "600",
              padding: 0,
            }}
          >
            Read
          </Button>
        ),
    },
  ];

  return (
    <main className="notifications-page">
      <style>{`
        .notifications-page {
          min-height: 100vh;
          background: #002d28;
          color: #f4fffb;
          padding: 50px 24px;
          font-family: Inter, sans-serif;
        }
        .notifications-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .notifications-header {
          margin-bottom: 40px;
        }
        .notifications-header h1.ant-typography {
          color: #69f8dd;
          margin: 0 0 12px 0;
          font-weight: 950;
          font-size: clamp(32px, 5vw, 46px);
          letter-spacing: -0.5px;
        }
        .notifications-header p.ant-typography {
          color: #e2f1ec;
          font-size: 18px;
          line-height: 1.6;
          margin: 0;
          max-width: 800px;
        }
        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 16px;
        }

        .notifications-table-card {
          background: rgba(0, 68, 60, 0.4) !important;
          border: 2px solid rgba(105, 248, 221, 0.15) !important;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .ant-table {
          background: transparent !important;
          color: #ffffff !important;
        }
        .ant-table-thead > tr > th {
          background: rgba(0, 32, 28, 0.8) !important;
          color: #69f8dd !important;
          font-weight: 800 !important;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
          border-bottom: 2px solid rgba(105, 248, 221, 0.15) !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(105, 248, 221, 0.08) !important;
          padding: 16px 16px !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: rgba(105, 248, 221, 0.05) !important;
        }

        .ant-pagination-item {
          background: rgba(0, 32, 28, 0.6) !important;
          border-color: rgba(105, 248, 221, 0.2) !important;
        }
        .ant-pagination-item a {
          color: rgba(244, 255, 251, 0.6) !important;
        }
        .ant-pagination-item-active {
          border-color: #69f8dd !important;
          background: #69f8dd !important;
        }
        .ant-pagination-item-active a {
          color: #062724 !important;
          font-weight: 700;
        }
        .ant-pagination-prev .ant-pagination-item-link, 
        .ant-pagination-next .ant-pagination-item-link {
          background: rgba(0, 32, 28, 0.6) !important;
          color: #69f8dd !important;
          border-color: rgba(105, 248, 221, 0.2) !important;
        }

        .notifications-loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }
        .ant-empty-description {
          color: #a3c2ba !important;
          font-size: 16px;
        }
      `}</style>

      <div className="notifications-container">
        <header className="notifications-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/home")}
            style={{
              color: "#69f8dd",
              padding: 0,
              marginBottom: "16px",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "700",
            }}
          >
            Back to Home
          </Button>
          <div className="header-actions">
            <div>
              <Title level={1}>Notifications</Title>
              <Paragraph style={{ color: "#cdf5ee", fontSize: "20px" }}>
                Stay updated with your latest activities, contracts, race
                results, and platform announcements.
              </Paragraph>
            </div>
            {notifications.some((n) => !n.isRead) && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleReadAll}
                style={{
                  background: "#69f8dd",
                  color: "#002d28",
                  border: "none",
                  fontWeight: "700",
                  height: "40px",
                  borderRadius: "6px",
                }}
              >
                Mark All as Read
              </Button>
            )}
          </div>
        </header>

        {isLoading ? (
          <div className="notifications-loading-container">
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="notifications-table-card">
            <Empty description="No notifications found" />
          </Card>
        ) : (
          <Card className="notifications-table-card">
            <Table
              dataSource={notifications}
              columns={columns}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => (
                  <span style={{ color: "#a3c2ba" }}>
                    Showing {range[0]}-{range[1]} of {total} notifications
                  </span>
                ),
              }}
            />
          </Card>
        )}
      </div>
    </main>
  );
}
