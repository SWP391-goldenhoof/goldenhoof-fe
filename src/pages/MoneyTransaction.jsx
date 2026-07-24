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
  FallOutlined,
  RiseOutlined,
  WalletOutlined, // Import icon ví tiền
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getMyMoneyHistory } from "../api/services/moneyTransaction.service";

dayjs.extend(utc);

const { Text, Title, Paragraph } = Typography;

export const TransactionTypeEnum = {
  ENTRY_FEE: "Entry_fee",
  PRIZE_PAYOUT: "Prize_payout",
  DEPOSIT: "Deposit",
  WITHDRAWAL: "Withdrawal",
  REFUND: "Refund",
  PENALTY: "Penalty",
  HOLD_BALANCE: "Hold_balance",
};

export default function MoneyTransactionHistory() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistoryData() {
    setIsLoading(true);
    try {
      const data = await getMyMoneyHistory();
      setHistoryItems(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(
        error?.message || "Failed to load money transaction history",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistoryData();
  }, []);

  const TRANSACTION_TYPE_CONFIG = {
    [TransactionTypeEnum.DEPOSIT]: {
      label: "Deposit",
      isInflow: true,
      color: "#69f8dd",
      bg: "rgba(105, 248, 221, 0.15)",
    },
    [TransactionTypeEnum.PRIZE_PAYOUT]: {
      label: "Prize Payout",
      isInflow: true,
      color: "#69f8dd",
      bg: "rgba(105, 248, 221, 0.15)",
    },
    [TransactionTypeEnum.REFUND]: {
      label: "Refund",
      isInflow: true,
      color: "#69f8dd",
      bg: "rgba(105, 248, 221, 0.15)",
    },
    [TransactionTypeEnum.ENTRY_FEE]: {
      label: "Entry Fee",
      isInflow: false,
      color: "#ff4d4f",
      bg: "rgba(255, 77, 79, 0.15)",
    },
    [TransactionTypeEnum.WITHDRAWAL]: {
      label: "Withdrawal",
      isInflow: false,
      color: "#ff4d4f",
      bg: "rgba(255, 77, 79, 0.15)",
    },
    [TransactionTypeEnum.PENALTY]: {
      label: "Penalty",
      isInflow: false,
      color: "#ff4d4f",
      bg: "rgba(255, 77, 79, 0.15)",
    },
    [TransactionTypeEnum.HOLD_BALANCE]: {
      label: "Hold Balance",
      status: "hold",
      color: "#ffb936", // Cập nhật màu vàng hệ thống
      bg: "rgba(255, 185, 54, 0.15)", // Background vàng mờ tương ứng
    },
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "_id",
      key: "_id",
      width: 140,
      render: (id) => (
        <Text
          style={{
            color: "rgba(244, 255, 251, 0.65)",
            fontFamily: "monospace",
          }}
        >
          {id ? id : "N/A"}
        </Text>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type) => {
        const config = TRANSACTION_TYPE_CONFIG[type] || {
          label: type,
          isInflow: false,
          color: "#e2f1ec",
          bg: "rgba(226, 241, 236, 0.15)",
        };

        return (
          <Tag
            icon={config.isInflow ? <RiseOutlined /> : <FallOutlined />}
            style={{
              fontSize: "13px",
              padding: "4px 10px",
              fontWeight: "700",
              background: config.bg,
              border: `1px solid ${config.color}`,
              color: config.color,
            }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "Amount",
      key: "amount",
      width: 140,
      render: (_, record) => {
        const isPositive =
          record.type === "Deposit" ||
          record.type === "Prize_payout" ||
          record.type === "Refund";
        return (
          <Text
            style={{
              color: isPositive ? "#69f8dd" : "#ff4d4f",
              fontWeight: "900",
              fontSize: "16px",
            }}
          >
            {isPositive ? "+" : "-"}
            {record.amount?.toLocaleString()} đ
          </Text>
        );
      },
    },
    {
      title: "Partner",
      key: "partner",
      width: 180,
      render: (_, record) => (
        <Text style={{ color: "#dbf080", fontWeight: "700" }}>
          {record.receiverName || record.senderName || "N/A"}
        </Text>
      ),
    },
    {
      title: "Description / Content",
      dataIndex: "content",
      key: "content",
      render: (content) => (
        <Text style={{ color: "#e2f1ec", fontWeight: "500" }}>{content}</Text>
      ),
    },
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => (
        <Text style={{ color: "rgba(244, 255, 251, 0.5)" }}>
          {date ? dayjs.utc(date).format("YYYY-MM-DD HH:mm:ss") : "N/A"}
        </Text>
      ),
    },
  ];

  return (
    <main className="money-history-page">
      <style>{`
        .money-history-page {
          min-height: 100vh;
          background: #002d28;
          color: #f4fffb;
          padding: 50px 24px;
          font-family: Inter, sans-serif;
        }
        .history-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .history-header-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 40px;
        }
        .history-header {
          flex: 1;
          min-width: 300px;
        }
        .history-header h1.ant-typography {
          color: #69f8dd;
          margin: 0 0 12px 0;
          font-weight: 950;
          font-size: clamp(32px, 5vw, 46px);
          letter-spacing: -0.5px;
        }
        .history-header p.ant-typography {
          color: #e2f1ec;
          font-size: 18px;
          line-height: 1.6;
          margin: 0;
          max-width: 800px;
        }

        .action-section-wrapper {
          display: flex;
          align-items: flex-end;
          padding-top: 40px;
        }
        @media (max-width: 768px) {
          .action-section-wrapper {
            align-items: flex-start;
            width: 100%;
            padding-top: 0;
          }
        }

        .btn-wallet-link {
          background: rgba(105, 248, 221, 0.1) !important;
          border: 1px solid rgba(105, 248, 221, 0.4) !important;
          color: #69f8dd !important;
          font-weight: 700 !important;
          border-radius: 8px !important;
          height: 38px !important;
        }
        .btn-wallet-link:hover {
          background: rgba(105, 248, 221, 0.2) !important;
          border-color: #69f8dd !important;
        }

        .history-table-card {
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

        .history-loading-container {
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

      <div className="history-container">
        <div className="history-header-wrapper">
          <header className="history-header">
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
              onMouseEnter={(e) => (e.currentTarget.style.color = "#86ffea")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#69f8dd")}
            >
              Back to Home
            </Button>
            <Title level={1}>Money Transaction History</Title>
            <Paragraph style={{ color: "#cdf5ee", fontSize: "20px" }}>
              Review your financial history, including funds deposits, payouts,
              entry fees, and balance adjustments within the platform.
            </Paragraph>
          </header>

          {/* Cụm nút chức năng bên phải header */}
          <div className="action-section-wrapper">
            <Button
              type="default"
              icon={<WalletOutlined />}
              className="btn-wallet-link"
              onClick={() => navigate("/wallet")}
            >
              Back to Wallet
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="history-loading-container">
            <Spin size="large" />
          </div>
        ) : historyItems.length === 0 ? (
          <Card className="history-table-card">
            <Empty description="No transactions recorded yet" />
          </Card>
        ) : (
          <Card className="history-table-card">
            <Table
              dataSource={historyItems}
              columns={columns}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => (
                  <span style={{ color: "#a3c2ba" }}>
                    Showing {range[0]}-{range[1]} of {total} transactions
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
