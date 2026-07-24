import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import WorkspaceHeader from "../../components/ui/WorkspaceHeader";
import { getJockeyDashboard } from "../../api/services/jockey.service";

dayjs.extend(utc);

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatAssignmentSchedule(record) {
  const date = String(record?.date || "").trim();
  const time = String(record?.time || "").trim();
  const venue = String(record?.venue || "").trim();
  const parts = [];

  if (date && date !== "N/A") {
    const parsedDate = dayjs.utc(date);
    parts.push(parsedDate.isValid() ? parsedDate.format("DD/MM/YYYY") : date);
  }

  if (time && time !== "N/A") {
    parts.push(time);
  }

  if (venue && venue !== "N/A") {
    parts.push(venue);
  }

  return parts.length ? parts.join(" - ") : "N/A";
}

export default function JockeyDashboard() {
  const [data, setData] = useState({ profile: {}, invitations: [], schedules: [], standings: [] });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getJockeyDashboard()
      .then(setData)
      .catch((error) => setErrorMessage(error.message || "Could not load jockey dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const pendingInvitations = data.invitations.filter((item) => item.status === "Pending").length;
  const upcomingAssignments = data.schedules.filter((item) => item.assignmentStatus !== "Finished").length;
  const finishedAssignments = data.schedules.filter((item) => item.result);
  const bestFinish = useMemo(() => {
    const ranks = finishedAssignments.map((item) => item.result?.rank || 99);
    return ranks.length ? Math.min(...ranks) : null;
  }, [finishedAssignments]);

  const columns = [
    {
      title: "Race",
      dataIndex: "race",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {formatAssignmentSchedule(record)}
          </Typography.Text>
        </Space>
      ),
    },
    { title: "Horse", dataIndex: "horse" },
    {
      title: "Status",
      dataIndex: "assignmentStatus",
      render: (value) => <Tag color={value === "Finished" ? "green" : "blue"}>{value}</Tag>,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <WorkspaceHeader
        kicker="RACE OVERVIEW"
        title="Jockey Workspace"
        subtitle="Manage invitations, assignments, and race performance"
      />

      {errorMessage && <Alert type="warning" showIcon message={errorMessage} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Season rank" value={data.profile.rank || 0} prefix="#" />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Win rate" value={data.profile.winRate || 0} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Pending invites" value={pendingInvitations} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="Season prize" value={data.profile.seasonPrize || 0} prefix="$" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card
            title="Upcoming assignments"
            extra={
              <Link to="/jockey/schedule">
                <Button type="primary">My race schedule</Button>
              </Link>
            }
          >
            <Table
              rowKey="id"
              loading={loading}
              columns={columns}
              dataSource={data.schedules.slice(0, 4)}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Personal performance">
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <Statistic title="Career wins" value={data.profile.careerWins || 0} />
              <Statistic title="Best recent finish" value={bestFinish ? `#${bestFinish}` : "-"} />
              <Statistic
                title="Recent prize earned"
                value={finishedAssignments.reduce((sum, item) => sum + (item.result?.prize || 0), 0)}
                formatter={formatMoney}
              />
              <Link to="/jockey/invitations">
                <Button block>Review invitations</Button>
              </Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
