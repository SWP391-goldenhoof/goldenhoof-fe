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
} from "antd";
import {
  ArrowLeftOutlined,
  FallOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getMyPointsHistory } from "../../api/services/pointsTransaction.service";

dayjs.extend(utc);

const { Text, Title, Paragraph } = Typography;

export default function PointsTransactionHistory() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistoryData() {
    setIsLoading(true);
    try {
      const data = await getMyPointsHistory();
      setHistoryItems(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(
        error?.message || "Failed to load points transaction history",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistoryData();
  }, []);

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
      width: 120,
      render: (type) => {
        if (type === "EARN" || type === "REFUND") {
          return (
            <Tag
              icon={<RiseOutlined />}
              color="emerald"
              style={{
                fontSize: "13px",
                padding: "4px 10px",
                fontWeight: "700",
                background: "rgba(105, 248, 221, 0.15)",
                border: "1px solid #69f8dd",
                color: "#69f8dd",
              }}
            >
              {type}
            </Tag>
          );
        }
        return (
          <Tag
            icon={<FallOutlined />}
            style={{
              fontSize: "13px",
              padding: "4px 10px",
              fontWeight: "700",
              background: "rgba(255, 77, 79, 0.15)",
              border: "1px solid #ff4d4f",
              color: "#ff4d4f",
            }}
          >
            {type}
          </Tag>
        );
      },
    },
    {
      title: "Amount",
      key: "amount",
      width: 140,
      render: (_, record) => {
        const isPositive = record.type === "EARN" || record.type === "REFUND";
        return (
          <Text
            style={{
              color: isPositive ? "#69f8dd" : "#ff4d4f",
              fontWeight: "900",
              fontSize: "16px",
            }}
          >
            {isPositive ? "+" : "-"}
            {record.amount?.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: "Balance After",
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      width: 150,
      render: (balance) => (
        <Text style={{ color: "#dbf080", fontWeight: "700" }}>
          {balance?.toLocaleString()} POINTS
        </Text>
      ),
    },
    {
      title: "Description / Reason",
      dataIndex: "reason",
      key: "reason",
      render: (reason) => (
        <Text style={{ color: "#e2f1ec", fontWeight: "500" }}>{reason}</Text>
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
    <main className="points-history-page">
      <style>{`
        .points-history-page {
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
        .history-header {
          margin-bottom: 40px;
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

        /* Custom Table Styling matching Vault Theme */
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

        /* Pagination custom theme */
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
        <header className="history-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/profile")}
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
            Back to Profile
          </Button>
          <Title level={1}>Points Transaction History</Title>
          <Paragraph style={{ color: "#cdf5ee", fontSize: "20px" }}>
            Review your complete points statement history, including gains from
            milestone rewards and expenditures inside the items shop.
          </Paragraph>
        </header>

        {isLoading ? (
          <div className="history-loading-container">
            <Spin size="large" />
          </div>
        ) : historyItems.length === 0 ? (
          <Card className="history-table-card">
            <Empty description="No point transactions recorded yet" />
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
