import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import "antd/dist/reset.css";
import {
  getAllContracts,
  completeContract,
  getJockeyInvitationById,
  getContractDetailByInvitationId,
  getBreachByContractId,
  processBreachReportByAdmin,
} from "../../api/services/jockey.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";
import { getTournaments } from "../../api/services/tournament.service";
import { getUsers } from "../../api/services/user.service";
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
  return date.isValid() ? date.format("DD/MM/YYYY") : value;
}

function formatMoney(value) {
  if (value === undefined || value === null) return "N/A";
  return Number(value).toLocaleString("vi-VN") + " VND";
}

function normalizeUser(user, index) {
  const id = pick(user, ["id", "_id", "userId"], `user-${index}`);
  const status = pick(user, ["status", "accountStatus", "isActive"], "Active");
  const rawRole = pick(user, ["role", "roleName", "type"], "Spectator");

  // Chuẩn hóa tên role theo đúng định dạng chuỗi route của Swagger API
  let normalizedRole = "Spectator";
  const lowerRole = rawRole.toLowerCase();
  if (lowerRole.includes("jockey")) normalizedRole = "Jockey";
  else if (lowerRole.includes("referee")) normalizedRole = "Referee";
  else if (lowerRole.includes("owner") || lowerRole.includes("horse"))
    normalizedRole = "Horse-Owner";

  return {
    key: id,
    id,
    avatar: pick(user, ["avatar", "avatarUrl", "imageUrl", "photoUrl"], ""),
    email: pick(user, ["email", "mail"], "N/A"),
    fullName: pick(
      user,
      ["fullName", "name", "displayName", "username"],
      "Unnamed User",
    ),
    dateOfBirth: pick(user, ["dateOfBirth", "dob", "birthDate"], ""),
    phoneNumber: pick(user, ["phoneNumber", "phone", "mobile"], "N/A"),
    address: pick(user, ["address", "location"], "N/A"),
    gender:
      user?.gender !== undefined && user?.gender !== null
        ? Number(user.gender)
        : 1,
    role: normalizedRole,
    status:
      typeof status === "boolean" ? (status ? "Active" : "Disabled") : status,
    weight: user?.weight,
    height: user?.height,
    experienceYears: user?.experienceYears,
    certification: user?.certification,
    stableName: user?.stableName,
    stableAddress: user?.stableAddress,
    createdAt: pick(user, ["createdAt", "createdDate", "registeredAt"], ""),
    updatedAt: pick(user, ["updatedAt", "modifiedAt"], ""),
  };
}

function normalizeContract(
  contract,
  index,
  usersMap = new Map(),
  tournamentsMap = new Map(),
) {
  const id = pick(contract, ["id", "_id", "contractId"], `contract-${index}`);
  const invitationId = pick(
    contract,
    ["invitationId", "invitation", "jockeyInvitationId"],
    id,
  );

  const jockeyId = pick(
    contract,
    ["jockeyId", "jockey._id", "jockey.id", "jockey"],
    "",
  );
  const ownerId = pick(
    contract,
    ["horseOwnerId", "ownerId", "owner._id", "owner.id", "owner"],
    "",
  );
  const tournamentId = pick(
    contract,
    ["tournamentId", "tournament._id", "tournament.id", "tournament"],
    "",
  );

  const jockeyFromMap = usersMap.get(jockeyId);
  const ownerFromMap = usersMap.get(ownerId);
  const tournamentFromMap = tournamentsMap.get(tournamentId);

  return {
    key: id,
    id,
    invitationId,
    contractNumber: pick(
      contract,
      ["contractNumber", "code", "contractCode"],
      id,
    ),
    tournamentTitle:
      pick(
        contract,
        ["tournamentTitle", "tournamentName", "tournament.title"],
        "",
      ) ||
      tournamentFromMap?.title ||
      "N/A",
    tournamentId,
    jockeyName:
      pick(
        contract,
        ["jockeyName", "jockeyFullName", "jockey.fullName", "jockey.name"],
        "",
      ) ||
      jockeyFromMap?.fullName ||
      "N/A",
    ownerName:
      pick(
        contract,
        ["ownerName", "horseOwnerName", "owner.fullName", "owner.name"],
        "",
      ) ||
      ownerFromMap?.fullName ||
      "N/A",
    status: pick(contract, ["status", "contractStatus"], "Pending"),
    salary: pick(
      contract,
      ["contractAmount", "salary", "amount", "agreedAmount"],
      null,
    ),
    ownerShareRate: contract?.ownerShareRate ?? "N/A",
    jockeyShareRate: contract?.jockeyShareRate ?? "N/A",
    ownerCompensationRate: contract?.ownerCompensationRate ?? "N/A",
    jockeyCompensationRate: contract?.jockeyCompensationRate ?? "N/A",
    signedAt: pick(contract, ["signedAt", "createdAt", "startDate"], ""),
    completedAt: pick(contract, ["completedAt", "endedAt", "updatedAt"], ""),
    raw: contract,
  };
}

function normalizeTournament(item, index) {
  const id = item?._id || item?.id || `tournament-${index}`;

  return {
    key: id,
    id,
    title: item?.title || "Untitled",
    startDate: item?.startDate || "",
    endDate: item?.endDate || "",
    location: item?.location || "",
    status: item?.status || "Preparing",
    availableSlot: item?.availableSlot ?? "N/A",
  };
}

function getContractStatusColor(status) {
  switch (status) {
    case "ACTIVE":
      return "blue";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
      return "red";
    case "BREACHED":
      return "volcano";
    case "DISPUTED":
      return "orange";
    default:
      return "default";
  }
}

function ContractManagement() {
  const [contracts, setContracts] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [selectedTournamentFilter, setSelectedTournamentFilter] =
    useState(null);

  // Actions state
  const [completingId, setCompletingId] = useState(null);
  const [selectedContractDetail, setSelectedContractDetail] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // --- BỔ SUNG STATE CHO ĐƠN VI PHẠM ---
  const [breachDetail, setBreachDetail] = useState(null);
  const [isBreachLoading, setIsBreachLoading] = useState(false);
  const [isBreachModalOpen, setIsBreachModalOpen] = useState(false);

  const [isProcessingBreach, setIsProcessingBreach] = useState(false);

  const shouldFixColumns = useAdminTableFixedColumns();

  const usersMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const tournamentsMap = useMemo(
    () => new Map(tournaments.map((t) => [t.id, t])),
    [tournaments],
  );

  async function loadTournaments() {
    try {
      const response = await getTournaments();
      setTournaments(resolveList(response).map(normalizeTournament));
    } catch (error) {
      message.error(error?.message || "Unable to load tournaments");
    }
  }

  async function loadContracts() {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedStatusFilter) params.status = selectedStatusFilter;
      if (selectedTournamentFilter)
        params.tournamentId = selectedTournamentFilter;

      const response = await getAllContracts(params);
      const data = resolveList(response);

      // SỬA TẠI ĐÂY: Truyền đầy đủ usersMap và tournamentsMap hiện tại vào hàm chuẩn hóa
      setContracts(
        data.map((c, i) => normalizeContract(c, i, usersMap, tournamentsMap)),
      );
    } catch (error) {
      message.error(error?.message || "Unable to load contracts");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [tournamentsRes, usersRes, contractsRes] = await Promise.all([
          getTournaments(),
          getUsers(),
          getAllContracts({
            ...(selectedStatusFilter && { status: selectedStatusFilter }),
            ...(selectedTournamentFilter && {
              tournamentId: selectedTournamentFilter,
            }),
          }),
        ]);

        if (isMounted) {
          const tournamentList =
            resolveList(tournamentsRes).map(normalizeTournament);
          const userList = resolveList(usersRes).map(normalizeUser);
          const rawContracts = resolveList(contractsRes);

          const tempUsersMap = new Map(userList.map((u) => [u.id, u]));
          const tempTournamentsMap = new Map(
            tournamentList.map((t) => [t.id, t]),
          );

          setTournaments(tournamentList);
          setUsers(userList);
          setContracts(
            rawContracts.map((c, i) =>
              normalizeContract(c, i, tempUsersMap, tempTournamentsMap),
            ),
          );
        }
      } catch (error) {
        if (isMounted) {
          message.error(error?.message || "Unable to load page data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedStatusFilter, selectedTournamentFilter]);

  async function handleCompleteContract(contractId) {
    setCompletingId(contractId);
    try {
      await completeContract(contractId);
      message.success("Contract marked as completed successfully");

      setContracts((current) =>
        current.map((item) =>
          item.id === contractId ? { ...item, status: "COMPLETED" } : item,
        ),
      );
    } catch (error) {
      message.error(error?.message || "Failed to complete contract");
    } finally {
      setCompletingId(null);
    }
  }

  async function handleViewDetail(record) {
    setIsDetailLoading(true);
    setSelectedContractDetail(record);
    try {
      const detailRes = await getContractDetailByInvitationId(
        record.invitationId || record.id,
      );

      const detailData = detailRes?.data || detailRes;

      if (detailData) {
        const normalizedDetail = normalizeContract(
          detailData,
          0,
          usersMap,
          tournamentsMap,
        );

        setSelectedContractDetail({
          ...record,
          ...normalizedDetail,
          // Ưu tiên giữ lại tên từ record hàng nếu dữ liệu detail bị thiếu
          tournamentTitle:
            normalizedDetail.tournamentTitle !== "N/A"
              ? normalizedDetail.tournamentTitle
              : record.tournamentTitle,
          jockeyName:
            normalizedDetail.jockeyName !== "N/A"
              ? normalizedDetail.jockeyName
              : record.jockeyName,
          ownerName:
            normalizedDetail.ownerName !== "N/A"
              ? normalizedDetail.ownerName
              : record.ownerName,
        });
      }
    } catch (error) {
      // Giữ nguyên record nếu gọi API detail bị lỗi
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function handleViewBreach(contractId) {
    setIsBreachLoading(true);
    setIsBreachModalOpen(true);
    setBreachDetail(null);
    try {
      const response = await getBreachByContractId(contractId);
      // Giả định response trả trực tiếp object hoặc bọc trong thuộc tính data
      setBreachDetail(response?.data || response);
    } catch (error) {
      message.error(error?.message || "Unable to load breach report details");
      setIsBreachModalOpen(false);
    } finally {
      setIsBreachLoading(false);
    }
  }

  async function handleProcessBreach(isApproved) {
    const breachId = breachDetail?.id || breachDetail?._id;
    if (!breachId) {
      message.error("Invalid Breach Report ID");
      return;
    }

    setIsProcessingBreach(true);
    try {
      const adminReason = isApproved
        ? "Approved by Admin"
        : "Rejected by Admin";

      await processBreachReportByAdmin(breachId, { isApproved, adminReason });
      message.success(
        `Breach report has been ${isApproved ? "approved" : "rejected"} successfully`,
      );

      // CẬP NHẬT TRỰC TIẾP STATE Ở LOCAL KHÔNG CẦN GỌI LẠI API CẢ BẢNG
      if (selectedContractDetail?.id) {
        setContracts((current) =>
          current.map((item) =>
            item.id === selectedContractDetail.id
              ? { ...item, status: isApproved ? "BREACHED" : "ACTIVE" } // Thay đổi trạng thái tùy thuộc vào logic nghiệp vụ của bạn
              : item,
          ),
        );
      }

      // Đóng modal vi phạm
      setIsBreachModalOpen(false);

      // Nếu muốn chắc chắn dữ liệu đồng bộ, hãy truyền đủ usersMap và tournamentsMap vào hàm loadContracts sửa đổi phía dưới
      // loadContracts();
    } catch (error) {
      message.error(error?.message || "Failed to process breach report");
    } finally {
      setIsProcessingBreach(false);
    }
  }

  const columns = useMemo(
    () => [
      // {
      //   title: "Contract Code",
      //   dataIndex: "contractNumber",
      //   fixed: shouldFixColumns ? "left" : undefined,
      //   width: 160,
      //   render: (text) => <Text strong>{text}</Text>,
      // },
      {
        title: "Tournament Title",
        dataIndex: "tournamentTitle",
        width: 220,
      },
      {
        title: "Jockey",
        dataIndex: "jockeyName",
        width: 180,
      },
      {
        title: "Horse Owner",
        dataIndex: "ownerName",
        width: 180,
      },
      {
        title: "Amount",
        dataIndex: "salary",
        width: 150,
        render: formatMoney,
      },
      {
        title: "Signed Date",
        dataIndex: "signedAt",
        width: 140,
        render: (value) => formatDate(value),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 140,
        render: (status) => (
          <Tag
            color={getContractStatusColor(status)}
            style={{ fontWeight: 600 }}
          >
            {status}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 240, // Tăng nhẹ width để vừa cấu trúc nút mới nếu cần
        render: (_, record) => {
          const isCompleted = record.status === "COMPLETED";
          const isBreached = record.status === "BREACHED"; // <-- Kiểm tra trạng thái vi phạm
          const isDisputed = record.status === "DISPUTED"; // <-- Kiểm tra trạng thái chờ duyệt vi phạm

          const shouldShowBreach = isBreached || isDisputed;

          return (
            <Space size="small">
              <Button
                className="user-management-link-btn"
                size="small"
                onClick={() => handleViewDetail(record)}
              >
                View Detail
              </Button>

              {/* --- BỔ SUNG NÚT XEM VI PHẠM --- */}
              {shouldShowBreach && (
                <Button
                  danger
                  size="small"
                  onClick={() => handleViewBreach(record.id)}
                  style={{ fontWeight: 700 }}
                >
                  View Breach
                </Button>
              )}

              {!isCompleted && !shouldShowBreach && (
                <Popconfirm
                  title="Complete Contract"
                  description="Are you sure you want to mark this contract as completed?"
                  onConfirm={() => handleCompleteContract(record.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="primary"
                    size="small"
                    loading={completingId === record.id}
                    style={{
                      backgroundColor: "#007a68",
                      borderColor: "#007a68",
                      fontWeight: 700,
                    }}
                  >
                    Complete
                  </Button>
                </Popconfirm>
              )}
            </Space>
          );
        },
      },
    ],
    [completingId, shouldFixColumns],
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
          flex-wrap: wrap;
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
          <Title level={1}>Contract Management</Title>
        </div>
        <div className="user-management-actions">
          <Select
            placeholder="Filter by Tournament"
            allowClear
            style={{ width: 230 }}
            onChange={(val) => setSelectedTournamentFilter(val)}
            options={tournaments.map((t) => ({
              value: t.id,
              label: t.title,
            }))}
          />

          <Select
            placeholder="Filter by Status"
            allowClear
            style={{ width: 170 }}
            onChange={(val) => setSelectedStatusFilter(val)}
          >
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="COMPLETED">Completed</Select.Option>
            <Select.Option value="CANCELLED">Cancelled</Select.Option>
            <Select.Option value="BREACHED">Breached</Select.Option>
          </Select>

          <Button className="user-management-refresh" onClick={loadContracts}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="user-management-card">
        <Table
          className="user-management-table"
          columns={columns}
          dataSource={contracts}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} contracts`,
          }}
          scroll={{ x: 1200 }}
        />
      </div>

      <Modal
        title={`Contract Detail - ${selectedContractDetail?.contractNumber || ""}`}
        open={Boolean(selectedContractDetail)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setSelectedContractDetail(null)}>
            Close
          </Button>,
        ]}
        onCancel={() => setSelectedContractDetail(null)}
      >
        <Descriptions
          bordered
          column={2}
          size="small"
          loading={isDetailLoading}
          style={{ marginTop: 16 }}
        >
          <Descriptions.Item label="Contract ID" span={2}>
            <Text code>{selectedContractDetail?.id || "N/A"}</Text>
          </Descriptions.Item>
          {/* <Descriptions.Item label="Invitation ID" span={2}>
            <Text code>{selectedContractDetail?.invitationId || "N/A"}</Text>
          </Descriptions.Item> */}
          {/* <Descriptions.Item label="Contract Code" span={2}>
            <Text strong>{selectedContractDetail?.contractNumber}</Text>
          </Descriptions.Item> */}
          {/* <Descriptions.Item label="Tournament ID" span={2}>
            <Text code>{selectedContractDetail?.tournamentId || "N/A"}</Text>
          </Descriptions.Item> */}
          <Descriptions.Item label="Tournament Title" span={2}>
            {selectedContractDetail?.tournamentTitle}
          </Descriptions.Item>
          <Descriptions.Item label="Jockey ID">
            <Text code>
              {selectedContractDetail?.raw?.jockeyId?._id ||
                selectedContractDetail?.raw?.jockeyId?.id ||
                selectedContractDetail?.raw?.jockey?._id ||
                selectedContractDetail?.raw?.jockey?.id ||
                selectedContractDetail?.raw?.jockeyId ||
                selectedContractDetail?.raw?.jockey ||
                "N/A"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Jockey Name">
            {selectedContractDetail?.jockeyName}
          </Descriptions.Item>
          <Descriptions.Item label="Horse Owner ID">
            <Text code>
              {selectedContractDetail?.raw?.horseOwnerId?._id ||
                selectedContractDetail?.raw?.horseOwnerId?.id ||
                selectedContractDetail?.raw?.ownerId?._id ||
                selectedContractDetail?.raw?.ownerId?.id ||
                selectedContractDetail?.raw?.owner?._id ||
                selectedContractDetail?.raw?.owner?.id ||
                selectedContractDetail?.raw?.horseOwnerId ||
                selectedContractDetail?.raw?.ownerId ||
                selectedContractDetail?.raw?.owner ||
                "N/A"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Horse Owner Name">
            {selectedContractDetail?.ownerName}
          </Descriptions.Item>
          <Descriptions.Item label="Salary Value">
            {formatMoney(selectedContractDetail?.salary)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getContractStatusColor(selectedContractDetail?.status)}>
              {selectedContractDetail?.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Signed Date">
            {formatDate(selectedContractDetail?.signedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Owner Share Rate">
            {selectedContractDetail?.ownerShareRate}%
          </Descriptions.Item>
          <Descriptions.Item label="Jockey Share Rate">
            {selectedContractDetail?.jockeyShareRate}%
          </Descriptions.Item>
          <Descriptions.Item label="Owner Compensation">
            {selectedContractDetail?.ownerCompensationRate}%
          </Descriptions.Item>
          <Descriptions.Item label="Jockey Compensation">
            {selectedContractDetail?.jockeyCompensationRate}%
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      {/* --- BỔ SUNG MODAL NỘI DUNG VI PHẠM --- */}
      <Modal
        title="Contract Breach Report Information"
        open={isBreachModalOpen}
        width={650}
        onCancel={() => setIsBreachModalOpen(false)}
        footer={[
          // Chỉ hiển thị nút xử lý nếu trạng thái là PENDING, undefined hoặc null
          (breachDetail?.status === "PENDING" || !breachDetail?.status) && (
            <Popconfirm
              key="reject-confirm"
              title="Reject Report"
              description="Are you sure you want to reject this breach report?"
              onConfirm={() => handleProcessBreach(false)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger loading={isProcessingBreach}>
                Reject
              </Button>
            </Popconfirm>
          ),
          (breachDetail?.status === "PENDING" || !breachDetail?.status) && (
            <Popconfirm
              key="approve-confirm"
              title="Approve Report"
              description="Are you sure you want to approve this breach report?"
              onConfirm={() => handleProcessBreach(true)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                loading={isProcessingBreach}
                style={{ backgroundColor: "#007a68", borderColor: "#007a68" }}
              >
                Approve
              </Button>
            </Popconfirm>
          ),
        ]}
      >
        <Descriptions
          bordered
          column={1}
          size="small"
          loading={isBreachLoading}
          style={{ marginTop: 16 }}
        >
          <Descriptions.Item label="Breach Report ID">
            <Text code>{breachDetail?.id || breachDetail?._id || "N/A"}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Reporter Name">
            <Text strong>
              {breachDetail?.reporterName ||
                breachDetail?.reporter?.fullName ||
                "N/A"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Reporter Email">
            <Text strong>
              {breachDetail?.reporterEmail ||
                breachDetail?.reporter?.email ||
                "N/A"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Reason / Breach Content">
            {breachDetail?.reason || breachDetail?.description || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Reported Date">
            {formatDate(breachDetail?.createdAt || breachDetail?.reportedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Admin Process Status">
            {breachDetail?.status === "APPROVED" && (
              <Tag color="green">Approved</Tag>
            )}
            {breachDetail?.status === "REJECTED" && (
              <Tag color="red">Rejected</Tag>
            )}
            {breachDetail?.status === undefined ||
            breachDetail?.status === null ||
            breachDetail?.status === "PENDING" ? (
              <Tag color="warning">Pending</Tag>
            ) : null}
          </Descriptions.Item>
          {breachDetail?.adminReason && (
            <Descriptions.Item label="Admin Feedback">
              <Text type="secondary">{breachDetail.adminReason}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Modal>
    </section>
  );
}

export default ContractManagement;
