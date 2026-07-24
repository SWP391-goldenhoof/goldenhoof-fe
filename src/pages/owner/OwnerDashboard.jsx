import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
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
import { Link } from "react-router-dom";
import WorkspaceHeader from "../../components/ui/WorkspaceHeader";
import { getHorseById, getMyHorses } from "../../api/services/horse.service";
import { getHorseStatusColor, horseCollectionFrom, isActiveHorse, normalizeHorse } from "./horseViewModel";

export default function OwnerDashboard() {
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const horseData = await getMyHorses();
      const horseList = horseCollectionFrom(horseData);
      const detailResults = await Promise.allSettled(
        horseList.map((horse) => {
          const horseId = horse.id ?? horse._id;

          return horseId ? getHorseById(horseId) : Promise.resolve(horse);
        }),
      );

      setHorses(
        detailResults.map((result, index) =>
          result.status === "fulfilled" ? result.value : horseList[index],
        ),
      );

      if (detailResults.some((result) => result.status === "rejected")) {
        setErrorMessage("Some horse details could not be loaded.");
      }
    } catch (error) {
      setHorses([]);
      setErrorMessage(error.message || "Could not load owner dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const rows = useMemo(() => horses.map(normalizeHorse), [horses]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(isActiveHorse).length;
    const totalWins = rows.reduce((sum, horse) => sum + Number(horse.totalWin || 0), 0);
    const averageWinRate =
      total > 0
        ? Math.round(rows.reduce((sum, horse) => sum + Number(horse.winRate || 0), 0) / total)
        : 0;

    return { total, active, totalWins, averageWinRate };
  }, [rows]);

  const latestRows = useMemo(() => rows.slice(0, 5), [rows]);

  const columns = [
    {
      title: "Horse",
      dataIndex: "name",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">{record.color || "No color"}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => <Tag color={getHorseStatusColor(value)}>{value}</Tag>,
    },
    { title: "Wins", dataIndex: "totalWin", responsive: ["md"] },
    { title: "Races", dataIndex: "totalRace", responsive: ["md"] },
    {
      title: "Win rate",
      dataIndex: "winRate",
      responsive: ["sm"],
      render: (value) => `${Number(value || 0).toFixed(2)}%`,
    },
  ];

  return (
    <Space direction="vertical" size={16} className="owner-page-stack">
      <style>{`
        .owner-page-stack {
          width: 100%;
        }

        .owner-stat-card {
          height: 100%;
          border-radius: 12px;
        }

        .owner-stable-card .ant-card-head {
          align-items: flex-start;
          gap: 12px;
        }

        .owner-stable-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
        }

        .owner-stable-actions .ant-btn {
          min-width: 0;
        }

        .owner-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .owner-table-wrap .ant-table-wrapper {
          min-width: 0;
        }

        .owner-horse-card {
          height: 100%;
          border-radius: 12px;
        }

        .owner-horse-card .ant-card-head {
          gap: 10px;
        }

        .owner-horse-card .ant-card-extra {
          min-width: 0;
        }

        @media (max-width: 768px) {
          .owner-stable-card .ant-card-head {
            flex-direction: column;
          }

          .owner-stable-card .ant-card-head-title,
          .owner-stable-card .ant-card-extra {
            width: 100%;
          }

          .owner-stable-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
          }

          .owner-stable-actions a,
          .owner-stable-actions .ant-btn {
            width: 100%;
          }

          .owner-stable-actions .ant-btn {
            padding-inline: 10px;
            white-space: normal;
            height: auto;
            min-height: 38px;
          }

          .owner-table-wrap .ant-table {
            min-width: 420px;
          }
        }

        @media (max-width: 480px) {
          .owner-page-stack {
            gap: 12px !important;
          }

          .owner-stable-actions {
            grid-template-columns: 1fr;
          }

          .owner-stable-card .ant-card-body,
          .owner-horse-card .ant-card-body {
            padding: 16px;
          }

          .owner-table-wrap .ant-table {
            min-width: 360px;
          }

          .owner-table-wrap .ant-table-cell {
            padding: 10px 8px !important;
          }
        }
      `}</style>

      <WorkspaceHeader
        kicker="STABLE OVERVIEW"
        title="Owner Workspace"
        subtitle="Manage your stable, horse profiles, and race readiness"
        onRefresh={loadDashboard}
        refreshLoading={loading}
      />

      {errorMessage && <Alert type="warning" showIcon message={errorMessage} />}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="owner-stat-card">
            <Statistic title="My horses" value={stats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="owner-stat-card">
            <Statistic title="Active horses" value={stats.active} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="owner-stat-card">
            <Statistic title="Total wins" value={stats.totalWins} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="owner-stat-card">
            <Statistic title="Average win rate" value={stats.averageWinRate} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Card
        className="owner-stable-card"
        title="Stable overview"
        extra={
          <div className="owner-stable-actions">
            <Link to="/owner/horses">
              <Button>Manage horses</Button>
            </Link>
            <Link to="/owner/horses/register">
              <Button type="primary">Register horse</Button>
            </Link>
            <Link to="/owner/tournaments">
              <Button>Tournaments</Button>
            </Link>
            <Button onClick={loadDashboard}>Refresh</Button>
          </div>
        }
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : rows.length === 0 ? (
          <Empty
            description="No horses found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Link to="/owner/horses/register">
              <Button type="primary">Register your first horse</Button>
            </Link>
          </Empty>
        ) : (
          <div className="owner-table-wrap">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={latestRows}
              pagination={false}
            />
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {rows.slice(0, 3).map((horse) => (
          <Col key={horse.id} xs={24} md={8}>
            <Card
              className="owner-horse-card"
              hoverable
              title={horse.name}
              extra={<Tag color={getHorseStatusColor(horse.status)}>{horse.status}</Tag>}
            >
              <Space direction="vertical" size={6}>
                <Typography.Text>Color: {horse.color || "N/A"}</Typography.Text>
                <Typography.Text>Wins: {horse.totalWin}</Typography.Text>
                <Typography.Text>Races: {horse.totalRace}</Typography.Text>
                <Typography.Text>
                  Win rate: {Number(horse.winRate || 0).toFixed(2)}%
                </Typography.Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
