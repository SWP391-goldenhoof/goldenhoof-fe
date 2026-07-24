import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import {
  confirmHorseRaceEntry,
  confirmJockeyForRace,
  getJockeyInvitationContract,
  getOwnerJockeyWorkspace,
  getSentJockeyInvitations,
  registerContractToTournament,
  sendJockeyInvitation,
} from "../../api/services/owner.service";
import { createRegistration } from "../../api/services/registration.service";
import {
  getTournamentById,
  getTournaments,
} from "../../api/services/tournament.service";
import {
  getUserById,
  searchUsersByName,
} from "../../api/services/user.service";
import { cancelContract } from "../../api/services/contract.service";
import JockeyContractModal from "../../components/contracts/JockeyContractModal";
import WorkspaceHeader from "../../components/ui/WorkspaceHeader";

dayjs.extend(utc);

const contractColor = {
  ACTIVE: "green",
  COMPLETED: "gold",
  CANCELLED: "darkred",
  BREACHED: "red",
};

const statusColor = {
  Accepted: "green",
  Pending: "gold",
  Rejected: "red",
  Expired: "darkred",
};

function pickFirstValue(source, keys, fallback = "") {
  for (const key of keys) {
    const value = source?.[key];

    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
}

function collectionFrom(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.result)) return value.result;
  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.licenses)) return value.licenses;
  if (Array.isArray(value?.license)) return value.license;
  if (Array.isArray(value?.content)) return value.content;
  if (Array.isArray(value?.records)) return value.records;

  return [];
}

function isJockeyUser(user) {
  const role = String(user?.role || user?.roleName || "").toLowerCase();

  return role.includes("jockey");
}

function normalizeImageSource(value) {
  if (typeof value !== "string") return value || undefined;

  return value.trim() || undefined;
}

function normalizeHorse(horse) {
  return {
    ...horse,
    id: pickFirstValue(horse, ["id", "_id", "horseId"]),
    name: pickFirstValue(horse, ["name", "horseName"], "Unnamed horse"),
  };
}

function normalizeTournament(tournament) {
  return {
    ...tournament,
    id: pickFirstValue(tournament, ["id", "_id", "tournamentId"]),
    title: pickFirstValue(tournament, ["title", "name"], "Unnamed tournament"),
    status: pickFirstValue(tournament, ["status"], "N/A"),
    availableSlot: pickFirstValue(tournament, ["availableSlot"], 0),
  };
}

function normalizeInvitation(invitation) {
  const horse = invitation?.horse || invitation?.horseInfo || {};
  const jockey = invitation?.jockey || invitation?.jockeyInfo || {};
  const tournament = invitation?.tournament || invitation?.tournamentInfo || {};
  const tournamentId = pickFirstValue(
    invitation,
    ["tournamentId"],
    pickFirstValue(tournament, ["id", "_id", "tournamentId"], ""),
  );

  return {
    ...invitation,
    id: pickFirstValue(invitation, ["id", "_id", "invitationId"]),
    tournamentId,
    horse: pickFirstValue(
      invitation,
      ["horseName"],
      pickFirstValue(horse, ["name", "horseName"], "N/A"),
    ),
    jockey: pickFirstValue(
      invitation,
      ["jockeyName", "jockeyFullName"],
      pickFirstValue(jockey, ["fullName", "name"], "N/A"),
    ),
    tournament: pickFirstValue(
      invitation,
      ["tournamentTitle", "tournamentName"],
      pickFirstValue(tournament, ["title", "name"], "N/A"),
    ),
    status: pickFirstValue(
      invitation,
      ["status", "invitationStatus"],
      "Pending",
    ),
    sentAt: pickFirstValue(
      invitation,
      ["sentAt", "createdAt", "createdDate"],
      "",
    ),
  };
}

function isAcceptedInvitation(invitation) {
  const status = String(invitation?.status || "").toLowerCase();

  return status === "accepted" || status === "accept";
}

async function resolveInvitationTournamentTitles(invitations) {
  const tournamentCache = new Map();

  return Promise.all(
    invitations.map(async (invitation) => {
      if (invitation.tournament !== "N/A" || !invitation.tournamentId) {
        return invitation;
      }

      try {
        if (!tournamentCache.has(invitation.tournamentId)) {
          tournamentCache.set(
            invitation.tournamentId,
            getTournamentById(invitation.tournamentId),
          );
        }

        const tournament = normalizeTournament(
          await tournamentCache.get(invitation.tournamentId),
        );

        return {
          ...invitation,
          tournament: tournament.title,
        };
      } catch {
        return invitation;
      }
    }),
  );
}

function normalizeJockey(jockey) {
  const profile = jockey?.jockeyProfile || jockey?.profile || {};
  const licenses = collectionFrom(
    pickFirstValue(jockey, ["license", "licenses"], null) ||
      pickFirstValue(profile, ["license", "licenses"], []),
  );

  return {
    ...jockey,
    id: pickFirstValue(
      jockey,
      ["id", "_id", "userId"],
      pickFirstValue(profile, ["id", "_id"]),
    ),
    fullName: pickFirstValue(jockey, ["fullName", "name"], "Unnamed jockey"),
    email: pickFirstValue(jockey, ["email"], "N/A"),
    phoneNumber: pickFirstValue(jockey, ["phoneNumber", "phone"], "N/A"),
    avatar: normalizeImageSource(
      pickFirstValue(jockey, ["avatar", "avatarUrl", "imageUrl"], undefined),
    ),
    weight: pickFirstValue(
      jockey,
      ["weight"],
      pickFirstValue(profile, ["weight"], "N/A"),
    ),
    height: pickFirstValue(
      jockey,
      ["height"],
      pickFirstValue(profile, ["height"], "N/A"),
    ),
    winRate: pickFirstValue(
      jockey,
      ["winRate"],
      pickFirstValue(profile, ["winRate"], 0),
    ),
    jockeyStatus: pickFirstValue(jockey, ["jockeyStatus"], "Available"),
    licenses,
  };
}

function formatRate(value) {
  if (value === undefined || value === null || value === "") return "0%";
  return String(value).includes("%") ? value : `${value}%`;
}

function formatMeasurement(value, unit) {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "N/A"
  ) {
    return "N/A";
  }

  return /[a-z]/i.test(String(value)) ? value : `${value} ${unit}`;
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : String(value);
}

export default function OwnerJockeyRaceWorkspace() {
  const [form] = Form.useForm();
  const [registrationForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [workspace, setWorkspace] = useState({
    horses: [],
    jockeys: [],
    invitations: [],
    contracts: [],
    schedules: [],
    tournaments: [],
  });
  const [loading, setLoading] = useState(true);
  const [invitationLoading, setInvitationLoading] = useState(true);
  const [tournamentLoading, setTournamentLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jockeySearchKeyword, setJockeySearchKeyword] = useState("");
  const [jockeySearching, setJockeySearching] = useState(false);
  const [registrationSaving, setRegistrationSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [invitationErrorMessage, setInvitationErrorMessage] = useState("");
  const [tournamentErrorMessage, setTournamentErrorMessage] = useState("");
  const [detailJockey, setDetailJockey] = useState(null);
  const [previewingLicense, setPreviewingLicense] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractLoadingId, setContractLoadingId] = useState(null);

  async function loadWorkspace() {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await getOwnerJockeyWorkspace();
      setWorkspace((current) => ({
        ...current,
        contracts: data.contracts || [],
        schedules: data.schedules || [],
        horses: (data.horses || []).map(normalizeHorse),
        jockeys: (data.jockeys || []).map(normalizeJockey),
      }));
    } catch (error) {
      setErrorMessage(error.message || "Could not load jockey workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchJockeys(value = jockeySearchKeyword) {
    const keyword = String(value || "").trim();

    if (!keyword) {
      await loadWorkspace();
      return;
    }

    setJockeySearching(true);
    setErrorMessage("");

    try {
      const data = await searchUsersByName(keyword);
      const jockeys = collectionFrom(data)
        .filter(isJockeyUser)
        .map(normalizeJockey);

      setWorkspace((current) => ({
        ...current,
        jockeys,
      }));

      if (jockeys.length === 0) {
        messageApi.info("No jockeys found with that name");
      }
    } catch (error) {
      messageApi.error(error.message || "Could not search jockeys.");
    } finally {
      setJockeySearching(false);
    }
  }

  async function loadSentInvitations() {
    setInvitationLoading(true);
    setInvitationErrorMessage("");

    try {
      const invitations = await getSentJockeyInvitations();
      const normalized = (invitations || []).map(normalizeInvitation);
      const resolved = await resolveInvitationTournamentTitles(normalized);

      setWorkspace((current) => ({
        ...current,
        invitations: resolved,
      }));
    } catch (error) {
      setWorkspace((current) => ({ ...current, invitations: [] }));
      setInvitationErrorMessage(
        error.message || "Could not load sent invitations.",
      );
    } finally {
      setInvitationLoading(false);
    }
  }

  async function loadTournaments() {
    setTournamentLoading(true);
    setTournamentErrorMessage("");

    try {
      const tournaments = await getTournaments();
      setWorkspace((current) => ({
        ...current,
        tournaments: (tournaments || []).map(normalizeTournament),
      }));
    } catch (error) {
      setWorkspace((current) => ({ ...current, tournaments: [] }));
      setTournamentErrorMessage(error.message || "Could not load tournaments.");
    } finally {
      setTournamentLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
    loadSentInvitations();
    loadTournaments();
  }, []);

  const horseOptions = useMemo(
    () =>
      workspace.horses.map((horse) => ({ value: horse.id, label: horse.name })),
    [workspace.horses],
  );

  const tournamentOptions = useMemo(
    () =>
      workspace.tournaments.map((tournament) => ({
        value: tournament.id,
        label: `${tournament.title} - ${tournament.status} - ${tournament.availableSlot} slots`,
      })),
    [workspace.tournaments],
  );

  const acceptedInvitationOptions = useMemo(
    () =>
      workspace.invitations.filter(isAcceptedInvitation).map((invitation) => ({
        value: invitation.id,
        label: `${invitation.tournament} - ${invitation.horse} / ${invitation.jockey}`,
      })),
    [workspace.invitations],
  );

  async function handleInvite(values) {
    setSaving(true);

    try {
      await sendJockeyInvitation(values);
      messageApi.success("Invitation sent to jockey");
      form.resetFields();
      await Promise.all([loadWorkspace(), loadSentInvitations()]);
    } catch (error) {
      messageApi.error(error.message || "Could not send invitation.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRegisterTournament(values) {
    setRegistrationSaving(true);

    try {
      await createRegistration({
        jockeyInvitationId: values.jockeyInvitationId,
      });
      messageApi.success("Tournament registration submitted");
      registrationForm.resetFields();
      await loadSentInvitations();
    } catch (error) {
      messageApi.error(error.message || "Could not submit registration.");
    } finally {
      setRegistrationSaving(false);
    }
  }

  async function runAction(action, successMessage) {
    try {
      await action();
      messageApi.success(successMessage);
      await loadWorkspace();
    } catch (error) {
      messageApi.error(error.message || "Action failed.");
    }
  }

  async function openInvitationContract(invitation) {
    setContractLoadingId(invitation.id);

    try {
      const contract = await getJockeyInvitationContract(invitation.id);
      let ownerName = "Horse Owner";
      let jockeyName = invitation.jockey || "Jockey";

      const userLookups = [];

      if (contract?.ownerId) {
        userLookups.push(
          getUserById(contract.ownerId)
            .then((owner) => {
              ownerName = pickFirstValue(
                owner,
                ["fullName", "name", "displayName", "email"],
                ownerName,
              );
            })
            .catch(() => undefined),
        );
      }

      if (
        contract?.jockeyId &&
        (!jockeyName || jockeyName === "N/A" || jockeyName === "Jockey")
      ) {
        userLookups.push(
          getUserById(contract.jockeyId)
            .then((jockey) => {
              jockeyName = pickFirstValue(
                jockey,
                ["fullName", "name", "displayName", "email"],
                jockeyName,
              );
            })
            .catch(() => undefined),
        );
      }

      await Promise.all(userLookups);

      setSelectedContract({
        ...contract,
        ownerName,
        jockeyName,
        horseName: invitation.horse,
        tournamentName: invitation.tournament,
      });
    } catch (error) {
      messageApi.error(error.message || "Could not load invitation contract.");
    } finally {
      setContractLoadingId(null);
    }
  }

  const jockeyColumns = [
    {
      title: "Jockey",
      dataIndex: "fullName",
      width: 260,
      render: (value, record) => (
        <Space align="center" style={{ minWidth: 0 }}>
          <Avatar size={44} src={record.avatar || undefined}>
            {String(value || "?").charAt(0)}
          </Avatar>
          <Typography.Text strong ellipsis style={{ maxWidth: 220 }}>
            {value}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Details",
      width: 130,
      render: (_, record) => (
        <Button size="small" onClick={() => setDetailJockey(record)}>
          View more
        </Button>
      ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          onClick={() => form.setFieldValue("jockeyId", record.id)}
        >
          Invite
        </Button>
      ),
      width: 100,
    },
  ];

  const invitationColumns = [
    { title: "Horse", dataIndex: "horse" },
    { title: "Jockey", dataIndex: "jockey" },
    { title: "Tournament", dataIndex: "tournament", responsive: ["md"] },
    {
      title: "Sent at",
      dataIndex: "sentAt",
      responsive: ["lg"],
      render: (value) => formatDateTime(value),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => (
        <Tag color={statusColor[value] || "blue"}>{value}</Tag>
      ),
    },
    {
      title: "Action",
      width: 110,
      render: (_, record) => (
        <Button
          size="small"
          disabled={
            !isAcceptedInvitation(record) || contractLoadingId === record.id
          }
          onClick={() => openInvitationContract(record)}
        >
          Contract
        </Button>
      ),
    },
  ];

  const contractColumns = [
    { title: "Horse", dataIndex: "horse" },
    { title: "Jockey", dataIndex: "jockey" },
    { title: "Race", dataIndex: "race", responsive: ["md"] },
    {
      title: "Owner confirm",
      dataIndex: "ownerConfirmed",
      render: (value) => (
        <Tag color={value ? "green" : "gold"}>
          {value ? "Confirmed" : "Waiting"}
        </Tag>
      ),
    },
    {
      title: "Tournament",
      dataIndex: "tournamentRegistered",
      render: (value) => (
        <Tag color={value ? "green" : "default"}>
          {value ? "Registered" : "Not yet"}
        </Tag>
      ),
      responsive: ["lg"],
    },
    {
      title: "Action",
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            disabled={record.ownerConfirmed}
            onClick={() =>
              runAction(
                () => confirmJockeyForRace(record.id),
                "Jockey confirmed for race",
              )
            }
          >
            Confirm jockey
          </Button>
          <Button
            size="small"
            type="primary"
            disabled={!record.ownerConfirmed || record.tournamentRegistered}
            onClick={() =>
              runAction(
                () => registerContractToTournament(record.id),
                "Horse registered to tournament",
              )
            }
          >
            Register tournament
          </Button>
        </Space>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: "Race",
      dataIndex: "race",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          <Typography.Text type="secondary">
            {record.tournament}
          </Typography.Text>
        </Space>
      ),
    },
    { title: "Horse", dataIndex: "horse" },
    {
      title: "Time",
      render: (_, record) => `${record.date} ${record.time}`,
      responsive: ["md"],
    },
    { title: "Venue", dataIndex: "venue", responsive: ["lg"] },
    {
      title: "Horse entry",
      dataIndex: "horseConfirmed",
      render: (value) => (
        <Tag color={value ? "green" : "gold"}>
          {value ? "Confirmed" : "Waiting"}
        </Tag>
      ),
    },
    {
      title: "Action",
      render: (_, record) => (
        <Button
          size="small"
          disabled={record.horseConfirmed}
          onClick={() =>
            runAction(
              () => confirmHorseRaceEntry(record.id),
              "Horse race entry confirmed",
            )
          }
        >
          Confirm horse
        </Button>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="owner-page-stack">
      {contextHolder}
      <WorkspaceHeader
        kicker="JOCKEY & ENTRIES"
        title="Jockey & Entries"
        subtitle="Invite jockeys, manage contracts, and confirm race entries"
      />

      {errorMessage && <Alert type="warning" showIcon message={errorMessage} />}
      {invitationErrorMessage && (
        <Alert type="warning" showIcon message={invitationErrorMessage} />
      )}
      {tournamentErrorMessage && (
        <Alert type="warning" showIcon message={tournamentErrorMessage} />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card title="Invite jockey">
            <Form
              layout="vertical"
              form={form}
              onFinish={handleInvite}
              initialValues={{
                proposeContractAmount: 5000000,
                proposeOwnerShareRate: 60,
                proposeJockeyShareRate: 40,
                ownerCompensationRate: 60,
                jockeyCompensationRate: 40,
                message: "Mời bạn tham gia giải đua tháng 6",
              }}
            >
              <Form.Item
                label="Tournament"
                name="tournamentId"
                rules={[{ required: true, message: "Choose tournament" }]}
              >
                <Select
                  loading={tournamentLoading}
                  options={tournamentOptions}
                  placeholder="Select tournament"
                  showSearch
                  optionFilterProp="label"
                  notFoundContent={
                    tournamentLoading
                      ? "Loading tournaments..."
                      : "No tournaments found"
                  }
                />
              </Form.Item>
              <Form.Item
                label="Horse"
                name="horseId"
                rules={[{ required: true, message: "Choose horse" }]}
              >
                <Select options={horseOptions} placeholder="Select horse" />
              </Form.Item>
              <Form.Item
                label="Jockey"
                name="jockeyId"
                rules={[{ required: true, message: "Choose jockey" }]}
              >
                <Select
                  options={workspace.jockeys.map((jockey) => ({
                    value: jockey.id,
                    label: `${jockey.fullName} - ${jockey.email}`,
                  }))}
                  placeholder="Select jockey"
                />
              </Form.Item>
              <Form.Item
                label="Contract amount"
                name="proposeContractAmount"
                rules={[{ required: true, message: "Enter contract amount" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Owner share"
                    name="proposeOwnerShareRate"
                    rules={[{ required: true, message: "Enter owner share" }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      addonAfter="%"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Jockey share"
                    name="proposeJockeyShareRate"
                    rules={[{ required: true, message: "Enter jockey share" }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      addonAfter="%"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Owner compensation"
                    name="ownerCompensationRate"
                    rules={[
                      { required: true, message: "Enter owner compensation" },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      addonAfter="%"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Jockey compensation"
                    name="jockeyCompensationRate"
                    rules={[
                      { required: true, message: "Enter jockey compensation" },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      addonAfter="%"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Message" name="message">
                <Input.TextArea
                  rows={3}
                  placeholder="Mời bạn tham gia giải đua tháng 6"
                />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                Send invitation
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          <Card
            title="Available jockeys"
            extra={
              <Space wrap>
                <Input.Search
                  allowClear
                  value={jockeySearchKeyword}
                  placeholder="Search jockey name"
                  onChange={(event) =>
                    setJockeySearchKeyword(event.target.value)
                  }
                  onSearch={handleSearchJockeys}
                  enterButton="Search"
                  loading={jockeySearching}
                  style={{ width: 260 }}
                />
                <Button
                  onClick={() => {
                    setJockeySearchKeyword("");
                    loadWorkspace();
                  }}
                  loading={loading}
                >
                  Reset
                </Button>
              </Space>
            }
          >
            <Table
              rowKey="id"
              loading={loading || jockeySearching}
              columns={jockeyColumns}
              dataSource={workspace.jockeys}
              pagination={{ pageSize: 5, showSizeChanger: false }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Jockey invitations">
        <Table
          rowKey="id"
          loading={invitationLoading}
          columns={invitationColumns}
          dataSource={workspace.invitations}
          pagination={{ pageSize: 5, showSizeChanger: false }}
        />
      </Card>

      <Card title="Register tournament entry">
        <Form
          layout="vertical"
          form={registrationForm}
          onFinish={handleRegisterTournament}
        >
          <Form.Item
            label="Accepted jockey invitation"
            name="jockeyInvitationId"
            rules={[
              { required: true, message: "Choose an accepted invitation" },
            ]}
          >
            <Select
              loading={invitationLoading}
              options={acceptedInvitationOptions}
              placeholder="Select accepted invitation"
              showSearch
              optionFilterProp="label"
              notFoundContent={
                invitationLoading
                  ? "Loading invitations..."
                  : "No accepted invitations found"
              }
            />
          </Form.Item>
          <Space wrap>
            <Button
              type="primary"
              htmlType="submit"
              loading={registrationSaving}
            >
              Register
            </Button>
            <Button onClick={loadSentInvitations} loading={invitationLoading}>
              Refresh invitations
            </Button>
          </Space>
        </Form>
      </Card>

      {/* <Card title="Contracts and tournament registration">
        <Table
          rowKey="id"
          loading={loading}
          columns={contractColumns}
          dataSource={workspace.contracts}
          pagination={false}
        />
      </Card>

      <Card title="Horse race schedule">
        <Table
          rowKey="id"
          loading={loading}
          columns={scheduleColumns}
          dataSource={workspace.schedules}
          pagination={{ pageSize: 5, showSizeChanger: false }}
        />
      </Card> */}

      <Modal
        open={Boolean(detailJockey)}
        title="Jockey details"
        footer={null}
        onCancel={() => {
          setDetailJockey(null);
          setPreviewingLicense(null);
        }}
        width={680}
      >
        {detailJockey && (
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <Space align="center" size={14}>
              <Avatar size={64} src={detailJockey.avatar || undefined}>
                {String(detailJockey.fullName || "?").charAt(0)}
              </Avatar>
              <Space direction="vertical" size={0}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {detailJockey.fullName}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {detailJockey.email}
                </Typography.Text>
              </Space>
            </Space>

            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 7fr) minmax(0, 3fr)",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    border: "1px solid #d9d9d9",
                    borderRadius: 8,
                  }}
                >
                  <Typography.Text type="secondary">Phone</Typography.Text>
                  <Typography.Text
                    strong
                    style={{ display: "block", marginTop: 4 }}
                  >
                    {detailJockey.phoneNumber}
                  </Typography.Text>
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    border: "1px solid #d9d9d9",
                    borderRadius: 8,
                  }}
                >
                  <Typography.Text type="secondary">Win rate</Typography.Text>
                  <Typography.Text
                    strong
                    style={{ display: "block", marginTop: 4 }}
                  >
                    {formatRate(detailJockey.winRate)}
                  </Typography.Text>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    border: "1px solid #d9d9d9",
                    borderRadius: 8,
                  }}
                >
                  <Typography.Text type="secondary">Height</Typography.Text>
                  <Typography.Text
                    strong
                    style={{ display: "block", marginTop: 4 }}
                  >
                    {formatMeasurement(detailJockey.height, "cm")}
                  </Typography.Text>
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    border: "1px solid #d9d9d9",
                    borderRadius: 8,
                  }}
                >
                  <Typography.Text type="secondary">Weight</Typography.Text>
                  <Typography.Text
                    strong
                    style={{ display: "block", marginTop: 4 }}
                  >
                    {formatMeasurement(detailJockey.weight, "kg")}
                  </Typography.Text>
                </div>
              </div>
            </div>

            <div>
              <Typography.Title level={5}>Licenses</Typography.Title>
              {detailJockey.licenses?.length ? (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {detailJockey.licenses.map((license, index) => (
                    <Descriptions
                      key={pickFirstValue(
                        license,
                        ["_id", "id", "licenseCode"],
                        index,
                      )}
                      bordered
                      size="small"
                      column={1}
                    >
                      <Descriptions.Item label="Code">
                        {pickFirstValue(license, ["licenseCode"], "N/A")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Racing start date">
                        {pickFirstValue(license, ["racingStartDate"], "N/A")}
                      </Descriptions.Item>
                      <Descriptions.Item label="Certificate">
                        {pickFirstValue(license, ["licenseUrl"], "") ? (
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            style={{ padding: 0 }}
                            onClick={() => setPreviewingLicense(license)}
                          >
                            Preview
                          </Button>
                        ) : (
                          "N/A"
                        )}
                      </Descriptions.Item>
                    </Descriptions>
                  ))}
                </Space>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No licenses"
                />
              )}
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        title={`License ${pickFirstValue(
          previewingLicense,
          ["licenseCode"],
          "",
        )}`}
        open={Boolean(previewingLicense)}
        footer={null}
        width={760}
        onCancel={() => setPreviewingLicense(null)}
        destroyOnHidden
      >
        {previewingLicense && (
          <Image
            src={pickFirstValue(previewingLicense, ["licenseUrl"], "")}
            alt={`License ${pickFirstValue(
              previewingLicense,
              ["licenseCode"],
              "",
            )}`}
            preview={false}
            width="100%"
            style={{
              display: "block",
              maxHeight: "70dvh",
              borderRadius: 10,
              objectFit: "contain",
              background: "#f4f8f7",
            }}
          />
        )}
      </Modal>

      <JockeyContractModal
        contract={selectedContract}
        onCancel={() => setSelectedContract(null)}
        cancellingParty="HORSE_OWNER"
        onCancelContract={async (payload) => {
          await cancelContract(payload);
          await loadSentInvitations();
        }}
      />
    </Space>
  );
}
