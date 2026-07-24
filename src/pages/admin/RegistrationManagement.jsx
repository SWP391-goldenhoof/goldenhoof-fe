import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import "antd/dist/reset.css";
import {
  acceptRegistrationToWaitlist,
  confirmRegistration,
  getRegistrationById,
  getRegistrations,
  rejectRegistration,
} from "../../api/services/registration.service";
import { getRacesByTournament } from "../../api/services/race.service";
import { getTournaments } from "../../api/services/tournament.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const { Title, Text } = Typography;

const REGISTRATION_STATUSES = [
  "Waitlisted",
  "Pending",
  "Confirmed",
  "Rejected",
];

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.registrations)) return response.registrations;
  return [];
}

function formatMoney(value) {
  if (value === undefined || value === null) return "N/A";
  return Number(value).toLocaleString("vi-VN") + " VND";
}

// function formatDate(value) {
//   if (!value) return "N/A";

//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return value;

//   return new Intl.DateTimeFormat("vi-VN", {
//     dateStyle: "short",
//     timeStyle: "short",
//   }).format(date);
// }

function formatDateTime(value) {
  if (!value) return "N/A";

  const d = dayjs(value);
  if (!d.isValid()) return value;

  // Sử dụng định dạng giữ nguyên hiển thị theo chuỗi ISO gốc hoặc format thủ công
  // Để hiển thị dạng DD/MM/YYYY HH:mm đúng chuẩn vi-VN mà không bị lệch múi giờ:
  return dayjs.utc(value).format("DD/MM/YYYY HH:mm");
}

function getTimeValue(value) {
  if (!value) return 0;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getObjectIdTime(value) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) {
    return 0;
  }

  return parseInt(value.slice(0, 8), 16) * 1000;
}

function sortNewestRegistrationFirst(a, b) {
  const aTime = Math.max(
    getTimeValue(a.registeredAt),
    getTimeValue(a.createdAt),
    getObjectIdTime(a.id),
  );
  const bTime = Math.max(
    getTimeValue(b.registeredAt),
    getTimeValue(b.createdAt),
    getObjectIdTime(b.id),
  );

  return bTime - aTime;
}

function statusColor(status) {
  switch (status) {
    case "Pending":
      return "orange";
    case "Confirmed":
      return "green";
    case "Rejected":
      return "red";
    case "Waitlisted":
      return "blue";
    default:
      return "default";
  }
}

function normalizeRegistration(item, index) {
  const id = item?._id || item?.id || `registration-${index}`;

  return {
    key: id,
    id,
    tournamentId: item?.tournamentId || "",
    raceId: item?.raceId || "",
    tournamentTitle: item?.tournamentTitle || "N/A",
    horseName: item?.horseName || "N/A",
    jockeyName: item?.jockeyName || "N/A",
    ownerName: item?.ownerName || "N/A",
    entryFee: item?.entryFee ?? 0,
    gateNumber: item?.gateNumber ?? "N/A",
    status: item?.status || "Pending",
    registeredAt: item?.registeredAt || "",
    createdAt: item?.createdAt || "",
  };
}

function normalizeRaceOption(item, index) {
  const id = item?._id || item?.id || `race-${index}`;
  const name = item?.name || `Race ${index + 1}`;
  const round = item?.roundNumber ? `Round ${item.roundNumber}` : "";
  const order = item?.raceOrder ? `Race ${item.raceOrder}` : "";
  const startTime = formatDateTime(item?.startTime || item?.date);
  const details = [round, order, startTime !== "N/A" ? startTime : ""]
    .filter(Boolean)
    .join(" - ");

  return {
    label: details ? `${name} (${details})` : name,
    value: id,
  };
}

function RegistrationManagement() {
  const [confirmForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const [registrations, setRegistrations] = useState([]);
  const [raceOptions, setRaceOptions] = useState([]);
  const [filterTournamentId, setFilterTournamentId] = useState("");
  const [tournamentOptions, setTournamentOptions] = useState([]);

  const [filterStatus, setFilterStatus] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRaces, setIsLoadingRaces] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [detailRegistration, setDetailRegistration] = useState(null);
  const [confirmingRegistration, setConfirmingRegistration] = useState(null);
  const [rejectingRegistration, setRejectingRegistration] = useState(null);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadRegistrations(
    status = filterStatus,
    tournamentId = filterTournamentId,
  ) {
    setIsLoading(true);

    try {
      const response = await getRegistrations({
        status,
        tournamentId,
      });

      setRegistrations(
        resolveList(response)
          .map(normalizeRegistration)
          .sort(sortNewestRegistrationFirst),
      );
    } catch (error) {
      message.error(error?.message || "Unable to load registrations");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTournamentOptions() {
    try {
      const tournaments = await getTournaments();

      setTournamentOptions(
        tournaments.map((item) => ({
          value: item._id || item.id,
          label: item.title,
        })),
      );
    } catch (error) {
      message.error(error?.message || "Unable to load tournaments");
    }
  }

  useEffect(() => {
    loadRegistrations();
    loadTournamentOptions();
  }, []);

  async function openDetailModal(record) {
    setIsLoading(true);

    try {
      const response = await getRegistrationById(record.id);
      setDetailRegistration(response);
    } catch (error) {
      message.error(error?.message || "Unable to load registration detail");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRaceOptions(tournamentId, currentRaceId = "") {
    if (!tournamentId) {
      setRaceOptions([]);
      return;
    }

    setIsLoadingRaces(true);

    try {
      const response = await getRacesByTournament(tournamentId);
      const options = resolveList(response).map(normalizeRaceOption);

      if (
        currentRaceId &&
        !options.some((option) => option.value === currentRaceId)
      ) {
        options.unshift({
          label: `Current race (${currentRaceId})`,
          value: currentRaceId,
        });
      }

      setRaceOptions(options);
    } catch (error) {
      setRaceOptions([]);
      message.error(error?.message || "Unable to load races");
    } finally {
      setIsLoadingRaces(false);
    }
  }

  function openConfirmModal(record) {
    setConfirmingRegistration(record);
    setRaceOptions([]);
    confirmForm.resetFields();
    confirmForm.setFieldsValue({
      raceId: record.raceId || "",
      gateNumber: record.gateNumber !== "N/A" ? record.gateNumber : undefined,
    });
    loadRaceOptions(record.tournamentId, record.raceId);
  }

  async function handleConfirm() {
    const values = await confirmForm.validateFields();

    setIsSaving(true);

    try {
      await confirmRegistration(confirmingRegistration.id, values);
      message.success("Registration confirmed");

      setConfirmingRegistration(null);
      confirmForm.resetFields();
      await loadRegistrations();
    } catch (error) {
      message.error(error?.message || "Unable to confirm registration");
    } finally {
      setIsSaving(false);
    }
  }

  function openRejectModal(record) {
    setRejectingRegistration(record);
    rejectForm.resetFields();
  }

  async function handleReject() {
    const values = await rejectForm.validateFields();

    setIsSaving(true);

    try {
      await rejectRegistration(rejectingRegistration.id, values);
      message.success("Registration rejected");

      setRejectingRegistration(null);
      rejectForm.resetFields();
      await loadRegistrations();
    } catch (error) {
      message.error(error?.message || "Unable to reject registration");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAcceptToWaitlist(record) {
    setIsSaving(true);

    try {
      await acceptRegistrationToWaitlist(record.id, {
        raceId: record.raceId,
        gateNumber: record.gateNumber,
      });

      message.success("Moved to waitlist");
      await loadRegistrations();
    } catch (error) {
      message.error(error?.message || "Unable to move to waitlist");
    } finally {
      setIsSaving(false);
    }
  }

  // const filteredRegistrations = useMemo(() => {
  //   const normalizedSearchText = searchText.trim().toLowerCase();

  //   if (!normalizedSearchText) {
  //     return registrations;
  //   }

  //   return registrations.filter((registration) =>
  //     [
  //       registration.tournamentTitle,
  //       registration.horseName,
  //       registration.jockeyName,
  //       registration.ownerName,
  //       registration.status,
  //     ]
  //       .filter(Boolean)
  //       .some((value) =>
  //         String(value).toLowerCase().includes(normalizedSearchText),
  //       ),
  //   );
  // }, [registrations, searchText]);

  const filteredRegistrations = useMemo(() => registrations, [registrations]);

  const columns = useMemo(
    () => [
      {
        title: "Tournament",
        dataIndex: "tournamentTitle",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 260,
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: "Horse",
        dataIndex: "horseName",
        width: 160,
      },
      {
        title: "Jockey",
        dataIndex: "jockeyName",
        width: 190,
      },
      {
        title: "Owner",
        dataIndex: "ownerName",
        width: 190,
      },
      {
        title: "Entry Fee",
        dataIndex: "entryFee",
        width: 150,
        render: formatMoney,
      },
      {
        title: "Gate",
        dataIndex: "gateNumber",
        width: 90,
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 130,
        render: (status) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      // {
      //   title: "Registered At",
      //   dataIndex: "registeredAt",
      //   width: 180,
      //   render: formatDateTime,
      // },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 390,
        render: (_, record) => (
          <Space>
            <Button
              className="registration-management-link-btn"
              size="small"
              onClick={() => openDetailModal(record)}
            >
              Detail
            </Button>
            <Button
              className="registration-management-link-btn"
              size="small"
              onClick={() => handleAcceptToWaitlist(record)}
            >
              Waitlist
            </Button>

            <Button
              className="registration-management-link-btn"
              size="small"
              onClick={() => openConfirmModal(record)}
            >
              Confirm
            </Button>

            <Button
              danger
              size="small"
              danger
              onClick={() => openRejectModal(record)}
            >
              Reject
            </Button>
          </Space>
        ),
      },
    ],
    [shouldFixColumns],
  );

  return (
    <section className="registration-management">
      <style>{`
        .registration-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .registration-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .registration-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
        }

        .registration-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .registration-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .registration-management-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
        }

        .registration-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
          background: #fff;
        }

        .registration-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }

        .registration-management-primary.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        @media (max-width: 920px) {
          .registration-management-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="registration-management-header">
        <div>
          <div className="registration-management-kicker">Admin dashboard</div>
          <Title level={1}>Registration Management</Title>
        </div>

        <Space wrap>
          <Select
            value={filterStatus}
            style={{ width: 170 }}
            options={[
              { label: "All Status", value: "" },
              ...REGISTRATION_STATUSES.map((status) => ({
                label: status,
                value: status,
              })),
            ]}
            onChange={(value) => {
              setFilterStatus(value);
              loadRegistrations(value, filterTournamentId);
            }}
          />

          <Select
            value={filterTournamentId}
            placeholder="Tournament"
            allowClear
            style={{ width: 260 }}
            options={[
              {
                label: "All Tournaments",
                value: "",
              },
              ...tournamentOptions,
            ]}
            onChange={(value) => {
              const tournamentId = value || "";

              setFilterTournamentId(tournamentId);
              loadRegistrations(filterStatus, tournamentId);
            }}
          />

          {/* <Input
            allowClear
            placeholder="Search by tournament title"
            value={searchText}
            style={{ width: 260 }}
            onChange={(event) => setSearchText(event.target.value)}
          /> */}

          {/* <Button
            className="registration-management-link-btn"
            onClick={() => loadRegistrations()}
          >
            Search
          </Button> */}

          <Button
            className="registration-management-primary"
            onClick={() => {
              setFilterStatus("");
              setFilterTournamentId("");
              setSearchText("");
              loadRegistrations("");
            }}
          >
            Reset
          </Button>
        </Space>
      </div>

      <div className="registration-management-card">
        <Table
          className="registration-management-table"
          columns={columns}
          dataSource={filteredRegistrations}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} registrations`,
          }}
          scroll={{ x: 1570 }}
        />
      </div>

      <Modal
        title="Registration Detail"
        open={Boolean(detailRegistration)}
        footer={null}
        width={800}
        onCancel={() => setDetailRegistration(null)}
      >
        {detailRegistration && (
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item label="Registration ID">
              <Text code>
                {detailRegistration._id || detailRegistration.id || "N/A"}
              </Text>
            </Descriptions.Item>

            {/* <Descriptions.Item label="Tournament ID">
              <Text code>
                {detailRegistration.tournamentId?._id ||
                  detailRegistration.tournamentId?.id ||
                  detailRegistration.tournamentId ||
                  "N/A"}
              </Text>
            </Descriptions.Item> */}

            <Descriptions.Item label="Tournament">
              {detailRegistration.tournamentTitle}
            </Descriptions.Item>

            {/* <Descriptions.Item label="Race ID">
              <Text code>
                {detailRegistration.raceId?._id ||
                  detailRegistration.raceId?.id ||
                  detailRegistration.raceId ||
                  "N/A"}
              </Text>
            </Descriptions.Item> */}

            <Descriptions.Item label="Race Title">
              {detailRegistration.raceId?.raceName ||
                detailRegistration.raceName ||
                "N/A"}
            </Descriptions.Item>

            {/* <Descriptions.Item label="Horse ID">
              <Text code>
                {detailRegistration.horseId?._id ||
                  detailRegistration.horseId?.id ||
                  detailRegistration.horseId ||
                  "N/A"}
              </Text>
            </Descriptions.Item> */}

            <Descriptions.Item label="Horse">
              {detailRegistration.horseName}
            </Descriptions.Item>

            {/* <Descriptions.Item label="Jockey ID">
              <Text code>
                {detailRegistration.jockeyId?._id ||
                  detailRegistration.jockeyId?.id ||
                  detailRegistration.jockeyId ||
                  "N/A"}
              </Text>
            </Descriptions.Item> */}

            <Descriptions.Item label="Jockey">
              {detailRegistration.jockeyName}
            </Descriptions.Item>

            {/* <Descriptions.Item label="Owner ID">
              <Text code>
                {detailRegistration.ownerId?._id ||
                  detailRegistration.ownerId?.id ||
                  detailRegistration.horseOwnerId?._id ||
                  detailRegistration.horseOwnerId?.id ||
                  detailRegistration.ownerId ||
                  detailRegistration.horseOwnerId ||
                  "N/A"}
              </Text>
            </Descriptions.Item> */}

            <Descriptions.Item label="Owner">
              {detailRegistration.ownerName}
            </Descriptions.Item>

            <Descriptions.Item label="Gate Number">
              {detailRegistration.gateNumber || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Entry Fee">
              {formatMoney(detailRegistration.entryFee)}
            </Descriptions.Item>

            <Descriptions.Item label="Status">
              <Tag color={statusColor(detailRegistration.status)}>
                {detailRegistration.status}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Registered At">
              {formatDateTime(detailRegistration.registeredAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Confirmed At">
              {formatDateTime(detailRegistration.confirmedAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Rejected Reason">
              {detailRegistration.rejectedReason || "N/A"}
            </Descriptions.Item>

            <Descriptions.Item label="Rejected At">
              {formatDateTime(detailRegistration.rejectedAt)}
            </Descriptions.Item>

            <Descriptions.Item label="Created At">
              {formatDateTime(detailRegistration.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="Confirm Registration"
        open={Boolean(confirmingRegistration)}
        okText="Confirm"
        cancelText="Cancel"
        confirmLoading={isSaving}
        onOk={handleConfirm}
        onCancel={() => setConfirmingRegistration(null)}
      >
        <Form form={confirmForm} layout="vertical">
          <Form.Item
            label="Race"
            name="raceId"
            rules={[{ required: true, message: "Race is required" }]}
          >
            <Select
              showSearch
              loading={isLoadingRaces}
              optionFilterProp="label"
              options={raceOptions}
              placeholder="Select race"
            />
          </Form.Item>

          <Form.Item
            label="Gate Number"
            name="gateNumber"
            rules={[{ required: true, message: "Gate number is required" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Reject Registration"
        open={Boolean(rejectingRegistration)}
        okText="Reject"
        cancelText="Cancel"
        confirmLoading={isSaving}
        onOk={handleReject}
        onCancel={() => setRejectingRegistration(null)}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: "Reason is required" }]}
          >
            <Input.TextArea rows={4} placeholder="Enter rejected reason" />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}

export default RegistrationManagement;
