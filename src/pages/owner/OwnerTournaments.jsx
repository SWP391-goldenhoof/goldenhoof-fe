import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import WorkspaceHeader from "../../components/ui/WorkspaceHeader";
import { getTournaments } from "../../api/services/tournament.service";

function pickFirstValue(source, keys, fallback = "") {
  for (const key of keys) {
    const value = source?.[key];

    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
}

function normalizeTournament(tournament = {}) {
  return {
    ...tournament,
    id: pickFirstValue(tournament, ["id", "_id", "tournamentId"]),
    title: pickFirstValue(tournament, ["title", "name"], "Unnamed tournament"),
    description: pickFirstValue(tournament, ["description"], ""),
    imageUrl: pickFirstValue(tournament, ["imageUrl", "image"], undefined),
    startDate: pickFirstValue(tournament, ["startDate"], "N/A"),
    endDate: pickFirstValue(tournament, ["endDate"], "N/A"),
    location: pickFirstValue(tournament, ["location"], "N/A"),
    status: pickFirstValue(tournament, ["status"], "N/A"),
    totalRounds: pickFirstValue(tournament, ["totalRounds"], 0),
    horsesPerRace: pickFirstValue(tournament, ["horsesPerRace"], 0),
    totalRaces: pickFirstValue(tournament, ["totalRaces"], 0),
    entryFee: pickFirstValue(tournament, ["entryFee"], 0),
    availableSlot: pickFirstValue(tournament, ["availableSlot"], 0),
  };
}

function statusColor(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("preparing")) return "gold";
  if (value.includes("open") || value.includes("active")) return "green";
  if (value.includes("running")) return "blue";
  if (value.includes("finished") || value.includes("completed")) return "default";
  if (value.includes("cancel")) return "red";

  return "default";
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

export default function OwnerTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setErrorMessage("");

    getTournaments()
      .then((data) => setTournaments(data.map(normalizeTournament)))
      .catch((error) => {
        setTournaments([]);
        setErrorMessage(error.message || "Could not load tournaments.");
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = tournaments.length;
    const preparing = tournaments.filter(
      (item) => String(item.status).toLowerCase() === "preparing",
    ).length;
    const availableSlots = tournaments.reduce(
      (sum, item) => sum + Number(item.availableSlot || 0),
      0,
    );
    const totalRaces = tournaments.reduce(
      (sum, item) => sum + Number(item.totalRaces || 0),
      0,
    );

    return { total, preparing, availableSlots, totalRaces };
  }, [tournaments]);

  const columns = [
    {
      title: "Tournament",
      dataIndex: "title",
      render: (value, record) => (
        <Space>
          <Avatar shape="square" size={48} src={record.imageUrl}>
            {String(value || "?").charAt(0)}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{value}</Typography.Text>
            <Typography.Text type="secondary">{record.location}</Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Date",
      render: (_, record) => `${record.startDate} - ${record.endDate}`,
      responsive: ["md"],
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => <Tag color={statusColor(value)}>{value}</Tag>,
    },
    { title: "Rounds", dataIndex: "totalRounds", responsive: ["lg"] },
    { title: "Races", dataIndex: "totalRaces", responsive: ["md"] },
    { title: "Horses/race", dataIndex: "horsesPerRace", responsive: ["lg"] },
    { title: "Slots", dataIndex: "availableSlot" },
    {
      title: "Entry fee",
      dataIndex: "entryFee",
      render: (value) => `${formatMoney(value)} VND`,
      responsive: ["lg"],
    },
  ];

  return (
    <Space direction="vertical" size={16} className="owner-page-stack">
      <WorkspaceHeader
        kicker="COMPETITION"
        title="Tournaments"
        subtitle="Browse available tournaments and race capacity"
      />

      {errorMessage && <Alert type="warning" showIcon message={errorMessage} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Tournaments" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Preparing" value={stats.preparing} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Available slots" value={stats.availableSlots} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Total races" value={stats.totalRaces} />
          </Card>
        </Col>
      </Row>

      <Card title="Tournaments">
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : tournaments.length === 0 ? (
          <Empty description="No tournaments found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={tournaments}
            pagination={{ pageSize: 8, showSizeChanger: false }}
          />
        )}
      </Card>
    </Space>
  );
}
