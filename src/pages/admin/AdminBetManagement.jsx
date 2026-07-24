import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
  Descriptions,
} from "antd";
import "antd/dist/reset.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { getAllBets, getBetDetail } from "../../api/services/bet.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const { Text, Title } = Typography;

function pick(source, keys, fallback = "") {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }
  return fallback;
}

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

// function formatDate(value) {
//   if (!value) return "N/A";
//   if (typeof value === "string" && value.includes("/")) {
//     return value;
//   }
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;

//   return new Intl.DateTimeFormat("en-GB", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   }).format(date);
// }

function formatDate(value) {
  if (!value) return "N/A";
  if (typeof value === "string" && value.includes("/")) {
    return value;
  }

  // Sử dụng dayjs với plugin utc để tránh tự động convert sang múi giờ địa phương
  const d = dayjs.utc(value);
  if (!d.isValid()) return value;

  return d.format("DD/MM/YYYY HH:mm:ss");
}

function getTimeValue(value) {
  if (!value) return 0;
  if (typeof value === "string" && value.includes("/")) {
    const parsedDate = dayjs(value, "DD/MM/YYYY", true);
    return parsedDate.isValid() ? parsedDate.valueOf() : 0;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getObjectIdTime(value) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    return 0;
  }
  return parseInt(value.slice(0, 8), 16) * 1000;
}

function sortNewestRequestFirst(a, b) {
  const aTime = Math.max(getTimeValue(a.placedAt), getObjectIdTime(a.id));
  const bTime = Math.max(getTimeValue(b.placedAt), getObjectIdTime(b.id));
  return bTime - aTime;
}

function normalizeBet(item, index) {
  if (!item) return null;

  return {
    key: item._id || item.id || `bet-${index}`,
    id: item._id || item.id || `bet-${index}`,

    spectatorId: item.spectatorId ?? "N/A",
    spectatorName: item.spectatorName ?? "N/A",

    raceId: item.raceId ?? "N/A",
    raceName: item.raceName ?? "N/A",

    horseId: item.horseId ?? "N/A",
    horseName: item.horseName ?? "N/A",

    horseWinRateAtBet: item.horseWinRateAtBet ?? 0,
    bettorsOnHorseAtBet: item.bettorsOnHorseAtBet ?? 0,
    totalBettorsAtBet: item.totalBettorsAtBet ?? 0,
    finalOdds: item.finalOdds ?? 0,
    pointsWagered: item.pointsWagered ?? 0,
    pointsWon: item.pointsWon ?? 0,
    result: item.result ?? "PENDING",
    placedAt: item.placedAt ?? "",
    isInsuranceCardUsed: Boolean(item.isInsuranceCardUsed),
  };
}

function statusColor(status) {
  const normalizedStatus = String(status).toUpperCase();
  if (normalizedStatus === "WIN") return "green";
  if (normalizedStatus === "LOST" || normalizedStatus === "LOSE") return "red";
  return "orange";
}

export default function AdminBetManagement() {
  const [bets, setBets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadBets({ result = selectedStatus } = {}) {
    setIsLoading(true);
    try {
      const response = await getAllBets({ result });
      setBets(
        resolveList(response).map(normalizeBet).sort(sortNewestRequestFirst),
      );
    } catch (error) {
      message.error(
        error?.message || "Failed to load system bet requests list",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBets();
  }, []);

  const filteredBets = useMemo(() => bets, [bets]);

  async function openDetailModal(id) {
    setActiveId(id);
    setIsDetailLoading(true);

    try {
      const bet = await getBetDetail(id);

      setDetailData(normalizeBet(bet, 0));
    } catch (error) {
      message.error(error?.message || "Không thể tải thông tin chi tiết");
    } finally {
      setIsDetailLoading(false);
      setActiveId(null);
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "Spectator Name",
        dataIndex: "spectatorName",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 180,
        ellipsis: true,
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: "Race Name",
        dataIndex: "raceName",
        width: 220,
        ellipsis: true,
      },
      {
        title: "Horse Name",
        dataIndex: "horseName",
        width: 160,
        ellipsis: true,
      },
      {
        title: "Wagered",
        dataIndex: "pointsWagered",
        width: 130,
        render: (val) => <Text strong>{val?.toLocaleString("vi-VN")} pts</Text>,
      },
      {
        title: "Odds",
        dataIndex: "finalOdds",
        width: 100,
        render: (val) => <Text>x{val}</Text>,
      },
      {
        title: "Points Won",
        dataIndex: "pointsWon",
        width: 130,
        render: (val, record) => (
          <Text
            strong
            style={{ color: record.result === "WIN" ? "#52c41a" : "inherit" }}
          >
            {val > 0 ? `+${val.toLocaleString("vi-VN")}` : val} pts
          </Text>
        ),
      },
      {
        title: "Result",
        dataIndex: "result",
        width: 130,
        render: (result) => <Tag color={statusColor(result)}>{result}</Tag>,
      },
      {
        title: "Insurance",
        dataIndex: "isInsuranceCardUsed",
        width: 120,
        render: (value) => (
          <Tag color={value ? "blue" : "default"}>
            {value ? "Used" : "No"}
          </Tag>
        ),
      },
      {
        title: "Placed At",
        dataIndex: "placedAt",
        width: 180,
        render: formatDate,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 120,
        render: (_, record) => (
          <Button
            className="bet-management-link-btn"
            size="small"
            ghost
            onClick={() => openDetailModal(record.id)}
            loading={isDetailLoading && activeId === record.id}
          >
            Details
          </Button>
        ),
      },
    ],
    [isDetailLoading, activeId, shouldFixColumns],
  );

  return (
    <section className="bet-management">
      <style>{`
        .bet-management {
          padding: 0;
        }

        .bet-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .bet-management-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          width: auto;
        }

        .bet-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .bet-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: 0;
        }

        .bet-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .bet-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .bet-management-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
          background: #fff;
        }

        .bet-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
          background: #fff;
        }

        .bet-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }

        .bet-management-refresh.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        .bet-management-refresh.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }

        .bet-management-modal .ant-modal-content {
          border-radius: 8px;
        }

        @media (max-width: 920px) {
          .bet-management-header {
            align-items: flex-start;
            flex-direction: column;
          }
          
          .bet-management-actions {
            width: 100%;
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="bet-management-header">
        <div>
          <div className="bet-management-kicker">Admin dashboard</div>
          <Title level={1}>Bet Management</Title>
        </div>
        <div className="bet-management-actions">
          <Select
            placeholder="Result"
            allowClear
            value={selectedStatus}
            style={{ width: 180 }}
            onChange={(val) => {
              const nextResult = val || null;
              setSelectedStatus(nextResult);
              loadBets({ result: nextResult });
            }}
            onClear={() => {
              setSelectedStatus(null);
              loadBets({ result: "" });
            }}
          >
            <Select.Option value="PENDING">PENDING</Select.Option>
            <Select.Option value="WIN">WIN</Select.Option>
            <Select.Option value="LOSE">LOSE</Select.Option>
            <Select.Option value="REFUNDED">REFUNDED</Select.Option>
          </Select>

          <Button
            className="bet-management-refresh"
            onClick={() => loadBets()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="bet-management-card">
        <Table
          className="bet-management-table"
          columns={columns}
          dataSource={filteredBets}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} bets`,
          }}
          scroll={{ x: 1500 }}
        />
      </div>

      <Modal
        className="bet-management-modal"
        title="System Bet Request Details"
        open={Boolean(detailData)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setDetailData(null)}
          >
            Close
          </Button>,
        ]}
        onCancel={() => setDetailData(null)}
        width={650}
      >
        {detailData && (
          <Descriptions
            column={1}
            bordered
            size="small"
            style={{ marginTop: 15 }}
          >
            <Descriptions.Item label="Bet ID">
              {detailData.id}
            </Descriptions.Item>
            <Descriptions.Item label="Spectator ID">
              {detailData.spectatorId}
            </Descriptions.Item>
            <Descriptions.Item label="Spectator Name">
              <Text strong>{detailData.spectatorName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Race ID">
              {detailData.raceId}
            </Descriptions.Item>
            <Descriptions.Item label="Race Name">
              {detailData.raceName}
            </Descriptions.Item>
            <Descriptions.Item label="Horse ID">
              {detailData.horseId}
            </Descriptions.Item>
            <Descriptions.Item label="Horse Name">
              {detailData.horseName}
            </Descriptions.Item>
            <Descriptions.Item label="Horse Win Rate">
              {detailData.horseWinRateAtBet}%
            </Descriptions.Item>
            <Descriptions.Item label="Bettors on Horse">
              {detailData.bettorsOnHorseAtBet} pool(s)
            </Descriptions.Item>
            <Descriptions.Item label="Total Pool Bettors">
              {detailData.totalBettorsAtBet} pool(s)
            </Descriptions.Item>
            <Descriptions.Item label="Final System Odds">
              x{detailData.finalOdds}
            </Descriptions.Item>
            <Descriptions.Item label="Wagered Points">
              {detailData.pointsWagered?.toLocaleString("vi-VN")} pts
            </Descriptions.Item>
            <Descriptions.Item label="Total Return (Won)">
              {detailData.pointsWon?.toLocaleString("vi-VN")} pts
            </Descriptions.Item>
            <Descriptions.Item label="Race Result">
              <Tag color={statusColor(detailData.result)}>
                {detailData.result}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Insurance Card">
              {detailData.isInsuranceCardUsed ? "Used" : "No"}
            </Descriptions.Item>
            <Descriptions.Item label="Placed At">
              {formatDate(detailData.placedAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </section>
  );
}
