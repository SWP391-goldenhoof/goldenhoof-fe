import { useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { useNavigate } from "react-router-dom";
import "antd/dist/reset.css";
import {
  createTournament,
  deleteTournament,
  getTournamentAdvancements,
  getTournamentById,
  getTournaments,
  uploadTournamentBanner,
  updateTournament,
  updateTournamentStatus,
} from "../../api/services/tournament.service";
import {
  createRaceBatch,
  createRound2Race,
} from "../../api/services/race.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const { Title, Text } = Typography;

const TOURNAMENT_STATUSES = [
  "Preparing",
  "Registration",
  "Upcoming",
  "Ongoing",
  "Completed",
  "Canceled",
];

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.tournaments)) return response.tournaments;
  return [];
}

function formatMoney(value) {
  if (value === undefined || value === null) return "N/A";
  return Number(value).toLocaleString("vi-VN") + " VND";
}

function buildRaceStartTime(date, time) {
  return `${date}T${time}:00.000Z`;
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY HH:mm") : value;
}

function toDatePickerValue(value) {
  if (!value) return null;

  const parsed = dayjs(value, "DD/MM/YYYY", true).isValid()
    ? dayjs(value, "DD/MM/YYYY", true)
    : dayjs(value);

  return parsed.isValid() ? parsed : null;
}

function parseTournamentDate(value) {
  if (!value) return null;

  const parsed = dayjs(value, "DD/MM/YYYY", true).isValid()
    ? dayjs(value, "DD/MM/YYYY", true)
    : dayjs(value);

  return parsed.isValid() ? parsed : null;
}

function toDateInputValue(value) {
  const parsed = parseTournamentDate(value);

  return parsed ? parsed.format("YYYY-MM-DD") : "";
}

function toRaceDateValue(value) {
  return parseTournamentDate(value);
}

function normalizeRaceDateValue(value) {
  if (dayjs.isDayjs(value)) {
    return value.format("YYYY-MM-DD");
  }

  return toDateInputValue(value);
}

function isOutsidePeriod(date, startDate, endDate) {
  const parsedStartDate = parseTournamentDate(startDate);
  const parsedEndDate = parseTournamentDate(endDate);

  if (!date || !parsedStartDate || !parsedEndDate) return false;

  return (
    date.isBefore(parsedStartDate, "day") || date.isAfter(parsedEndDate, "day")
  );
}

function formatTournamentPeriod(startDate, endDate) {
  const parsedStartDate = parseTournamentDate(startDate);
  const parsedEndDate = parseTournamentDate(endDate);

  if (!parsedStartDate || !parsedEndDate) {
    return "Tournament period is unavailable";
  }

  return `${parsedStartDate.format("DD/MM/YYYY")} - ${parsedEndDate.format("DD/MM/YYYY")}`;
}

function getUploadedBannerUrl(response) {
  if (typeof response === "string") return response;

  return (
    response?.imageUrl ||
    response?.bannerUrl ||
    response?.url ||
    response?.path ||
    ""
  );
}

function normalizeAdvancement(item, index) {
  const horse = item?.horseId || item?.horse || {};
  const fromRace = item?.fromRaceId || item?.fromRace || {};

  return {
    key: item?._id || item?.id || `advancement-${index}`,
    id: item?._id || item?.id || "N/A",
    horseId:
      typeof horse === "string" ? horse : horse?._id || horse?.id || "N/A",
    horseName: horse?.name || "N/A",
    horseColor: horse?.color || "N/A",
    fromRaceId:
      typeof fromRace === "string"
        ? fromRace
        : fromRace?._id || fromRace?.id || "N/A",
    fromRaceName: fromRace?.name || "N/A",
    toRaceId:
      item?.toRaceId?._id || item?.toRaceId?.id || item?.toRaceId || "N/A",
    advancedAt: item?.advancedAt || item?.createdAt || "",
  };
}

function statusColor(status) {
  switch (status) {
    case "Preparing":
      return "blue";
    case "Registration":
      return "green";
    case "Upcoming":
      return "cyan";
    case "Ongoing":
      return "gold";
    case "Completed":
      return "purple";
    case "Canceled":
      return "red";
    default:
      return "default";
  }
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

function normalizeTournamentDetail(item) {
  const id = item?._id || item?.id;

  return {
    key: id,
    id,
    title: item?.title || "Untitled",
    description: item?.description || "",
    imageUrl: item?.imageUrl || "",
    startDate: item?.startDate || "",
    endDate: item?.endDate || "",
    location: item?.location || "",
    status: item?.status || "Preparing",
    totalRounds: item?.totalRounds ?? 0,
    horsesPerRace: item?.horsesPerRace ?? 0,
    totalRaces: item?.totalRaces ?? 0,
    entryFee: item?.entryFee ?? 0,
    availableSlot: item?.availableSlot ?? "N/A",
  };
}

function TournamentManagement() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [round1Form] = Form.useForm();
  const [round2Form] = Form.useForm();

  const [tournaments, setTournaments] = useState([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerUrl = Form.useWatch("imageUrl", form);

  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [createdTournament, setCreatedTournament] = useState(null);
  const [editingTournament, setEditingTournament] = useState(null);
  const [changingStatusTournament, setChangingStatusTournament] =
    useState(null);

  const [detailTournament, setDetailTournament] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [advancementTournament, setAdvancementTournament] = useState(null);
  const [advancements, setAdvancements] = useState([]);
  const [isAdvancementsLoading, setIsAdvancementsLoading] = useState(false);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadTournaments(status = filterStatus) {
    setIsLoading(true);

    try {
      const response = await getTournaments(status);
      setTournaments(resolveList(response).map(normalizeTournament));
    } catch (error) {
      message.error(error?.message || "Unable to load tournaments");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTournaments();
  }, []);

  function openCreateModal() {
    setEditingTournament(null);
    form.resetFields();
    round1Form.resetFields();
    round2Form.resetFields();
    form.setFieldsValue({
      horsesPerRace: 8,
      entryFee: 500000,
    });
    round1Form.setFieldsValue({
      races: [{ name: "Vong 1 - Race 1", date: "", startTime: "" }],
    });
    setCreatedTournament(null);
    setSetupStep(0);
    setIsSetupWizardOpen(true);
  }

  async function finishSetupWizard() {
    setIsSetupWizardOpen(false);
    setSetupStep(0);
    setCreatedTournament(null);
    form.resetFields();
    round1Form.resetFields();
    round2Form.resetFields();
    await loadTournaments();
  }

  async function handleCreateTournamentStep() {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startDate: values.startDate.format("DD/MM/YYYY"),
      endDate: values.endDate.format("DD/MM/YYYY"),
      totalRounds: 2,
      // totalRaces: 3,
    };

    setIsSaving(true);

    try {
      const response = await createTournament(payload);
      const tournamentId = response?._id || response?.id;

      if (!tournamentId) {
        throw new Error("Tournament was created but no ID was returned");
      }

      setCreatedTournament({
        id: tournamentId,
        title: response?.title || payload.title,
        startDate: response?.startDate || payload.startDate,
        endDate: response?.endDate || payload.endDate,
      });
      round1Form.setFieldsValue({
        races: [
          {
            name: "Vong 1 - Race 1",
            date: toRaceDateValue(response?.startDate || payload.startDate),
            startTime: "08:00",
          },
        ],
      });
      round2Form.setFieldsValue({
        date: toRaceDateValue(response?.endDate || payload.endDate),
        startTime: "08:00",
      });
      setSetupStep(1);
      message.success("Tournament created. Continue with Round 1 races.");
    } catch (error) {
      message.error(error?.message || "Unable to create tournament");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateRound1Step() {
    const values = await round1Form.validateFields();

    setIsSaving(true);

    try {
      await createRaceBatch({
        tournamentId: createdTournament.id,
        races: values.races.map((race) => ({
          ...race,
          date: normalizeRaceDateValue(race.date),
          startTime: buildRaceStartTime(
            normalizeRaceDateValue(race.date),
            race.startTime,
          ),
        })),
      });
      setSetupStep(2);
      message.success("Round 1 races created. You can now create the final.");
    } catch (error) {
      message.error(error?.message || "Unable to create Round 1 races");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateRound2Step() {
    const values = await round2Form.validateFields();

    setIsSaving(true);

    try {
      await createRound2Race(createdTournament.id, {
        date: normalizeRaceDateValue(values.date),
        startTime: buildRaceStartTime(
          normalizeRaceDateValue(values.date),
          values.startTime,
        ),
      });
      message.success("Tournament and race setup completed");
      await finishSetupWizard();
    } catch (error) {
      message.error(error?.message || "Unable to create Round 2 race");
    } finally {
      setIsSaving(false);
    }
  }

  async function openDetailModal(record) {
    setIsLoading(true);

    try {
      const response = await getTournamentById(record.id);

      setDetailTournament({
        ...normalizeTournamentDetail(response),
        id: response?._id || response?.id || record.id,
      });
      setIsDetailModalOpen(true);
    } catch (error) {
      message.error(error?.message || "Unable to load tournament detail");
    } finally {
      setIsLoading(false);
    }
  }

  async function openEditModal(record) {
    setIsLoading(true);

    try {
      const response = await getTournamentById(record.id);
      const tournament = normalizeTournamentDetail(response);

      setEditingTournament(tournament);
      setIsTournamentModalOpen(true);

      form.setFieldsValue({
        title: tournament.title,
        description: tournament.description,
        imageUrl: tournament.imageUrl,
        startDate: toDatePickerValue(tournament.startDate),
        endDate: toDatePickerValue(tournament.endDate),
        location: tournament.location,
        horsesPerRace: tournament.horsesPerRace,
        entryFee: tournament.entryFee,
        totalRaces: tournament.totalRaces,
      });
    } catch (error) {
      message.error(error?.message || "Unable to load tournament detail");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveTournament() {
    const values = await form.validateFields();
    const payload = {
      ...values,
      startDate: values.startDate.format("DD/MM/YYYY"),
      endDate: values.endDate.format("DD/MM/YYYY"),
      ...(!editingTournament
        ? {
            totalRounds: values.totalRounds,
            totalRaces: values.totalRaces,
          }
        : {}),
    };

    setIsSaving(true);

    try {
      if (editingTournament) {
        await updateTournament(editingTournament.id, payload);
        message.success("Tournament updated");
      } else {
        await createTournament(payload);
        message.success("Tournament created");
      }

      setEditingTournament(null);
      setIsTournamentModalOpen(false);
      form.resetFields();
      await loadTournaments();
    } catch (error) {
      message.error(error?.message || "Unable to save tournament");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleBannerUpload({ file, onSuccess, onError }) {
    if (!file.type?.startsWith("image/")) {
      const error = new Error("Banner must be an image file");
      message.error(error.message);
      onError(error);
      return;
    }

    setIsUploadingBanner(true);

    try {
      const response = await uploadTournamentBanner(file);
      const imageUrl = getUploadedBannerUrl(response);

      if (!imageUrl) {
        throw new Error("Upload response does not contain an image URL");
      }

      form.setFieldValue("imageUrl", imageUrl);
      message.success("Tournament banner uploaded");
      onSuccess(response);
    } catch (error) {
      message.error(error?.message || "Unable to upload tournament banner");
      onError(error);
    } finally {
      setIsUploadingBanner(false);
    }
  }

  function openStatusModal(record) {
    setChangingStatusTournament(record);
    statusForm.setFieldsValue({
      status: record.status,
    });
  }

  async function handleUpdateStatus() {
    const values = await statusForm.validateFields();

    setIsSaving(true);

    try {
      await updateTournamentStatus(changingStatusTournament.id, values.status);
      message.success("Status updated");

      setChangingStatusTournament(null);
      await loadTournaments();
    } catch (error) {
      message.error(error?.message || "Unable to update status");
    } finally {
      setIsSaving(false);
    }
  }

  async function openAdvancementsModal(record) {
    setAdvancementTournament(record);
    setAdvancements([]);
    setIsAdvancementsLoading(true);

    try {
      const response = await getTournamentAdvancements(record.id);
      const nextAdvancements = resolveList(response)
        .map(normalizeAdvancement)
        .sort(
          (a, b) =>
            new Date(b.advancedAt).getTime() - new Date(a.advancedAt).getTime(),
        );

      setAdvancements(nextAdvancements);
    } catch (error) {
      message.error(error?.message || "Unable to load advancements");
    } finally {
      setIsAdvancementsLoading(false);
    }
  }

  async function handleDeleteTournament(record) {
    setIsSaving(true);

    try {
      await deleteTournament(record.id);
      message.success("Tournament deleted");
      await loadTournaments();
    } catch (error) {
      message.error(error?.message || "Unable to delete tournament");
    } finally {
      setIsSaving(false);
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "Title",
        dataIndex: "title",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 100,
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: "Start Date",
        dataIndex: "startDate",
        width: 50,
      },
      {
        title: "End Date",
        dataIndex: "endDate",
        width: 50,
      },
      // {
      //   title: "Location",
      //   dataIndex: "location",
      //   width: 260,
      //   ellipsis: true,
      // },
      {
        title: "Status",
        dataIndex: "status",
        width: 50,
        render: (status) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      {
        title: "Available Slot",
        dataIndex: "availableSlot",
        width: 50,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 90,
        render: (_, record) => (
          <Space>
            <Button
              className="tournament-management-link-btn"
              size="small"
              onClick={() => openDetailModal(record)}
            >
              Detail
            </Button>

            <Tooltip title="View qualified horses">
              <Button
                className="tournament-management-link-btn"
                size="small"
                onClick={() => openAdvancementsModal(record)}
              >
                Qualified
              </Button>
            </Tooltip>

            {/* {record.status === "Completed" && (
              <Tooltip title="Award tournament prize">
                <Button
                  className="tournament-management-link-btn"
                  size="small"
                  onClick={() =>
                    navigate(`/admin/prize?tournamentId=${record.id}`)
                  }
                >
                  Award Prize
                </Button>
              </Tooltip>
            )} */}

            <Button
              className="tournament-management-link-btn"
              size="small"
              onClick={() => openEditModal(record)}
            >
              Edit
            </Button>

            <Button
              className="tournament-management-link-btn"
              size="small"
              onClick={() => openStatusModal(record)}
            >
              Status
            </Button>

            <Popconfirm
              title="Delete tournament?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: isSaving }}
              onConfirm={() => handleDeleteTournament(record)}
            >
              <Button size="small" danger>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [isSaving, shouldFixColumns],
  );

  return (
    <section className="tournament-management">
      <style>{`
        .tournament-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .tournament-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .tournament-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: 0;
        }

        .tournament-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .tournament-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .tournament-management-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
        }

        .tournament-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
        }

        .tournament-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }

        .tournament-management-primary.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        .tournament-management-primary.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }

        .tournament-management-edit-modal .ant-modal-content {
          border-radius: 8px;
        }

        .setup-wizard-steps {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #dff3ee;
        }

        .setup-wizard-heading {
          margin-bottom: 18px;
        }

        .setup-wizard-heading h4.ant-typography {
          margin: 0 0 4px;
          color: #06332e;
        }

        .setup-wizard-created {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-left: 3px solid #00a88d;
          background: #f3fffc;
          color: #315f59;
        }

        .setup-wizard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 14px;
        }

        .setup-wizard-race-row {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) 180px 160px auto;
          gap: 10px;
          align-items: flex-start;
          padding: 14px 0;
          border-bottom: 1px solid #edf5f3;
        }

        .setup-wizard-period {
          margin: 0 0 18px;
          padding: 12px 14px;
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #f7fffd;
        }

        .setup-wizard-period-label {
          display: block;
          color: #007a68;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .setup-wizard-period-range {
          display: block;
          margin-top: 3px;
          color: #06332e;
          font-size: 16px;
          font-weight: 950;
        }

        .setup-wizard-period-note {
          display: block;
          margin-top: 5px;
        }

        @media (max-width: 920px) {
          .tournament-management-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .setup-wizard-grid,
          .setup-wizard-race-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="tournament-management-header">
        <div>
          <div className="tournament-management-kicker">Admin dashboard</div>
          <Title level={1}>Tournament Management</Title>
        </div>

        <Space>
          <Select
            value={filterStatus}
            style={{ width: 170 }}
            options={[
              { label: "Filter by Status", value: "" },
              ...TOURNAMENT_STATUSES.map((status) => ({
                label: status,
                value: status,
              })),
            ]}
            onChange={(value) => {
              setFilterStatus(value);
              loadTournaments(value);
            }}
          />

          <Button
            className="tournament-management-link-btn"
            onClick={() => loadTournaments()}
          >
            Refresh
          </Button>

          <Button
            className="tournament-management-primary"
            onClick={openCreateModal}
          >
            Create Tournament & Races
          </Button>
        </Space>
      </div>

      <div className="tournament-management-card">
        <Table
          className="tournament-management-table"
          columns={columns}
          dataSource={tournaments}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} tournaments`,
          }}
          scroll={{ x: 1650 }}
        />
      </div>

      <Modal
        className="tournament-management-edit-modal"
        title="Tournament Setup"
        open={isSetupWizardOpen}
        width={900}
        confirmLoading={isSaving}
        onCancel={finishSetupWizard}
        destroyOnClose
        footer={[
          <Button key="close" onClick={finishSetupWizard}>
            {setupStep === 0 ? "Cancel" : "Finish Later"}
          </Button>,
          <Button
            key="continue"
            className="tournament-management-primary"
            loading={isSaving}
            onClick={
              setupStep === 0
                ? handleCreateTournamentStep
                : setupStep === 1
                  ? handleCreateRound1Step
                  : handleCreateRound2Step
            }
          >
            {setupStep === 0
              ? "Create & Continue"
              : setupStep === 1
                ? "Create Round 1 & Continue"
                : "Create Final & Finish"}
          </Button>,
        ]}
      >
        <Steps
          className="setup-wizard-steps"
          current={setupStep}
          responsive
          items={[
            { title: "Tournament" },
            { title: "Round 1" },
            { title: "Final" },
          ]}
        />

        {createdTournament && (
          <div className="setup-wizard-created">
            <Text strong>{createdTournament.title}</Text> has been created.
            Continue setting up its races or finish and return later.
          </div>
        )}

        {setupStep === 0 && (
          <>
            <div className="setup-wizard-heading">
              <Title level={4}>Tournament information</Title>
              <Text type="secondary">
                Set the registration period, venue and participation rules.
              </Text>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Title is required" }]}
              >
                <Input placeholder="Tournament title" />
              </Form.Item>

              <Form.Item label="Description" name="description">
                <Input.TextArea rows={3} placeholder="Tournament description" />
              </Form.Item>

              <Form.Item label="Tournament Banner" required>
                <Form.Item
                  name="imageUrl"
                  noStyle
                  rules={[
                    {
                      required: true,
                      message: "Tournament banner is required",
                    },
                  ]}
                >
                  <Input type="hidden" />
                </Form.Item>
                <Upload
                  accept="image/*"
                  customRequest={handleBannerUpload}
                  maxCount={1}
                  showUploadList={false}
                >
                  <Button loading={isUploadingBanner}>Upload Banner</Button>
                </Upload>
                {bannerUrl ? (
                  <img
                    src={bannerUrl}
                    alt="Tournament banner preview"
                    style={{
                      width: "100%",
                      height: 160,
                      display: "block",
                      marginTop: 12,
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                  />
                ) : null}
              </Form.Item>

              <div className="setup-wizard-grid">
                <Form.Item
                  label="Start Date"
                  name="startDate"
                  rules={[
                    { required: true, message: "Start date is required" },
                  ]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  label="End Date"
                  name="endDate"
                  rules={[{ required: true, message: "End date is required" }]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  label="Location"
                  name="location"
                  rules={[{ required: true, message: "Location is required" }]}
                >
                  <Input placeholder="Tournament location" />
                </Form.Item>

                <Form.Item
                  label="Horses Per Race"
                  name="horsesPerRace"
                  rules={[
                    { required: true, message: "Horses per race is required" },
                    {
                      type: "number",
                      min: 8,
                      max: 10,
                      message: "Horses per race must be between 8 and 10",
                    },
                  ]}
                >
                  <InputNumber min={8} max={10} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  label="Total Races for round 1"
                  name="totalRaces"
                  rules={[
                    { required: true, message: "Total races is required" },
                    {
                      type: "number",
                      min: 2,
                      max: 10,
                      message: "Races must be at least 2, maximum 10",
                    },
                  ]}
                >
                  <InputNumber min={2} max={10} style={{ width: "100%" }} />
                </Form.Item>
              </div>

              <Form.Item label="Entry Fee" name="entryFee">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  addonAfter="VND"
                />
              </Form.Item>
            </Form>
          </>
        )}

        {setupStep === 1 && (
          <>
            <div className="setup-wizard-heading">
              <Title level={4}>Round 1 races</Title>
              <Text type="secondary">
                Add each qualifying race with its date and start time.
              </Text>
            </div>

            <div className="setup-wizard-period">
              <span className="setup-wizard-period-label">Tournament time</span>
              <span className="setup-wizard-period-range">
                {formatTournamentPeriod(
                  createdTournament?.startDate,
                  createdTournament?.endDate,
                )}
              </span>
              <Text type="secondary" className="setup-wizard-period-note">
                Race date should stay inside this tournament period to avoid
                backend validation errors.
              </Text>
            </div>

            <Form form={round1Form} layout="vertical">
              <Form.List name="races">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {fields.map(({ key, name, ...restField }, index) => (
                      <div className="setup-wizard-race-row" key={key}>
                        <Form.Item
                          {...restField}
                          label="Race Name"
                          name={[name, "name"]}
                          rules={[
                            { required: true, message: "Name is required" },
                          ]}
                        >
                          <Input placeholder={`Vong 1 - Race ${index + 1}`} />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          label="Date"
                          name={[name, "date"]}
                          rules={[
                            { required: true, message: "Date is required" },
                          ]}
                        >
                          <DatePicker
                            format="DD/MM/YYYY"
                            placeholder="DD/MM/YYYY"
                            style={{ width: "100%" }}
                            disabledDate={(date) =>
                              isOutsidePeriod(
                                date,
                                createdTournament?.startDate,
                                createdTournament?.endDate,
                              )
                            }
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          label="Start Time"
                          name={[name, "startTime"]}
                          rules={[
                            { required: true, message: "Time is required" },
                          ]}
                        >
                          <Input type="time" />
                        </Form.Item>

                        <Form.Item label=" ">
                          <Button
                            danger
                            disabled={fields.length === 1}
                            onClick={() => remove(name)}
                          >
                            Remove
                          </Button>
                        </Form.Item>
                      </div>
                    ))}

                    <Button
                      onClick={() =>
                        add({
                          name: `Vong 1 - Race ${fields.length + 1}`,
                          date: toRaceDateValue(createdTournament?.startDate),
                          startTime: "08:00",
                        })
                      }
                    >
                      Add Round 1 Race
                    </Button>
                  </Space>
                )}
              </Form.List>
            </Form>
          </>
        )}

        {setupStep === 2 && (
          <>
            <div className="setup-wizard-heading">
              <Title level={4}>Round 2 final</Title>
              <Text type="secondary">
                Schedule the final now, or choose Finish Later to create it from
                Race Management.
              </Text>
            </div>

            <div className="setup-wizard-period">
              <span className="setup-wizard-period-label">Tournament time</span>
              <span className="setup-wizard-period-range">
                {formatTournamentPeriod(
                  createdTournament?.startDate,
                  createdTournament?.endDate,
                )}
              </span>
              <Text type="secondary" className="setup-wizard-period-note">
                The final race date should also stay inside this tournament
                period.
              </Text>
            </div>

            <Form form={round2Form} layout="vertical">
              <div className="setup-wizard-grid">
                <Form.Item
                  label="Final Date"
                  name="date"
                  rules={[{ required: true, message: "Date is required" }]}
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    placeholder="DD/MM/YYYY"
                    style={{ width: "100%" }}
                    disabledDate={(date) =>
                      isOutsidePeriod(
                        date,
                        createdTournament?.startDate,
                        createdTournament?.endDate,
                      )
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="Start Time"
                  name="startTime"
                  rules={[{ required: true, message: "Time is required" }]}
                >
                  <Input type="time" />
                </Form.Item>
              </div>
            </Form>
          </>
        )}
      </Modal>

      <Modal
        className="tournament-management-edit-modal"
        title="Edit Tournament"
        open={isTournamentModalOpen}
        okText="Update"
        cancelText="Cancel"
        confirmLoading={isSaving}
        onOk={handleSaveTournament}
        onCancel={() => {
          setEditingTournament(null);
          setIsTournamentModalOpen(false);
          form.resetFields();
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Tournament Banner" required>
            <Form.Item
              name="imageUrl"
              noStyle
              rules={[
                { required: true, message: "Tournament banner is required" },
              ]}
            >
              <Input type="hidden" />
            </Form.Item>
            <Upload
              accept="image/*"
              customRequest={handleBannerUpload}
              maxCount={1}
              showUploadList={false}
            >
              <Button loading={isUploadingBanner}>Upload Banner</Button>
            </Upload>
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Tournament banner preview"
                style={{
                  width: "100%",
                  height: 150,
                  display: "block",
                  marginTop: 12,
                  borderRadius: 8,
                  objectFit: "cover",
                }}
              />
            ) : null}
          </Form.Item>

          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: "Start date is required" }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="DD/MM/YYYY"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="End Date"
            name="endDate"
            rules={[{ required: true, message: "End date is required" }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="DD/MM/YYYY"
              style={{ width: "100%" }}
            />
          </Form.Item>

          <Form.Item
            label="Location"
            name="location"
            rules={[{ required: true, message: "Location is required" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Horses Per Race"
            name="horsesPerRace"
            rules={[
              { required: true, message: "Horses per race is required" },
              {
                type: "number",
                min: 8,
                max: 10,
                message: "Horses per race must be between 8 and 10",
              },
            ]}
          >
            <InputNumber min={8} max={10} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Total Races for round 1"
            name="totalRaces"
            rules={[
              { required: true, message: "Total races is required" },
              {
                type: "number",
                min: 2,
                max: 10,
                message: "Races must be at least 2, maximum 10",
              },
            ]}
          >
            <InputNumber min={2} max={10} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Entry Fee" name="entryFee">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        className="tournament-management-edit-modal"
        title="Update Tournament Status"
        open={Boolean(changingStatusTournament)}
        okText="Update"
        cancelText="Cancel"
        confirmLoading={isSaving}
        onOk={handleUpdateStatus}
        onCancel={() => setChangingStatusTournament(null)}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select
              options={TOURNAMENT_STATUSES.map((status) => ({
                label: status,
                value: status,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Qualified Horses for Final - ${advancementTournament?.title || ""}`}
        open={Boolean(advancementTournament)}
        footer={null}
        width={920}
        onCancel={() => {
          setAdvancementTournament(null);
          setAdvancements([]);
        }}
        destroyOnClose
      >
        <div
          style={{
            marginBottom: 16,
            padding: "12px 14px",
            border: "1px solid #d9f7ef",
            borderRadius: 8,
            background: "#f6fffc",
          }}
        >
          <Text strong>Final qualification list</Text>
          <br />
          <Text type="secondary">
            Horses shown here have advanced from Round 1 races into the final
            race of this tournament.
          </Text>
        </div>

        <Table
          rowKey="key"
          loading={isAdvancementsLoading}
          dataSource={advancements}
          pagination={false}
          scroll={{ x: 1180 }}
          locale={{ emptyText: "No qualified horses for the final yet" }}
          columns={[
            {
              title: "Qualified Record ID",
              dataIndex: "id",
              width: 190,
              render: (value) => <Text code>{value}</Text>,
            },
            {
              title: "Horse",
              dataIndex: "horseName",
              render: (value) => <Text strong>{value}</Text>,
            },
            {
              title: "Horse ID",
              dataIndex: "horseId",
              width: 190,
              render: (value) => <Text code>{value}</Text>,
            },
            {
              title: "Color",
              dataIndex: "horseColor",
              width: 140,
            },
            {
              title: "Qualified From",
              dataIndex: "fromRaceName",
            },
            {
              title: "Source Race ID",
              dataIndex: "fromRaceId",
              width: 190,
              render: (value) => <Text code>{value}</Text>,
            },
            {
              title: "Final Race ID",
              dataIndex: "toRaceId",
              width: 190,
              render: (value) => <Text code>{value}</Text>,
            },
            {
              title: "Qualified At",
              dataIndex: "advancedAt",
              width: 180,
              render: formatDateTime,
            },
          ]}
        />
      </Modal>

      <Modal
        title="Tournament Detail"
        open={isDetailModalOpen}
        footer={null}
        width={700}
        onCancel={() => {
          setDetailTournament(null);
          setIsDetailModalOpen(false);
        }}
      >
        {detailTournament && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <p>
              <strong>ID:</strong> <Text code>{detailTournament.id}</Text>
            </p>

            <p>
              <strong>Title:</strong> {detailTournament.title}
            </p>

            <p>
              <strong>Description:</strong> {detailTournament.description}
            </p>

            <p>
              <strong>Location:</strong> {detailTournament.location}
            </p>

            <p>
              <strong>Start Date:</strong> {detailTournament.startDate}
            </p>

            <p>
              <strong>End Date:</strong> {detailTournament.endDate}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              <Tag color={statusColor(detailTournament.status)}>
                {detailTournament.status}
              </Tag>
            </p>

            <p>
              <strong>Total Rounds:</strong> {detailTournament.totalRounds}
            </p>

            <p>
              <strong>Horses Per Race:</strong> {detailTournament.horsesPerRace}
            </p>

            <p>
              <strong>Total Races for round 1:</strong>{" "}
              {detailTournament.totalRaces}
            </p>

            <p>
              <strong>Available Slot:</strong> {detailTournament.availableSlot}
            </p>

            <p>
              <strong>Entry Fee:</strong>{" "}
              {formatMoney(detailTournament.entryFee)}
            </p>

            {detailTournament.imageUrl && (
              <img
                src={detailTournament.imageUrl}
                alt={detailTournament.title}
                style={{
                  width: "100%",
                  borderRadius: 8,
                }}
              />
            )}
          </Space>
        )}
      </Modal>
    </section>
  );
}

export default TournamentManagement;
