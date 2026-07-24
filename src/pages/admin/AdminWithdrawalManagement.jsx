import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Descriptions,
} from "antd";
import "antd/dist/reset.css";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import {
  approveWithdrawal,
  getAllWithdrawalRequests,
  getWithdrawalDetail,
  rejectWithdrawal,
} from "../../api/services/withdrawal.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const { Text, Title } = Typography;
const { Search } = Input;

function pick(source, keys, fallback = "") {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }
  return fallback;
}

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  return [];
}

function formatDate(value) {
  if (!value) return "N/A";
  if (typeof value === "string" && value.includes("/")) {
    return value;
  }
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY HH:mm:ss") : value;
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
  const aTime = Math.max(
    getTimeValue(a.createdAt),
    getTimeValue(a.updatedAt),
    getObjectIdTime(a.id),
  );
  const bTime = Math.max(
    getTimeValue(b.createdAt),
    getTimeValue(b.updatedAt),
    getObjectIdTime(b.id),
  );
  return bTime - aTime;
}

function normalizeWithdrawal(item, index) {
  const id = pick(item, ["id", "_id"], `request-${index}`);
  const userRaw = item?.userId || {};

  return {
    key: id,
    id,
    userId: pick(userRaw, ["id", "_id"], "N/A"),
    fullName: pick(userRaw, ["fullName", "name"], "N/A"),
    email: pick(userRaw, ["email"], "N/A"),
    role: pick(userRaw, ["role"], "N/A"),
    bankName: pick(item, ["bankName"], "N/A"),
    accountNumber: pick(item, ["accountNumber"], "N/A"),
    accountName: pick(item, ["accountName"], "N/A"),
    amount: item?.amount || 0,
    content: pick(item, ["content"], ""),
    status: pick(item, ["status"], "PENDING"),
    adminNote: pick(item, ["adminNote"], ""),
    createdAt: pick(item, ["createdAt"], ""),
    updatedAt: pick(item, ["updatedAt"], ""),
  };
}

function statusColor(status) {
  const normalizedStatus = String(status).toUpperCase();
  if (normalizedStatus === "APPROVED") return "green";
  if (normalizedStatus === "REJECTED") return "red";
  return "orange";
}

export default function AdminWithdrawalManagement() {
  const [form] = Form.useForm();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [loadingDetailId, setLoadingDetailId] = useState(null);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadWithdrawals({
    status = selectedStatus,
    search = searchKey,
  } = {}) {
    setIsLoading(true);
    try {
      const response = await getAllWithdrawalRequests({
        status,
        search: search?.trim(),
      });
      setRequests(
        resolveList(response)
          .map(normalizeWithdrawal)
          .sort(sortNewestRequestFirst),
      );
    } catch (error) {
      message.error(
        error?.message || "Failed to load withdrawal requests list",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const filteredRequests = useMemo(() => requests, [requests]);

  async function openDetailModal(id) {
    setLoadingDetailId(id);
    try {
      const data = await getWithdrawalDetail(id);
      setDetailData(data);
    } catch (error) {
      message.error(
        error?.message || "Failed to load withdrawal request details",
      );
    } finally {
      setLoadingDetailId(null);
    }
  }

  function openActionModal(request) {
    setSelectedRequest(request);
    form.setFieldsValue({
      adminNote: request.adminNote || "",
    });
  }

  async function handleApprove() {
    const values = await form.validateFields();
    setIsActionLoading(true);
    try {
      await approveWithdrawal(selectedRequest.id, {
        adminNote: values.adminNote,
      });
      message.success("Withdrawal disbursement approved successfully");
      setSelectedRequest(null);
      loadWithdrawals();
    } catch (error) {
      message.error(error?.message || "Approval failed");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleReject() {
    const values = await form.validateFields();
    if (!values.adminNote || values.adminNote.trim() === "") {
      message.warning("Please enter the reason for rejection in the notes");
      return;
    }
    setIsActionLoading(true);
    try {
      await rejectWithdrawal(selectedRequest.id, {
        adminNote: values.adminNote,
      });
      message.success(
        "Cancelled and refunded amount to user wallet successfully",
      );
      setSelectedRequest(null);
      loadWithdrawals();
    } catch (error) {
      message.error(error?.message || "Rejection failed");
    } finally {
      setIsActionLoading(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "Requester",
        dataIndex: "fullName",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 180,
        render: (text, record) => (
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.email}
            </Text>
          </div>
        ),
      },
      //   {
      //     title: "Role",
      //     dataIndex: "role",
      //     width: 130,
      //   },
      {
        title: "Bank Name",
        dataIndex: "bankName",
        width: 140,
      },
      {
        title: "Account Number",
        dataIndex: "accountNumber",
        width: 150,
      },
      {
        title: "Account Name",
        dataIndex: "accountName",
        width: 160,
      },
      {
        title: "Amount (VNĐ)",
        dataIndex: "amount",
        width: 130,
        render: (val) => <Text strong>{val?.toLocaleString("vi-VN")}</Text>,
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 130,
        render: (status) => <Tag color={statusColor(status)}>{status}</Tag>,
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
        width: 180,
        render: (_, record) => (
          <Space>
            <Button
              className="withdrawal-management-link-btn"
              size="small"
              ghost
              loading={loadingDetailId === record.id}
              onClick={() => openDetailModal(record.id)}
            >
              Details
            </Button>
            {record.status === "PENDING" ? (
              <Button
                className="withdrawal-management-link-btn"
                size="small"
                style={{
                  width: 85,
                  textAlign: "center",
                  backgroundColor: "#69f8dd",
                }}
                onClick={() => openActionModal(record)}
              >
                Process
              </Button>
            ) : (
              <Button
                disabled
                className="withdrawal-resolved-management-link-btn"
                size="small"
                style={{ width: 85, textAlign: "center" }}
              >
                Resolved
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [isDetailLoading, shouldFixColumns],
  );

  return (
    <section className="withdrawal-management">
      <style>{`
        .withdrawal-management {
          padding: 0;
        }

        .withdrawal-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .withdrawal-management-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          width: auto;
        }

        .withdrawal-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .withdrawal-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: 0;
        }

        .withdrawal-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .withdrawal-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .withdrawal-management-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
          background: #fff;
        }

        .withdrawal-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
          background: #fff;
        }

        .withdrawal-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }

        .withdrawal-resolved-management-link-btn.ant-btn:disabled {
        border-color: #b7eb8f;
        color: #389e0d;
        font-weight: 850;
        background: #f6ffed;
        opacity: 0.7;
        }

        // .withdrawal-resolved-management-link-btn.ant-btn:hover {
        //   border-color: #f4f800 !important;
        //   color: #006755 !important;
        // }

        .withdrawal-management-refresh.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        .withdrawal-management-refresh.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }

        .withdrawal-management-modal .ant-modal-content {
          border-radius: 8px;
        }

        @media (max-width: 920px) {
          .withdrawal-management-header {
            align-items: flex-start;
            flex-direction: column;
          }
          
          .withdrawal-management-actions {
            width: 100%;
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="withdrawal-management-header">
        <div>
          <div className="withdrawal-management-kicker">Admin dashboard</div>
          <Title level={1}>Withdrawal Management</Title>
        </div>
        <div className="withdrawal-management-actions">
          <Select
            placeholder="Status"
            allowClear
            value={selectedStatus}
            style={{ width: 180 }}
            onChange={(val) => {
              const nextStatus = val || null;
              setSelectedStatus(nextStatus);
              loadWithdrawals({ status: nextStatus, search: searchKey });
            }}
            onClear={() => {
              setSelectedStatus(null);
              loadWithdrawals({ status: "", search: searchKey });
            }}
          >
            <Select.Option value="PENDING">PENDING</Select.Option>
            <Select.Option value="APPROVED">APPROVED</Select.Option>
            <Select.Option value="REJECTED">REJECTED</Select.Option>
          </Select>

          <Search
            className="withdrawal-management-search-input"
            placeholder="Search by User name"
            allowClear
            enterButton="Search"
            size="middle"
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            onSearch={(value) =>
              loadWithdrawals({ status: selectedStatus, search: value })
            }
            onClear={() => {
              setSearchKey("");
              loadWithdrawals({ status: selectedStatus, search: "" });
            }}
          />
          <Button
            className="withdrawal-management-refresh"
            onClick={() => loadWithdrawals()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="withdrawal-management-card">
        <Table
          className="withdrawal-management-table"
          columns={columns}
          dataSource={filteredRequests}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} requests`,
          }}
          scroll={{ x: 1600 }}
        />
      </div>

      {/* MODAL XỬ LÝ DUYỆT / TỪ CHỐI */}
      <Modal
        className="withdrawal-management-modal"
        title="Process Withdrawal Request"
        open={Boolean(selectedRequest)}
        confirmLoading={isActionLoading}
        onCancel={() => setSelectedRequest(null)}
        footer={[
          <Button key="cancel" onClick={() => setSelectedRequest(null)}>
            Cancel
          </Button>,
          <Button
            key="reject"
            danger
            loading={isActionLoading}
            onClick={handleReject}
          >
            Reject Request
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={isActionLoading}
            onClick={handleApprove}
          >
            Approve Disbursement
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div style={{ marginTop: 15 }}>
            <Descriptions
              column={1}
              bordered
              size="small"
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="Account Holder">
                {selectedRequest.accountName}
              </Descriptions.Item>
              <Descriptions.Item label="Withdrawal Amount">
                {selectedRequest.amount?.toLocaleString("vi-VN")} VNĐ
              </Descriptions.Item>
              <Descriptions.Item label="Description">
                {selectedRequest.content || "None"}
              </Descriptions.Item>
            </Descriptions>
            <Form form={form} layout="vertical">
              <Form.Item
                label="Admin Feedback (Note transaction reference or reason for rejection)"
                name="adminNote"
                rules={[
                  {
                    required: true,
                    message: "Please enter system feedback notes",
                  },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Enter processing details..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* MODAL XEM CHI TIẾT ĐƠN */}
      <Modal
        className="withdrawal-management-modal"
        title="System Withdrawal Request Details"
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
            <Descriptions.Item label="Request ID">
              {detailData._id || detailData.id}
            </Descriptions.Item>
            <Descriptions.Item label="Requested By">
              {detailData.userId?.fullName}
            </Descriptions.Item>
            <Descriptions.Item label="User ID">
              {detailData.userId?._id ||
                detailData.userId?.id ||
                detailData.userId ||
                "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Email">
              {detailData.userId?.email}
            </Descriptions.Item>
            <Descriptions.Item label="System Role">
              <span style={{ color: "green" }}>{detailData.userId?.role}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Transaction Bank">
              {detailData.bankName}
            </Descriptions.Item>
            <Descriptions.Item label="Receiving Account Number">
              {detailData.accountNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Identified Account Name">
              {detailData.accountName}
            </Descriptions.Item>
            <Descriptions.Item label="Requested Amount">
              {detailData.amount?.toLocaleString("vi-VN")} VNĐ
            </Descriptions.Item>
            <Descriptions.Item label="User Content">
              {detailData.content || "Empty"}
            </Descriptions.Item>
            <Descriptions.Item label="Approval Status">
              <Tag color={statusColor(detailData.status)}>
                {detailData.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="System Notes">
              {detailData.adminNote || "No notes available"}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {formatDate(detailData.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {formatDate(detailData.updatedAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </section>
  );
}
