import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import "antd/dist/reset.css";
import { useSearchParams } from "react-router-dom";
import { distributeRacePrize } from "../../api/services/prize-distribution.service";
import {
  createPrize,
  getPrizesByTournament,
} from "../../api/services/prize.service";
import { getRacesByTournament } from "../../api/services/race.service";
import { getTournaments } from "../../api/services/tournament.service";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const { Title, Text } = Typography;

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.races)) return response.races;
  if (
    response &&
    typeof response === "object" &&
    (response._id || response.id)
  ) {
    return [response];
  }
  return [];
}

function getId(item, fallback) {
  return item?._id || item?.id || fallback;
}

// function formatDateTime(value) {
//   if (!value) return "N/A";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;

//   return new Intl.DateTimeFormat("vi-VN", {
//     dateStyle: "short",
//     timeStyle: "short",
//   }).format(date);
// }

function formatDateTime(value) {
  if (!value) return "N/A";

  const d = dayjs(value);
  if (!d.isValid()) return value;

  // Sử dụng định dạng giữ nguyên hiển thị theo chuỗi ISO gốc hoặc format thủ công
  // Để hiển thị dạng DD/MM/YYYY HH:mm đúng chuẩn vi-VN mà không bị lệch múi giờ:
  return dayjs.utc(value).format("DD/MM/YYYY HH:mm");
}

function formatMoney(value) {
  if (value === undefined || value === null) return "N/A";
  return `${Number(value).toLocaleString("vi-VN")} VND`;
}

function statusColor(status) {
  switch (status) {
    case "Scheduled":
      return "blue";
    case "Ready":
      return "green";
    case "Simulated":
      return "purple";
    case "Ongoing":
      return "gold";
    case "Finished":
      return "cyan";
    case "Cancelled":
      return "red";
    default:
      return "default";
  }
}

function Prize() {
  const [searchParams] = useSearchParams();
  const [prizeForm] = Form.useForm();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState();
  const [finalRaces, setFinalRaces] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrizeLoading, setIsPrizeLoading] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [isPrizeSaving, setIsPrizeSaving] = useState(false);
  const [distributingRaceId, setDistributingRaceId] = useState("");

  async function loadFinalRaces(tournamentId) {
    if (!tournamentId) {
      setFinalRaces([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await getRacesByTournament(tournamentId);
      const races = resolveList(response)
        .filter((race) => Number(race?.roundNumber) === 2)
        .map((race, index) => ({
          ...race,
          key: getId(race, `final-race-${index}`),
          id: getId(race, ""),
          participantCount:
            race?.filledSlots ?? race?.participants?.length ?? 0,
        }));

      setFinalRaces(races);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load final races",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPrizes(tournamentId) {
    if (!tournamentId) {
      setPrizes([]);
      return;
    }

    setIsPrizeLoading(true);

    try {
      const response = await getPrizesByTournament(tournamentId);
      const nextPrizes = resolveList(response).map((prize, index) => ({
        ...prize,
        key: getId(prize, `prize-${index}`),
      }));

      setPrizes(nextPrizes);
    } catch {
      setPrizes([]);
    } finally {
      setIsPrizeLoading(false);
    }
  }

  async function loadTournaments() {
    setIsLoading(true);

    try {
      const response = await getTournaments();
      const options = resolveList(response).map((tournament, index) => ({
        label:
          tournament?.title || tournament?.name || `Tournament ${index + 1}`,
        value: getId(tournament, `tournament-${index}`),
      }));

      setTournaments(options);

      if (options.length > 0) {
        const requestedTournamentId = searchParams.get("tournamentId");
        const initialTournamentId = options.some(
          (option) => option.value === requestedTournamentId,
        )
          ? requestedTournamentId
          : options[0].value;

        setSelectedTournamentId(initialTournamentId);
        await Promise.all([
          loadFinalRaces(initialTournamentId),
          loadPrizes(initialTournamentId),
        ]);
      }
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load tournaments",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  async function handleDistribute(record) {
    setDistributingRaceId(record.id);

    try {
      const response = await distributeRacePrize(record.id);
      message.success(response?.message || "Prize distributed successfully");
      await loadFinalRaces(selectedTournamentId);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to distribute prize",
      );
    } finally {
      setDistributingRaceId("");
    }
  }

  function openCreatePrizeModal() {
    if (!selectedTournamentId) {
      message.warning("Please select a tournament first");
      return;
    }

    prizeForm.resetFields();
    setIsPrizeModalOpen(true);
  }

  async function handleCreatePrize() {
    const values = await prizeForm.validateFields();
    setIsPrizeSaving(true);

    try {
      const response = await createPrize({
        tournamentId: selectedTournamentId,
        name: values.name.trim(),
        amount: values.amount,
      });

      message.success(response?.message || "Prize created successfully");
      setIsPrizeModalOpen(false);
      prizeForm.resetFields();
      await loadPrizes(selectedTournamentId);
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create prize",
      );
    } finally {
      setIsPrizeSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "Final Race",
        dataIndex: "name",
        render: (value) => <Text strong>{value || "N/A"}</Text>,
      },
      {
        title: "Start Time",
        dataIndex: "startTime",
        width: 190,
        render: formatDateTime,
      },
      {
        title: "Participants",
        dataIndex: "participantCount",
        width: 130,
      },
      {
        title: "Readiness",
        key: "readiness",
        width: 180,
        render: (_, record) => {
          if (prizes.length === 0) {
            return <Tag color="red">Prize required</Tag>;
          }

          if (record.status !== "Finished") {
            return <Tag color="gold">Waiting for result</Tag>;
          }

          return <Tag color="green">Ready to distribute</Tag>;
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 190,
        render: (_, record) => {
          const isReady = prizes.length > 0 && record.status === "Finished";

          if (!isReady) {
            const reason =
              prizes.length === 0
                ? "Create a tournament prize first"
                : "Wait until the final race is Finished";

            return (
              <Tooltip title={reason}>
                <span>
                  <Button disabled>
                    Distribute
                  </Button>
                </span>
              </Tooltip>
            );
          }

          return (
            <Popconfirm
              title="Distribute tournament prize?"
              description="The prize will be sent to the winner with final rank 1."
              okText="Distribute"
              cancelText="Cancel"
              onConfirm={() => handleDistribute(record)}
            >
              <Button
                className="prize-primary"
                loading={distributingRaceId === record.id}
              >
                Distribute
              </Button>
            </Popconfirm>
          );
        },
      },
    ],
    [distributingRaceId, prizes, selectedTournamentId],
  );

  return (
    <section className="prize-management">
      <style>{`
        .prize-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .prize-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .prize-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: 0;
        }

        .prize-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .prize-card {
          overflow: hidden;
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
        }

        .prize-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .prize-primary.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        .prize-primary.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }

        .prize-distribution-note.ant-alert {
          margin-bottom: 14px;
          border: 1px solid #bdeee5;
          border-radius: 8px;
          background: #f3fffc;
        }

        .prize-distribution-note .ant-alert-message {
          color: #06332e;
          font-weight: 900;
        }

        @media (max-width: 700px) {
          .prize-header,
          .prize-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="prize-header">
        <div>
          <div className="prize-kicker">Admin dashboard</div>
          <Title level={1}>Prize</Title>
        </div>

        <Button
          className="prize-primary"
          onClick={openCreatePrizeModal}
        >
          Create Prize
        </Button>
      </div>

      <div className="prize-toolbar">
        <Space wrap>
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Select tournament"
            style={{ width: 320 }}
            value={selectedTournamentId}
            options={tournaments}
            onChange={(value) => {
              setSelectedTournamentId(value);
              loadFinalRaces(value);
              loadPrizes(value);
            }}
          />

          <Button
            loading={isLoading}
            onClick={() => {
              loadFinalRaces(selectedTournamentId);
              loadPrizes(selectedTournamentId);
            }}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Title level={4}>Tournament Prize</Title>
      <div className="prize-card" style={{ marginBottom: 22 }}>
        <Table
          className="prize-table"
          loading={isPrizeLoading}
          dataSource={prizes}
          pagination={false}
          locale={{ emptyText: "No prize has been created" }}
          columns={[
            {
              title: "Prize Name",
              dataIndex: "name",
              render: (value) => <Text strong>{value || "N/A"}</Text>,
            },
            {
              title: "Amount",
              dataIndex: "amount",
              width: 220,
              render: formatMoney,
            },
            {
              title: "Created At",
              dataIndex: "createdAt",
              width: 200,
              render: formatDateTime,
            },
          ]}
        />
      </div>

      <Title level={4}>Prize Distribution</Title>
      <Alert
        className="prize-distribution-note"
        type="info"
        showIcon
        message="How prize distribution works"
        description="The system sends the tournament prize to the Round 2 winner whose saved result has finalRank = 1. Create a prize first, then wait until the final race is Finished before distributing it."
      />
      <div className="prize-card">
        <Table
          className="prize-table"
          columns={columns}
          dataSource={finalRaces}
          loading={isLoading}
          pagination={false}
          locale={{ emptyText: "No Round 2 race found" }}
          scroll={{ x: 850 }}
        />
      </div>

      <Modal
        title="Create Prize"
        open={isPrizeModalOpen}
        okText="Create"
        cancelText="Cancel"
        confirmLoading={isPrizeSaving}
        onOk={handleCreatePrize}
        onCancel={() => {
          setIsPrizeModalOpen(false);
          prizeForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={prizeForm} layout="vertical">
          <Form.Item
            label="Prize Name"
            name="name"
            rules={[
              { required: true, message: "Prize name is required" },
              { whitespace: true, message: "Prize name is required" },
            ]}
          >
            <Input placeholder="Championship prize" maxLength={150} />
          </Form.Item>

          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <InputNumber
              min={1}
              precision={0}
              style={{ width: "100%" }}
              placeholder="Enter prize amount"
            />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}

export default Prize;
