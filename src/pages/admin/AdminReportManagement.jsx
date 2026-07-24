import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Select,
  Table,
  Tag,
  Typography,
  message,
  Descriptions,
  Popconfirm,
  Dropdown,
} from "antd";
import "antd/dist/reset.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  getAllReportsAdmin,
  getReportById,
  resolveReport,
  deleteReport,
} from "../../api/services/report.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";

dayjs.extend(customParseFormat);

const { Text, Title } = Typography;

const ReportCategory = {
  MISSING_WINNING_POINTS: "MISSING_WINNING_POINTS",
  MISSING_COMPENSATION: "MISSING_COMPENSATION",
  UNAUTHORIZED_DEDUCTION: "UNAUTHORIZED_DEDUCTION",
  FROZEN_POINTS_NOT_REFUNDED: "FROZEN_POINTS_NOT_REFUNDED",
  OTHER: "OTHER",
};

const ReportStatus = {
  PENDING: "PENDING",
  INVESTIGATING: "INVESTIGATING",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
};

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

// function formatDate(value) {
//   if (!value) return "N/A";
//   if (typeof value === "string" && value.includes("/")) {
//     return value;
//   }
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;

//   return new Intl.DateTimeFormat("en-GB", {
//     day: "2-digit",
//     month: "2-digit",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   }).format(date);
// }

function formatDate(value) {
  if (!value) return "N/A";
  if (typeof value === "string" && value.includes("/")) {
    return value;
  }

  // Sử dụng dayjs với plugin utc để tránh tự động convert sang múi giờ địa phương
  const d = dayjs.utc(value);
  if (!d.isValid()) return value;

  return d.format("DD/MM/YYYY HH:mm:ss");
}

function getTimeValue(value) {
  if (!value) return 0;
  if (typeof value === "string" && value.includes("/")) {
    const parsedDate = dayjs(value, "DD/MM/YYYY", true);
    return parsedDate.isValid() ? parsedDate.valueOf() : 0;
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

function sortNewestRequestFirst(a, b) {
  const aTime = Math.max(getTimeValue(a.createdAt), getObjectIdTime(a.id));
  const bTime = Math.max(getTimeValue(b.createdAt), getObjectIdTime(b.id));
  return bTime - aTime;
}

function getCategoryLabel(category) {
  switch (category) {
    case ReportCategory.MISSING_WINNING_POINTS:
      return "Missing Winning Points";
    case ReportCategory.MISSING_COMPENSATION:
      return "Missing Compensation";
    case ReportCategory.UNAUTHORIZED_DEDUCTION:
      return "Unauthorized Deduction";
    case ReportCategory.FROZEN_POINTS_NOT_REFUNDED:
      return "Frozen Points Not Refunded";
    case ReportCategory.OTHER:
      return "Other Issues";
    default:
      return category || "N/A";
  }
}

function getStatusDetails(status) {
  const normalized = String(status).toUpperCase();
  switch (normalized) {
    case ReportStatus.PENDING:
      return { color: "orange", label: "Pending" };
    case ReportStatus.INVESTIGATING:
      return { color: "blue", label: "Investigating" };
    case ReportStatus.RESOLVED:
      return { color: "green", label: "Resolved" };
    case ReportStatus.REJECTED:
      return { color: "red", label: "Rejected" };
    default:
      return { color: "default", label: normalized || "Unknown" };
  }
}

function normalizeReport(item, index) {
  if (!item) return null;

  return {
    key: item._id || item.id || `report-${index}`,
    id: item._id || item.id || `report-${index}`,
    reporterId: item.userId?._id || item.userId || "N/A",
    reporterName: item.userId?.fullName || "Unknown User",
    reporterEmail: item.userId?.email || "N/A",
    description: item.description || "No Description",
    category: item.category || "OTHER",
    status: item.status || "PENDING",
    adminNotes: item.adminNotes || "",
    relatedRaceId: item.relatedRaceId || null,
    resolvedBy: item.resolvedBy || null,
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt || "",
  };
}

export default function AdminReportManagement() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadReports({
    status = selectedStatus,
    category = selectedCategory,
  } = {}) {
    setIsLoading(true);
    try {
      const response = await getAllReportsAdmin({ status, category });
      setReports(
        resolveList(response).map(normalizeReport).sort(sortNewestRequestFirst),
      );
    } catch (error) {
      message.error(
        error?.message || "Failed to load system report requests list",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => reports, [reports]);

  async function openDetailModal(id) {
    setActiveId(id);
    setIsDetailLoading(true);

    try {
      const report = await getReportById(id);
      setDetailData(normalizeReport(report, 0));
    } catch (error) {
      message.error(error?.message || "Failed to load report details");
    } finally {
      setIsDetailLoading(false);
      setActiveId(null);
    }
  }

  async function handleResolve(id, nextStatus) {
    setIsActionLoading(true);
    try {
      await resolveReport(id, {
        status: nextStatus,
        adminNotes: `Updated by admin on ${new Date().toLocaleDateString()}`,
      });
      message.success(
        `Report marked as ${nextStatus.toLowerCase()} successfully`,
      );

      if (detailData && detailData.id === id) {
        setDetailData((prev) =>
          prev ? { ...prev, status: nextStatus } : null,
        );
      }

      await loadReports();
    } catch (error) {
      message.error(error?.message || "Failed to update report status");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleDelete(id) {
    setIsActionLoading(true);
    try {
      await deleteReport(id);
      message.success("Report deleted successfully");
      if (detailData && detailData.id === id) {
        setDetailData(null);
      }
      await loadReports();
    } catch (error) {
      message.error(error?.message || "Failed to delete report");
    } finally {
      setIsActionLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "Reporter Name",
        dataIndex: "reporterName",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 180,
        ellipsis: true,
        render: (text) => <Text strong>{text}</Text>,
      },
      {
        title: "Email",
        dataIndex: "reporterEmail",
        width: 220,
        ellipsis: true,
      },
      {
        title: "Description",
        dataIndex: "description",
        width: 300,
        ellipsis: true,
      },
      {
        title: "Category",
        dataIndex: "category",
        width: 220,
        ellipsis: true,
        render: (cat) => <Text>{getCategoryLabel(cat)}</Text>,
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 140,
        render: (status) => {
          const { color, label } = getStatusDetails(status);
          return <Tag color={color}>{label}</Tag>;
        },
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        width: 180,
        render: formatDate,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 240,
        render: (_, record) => {
          const resolveMenuItems = [
            {
              key: ReportStatus.INVESTIGATING,
              label: "Investigate",
              onClick: () =>
                handleResolve(record.id, ReportStatus.INVESTIGATING),
            },
            {
              key: ReportStatus.RESOLVED,
              label: "Resolve Success",
              onClick: () => handleResolve(record.id, ReportStatus.RESOLVED),
            },
            {
              key: ReportStatus.REJECTED,
              label: "Reject Report",
              onClick: () => handleResolve(record.id, ReportStatus.REJECTED),
            },
          ];

          const isPendingAndInvestigate =
            record.status === ReportStatus.PENDING ||
            record.status === ReportStatus.INVESTIGATING;

          return (
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                className="report-management-link-btn"
                size="small"
                ghost
                onClick={() => openDetailModal(record.id)}
                loading={isDetailLoading && activeId === record.id}
              >
                Details
              </Button>

              {isPendingAndInvestigate ? (
                <Dropdown
                  menu={{ items: resolveMenuItems }}
                  trigger={["click"]}
                  disabled={isActionLoading}
                >
                  <Button
                    size="small"
                    type="default"
                    style={{
                      backgroundColor: "#69f8dd",
                      color: "#006d75",
                      borderColor: "#87e8de",
                      fontWeight: 900,
                    }}
                  >
                    Resolve
                  </Button>
                </Dropdown>
              ) : (
                <Button
                  size="small"
                  type="default"
                  disabled
                  style={{
                    backgroundColor: "#f5f5f5",
                    color: "rgba(0, 0, 0, 0.25)",
                    borderColor: "#d9d9d9",
                    fontWeight: 600,
                  }}
                >
                  Resolve
                </Button>
              )}

              {/* <Popconfirm
                title="Delete Report"
                description="Are you sure you want to delete this report?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
                disabled={isActionLoading}
              >
                <Button size="small" type="primary" danger ghost>
                  Delete
                </Button>
              </Popconfirm> */}
            </div>
          );
        },
      },
    ],
    [isDetailLoading, isActionLoading, activeId, reports, shouldFixColumns],
  );

  return (
    <section className="bet-management">
      <style>{`
        .bet-management {
          padding: 0;
        }

        .bet-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .bet-management-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          width: auto;
        }

        .bet-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .bet-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: 0;
        }

        .bet-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .bet-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .bet-management-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
          background: #fff;
        }

        .report-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
          background: #fff;
        }

        .report-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }

        .bet-management-refresh.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        .bet-management-refresh.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }

        .bet-management-modal .ant-modal-content {
          border-radius: 8px;
        }

        @media (max-width: 1100px) {
          .bet-management-header {
            align-items: flex-start;
            flex-direction: column;
          }
          
          .bet-management-actions {
            width: 100%;
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="bet-management-header">
        <div>
          <div className="bet-management-kicker">Admin dashboard</div>
          <Title level={1}>Report Management</Title>
        </div>
        <div className="bet-management-actions">
          <Select
            placeholder="Category"
            allowClear
            value={selectedCategory}
            style={{ width: 200 }}
            onChange={(val) => {
              const nextCategory = val || null;
              setSelectedCategory(nextCategory);
              loadReports({
                status: selectedStatus,
                category: nextCategory,
              });
            }}
            onClear={() => {
              setSelectedCategory(null);
              loadReports({ status: selectedStatus, category: "" });
            }}
          >
            {Object.values(ReportCategory).map((cat) => (
              <Select.Option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Status"
            allowClear
            value={selectedStatus}
            style={{ width: 160 }}
            onChange={(val) => {
              const nextStatus = val || null;
              setSelectedStatus(nextStatus);
              loadReports({
                status: nextStatus,
                category: selectedCategory,
              });
            }}
            onClear={() => {
              setSelectedStatus(null);
              loadReports({ status: "", category: selectedCategory });
            }}
          >
            {Object.values(ReportStatus).map((status) => (
              <Select.Option key={status} value={status}>
                {getStatusDetails(status).label}
              </Select.Option>
            ))}
          </Select>

          <Button
            className="bet-management-refresh"
            onClick={() => loadReports()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="bet-management-card">
        <Table
          className="bet-management-table"
          columns={columns}
          dataSource={filteredReports}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} reports`,
          }}
          scroll={{ x: 1500 }}
        />
      </div>

      <Modal
        className="bet-management-modal"
        title="System Incident Report Details"
        open={Boolean(detailData)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setDetailData(null)}
          >
            Close
          </Button>,
        ]}
        onCancel={() => setDetailData(null)}
        width={650}
      >
        {detailData && (
          <Descriptions
            column={1}
            bordered
            size="small"
            style={{ marginTop: 15 }}
          >
            <Descriptions.Item label="ID">
              <Text strong>{detailData.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Reporter Name">
              <Text strong>{detailData.reporterName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Reporter Email">
              {detailData.reporterEmail}
            </Descriptions.Item>
            <Descriptions.Item label="Reporter ID">
              {detailData.reporterId}
            </Descriptions.Item>
            <Descriptions.Item label="Category">
              {getCategoryLabel(detailData.category)}
            </Descriptions.Item>
            <Descriptions.Item label="Description Details">
              <span style={{ whiteSpace: "pre-wrap" }}>
                {detailData.description}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Current Status">
              {(() => {
                const { color, label } = getStatusDetails(detailData.status);
                return <Tag color={color}>{label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Related Race ID">
              {detailData.relatedRaceId || "None"}
            </Descriptions.Item>
            <Descriptions.Item label="Resolved By (Admin ID)">
              {detailData.resolvedBy || "Not resolved yet"}
            </Descriptions.Item>
            <Descriptions.Item label="Admin Notes">
              {detailData.adminNotes || "No notes appended yet."}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {formatDate(detailData.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </section>
  );
}
