import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  Button,
} from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FlagOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getMyRaces } from "../../api/services/race.service";
import { getRaceCourseById }
  from "../../api/services/race-course.service";
import "./RefereeDashboard.css";

function statusColor(status) {
  switch (status) {
    case "Preparing":
      return "blue";

    case "Ready":
      return "gold";

    case "InProgress":
      return "processing";

    case "Finished":
      return "green";

    case "Canceled":
      return "red";

    default:
      return "default";
  }
}

export default function RefereeDashboard() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");



  useEffect(() => {
    loadRaces();
  }, []);

  useEffect(() => {
    console.log("RACES STATE:", races);

    if (races.length > 0) {
      console.log(
        "FIRST RACE:",
        races[0]
      );
    }
  }, [races]);

  async function loadRaces() {
    try {
      setLoading(true);

      const data = await getMyRaces();

      const raceList = Array.isArray(data)
        ? data
        : data?.data || [];

      const racesWithCourse =
        await Promise.all(
          raceList.map(async (race) => {
            try {
              const raceCourse =
                await getRaceCourseById(
                  race.raceCourseId
                );

              return {
                ...race,
                raceCourse,
              };
            } catch {
              return race;
            }
          })
        );

      setRaces(racesWithCourse);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error.response?.data?.message ||
        error.message ||
        "Cannot load assigned races."
      );
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => ({
    scheduled: races.filter(
      race => race.status === "Scheduled"
    ).length,

    ready: races.filter(
      race => race.status === "Ready"
    ).length,

    finished: races.filter(
      race => race.status === "Finished"
    ).length,

    inProgress: races.filter(
      race => race.status === "InProgress"
    ).length,
  }), [races]);

  const columns = [
    {
      title: "Race",
      render: (_, record) =>
        record.name ||
        `Race #${record.id}`,
    },

    {
      title: "Tournament",
      render: (_, record) =>
        record.tournamentTitle ||
        record.tournament?.name ||
        "-",
    },

    {
      title: "Round",
      render: (_, record) =>
        record.roundNumber ||
        record.round ||
        "-",
    },

    {
      title: "Race Course",
      render: (_, record) =>
        record.raceCourse?.name ||
        record.raceCourseName ||
        record.courseName ||
        record.raceCourseId ||
        "-"
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={statusColor(status)}>
          {status}
        </Tag>
      ),
    },

    {
      title: "Action",
      render: (_, record) => (
        <Space>
          <Link
            to={`/referee/races/${record._id || record.id}`}
          >
            <Button
              type="primary"
              className="dashboard-btn"
            >
              View Details
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <div className="dashboard-page">
      <Space
        direction="vertical"
        size={28}
        style={{
          width: "100%",
        }}
      >

        <Typography.Title
          level={1}
          style={{
            marginBottom: 0,
            color: "#fff",
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          Referee Dashboard
        </Typography.Title>

        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
          />
        )}

        <Card
          className="dashboard-hero"
          style={{
            marginBottom: 8,
          }}
        >
          <Row
            align="middle"
            gutter={[48, 32]}
          >
            <Col xs={24} md={16}>
              <div className="dashboard-badge">
                GOLDEN HOOF RACING SYSTEM
              </div>

              <Typography.Title
                level={1}
                className="dashboard-title"
              >
                Welcome Back,
                <span className="dashboard-title-highlight">
                  {" "}Referee
                </span>
              </Typography.Title>

              <Typography.Paragraph
                className="dashboard-subtitle"
              >
                Track races, validate results,
                manage horse performance and
                oversee tournament operations.
              </Typography.Paragraph>
            </Col>

            <Col xs={24} md={8}>
              <img
                src="/goldenhoof-hero.png"
                alt="Golden Hoof"
                className="transition-all duration-500"
                style={{
                  width: "100%",
                  maxHeight: 320,
                  objectFit: "cover",
                }}
              />
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} xl={6}>
            <Card
              className="dashboard-stat-card"
              styles={{
                body: {
                  padding: 28,
                },
              }}
            >
              <Statistic
                title={
                  <span
                    style={{
                      color: "#c8e5df",
                      fontWeight: 600,
                      fontSize: 15

                    }}
                  >
                    Assigned Races
                  </span>
                }
                value={races.length}
                valueStyle={{
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 46,
                }}
                prefix={
                  <div className="dashboard-icon">
                    <TrophyOutlined />
                  </div>
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card
              className="dashboard-stat-card"
              styles={{
                body: {
                  padding: 28,
                },
              }}
            >
              <Statistic
                title={
                  <span
                    style={{
                      color: "#c8e5df",
                      fontWeight: 600,
                      fontSize: 15

                    }}
                  >
                    Preparing
                  </span>
                }
                value={stats.scheduled}
                valueStyle={{
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: 46,
                }}
                prefix={
                  <div className="dashboard-icon">
                    <ClockCircleOutlined />
                  </div>
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card
              className="dashboard-stat-card"
              styles={{
                body: {
                  padding: 28,
                },
              }}
            >
              <Statistic
                title={
                  <span
                    style={{
                      color: "#c8e5df",
                      fontWeight: 600,
                      fontSize: 15

                    }}
                  >
                    Ready
                  </span>
                }

                value={stats.ready}
                valueStyle={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 46,
                }}
                prefix={
                  <div className="dashboard-icon">
                    <FlagOutlined />
                  </div>
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card
              className="dashboard-stat-card"
              styles={{
                body: {
                  padding: 28,
                },
              }}
            >
              <Statistic
                title={
                  <span
                    style={{
                      color: "#c8e5df",
                      fontWeight: 600,
                      fontSize: 15

                    }}
                  >
                    Finished
                  </span>
                }

                value={stats.finished}
                valueStyle={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 46,
                }}
                prefix={
                  <div className="dashboard-icon">
                    <CheckCircleOutlined />
                  </div>
                }
              />
            </Card>
          </Col>
        </Row>

        <Card
          className="dashboard-content-card"
          styles={{
            body: {
              padding: 0
            }
          }}
          title={
            <span
              style={{
                fontSize: 30,
                letterSpacing: .5,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              My Assigned Races
            </span>
          }
          extra={
            <Typography.Text
              style={{
                color: "#8fd8cf",
                fontWeight: 500
              }}
            >
              Manage your assigned races
            </Typography.Text>
          }
        >
          {loading ? (
            <Skeleton
              active
              paragraph={{ rows: 8 }}
            />
          ) : races.length === 0 ? (
            <Empty description="No races assigned" />
          ) : (
            <Table
              className="dashboard-table"
              size="large"
              rowKey={(record) => record._id || record.id}
              columns={columns}
              dataSource={races}
              pagination={{
                pageSize: 5,
                showSizeChanger: false
              }}
            />
          )}
        </Card>

        <Card
          className="dashboard-content-card"
          title={
            <span
              style={{
                color: "#ffffff",
              }}
            >
              Referee Workspace
            </span>
          }
        >
          <Typography.Paragraph
            style={{
              color: "#d6ece8",
              fontSize: 16,
              lineHeight: 1.9,
              marginBottom: 0
            }}
          >
            Review your assigned races,
            configure race conditions,
            confirm readiness,
            run simulations,
            and submit final reports after
            each race.
          </Typography.Paragraph>
        </Card>
      </Space>
    </div>
  );
}
