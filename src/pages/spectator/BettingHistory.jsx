import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getMyBets, updateBet } from "../../api/services/bet.service";
import { getRaceById } from "../../api/services/race.service";
import { getHorses } from "../../api/services/horse.service";

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

function formatDate(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY HH:mm:ss") : value;
}

function normalizeBet(item, index) {
  if (!item) return null;
  const id = pick(item, ["id", "_id"], `bet-${index}`);
  return {
    key: id,
    id,
    spectatorId: pick(item, ["spectatorId"], "N/A"),
    spectatorName: pick(item, ["spectatorName"], "N/A"),
    raceId: pick(item, ["raceId"], "N/A"),
    raceName: pick(item, ["raceName"], "N/A"),
    horseId: pick(item, ["horseId"], "N/A"),
    horseName: pick(item, ["horseName"], "N/A"),
    horseWinRateAtBet: item?.horseWinRateAtBet ?? 0,
    bettorsOnHorseAtBet: item?.bettorsOnHorseAtBet ?? 0,
    totalBettorsAtBet: item?.totalBettorsAtBet ?? 0,
    finalOdds: item?.finalOdds ?? 0,
    pointsWagered: item?.pointsWagered ?? 0,
    pointsWon: item?.pointsWon ?? 0,
    result: pick(item, ["result"], "PENDING"),
    placedAt: pick(item, ["placedAt"], ""),
    isInsuranceCardUsed: item?.isInsuranceCardUsed ?? false,
  };
}

function statusColor(status) {
  const normalizedStatus = String(status).toUpperCase();
  if (normalizedStatus === "WIN") return "green";
  if (normalizedStatus === "LOSE") return "red";
  if (normalizedStatus === "REFUNDED") return "blue";
  return "orange";
}

function getId(item) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item._id || item.id || item.horseId || item.raceId || "";
}

function getHorseName(horse) {
  return horse?.name || horse?.horseName || "";
}

export default function BettingHistory() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [bets, setBets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const [editingBet, setEditingBet] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalHorseOptions, setModalHorseOptions] = useState([]);
  const [isLoadingModalHorses, setIsLoadingModalHorses] = useState(false);
  const [horsesById, setHorsesById] = useState(new Map());

  useEffect(() => {
    if (!editingBet) return;

    form.setFieldsValue({
      horseId: editingBet.horseId ? String(editingBet.horseId) : undefined,
      pointsWagered: editingBet.pointsWagered,
      isInsuranceCardUsed: editingBet.isInsuranceCardUsed || false,
    });
  }, [editingBet, form]);

  async function loadMyBets(result = selectedStatus) {
    setIsLoading(true);

    try {
      const params = {};

      if (result) {
        params.result = result;
      }

      const response = await getMyBets(params);

      const normalized = resolveList(response).map(normalizeBet);

      normalized.sort(
        (a, b) => new Date(b.placedAt) - new Date(a.placedAt),
      );

      setBets(normalized);
    } catch (error) {
      messageApi.error(
        error?.message || "Failed to load your betting history.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function initData() {
    try {
      const response = await getHorses();
      const rawHorses = resolveList(response);
      console.log("RESOLVED HORSES:", rawHorses);

      const horseMap = new Map(
        rawHorses
          .map((horse) => [String(getId(horse)), getHorseName(horse)])
          .filter(([id]) => id),
      );

      setHorsesById(horseMap);
    } catch (err) {
      console.error("Error loading horses map:", err);
    }
    await loadMyBets();
  }

  useEffect(() => {
    loadMyBets(selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    initData();
  }, []);

  async function openEditModal(record) {
    setEditingBet(record);
    setModalHorseOptions([]);
    setIsLoadingModalHorses(true);

    try {
      const race = await getRaceById(record.raceId);
      const participants = race?.participants || race?.horses || [];

      const options = participants
        .map((p) => {
          const pHorseId = String(
            getId(p?.horse || p?.horseInfo || p?.horseId || p),
          );
          const nameFromMap = horsesById.get(pHorseId);
          const pLabel =
            p?.horseName || p?.name || nameFromMap || `Horse ID: ${pHorseId}`;

          return pHorseId && pLabel ? { value: pHorseId, label: pLabel } : null;
        })
        .filter(Boolean);

      setModalHorseOptions(
        Array.from(
          new Map(options.map((option) => [option.value, option])).values(),
        ),
      );
    } catch (error) {
      messageApi.error(
        error?.message || "Unable to load horses for this race.",
      );
    } finally {
      setIsLoadingModalHorses(false);
    }
  }

  async function handleUpdateSubmit(values) {
    if (!editingBet) return;
    setIsUpdating(true);

    try {
      await updateBet(editingBet.id, {
        horseId: values.horseId,
        pointsWagered: values.pointsWagered,
        useInsuranceCard: values.isInsuranceCardUsed,
      });

      messageApi.success("Bet updated successfully");
      setEditingBet(null);
      form.resetFields();
      await loadMyBets(selectedStatus);
    } catch (error) {
      messageApi.error(error?.message || "Unable to update bet.");
    } finally {
      setIsUpdating(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "Bet ID",
        dataIndex: "id",
        fixed: "left",
        width: 140,
        ellipsis: true,
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
        title: "Placed At",
        dataIndex: "placedAt",
        width: 180,
        render: formatDate,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right",
        width: 120,
        render: (_, record) => {
          const isPending = String(record.result).toUpperCase() === "PENDING";
          return (
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EditOutlined />}
              disabled={!isPending}
              onClick={() => openEditModal(record)}
            >
              Edit
            </Button>
          );
        },
      },
    ],
    [horsesById],
  );

  return (
    <main
      className="betting-history-container"
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background:
          "radial-gradient(circle at top left, #e2fff8, transparent 34%), #f4fbf9",
      }}
    >
      {contextHolder}
      <style>{`
        .history-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 22px;
        }

        .history-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #06332e;
          font-size: 20px;
          font-weight: 950;
          text-decoration: none;
        }

        .history-brand img {
          width: 42px;
          height: 42px;
          object-fit: contain;
        }

        .history-home-btn.ant-btn {
          min-height: 40px;
          border: 1px solid rgba(8, 122, 109, 0.3);
          border-radius: 8px;
          color: #06332e;
          background: #69f8dd;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 8px 20px rgba(8, 122, 109, 0.12);
        }

        .history-home-btn.ant-btn:hover {
          border-color: #087a6d !important;
          color: #06332e !important;
          background: #75ffe6 !important;
          transform: translateY(-1px);
        }

        .history-title-section {
          margin-bottom: 22px;
        }

        .history-title-section h1.ant-typography {
          margin: 4px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: 0;
        }

        .history-filter-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .history-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .history-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .history-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
          background: #fff;
        }

        @media (max-width: 768px) {
          .history-filter-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>

      <div style={{ width: "min(1200px, 100%)", margin: "0 auto" }}>
        <div className="history-topbar">
          <Link className="history-brand" to="/home">
            <img src="/goldenhoof-logo.png" alt="" />
            <span>GoldenHoof</span>
          </Link>
          <Button
            className="history-home-btn"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/spectator/bets")}
          >
            Back to Bet
          </Button>
        </div>

        <div className="history-title-section">
          <Text style={{ color: "#087a6d", fontWeight: 900 }}>
            SPECTATOR DASHBOARD
          </Text>
          <Title level={1}>My Betting History</Title>
        </div>

        <div className="history-filter-actions">
          <Select
            placeholder="Filter by result"
            allowClear
            style={{ width: 180 }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Select.Option value="PENDING">PENDING</Select.Option>
            <Select.Option value="WIN">WIN</Select.Option>
            <Select.Option value="LOSE">LOSE</Select.Option>
            <Select.Option value="REFUNDED">REFUNDED</Select.Option>
          </Select>

          <Button
            type="default"
            style={{ fontWeight: 700 }}
            onClick={() => loadMyBets(selectedStatus)}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>

        <div className="history-card">
          <Table
            className="history-table"
            columns={columns}
            dataSource={bets}
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} bet requests`,
            }}
            scroll={{ x: 1100 }}
          />
        </div>
      </div>

      <Modal
        title="Edit Your Bet Request"
        open={Boolean(editingBet)}
        onCancel={() => {
          setEditingBet(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={500}
      >
        {editingBet && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateSubmit}
            requiredMark={false}
            style={{ marginTop: 20 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Race: </Text>
              <Text strong>{editingBet.raceName}</Text>
            </div>

            <Form.Item
              label="Select New Horse"
              name="horseId"
              rules={[{ required: true, message: "Please select a horse" }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={modalHorseOptions}
                loading={isLoadingModalHorses}
                placeholder="Choose horse"
              />
            </Form.Item>

            <Form.Item
              label="Points Wagered"
              name="pointsWagered"
              rules={[
                { required: true, message: "Please enter your wager" },
                {
                  type: "number",
                  min: 50,
                  message: "Wager must be at least 50 points",
                },
              ]}
            >
              <InputNumber
                min={50}
                precision={0}
                addonAfter="points"
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item
              name="isInsuranceCardUsed"
              valuePropName="checked" // Cần thiết đối với Checkbox hoặc Switch trong Antd Form
            >
              <Checkbox>Use items/cards for this bet</Checkbox>
            </Form.Item>

            <div style={{ margin: "-8px 0 20px" }}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 8 }}
              >
                Quick options
              </Text>
              <Space wrap>
                {[50, 100, 200, 500, 1000].map((points) => (
                  <Button
                    key={points}
                    size="small"
                    onClick={() => form.setFieldValue("pointsWagered", points)}
                  >
                    {points.toLocaleString("vi-VN")}
                  </Button>
                ))}
              </Space>
            </div>

            <Space style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setEditingBet(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdating}
                style={{
                  background: "#087a6d",
                  borderColor: "#087a6d",
                  fontWeight: 700,
                }}
              >
                Update Bet
              </Button>
            </Space>
          </Form>
        )}
      </Modal>
    </main>
  );
}
