import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import { getJockeyProfile, getJockeyRaceSchedule } from "../../api/services/jockey.service";
import { getTournamentById } from "../../api/services/tournament.service";
import RaceHistoryCard from "../../components/races/RaceHistoryCard";
import WorkspaceHeader from "../../components/ui/WorkspaceHeader";

dayjs.extend(utc);

function shouldShowRaceSubtitle(value) {
  const text = String(value || "").trim();

  if (!text || text === "N/A") return false;
  if (/^[a-f0-9]{24}$/i.test(text)) return false;
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(text)) {
    return false;
  }

  return true;
}

function getDisplayValue(value) {
  const text = String(value ?? "").trim();

  return text && text !== "N/A" ? text : "";
}

function formatScheduleTime(record) {
  const date = String(record.date || "").trim();
  const time = String(record.time || "").trim();
  const hasDate = date && date !== "N/A";
  const hasTime = time && time !== "N/A";
  const parsedDate = hasDate ? new Date(date) : null;

  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    const formattedDate = dayjs.utc(date).format("DD/MM/YYYY");

    return hasTime ? `${formattedDate} ${time}` : formattedDate;
  }

  const rawDateTime = [date, time].filter((value) => value && value !== "N/A").join(" ");
  const parsedDateTime = rawDateTime ? new Date(rawDateTime) : null;

  if (parsedDateTime && !Number.isNaN(parsedDateTime.getTime())) {
    return dayjs.utc(rawDateTime).format("HH:mm DD/MM/YYYY");
  }

  return rawDateTime || "N/A";
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : String(value);
}

function getTournamentTitle(tournament) {
  return (
    getDisplayValue(tournament?.title) ||
    getDisplayValue(tournament?.name) ||
    getDisplayValue(tournament?.tournamentName) ||
    getDisplayValue(tournament?.data?.title) ||
    getDisplayValue(tournament?.result?.title)
  );
}

async function resolveScheduleTournamentTitles(schedules) {
  const cache = new Map();

  return Promise.all(
    schedules.map(async (schedule) => {
      if (shouldShowRaceSubtitle(schedule.tournament) || !schedule.tournamentId) {
        return schedule;
      }

      try {
        const tournamentId = getDisplayValue(schedule.tournamentId);

        if (!tournamentId) return schedule;

        if (!cache.has(tournamentId)) {
          cache.set(tournamentId, getTournamentById(tournamentId));
        }

        const tournament = await cache.get(tournamentId);
        const title = getTournamentTitle(tournament);

        return title ? { ...schedule, tournament: title } : schedule;
      } catch {
        return schedule;
      }
    }),
  );
}

function collectFinalRanks(history) {
  const ranks = [];

  function visit(value) {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (typeof value !== "object") return;

    const rank = Number(value.finalRank ?? value.rank ?? value.rawRank);
    if (Number.isFinite(rank)) {
      ranks.push(rank);
    }

    ["historyRace", "rounds", "races"].forEach((key) => {
      if (Array.isArray(value[key])) visit(value[key]);
    });
  }

  visit(history);

  return ranks;
}

export default function JockeyRaceSchedule() {
  const [data, setData] = useState({ schedules: [], standings: [] });
  const [profile, setProfile] = useState({});
  const [selectedRace, setSelectedRace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    Promise.all([getJockeyRaceSchedule(), getJockeyProfile()])
      .then(async ([scheduleData, profileData]) => {
        const schedules = await resolveScheduleTournamentTitles(scheduleData?.schedules || []);

        setData({
          ...scheduleData,
          schedules,
        });
        setProfile(profileData || {});
      })
      .catch((error) => setErrorMessage(error.message || "Could not load race schedule."))
      .finally(() => setLoading(false));
  }, []);

  const finishedRaces = data.schedules.filter((race) => race.result);
  const upcomingRaces = useMemo(
    () =>
      data.schedules.filter(
        (race) => String(race.status || "").toLowerCase() !== "finished",
      ),
    [data.schedules],
  );
  const totalPrize = finishedRaces.reduce((sum, race) => sum + (race.result?.prize || 0), 0);
  const bestRank = useMemo(() => {
    const historyRanks = collectFinalRanks(profile.historyRaceJockey);
    const scheduleRanks = finishedRaces
      .map((race) => Number(race.result?.rank))
      .filter((rank) => Number.isFinite(rank));
    const ranks = historyRanks.length ? historyRanks : scheduleRanks;

    return ranks.length ? Math.min(...ranks) : null;
  }, [finishedRaces, profile.historyRaceJockey]);

  const scheduleColumns = [
    {
      title: "Race",
      dataIndex: "race",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          {shouldShowRaceSubtitle(record.tournament) && (
            <Typography.Text type="secondary">{record.tournament}</Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: "Tournament",
      dataIndex: "tournament",
      responsive: ["md"],
      render: (value) => getDisplayValue(value) || "N/A",
    },
    {
      title: "Time",
      render: (_, record) => formatScheduleTime(record),
      responsive: ["md"],
    },
    { title: "Race course", dataIndex: "raceCourseName", responsive: ["lg"] },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => <Tag color={value === "Finished" ? "green" : "blue"}>{value}</Tag>,
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button size="small" onClick={() => setSelectedRace(record)}>
          View detail
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <WorkspaceHeader
        kicker="RACE SCHEDULE"
        title="Race Schedule"
        subtitle="Review assigned races, finishes, and recent performance"
      />

      {errorMessage && <Alert type="warning" showIcon message={errorMessage} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Assigned races" value={data.schedules.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Best finish" value={bestRank ? `#${bestRank}` : "-"} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Prize earned" value={totalPrize} prefix="$" />
          </Card>
        </Col>
      </Row>

      <Card title="My upcoming race schedule">
        <Table
          rowKey="id"
          loading={loading}
          columns={scheduleColumns}
          dataSource={upcomingRaces}
          pagination={{ pageSize: 6, showSizeChanger: false }}
        />
      </Card>

      <RaceHistoryCard
        history={profile.historyRaceJockey}
        loading={loading}
        participantLabel="Owner"
        compact
      />

      <Modal
        title={selectedRace ? selectedRace.raceName || selectedRace.race : "Race detail"}
        open={Boolean(selectedRace)}
        onCancel={() => setSelectedRace(null)}
        footer={<Button onClick={() => setSelectedRace(null)}>Close</Button>}
        width={760}
        destroyOnHidden
      >
        {selectedRace ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Race name">
              {selectedRace.raceName || selectedRace.race || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Date">{formatDateTime(selectedRace.date)}</Descriptions.Item>
            <Descriptions.Item label="Start time">
              {formatDateTime(selectedRace.startTime)}
            </Descriptions.Item>
            <Descriptions.Item label="Status">{selectedRace.status || "N/A"}</Descriptions.Item>
            <Descriptions.Item label="Tournament">
              {getDisplayValue(selectedRace.tournament) || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Race course">
              {selectedRace.raceCourseName || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Horse">
              {selectedRace.horseName || "N/A"}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a race" />
        )}
      </Modal>
    </Space>
  );
}
