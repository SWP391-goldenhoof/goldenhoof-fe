import { useEffect, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Alert, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import WorkspaceHeader from "../../components/ui/WorkspaceHeader";
import { getOwnerRaceCenter } from "../../api/services/owner.service";
import RaceHistoryCard from "../../components/races/RaceHistoryCard";

dayjs.extend(utc);

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : String(value);
}

export default function OwnerRaceResults() {
  const [data, setData] = useState({ races: [], standings: [], historyRaceOwner: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    getOwnerRaceCenter()
      .then((result) => {
        if (!mounted) return;
        setData(result);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error.message || "Could not load race information.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const horseCount = new Set(data.races.map((race) => race.horseId || race.horseName).filter(Boolean)).size;
  const availableSlots = data.races.reduce((sum, race) => sum + Number(race.availableSlots || 0), 0);

  const raceColumns = [
    {
      title: "Race",
      dataIndex: "raceName",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.tournamentName}</Typography.Text>
        </Space>
      ),
    },
    { title: "Horse", dataIndex: "horseName" },
    { title: "Jockey", dataIndex: "jockeyName", responsive: ["md"] },
    {
      title: "Start time",
      dataIndex: "startTime",
      render: (value, record) => formatDateTime(value || record.date),
      responsive: ["md"],
    },
    { title: "Race course", dataIndex: "raceCourseName", responsive: ["lg"] },
    {
      title: "Slots",
      render: (_, record) => `${record.filledSlots || 0}/${record.totalSlots || 0}`,
      responsive: ["lg"],
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => <Tag color={value === "Finished" ? "green" : "blue"}>{value || "Upcoming"}</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size={16} className="owner-page-stack">
      <WorkspaceHeader
        kicker="RACE CENTER"
        title="Race Results"
        subtitle="Track upcoming races, assignments, and owner history"
      />

      {errorMessage && <Alert type="warning" showIcon message={errorMessage} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Upcoming races" value={data.races.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Horses scheduled" value={horseCount} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Available slots" value={availableSlots} />
          </Card>
        </Col>
      </Row>

      <Card title="Upcoming races">
        <Table
          rowKey={(record) => record.id || `${record.raceId}-${record.horseId}`}
          loading={loading}
          columns={raceColumns}
          dataSource={data.races}
          pagination={{ pageSize: 6, showSizeChanger: false }}
        />
      </Card>

      <RaceHistoryCard
        history={data.historyRaceOwner}
        loading={loading}
        participantLabel="Jockey"
      />
    </Space>
  );
}
