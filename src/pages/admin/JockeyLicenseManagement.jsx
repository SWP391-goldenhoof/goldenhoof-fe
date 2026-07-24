import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  List,
  Image,
} from "antd";
import "antd/dist/reset.css";
import { getJockeysWithLicenses } from "../../api/services/user.service";
import { updateJockeyStatus } from "../../api/services/jockeyLicense.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

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

function formatDate(value) {
  if (!value) return "N/A";
  if (typeof value === "string" && value.includes("/")) {
    return value;
  }
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : value;
}

function getTimeValue(value) {
  if (!value) return 0;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    const dateParts = trimmedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (dateParts) {
      const [, day, month, year] = dateParts;
      const date = new Date(Number(year), Number(month) - 1, Number(day));

      return Number.isNaN(date.getTime()) ? 0 : date.getTime();
    }
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

function getNewestLicenseTime(licenses = []) {
  return licenses.reduce((latest, license) => {
    const licenseTime = Math.max(
      getObjectIdTime(license?._id),
      getObjectIdTime(license?.id),
      getObjectIdTime(license?.licenseId),
      getTimeValue(license?.createdAt),
      getTimeValue(license?.uploadedAt),
      getTimeValue(license?.racingStartDate),
      getTimeValue(license?.submittedAt),
      getTimeValue(license?.registeredAt),
      getTimeValue(license?.requestedAt),
    );

    return Math.max(latest, licenseTime);
  }, 0);
}

function sortNewestJockeyFirst(a, b) {
  return b.sortTime - a.sortTime;
}

function normalizeJockey(jockey, index) {
  const id = pick(jockey, ["id", "_id", "userId"], `jockey-${index}`);
  const profileId = pick(jockey, ["profileId", "jockeyProfileId"], "");
  const licenses = Array.isArray(jockey?.licenses)
    ? [...jockey.licenses].sort((a, b) => {
        const aTime = getNewestLicenseTime([a]);
        const bTime = getNewestLicenseTime([b]);

        return bTime - aTime;
      })
    : [];

  return {
    key: id,
    id,
    profileId,
    avatar: pick(jockey, ["avatar", "avatarUrl", "imageUrl", "photoUrl"], ""),
    email: pick(jockey, ["email", "mail"], "N/A"),
    fullName: pick(
      jockey,
      ["fullName", "name", "displayName", "username"],
      "Unnamed Jockey",
    ),
    dateOfBirth: pick(jockey, ["dateOfBirth", "dob", "birthDate"], ""),
    phoneNumber: pick(jockey, ["phoneNumber", "phone", "mobile"], "N/A"),
    address: pick(jockey, ["address", "location"], "N/A"),
    gender:
      jockey?.gender !== undefined && jockey?.gender !== null
        ? Number(jockey.gender)
        : 1,
    weight: jockey?.weight || "N/A",
    height: jockey?.height || "N/A",
    jockeyStatus: jockey?.jockeyStatus || "Pending_Approval",
    licenses,
    winRate: jockey?.winRate || 0,
    reputationPoints: jockey?.reputationPoints || 0,
    sortTime: Math.max(
      getObjectIdTime(id),
      getObjectIdTime(profileId),
      getTimeValue(
        pick(
          jockey,
          ["createdAt", "submittedAt", "registeredAt", "requestedAt"],
          "",
        ),
      ),
      getTimeValue(
        pick(
          jockey?.profile,
          ["createdAt", "submittedAt", "registeredAt", "requestedAt"],
          "",
        ),
      ),
      getNewestLicenseTime(licenses),
    ),
  };
}

function getJockeyStatusColor(status) {
  switch (status) {
    case "Pending_Approval":
      return "orange";
    case "Rejected":
      return "red";
    case "Available":
      return "green";
    case "Contracted":
      return "blue";
    case "Busy":
      return "purple";
    case "Resting":
      return "default";
    case "Injured":
      return "magenta";
    case "Banned":
      return "volcano";
    default:
      return "cyan";
  }
}

function JockeyLicenseManagement() {
  const [jockeys, setJockeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [statusChangingId, setStatusChangingId] = useState(null);
  const [viewingLicensesJockey, setViewingLicensesJockey] = useState(null);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadJockeys(jockeyStatus = "") {
    setIsLoading(true);
    try {
      const data = await getJockeysWithLicenses(jockeyStatus);
      setJockeys(data.map(normalizeJockey).sort(sortNewestJockeyFirst));
    } catch (error) {
      message.error(error?.message || "Unable to load jockeys");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredJockeys = useMemo(() => jockeys, [jockeys]);

  async function handleJockeyStatusChange(profileId, recordId, nextStatus) {
    if (!profileId) {
      message.error("Jockey Profile ID not found");
      return;
    }

    setStatusChangingId(recordId);
    try {
      await updateJockeyStatus(profileId, nextStatus);
      message.success(`Updated status to ${nextStatus}`);

      setJockeys((current) =>
        current.map((jockey) =>
          jockey.id === recordId
            ? { ...jockey, jockeyStatus: nextStatus }
            : jockey,
        ),
      );
    } catch (error) {
      message.error(error?.message || "Failed to update jockey status");
    } finally {
      setStatusChangingId(null);
    }
  }

  useEffect(() => {
    loadJockeys();
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Avatar",
        dataIndex: "avatar",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 88,
        render: (avatar, record) => {
          const cleanSrc = avatar && avatar.trim() !== "" ? avatar : null;
          return (
            <Avatar className="user-management-avatar" size={44} src={cleanSrc}>
              {record.fullName
                ? record.fullName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "?"}
            </Avatar>
          );
        },
      },
      {
        title: "Full Name",
        dataIndex: "fullName",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 190,
      },
      {
        title: "Email",
        dataIndex: "email",
        width: 220,
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: "Phone Number",
        dataIndex: "phoneNumber",
        width: 150,
      },
      // {
      //   title: "Height / Weight",
      //   key: "specs",
      //   width: 160,
      //   render: (_, record) => `${record.height} cm / ${record.weight} kg`,
      // },
      {
        title: "License Active",
        dataIndex: "licenses",
        width: 130,
        // render: (licenses) => <Tag color="blue">{licenses.length} active</Tag>,
        render: (licenses) => {
          const isActive = licenses && licenses.length > 0;
          return (
            <Tag color={isActive ? "darkgreen" : "red"}>
              {isActive ? "Active" : "Inactive"}
            </Tag>
          );
        },
      },
      {
        title: "Latest",
        dataIndex: "sortTime",
        width: 130,
        render: (sortTime) => (sortTime ? formatDate(sortTime) : "N/A"),
      },
      {
        title: "Update Jockey Status",
        dataIndex: "jockeyStatus",
        width: 180,
        render: (jockeyStatus, record) => (
          <Select
            value={jockeyStatus}
            size="small"
            style={{ width: 155, background: "darkgreen", color: "white" }}
            loading={statusChangingId === record.id}
            onChange={(nextValue) =>
              handleJockeyStatusChange(record.profileId, record.id, nextValue)
            }
            options={[
              {
                value: "Pending_Approval",
                label: <span style={{ color: "white" }}>Pending Approval</span>,
              },
              {
                value: "Available",
                label: <span style={{ color: "white" }}>Available</span>,
              },
              // {
              //   value: "Contracted",
              //   label: <span style={{ color: "white" }}>Contracted</span>,
              // },
              // {
              //   value: "Busy",
              //   label: <span style={{ color: "white" }}>Busy</span>,
              // },
              // {
              //   value: "Resting",
              //   label: <span style={{ color: "white" }}>Resting</span>,
              // },
              // {
              //   value: "Injured",
              //   label: <span style={{ color: "white" }}>Injured</span>,
              // },
              {
                value: "Rejected",
                label: <span style={{ color: "white" }}>Rejected</span>,
              },
              {
                value: "Banned",
                label: <span style={{ color: "white" }}>Banned</span>,
              },
            ]}
          />
        ),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 140,
        render: (_, record) => (
          <Button
            className="user-management-link-btn"
            size="small"
            onClick={() => setViewingLicensesJockey(record)}
          >
            View Licenses
          </Button>
        ),
      },
    ],
    [statusChangingId, jockeys, shouldFixColumns],
  );

  return (
    <section className="user-management">
      <style>{`
        .user-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }
        .user-management-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          width: auto;
        }
        .user-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0;
          text-transform: uppercase;
        }
        .user-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: 0;
        }
        .user-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }
        .user-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }
        .user-management-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
          background: #fff;
        }
        .user-management-avatar.ant-avatar {
          color: #06332e;
          background: #d9fbf4;
          font-weight: 950;
        }
        .user-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
          background: #fff;
        }
        .user-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }
        .user-management-refresh.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }
        .user-management-refresh.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }
        @media (max-width: 920px) {
          .user-management-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="user-management-header">
        <div>
          <div className="user-management-kicker">Admin dashboard</div>
          <Title level={1}>Jockey License Management</Title>
        </div>
        <div className="user-management-actions">
          <Select
            placeholder="Filter by Jockey Status"
            allowClear
            style={{ width: 220 }}
            onChange={(val) => {
              setSelectedStatusFilter(val);
              loadJockeys(val || "");
            }}
          >
            <Select.Option value="Pending_Approval">
              Pending Approval
            </Select.Option>
            <Select.Option value="Available">Available</Select.Option>
            <Select.Option value="Contracted">Contracted</Select.Option>
            <Select.Option value="Busy">Busy</Select.Option>
            <Select.Option value="Resting">Resting</Select.Option>
            <Select.Option value="Injured">Injured</Select.Option>
            <Select.Option value="Rejected">Rejected</Select.Option>
            <Select.Option value="Banned">Banned</Select.Option>
          </Select>

          <Button
            className="user-management-refresh"
            onClick={() => loadJockeys(selectedStatusFilter || "")}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="user-management-card">
        <Table
          className="user-management-table"
          columns={columns}
          dataSource={filteredJockeys}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} jockeys`,
          }}
          scroll={{ x: 1300 }}
        />
      </div>

      <Modal
        title={`License List - ${viewingLicensesJockey?.fullName}`}
        open={Boolean(viewingLicensesJockey)}
        footer={[
          <Button key="close" onClick={() => setViewingLicensesJockey(null)}>
            Close
          </Button>,
        ]}
        onCancel={() => setViewingLicensesJockey(null)}
      >
        {viewingLicensesJockey && (
          <Space direction="vertical" size={2} style={{ marginBottom: 12 }}>
            <Text>
              Jockey ID: <Text code>{viewingLicensesJockey.id || "N/A"}</Text>
            </Text>
            {/* <Text>
              Profile ID:{" "}
              <Text code>{viewingLicensesJockey.profileId || "N/A"}</Text>
            </Text> */}
          </Space>
        )}
        {viewingLicensesJockey?.licenses.length === 0 ? (
          <Text
            type="secondary"
            style={{ display: "block", padding: "16px 0" }}
          >
            This jockey has not uploaded any licenses to the system.
          </Text>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={viewingLicensesJockey?.licenses}
            renderItem={(license) => (
              <List.Item
                key={license.licenseCode}
                extra={
                  license.licenseUrl ? (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <Image
                        src={license.licenseUrl}
                        alt={`License ${license.licenseCode}`}
                        style={{
                          width: "100%",
                          maxWidth: "220px",
                          maxHeight: "140px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid #f0f0f0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          cursor: "pointer",
                        }}
                        fallback="https://via.placeholder.com/220x140?text=Image+Error"
                      />
                    </div>
                  ) : null
                }
                actions={[
                  <a
                    href={license.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    key="view-link"
                    style={{ fontWeight: 700, color: "#007a68" }}
                  >
                    View detailed source file
                  </a>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Text strong>License Code: {license.licenseCode}</Text>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Text>
                        License ID:{" "}
                        <Text code>
                          {license._id ||
                            license.id ||
                            license.licenseId ||
                            "N/A"}
                        </Text>
                      </Text>
                      <Text>
                        Racing Start Date: {formatDate(license.racingStartDate)}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </section>
  );
}

export default JockeyLicenseManagement;
