import {
  Button,
  Card,
  Descriptions,
  Empty,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function formatRaceDate(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : value;
}

function formatRaceDateTime(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : String(value);
}

function displayValue(value) {
  if (value === undefined || value === null || value === "") return "N/A";

  return String(value);
}

function buildHistoryRows(history) {
  return asArray(history)
    .filter(
      (item) =>
        item && typeof item === "object" && (item.raceId || item.raceName),
    )
    .map((item, index) => ({
      key: `${item.tournamentId || "tournament"}-${item.raceId || "race"}-${index}`,
      tournamentId: item.tournamentId || "N/A",
      tournamentName: item.tournamentName || "",
      raceId: item.raceId || "N/A",
      raceName: item.raceName || "",
      date: formatRaceDateTime(item.date || item.raceDate),
      rawDate: item.date || item.raceDate || "",
      ownerId: item.horseOwnerId || "",
      ownerName: item.horseOwnerName || "",
      jockeyId: item.jockeyProfileId || "",
      jockeyName: item.jockeyName || "",
      horseName: item.horseName || "",
      rawRank: item.rawRank ?? "",
      finalRank: item.finalRank ?? item.rank ?? "",
      result: item.result || null,
      raw: item,
    }));
}

function RaceLabel({ name }) {
  return name ? <Typography.Text strong>{name}</Typography.Text> : "N/A";
}

export default function RaceHistoryCard({
  history,
  loading = false,
  participantLabel = "Participant",
  compact = false,
}) {
  const [selectedRace, setSelectedRace] = useState(null);
  const rows = buildHistoryRows(history);

  const fullColumns = [
    {
      title: "Tournament",
      dataIndex: "tournamentName",
      render: (value) => value || "N/A",
    },
    {
      title: "Race",
      dataIndex: "raceName",
      render: (value) => <RaceLabel name={value} />,
    },
    {
      title: "Date",
      dataIndex: "date",
      width: 120,
      responsive: ["md"],
    },
    {
      title: participantLabel,
      render: (_, record) => {
        const name =
          participantLabel === "Owner" ? record.ownerName : record.jockeyName;
        const id =
          participantLabel === "Owner" ? record.ownerId : record.jockeyId;

        return name || id || "N/A";
      },
      responsive: ["md"],
    },
    {
      title: "Horse",
      dataIndex: "horseName",
      render: (value) => value || "N/A",
      responsive: ["lg"],
    },
    {
      title: "Rank",
      dataIndex: "finalRank",
      width: 96,
      render: (value) =>
        value ? (
          <Tag color={Number(value) === 1 ? "gold" : "blue"}>#{value}</Tag>
        ) : (
          "N/A"
        ),
    },
  ];

  const compactColumns = [
    {
      title: "Race",
      dataIndex: "raceName",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <RaceLabel name={value} />
          <Typography.Text type="secondary">
            {record.tournamentName || "N/A"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Rank",
      dataIndex: "finalRank",
      width: 96,
      render: (value) =>
        value ? (
          <Tag color={Number(value) === 1 ? "gold" : "blue"}>#{value}</Tag>
        ) : (
          "N/A"
        ),
    },
    {
      title: "Date",
      dataIndex: "date",
      width: 120,
      responsive: ["md"],
    },
    {
      title: "Action",
      width: 110,
      render: (_, record) => (
        <Button size="small" onClick={() => setSelectedRace(record)}>
          View detail
        </Button>
      ),
    },
  ];

  const columns = compact ? compactColumns : fullColumns;

  return (
    <>
      <Card
        title="Race history"
        extra={<Tag color="gold">{rows.length} races</Tag>}
      >
        <Table
          rowKey="key"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 5, hideOnSinglePage: true }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No race history yet"
              />
            ),
          }}
        />
      </Card>

      {compact && (
        <Modal
          title={selectedRace?.raceName || "Race detail"}
          open={Boolean(selectedRace)}
          onCancel={() => setSelectedRace(null)}
          footer={<Button onClick={() => setSelectedRace(null)}>Close</Button>}
          width={720}
          destroyOnHidden
        >
          {selectedRace ? (
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Race">
                {displayValue(selectedRace.raceName)}
              </Descriptions.Item>
              <Descriptions.Item label="Tournament">
                {displayValue(selectedRace.tournamentName)}
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {formatRaceDateTime(selectedRace.rawDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Final rank">
                {displayValue(selectedRace.finalRank)}
              </Descriptions.Item>
              <Descriptions.Item label={participantLabel}>
                {participantLabel === "Owner"
                  ? displayValue(selectedRace.ownerName || selectedRace.ownerId)
                  : displayValue(
                      selectedRace.jockeyName || selectedRace.jockeyId,
                    )}
              </Descriptions.Item>
              <Descriptions.Item label="Horse">
                {displayValue(selectedRace.horseName)}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Select a race"
            />
          )}
        </Modal>
      )}
    </>
  );
}
