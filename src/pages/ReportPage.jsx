import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Tag,
  Typography,
  message,
  Spin,
  Empty,
  Card,
  ConfigProvider,
  Space,
  Form,
  Input,
  Select,
  Modal,
  Descriptions,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  createReport,
  deleteReport,
  getMyReports,
  getReportById,
} from "../api/services/report.service";

dayjs.extend(utc);

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

function formatDate(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY HH:mm:ss") : value;
}

export default function ReportPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  async function loadReports() {
    setIsLoading(true);
    try {
      const data = await getMyReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error?.message || "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }

  async function onFinish(values) {
    setIsSubmitting(true);
    try {
      const payload = {
        category: values.category,
        description: values.description,
      };
      if (values.relatedRaceId?.trim()) {
        payload.relatedRaceId = values.relatedRaceId.trim();
      }

      await createReport(payload);
      message.success("Report submitted successfully");
      form.resetFields();
      loadReports(); // Reload danh sách sau khi gửi thành công
    } catch (error) {
      message.error(error?.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function openDetailModal(id) {
    setActiveId(id);
    setIsDetailLoading(true);
    try {
      // Sử dụng service chung hoặc getReportById tùy cấu trúc hệ thống công ty của bạn
      const report = await getReportById(id);
      setDetailData({
        id: report._id || report.id,
        description: report.description || "No Description",
        category: report.category || "OTHER",
        status: report.status || "PENDING",
        adminNotes: report.adminNotes || "",
        relatedRaceId: report.relatedRaceId || null,
        createdAt: report.createdAt || "",
      });
    } catch (error) {
      message.error(error?.message || "Failed to load report details");
    } finally {
      setIsDetailLoading(false);
      setActiveId(null);
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

  const categoryConfigs = {
    MISSING_WINNING_POINTS: {
      text: "Missing Winning Points",
      color: "warning",
    },
    MISSING_COMPENSATION: { text: "Missing Compensation", color: "gold" },
    UNAUTHORIZED_DEDUCTION: { text: "Unauthorized Deduction", color: "error" },
    FROZEN_POINTS_NOT_REFUNDED: {
      text: "Frozen Points Not Refunded",
      color: "volcano",
    },
    OTHER: { text: "Other", color: "orange" },
  };

  const statusConfigs = {
    PENDING: {
      text: "PENDING",
      color: "processing",
      bg: "rgba(250, 173, 20, 0.15)",
      border: "#faad14",
    },
    RESOLVED: {
      text: "RESOLVED",
      color: "success",
      bg: "rgba(82, 196, 26, 0.15)",
      border: "#52c41a",
    },
    REJECTED: {
      text: "REJECTED",
      color: "error",
      bg: "rgba(245, 34, 45, 0.15)",
      border: "#f5222d",
    },
  };

  const columns = [
    // ... Giữ nguyên các cột cũ (Category, Status, Report Content, Created At) ...
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 200,
      render: (category) => {
        const config = categoryConfigs[category] || {
          text: category,
          color: "default",
        };
        return (
          <Tag
            color={config.color}
            style={{
              fontWeight: "600",
              backgroundColor: "#002d28",
              textTransform: "none",
              borderRadius: "4px",
            }}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => {
        const config = statusConfigs[status] || {
          text: status,
          color: "default",
          bg: "rgba(244, 255, 251, 0.05)",
          border: "rgba(244, 255, 251, 0.3)",
        };
        return (
          <Tag
            style={{
              fontSize: "12px",
              padding: "2px 8px",
              fontWeight: "700",
              background: config.bg,
              border: `1px solid ${config.border}`,
              color: config.border,
            }}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Report Content",
      key: "report_content",
      render: (_, record) => (
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Paragraph
            style={{
              color: "#e2f1ec",
              margin: 0,
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {record.description}
          </Paragraph>
          {record.relatedRaceId && (
            <Text
              style={{ color: "rgba(105, 248, 221, 0.7)", fontSize: "12px" }}
            >
              Related Race ID: {record.relatedRaceId}
            </Text>
          )}
          {record.adminNotes && (
            <div
              style={{
                background: "rgba(245, 34, 45, 0.05)",
                borderLeft: "3px solid #f5222d",
                padding: "4px 8px",
                marginTop: "4px",
              }}
            >
              <Text strong style={{ color: "#ff4d4f", fontSize: "13px" }}>
                Admin Response:{" "}
              </Text>
              <Text
                style={{ color: "rgba(244, 255, 251, 0.85)", fontSize: "13px" }}
              >
                {record.adminNotes}
              </Text>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => (
        <Text style={{ color: "rgba(244, 255, 251, 0.5)" }}>
          {date ? dayjs.utc(date).format("YYYY-MM-DD HH:mm:ss") : "N/A"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, record) => {
        // Lấy ID thực tế dựa theo dữ liệu bản ghi
        const targetId = record._id || record.id;

        return (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              size="small"
              type="primary"
              ghost
              onClick={() => openDetailModal(targetId)}
              loading={isDetailLoading && activeId === targetId}
            >
              Details
            </Button>

            {/* <Popconfirm
              title="Delete Report"
              description="Are you sure you want to delete this report?"
              onConfirm={() => handleDelete(targetId)}
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
  ];

  return (
    <main className="reports-page">
      <style>{`
        .reports-page {
          min-height: 100vh;
          background: #002d28;
          color: #f4fffb;
          padding: 50px 24px;
          font-family: Inter, sans-serif;
        }
        .reports-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .reports-header {
          margin-bottom: 40px;
        }
        .reports-header h1.ant-typography {
          color: #69f8dd;
          margin: 0 0 12px 0;
          font-weight: 950;
          font-size: clamp(32px, 5vw, 46px);
          letter-spacing: -0.5px;
        }
        .reports-header p.ant-typography {
          color: #e2f1ec;
          font-size: 18px;
          line-height: 1.6;
          margin: 0;
          max-width: 800px;
        }
        
        .report-form-card {
          background: rgba(0, 68, 60, 0.3) !important;
          border: 2px solid rgba(105, 248, 221, 0.1) !important;
          border-radius: 12px;
          margin-bottom: 32px;
        }
        .report-form-card .ant-card-head {
          border-bottom: 1px solid rgba(105, 248, 221, 0.15) !important;
        }
        .report-form-card .ant-card-head-title {
          color: #69f8dd !important;
          font-weight: 700;
        }
        
        .ant-form-item-label > label {
          color: #ffffff !important;
          font-weight: 600;
        }
        .ant-input, .ant-select-selector {
          background: rgba(0, 20, 18, 0.9) !important; /* Làm nền tối hơn để chữ nổi lên */
          border: 1px solid rgba(105, 248, 221, 0.4) !important; /* Tăng độ sáng viền */
          color: #ffffff !important;
          border-radius: 6px !important;
        }
        .ant-input::placeholder {
          color: rgba(255, 255, 255, 0.45) !important;
        }
        .ant-input:focus, .ant-input-focused, .ant-select-focused .ant-select-selector {
          border-color: #69f8dd !important;
          box-shadow: 0 0 0 2px rgba(105, 248, 221, 0.2) !important;
        }
        .ant-select-arrow {
          color: #69f8dd !important;
        }
        .ant-select-dropdown {
          background: #00201c !important; /* Khớp với màu nền input */
          border: 1px solid #69f8dd !important; /* Viền sáng màu teal công nghệ */
          padding: 4px !important;
        }
        .ant-select-item {
          margin: 2px 0;
          border-radius: 4px;
          color: #ffffff !important;
        }
        .ant-select-item-option-active {
          background: rgba(105, 248, 221, 0.15) !important;
        }
        .ant-select-item-option-selected {
          background: #69f8dd !important;
          color: #002d28 !important;
          font-weight: 700;
        }
        .reports-page .report-category-select.ant-select {
          width: 100%;
          height: 40px;
        }
        .reports-page .report-category-select.ant-select .ant-select-selector {
          background: #001c19 !important;
          border-color: rgba(105, 248, 221, 0.42) !important;
          color: #f4fffb !important;
          box-shadow: none !important;
        }
        .reports-page .report-category-select.ant-select:hover .ant-select-selector,
        .reports-page .report-category-select.ant-select-focused .ant-select-selector {
          border-color: #69f8dd !important;
        }
        .reports-page .report-category-select .ant-select-selection-placeholder {
          color: rgba(205, 245, 238, 0.5) !important;
        }
        .reports-page .report-category-select .ant-select-selection-item {
          color: #f4fffb !important;
          font-weight: 600;
        }
        .reports-page .report-category-select .ant-select-arrow {
          color: #69f8dd !important;
        }
        .report-category-dropdown.ant-select-dropdown {
          background: #002722 !important;
          border: 1px solid rgba(105, 248, 221, 0.42) !important;
          border-radius: 8px !important;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.4) !important;
        }
        .report-category-dropdown .ant-select-item-option {
          color: #e7faf6 !important;
          border-radius: 6px;
        }
        .report-category-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
          background: rgba(105, 248, 221, 0.12) !important;
        }
        .report-category-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
          color: #052a26 !important;
          background: #69f8dd !important;
        }
        .report-category-dropdown .ant-select-item-option-state {
          color: #087a6d !important;
        }

        .reports-table-card {
          background: rgba(0, 68, 60, 0.4) !important;
          border: 2px solid rgba(105, 248, 221, 0.15) !important;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .ant-table {
          background: transparent !important;
          color: #ffffff !important;
        }
        .ant-table-thead > tr > th {
          background: rgba(0, 32, 28, 0.8) !important;
          color: #69f8dd !important;
          font-weight: 800 !important;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
          border-bottom: 2px solid rgba(105, 248, 221, 0.15) !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(105, 248, 221, 0.08) !important;
          padding: 16px 16px !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: rgba(105, 248, 221, 0.05) !important;
        }

        .ant-pagination-item {
          background: rgba(0, 32, 28, 0.6) !important;
          border-color: rgba(105, 248, 221, 0.2) !important;
        }
        .ant-pagination-item a {
          color: rgba(244, 255, 251, 0.6) !important;
        }
        .ant-pagination-item-active {
          border-color: #69f8dd !important;
          background: #69f8dd !important;
        }
        .ant-pagination-item-active a {
          color: #062724 !important;
          font-weight: 700;
        }
        .ant-pagination-prev .ant-pagination-item-link, 
        .ant-pagination-next .ant-pagination-item-link {
          background: rgba(0, 32, 28, 0.6) !important;
          color: #69f8dd !important;
          border-color: rgba(105, 248, 221, 0.2) !important;
        }

        .reports-loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
        }
        .ant-empty-description {
          color: #a3c2ba !important;
          font-size: 16px;
        }
      `}</style>

      <div className="reports-container">
        <header className="reports-header">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/home")}
            style={{
              color: "#69f8dd",
              padding: 0,
              marginBottom: "16px",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "700",
            }}
          >
            Back to Home
          </Button>
          <div>
            <Title level={1}>Support & Reports</Title>
            <Paragraph style={{ color: "#cdf5ee", fontSize: "20px" }}>
              Submit system issues, missing winning points, or wallet lock
              anomalies to administration. Track ticket updates below.
            </Paragraph>
          </div>
        </header>

        {/* Khu vực tạo báo cáo mới */}
        <Card
          title="File a New Report"
          className="report-form-card"
          icon={<FileProtectOutlined />}
        >
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "16px",
              }}
            >
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: "#69f8dd",
                    colorBgContainer: "#001c19",
                    colorBgElevated: "#002722",
                    colorBorder: "rgba(105, 248, 221, 0.42)",
                    colorText: "#f4fffb",
                    colorTextPlaceholder: "rgba(205, 245, 238, 0.5)",
                  },
                  components: {
                    Select: {
                      selectorBg: "#001c19",
                      hoverBorderColor: "#69f8dd",
                      activeBorderColor: "#69f8dd",
                      activeOutlineColor: "rgba(105, 248, 221, 0.18)",
                      optionActiveBg: "rgba(105, 248, 221, 0.12)",
                      optionSelectedBg: "#69f8dd",
                      optionSelectedColor: "#052a26",
                    },
                  },
                }}
              >
                <Form.Item
                  name="category"
                  label="Issue Category"
                  rules={[
                    { required: true, message: "Please select a category" },
                  ]}
                >
                  <Select
                    className="report-category-select"
                    popupClassName="report-category-dropdown"
                    placeholder="Select issue category"
                  >
                    <Select.Option value="MISSING_WINNING_POINTS">
                      Missing Winning Points
                    </Select.Option>
                    <Select.Option value="MISSING_COMPENSATION">
                      Missing Compensation
                    </Select.Option>
                    <Select.Option value="UNAUTHORIZED_DEDUCTION">
                      Unauthorized Deduction
                    </Select.Option>
                    <Select.Option value="FROZEN_POINTS_NOT_REFUNDED">
                      Frozen Points Not Refunded
                    </Select.Option>
                    <Select.Option value="OTHER">Other</Select.Option>
                  </Select>
                </Form.Item>
              </ConfigProvider>
              <Form.Item
                name="relatedRaceId"
                label="Related Race ID (Optional)"
              >
                <Input placeholder="Enter race identifier if applicable" />
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Detailed Description"
              rules={[
                {
                  required: true,
                  message: "Please provide details about the issue",
                },
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Describe what happened clearly so our staff can verify and resolve your issue immediately..."
              />
            </Form.Item>

            <Form.Item style={{ margin: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={isSubmitting}
                style={{
                  background: "#69f8dd",
                  color: "#002d28",
                  border: "none",
                  fontWeight: "700",
                  height: "40px",
                  borderRadius: "6px",
                  padding: "0 24px",
                }}
              >
                Submit Ticket
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Khu vực lịch sử báo cáo */}
        <Title
          level={3}
          style={{ color: "#69f8dd", marginBottom: "16px", fontWeight: "800" }}
        >
          Report Logs & History
        </Title>

        {isLoading ? (
          <div className="reports-loading-container">
            <Spin size="large" />
          </div>
        ) : reports.length === 0 ? (
          <Card className="reports-table-card">
            <Empty description="No report logs filed yet" />
          </Card>
        ) : (
          <Card className="reports-table-card">
            <Table
              dataSource={reports}
              columns={columns}
              rowKey="_id"
              pagination={{
                pageSize: 5,
                showTotal: (total, range) => (
                  <span style={{ color: "#a3c2ba" }}>
                    Showing {range[0]}-{range[1]} of {total} tickets
                  </span>
                ),
              }}
            />
          </Card>
        )}
      </div>

      <Modal
        title="Incident Report Details"
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
        width={600}
      >
        {detailData && (
          <Descriptions
            column={1}
            bordered
            size="small"
            style={{ marginTop: 15 }}
          >
            <Descriptions.Item label="Ticket ID">
              <Text strong>{detailData.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Category">
              {categoryConfigs[detailData.category]?.text ||
                detailData.category}
            </Descriptions.Item>
            <Descriptions.Item label="Current Status">
              {(() => {
                const config = statusConfigs[detailData.status] || {
                  text: detailData.status,
                  border: "#ccc",
                };
                return (
                  <Tag
                    style={{
                      fontWeight: "700",
                      color: config.border,
                      borderColor: config.border,
                    }}
                  >
                    {config.text}
                  </Tag>
                );
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Related Race ID">
              {detailData.relatedRaceId || "None"}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {formatDate(detailData.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Description Details">
              <span style={{ whiteSpace: "pre-wrap" }}>
                {detailData.description}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Admin Response">
              {detailData.adminNotes ? (
                <Text type="danger" strong>
                  {detailData.adminNotes}
                </Text>
              ) : (
                <Text type="secondary">No responses from admin yet.</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </main>
  );
}
