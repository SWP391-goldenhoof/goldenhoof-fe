import { useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import "antd/dist/reset.css";
import {
  assignRaceCourse,
  assignRaceReferee,
  createRaceBatch,
  createRound2Race,
  getRaceById,
  getRacesByTournament,
} from "../../api/services/race.service";
import { getHorseById } from "../../api/services/horse.service";
import {
  getRaceCourseById,
  getRaceCourses,
} from "../../api/services/race-course.service";
import { getTournaments } from "../../api/services/tournament.service";
import { getUserById, getUsersByRole } from "../../api/services/user.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

const { Title, Text } = Typography;

const RACE_STATUSES = [
  "Scheduled",
  "Ready",
  "Simulated",
  "Ongoing",
  "Finished",
  "Cancelled",
];

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.races)) return response.races;
  return [];
}

function getId(item, fallback) {
  return item?._id || item?.id || fallback;
}

function unwrapEntity(response) {
  return (
    response?.data?.data ||
    response?.data ||
    response?.result ||
    response?.user ||
    response?.horse ||
    response
  );
}

function getPersonName(item) {
  return item?.fullName || item?.name || item?.username || item?.email || "";
}

function getRaceCourseName(item) {
  return (
    item?.raceCourseName ||
    item?.raceCourse?.name ||
    item?.raceCourse?.title ||
    item?.raceCourse?.location ||
    item?.courseName ||
    item?.course?.name ||
    item?.name ||
    item?.title ||
    ""
  );
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : value;
}

// function formatDateTime(value) {
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

function normalizeTimeInput(value = "") {
  const trimmedValue = String(value).trim();

  if (/^\d{1,2}$/.test(trimmedValue)) {
    return `${trimmedValue.padStart(2, "0")}:00`;
  }

  if (/^\d{1,2}:\d{2}$/.test(trimmedValue)) {
    const [hour, minute] = trimmedValue.split(":");

    return `${hour.padStart(2, "0")}:${minute}`;
  }

  return trimmedValue;
}

function buildStartDateTime(dateValue, timeValue) {
  const normalizedTime = normalizeTimeInput(timeValue);

  if (!dateValue || !normalizedTime) {
    return timeValue;
  }

  if (normalizedTime.includes("T")) {
    return normalizedTime;
  }

  return `${dateValue}T${normalizedTime}:00.000Z`;
}

function normalizeRacePayload(race) {
  const date = dayjs.isDayjs(race.date)
    ? race.date.format("YYYY-MM-DD")
    : race.date;

  return {
    ...race,
    date,
    startTime: buildStartDateTime(date, race.startTime),
  };
}

function statusColor(status) {
  switch (status) {
    case "Scheduled":
      return "blue";
    case "Ready":
      return "green";
    case "Simulated":
      return "purple";
    case "Ongoing":
      return "gold";
    case "Finished":
      return "cyan";
    case "Cancelled":
      return "red";
    default:
      return "default";
  }
}

function normalizeRace(item, index) {
  const id = getId(item, `race-${index}`);

  return {
    key: id,
    id,
    tournamentId: item?.tournamentId || "",
    tournamentTitle: item?.tournamentTitle || "N/A",
    refereeId: item?.refereeId || "",
    raceCourseId: item?.raceCourseId || "",
    refereeName: item?.refereeName || getPersonName(item?.referee) || "",
    raceCourseName: getRaceCourseName(item),
    name: item?.name || `Race ${index + 1}`,
    roundNumber: item?.roundNumber ?? "N/A",
    raceOrder: item?.raceOrder ?? "N/A",
    startTime: item?.startTime || "",
    date: item?.date || "",
    totalBettors: item?.totalBettors ?? 0,
    status: item?.status || "Scheduled",
    refereeConfirmedAt: item?.refereeConfirmedAt || "",
    simulatedAt: item?.simulatedAt || "",
    createdAt: item?.createdAt || "",
    participants: item?.participants || item?.horses || [],
    totalSlots: item?.totalSlots,
    filledSlots: item?.filledSlots,
    availableSlots: item?.availableSlots,
  };
}

async function resolveParticipant(participant, index) {
  const horseReference = participant?.horseId || participant?.horse;
  const jockeyReference = participant?.jockeyId || participant?.jockey;
  const horseId =
    typeof horseReference === "string"
      ? horseReference
      : getId(horseReference, "");
  const jockeyId =
    typeof jockeyReference === "string"
      ? jockeyReference
      : getId(jockeyReference, "");

  const [horseResult, jockeyResult] = await Promise.allSettled([
    horseReference && typeof horseReference === "object"
      ? Promise.resolve(horseReference)
      : horseId
        ? getHorseById(horseId)
        : Promise.resolve({}),
    jockeyReference && typeof jockeyReference === "object"
      ? Promise.resolve(jockeyReference)
      : jockeyId
        ? getUserById(jockeyId)
        : Promise.resolve({}),
  ]);
  const horse =
    horseResult.status === "fulfilled" ? unwrapEntity(horseResult.value) : {};
  const jockey =
    jockeyResult.status === "fulfilled" ? unwrapEntity(jockeyResult.value) : {};

  return {
    key: `${participant?.gateNumber ?? index}-${horseId}-${jockeyId}`,
    gateNumber: participant?.gateNumber ?? "N/A",
    horseId: horseId || "N/A",
    horseName: horse?.name || "N/A",
    jockeyId: jockeyId || "N/A",
    jockeyName: getPersonName(jockey) || "N/A",
  };
}

function normalizeReferee(item, index) {
  const id = getId(item, `referee-${index}`);
  const label = getPersonName(item) || id;

  return {
    label,
    value: id,
  };
}

function normalizeTournamentOption(item, index) {
  const id = getId(item, `tournament-${index}`);
  const title = item?.title || item?.name || id;

  return {
    label: title,
    value: id,
    startDate: item?.startDate || "",
    endDate: item?.endDate || "",
  };
}

function parseTournamentDate(value) {
  if (!value) return null;

  const slashDate = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const parsed = slashDate
    ? dayjs(`${slashDate[3]}-${slashDate[2]}-${slashDate[1]}`)
    : dayjs(value);

  return parsed.isValid() ? parsed.startOf("day") : null;
}

function RaceManagement() {
  const [searchForm] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [round2Form] = Form.useForm();
  const [refereeForm] = Form.useForm();
  const [raceCourseForm] = Form.useForm();
  const batchTournamentId = Form.useWatch("tournamentId", batchForm);
  const round2TournamentId = Form.useWatch("tournamentId", round2Form);

  const [races, setRaces] = useState([]);
  const [referees, setReferees] = useState([]);
  const [raceCourses, setRaceCourses] = useState([]);
  const [raceCoursesById, setRaceCoursesById] = useState({});
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [detailRace, setDetailRace] = useState(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isRound2ModalOpen, setIsRound2ModalOpen] = useState(false);
  const [batchRaceCount, setBatchRaceCount] = useState(1);
  const [assigningRefereeRace, setAssigningRefereeRace] = useState(null);
  const [assigningCourseRace, setAssigningCourseRace] = useState(null);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadReferees() {
    try {
      const response = await getUsersByRole("Referee");
      setReferees(resolveList(response).map(normalizeReferee));
    } catch (error) {
      message.error(error?.message || "Unable to load referees");
    }
  }

  async function loadRaceCourses() {
    try {
      const response = await getRaceCourses();
      const courses = resolveList(response);
      const options = courses.map((course, index) => {
        const id = getId(course, `race-course-${index}`);
        const name = getRaceCourseName(course) || "Unnamed race course";
        const location = course?.location ? ` - ${course.location}` : "";

        return {
          label: `${name}${location}`,
          value: id,
        };
      });

      setRaceCourses(options);
      setRaceCoursesById((current) => ({
        ...current,
        ...Object.fromEntries(
          courses.map((course, index) => [
            getId(course, `race-course-${index}`),
            getRaceCourseName(course) || "N/A",
          ]),
        ),
      }));
    } catch (error) {
      message.error(error?.message || "Unable to load race courses");
    }
  }

  async function loadRacesFor(tournamentId, status = "") {
    setIsLoading(true);

    try {
      const response = await getRacesByTournament(tournamentId, status);
      const normalizedRaces = resolveList(response).map(normalizeRace);

      setRaces(normalizedRaces);
      loadRaceCourseNames(normalizedRaces);
    } catch (error) {
      message.error(error?.message || "Unable to load races");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRaceCourseNames(nextRaces) {
    const missingIds = [
      ...new Set(
        nextRaces
          .filter((race) => race.raceCourseId && !race.raceCourseName)
          .map((race) => race.raceCourseId),
      ),
    ].filter((id) => !raceCoursesById[id]);

    if (missingIds.length === 0) {
      return;
    }

    const entries = await Promise.all(
      missingIds.map(async (id) => {
        try {
          const response = await getRaceCourseById(id);
          const raceCourse = response?.data || response?.result || response;

          return [id, getRaceCourseName(raceCourse) || "N/A"];
        } catch {
          return [id, "N/A"];
        }
      }),
    );

    setRaceCoursesById((current) => ({
      ...current,
      ...Object.fromEntries(entries),
    }));
  }

  async function loadRaces() {
    const { tournamentId, status } = await searchForm.validateFields();
    await loadRacesFor(tournamentId, status);
  }

  async function loadTournaments() {
    setIsLoading(true);

    try {
      const response = await getTournaments();
      const options = resolveList(response).map(normalizeTournamentOption);

      setTournaments(options);

      if (options.length > 0 && !searchForm.getFieldValue("tournamentId")) {
        const firstTournamentId = options[0].value;

        searchForm.setFieldsValue({
          tournamentId: firstTournamentId,
        });
        await loadRacesFor(firstTournamentId);
      }
    } catch (error) {
      message.error(error?.message || "Unable to load tournaments");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReferees();
    loadRaceCourses();
    loadTournaments();
  }, []);

  function openBatchModal() {
    const tournamentId = searchForm.getFieldValue("tournamentId") || "";
    const suggestedDate = getTournamentDate(tournamentId, "startDate");

    batchForm.resetFields();
    batchForm.setFieldsValue({
      tournamentId,
      races: [
        {
          name: "Vong 1 - Race 1",
          date: suggestedDate,
          startTime: "08:00",
        },
      ],
    });
    setBatchRaceCount(1);
    setIsBatchModalOpen(true);
  }

  function handleBatchRaceCountChange(count) {
    const currentRaces = batchForm.getFieldValue("races") || [];
    const firstRace = currentRaces[0] || {
      name: "Vong 1 - Race 1",
      date: getTournamentDate(batchTournamentId, "startDate"),
      startTime: "08:00",
    };

    batchForm.setFieldValue(
      "races",
      count === 1
        ? [firstRace]
        : [
            firstRace,
            currentRaces[1] || {
              name: "Vong 1 - Race 2",
              date:
                firstRace.date ||
                getTournamentDate(batchTournamentId, "startDate"),
              startTime: "08:00",
            },
          ],
    );
    setBatchRaceCount(count);
  }

  function getTournamentDate(tournamentId, field) {
    const tournament = tournaments.find(
      (option) => option.value === tournamentId,
    );

    return parseTournamentDate(tournament?.[field]);
  }

  function isOutsideTournament(date, tournamentId) {
    const startDate = getTournamentDate(tournamentId, "startDate");
    const endDate = getTournamentDate(tournamentId, "endDate");

    if (!date || !startDate || !endDate) return false;
    return date.isBefore(startDate, "day") || date.isAfter(endDate, "day");
  }

  function getTournamentPeriodText(tournamentId) {
    const startDate = getTournamentDate(tournamentId, "startDate");
    const endDate = getTournamentDate(tournamentId, "endDate");

    if (!startDate || !endDate) {
      return "Tournament period is unavailable";
    }

    return `Tournament period: ${startDate.format("DD/MM/YYYY")} - ${endDate.format("DD/MM/YYYY")}`;
  }

  function renderTournamentPeriodHint(tournamentId) {
    const startDate = getTournamentDate(tournamentId, "startDate");
    const endDate = getTournamentDate(tournamentId, "endDate");

    return (
      <div className="race-tournament-period">
        <span className="race-tournament-period-label">Tournament time</span>
        <span className="race-tournament-period-range">
          {startDate && endDate
            ? `${startDate.format("DD/MM/YYYY")} - ${endDate.format("DD/MM/YYYY")}`
            : "Select a tournament to see its date range"}
        </span>
        <Text type="secondary" className="race-tournament-period-note">
          Race date should stay inside this tournament period to avoid backend
          validation errors.
        </Text>
      </div>
    );
  }

  function applyBatchTournamentDefaults(tournamentId) {
    const suggestedDate = getTournamentDate(tournamentId, "startDate");
    const races = batchForm.getFieldValue("races") || [];

    batchForm.setFieldValue(
      "races",
      races.map((race, index) => ({
        ...race,
        name: race?.name || `Vong 1 - Race ${index + 1}`,
        date: suggestedDate,
        startTime: race?.startTime || "08:00",
      })),
    );
  }

  function openRound2Modal() {
    const tournamentId = searchForm.getFieldValue("tournamentId") || "";
    round2Form.resetFields();
    round2Form.setFieldsValue({
      tournamentId,
      date: getTournamentDate(tournamentId, "endDate"),
      startTime: "08:00",
    });
    setIsRound2ModalOpen(true);
  }

  async function openDetailModal(record) {
    setIsLoading(true);

    try {
      const response = await getRaceById(record.id);
      const nextRace = normalizeRace(response, 0);
      const participants = await Promise.all(
        nextRace.participants.map(resolveParticipant),
      );

      setDetailRace({ ...nextRace, participants });
      loadRaceCourseNames([nextRace]);
    } catch (error) {
      message.error(error?.message || "Unable to load race detail");
    } finally {
      setIsLoading(false);
    }
  }

  function openAssignRefereeModal(record) {
    setAssigningRefereeRace(record);
    refereeForm.resetFields();
    refereeForm.setFieldsValue({
      refereeId: record.refereeId || undefined,
    });
  }

  function openAssignRaceCourseModal(record) {
    setAssigningCourseRace(record);
    raceCourseForm.resetFields();
    raceCourseForm.setFieldsValue({
      raceCourseId: record.raceCourseId || undefined,
    });
  }

  async function handleCreateBatch() {
    const values = await batchForm.validateFields();
    const payload = {
      ...values,
      races: values.races.map(normalizeRacePayload),
    };

    setIsSaving(true);

    try {
      await createRaceBatch(payload);
      message.success("Races created");
      setIsBatchModalOpen(false);
      batchForm.resetFields();
      searchForm.setFieldsValue({ tournamentId: payload.tournamentId });
      await loadRacesFor(
        payload.tournamentId,
        searchForm.getFieldValue("status"),
      );
    } catch (error) {
      message.error(error?.message || "Unable to create races");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateRound2() {
    const values = await round2Form.validateFields();
    const date = values.date.format("YYYY-MM-DD");

    setIsSaving(true);

    try {
      await createRound2Race(values.tournamentId, {
        startTime: buildStartDateTime(date, values.startTime),
        date,
      });
      message.success("Round 2 race created");
      setIsRound2ModalOpen(false);
      round2Form.resetFields();
      searchForm.setFieldsValue({ tournamentId: values.tournamentId });
      await loadRacesFor(
        values.tournamentId,
        searchForm.getFieldValue("status"),
      );
    } catch (error) {
      message.error(error?.message || "Unable to create round 2 race");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignReferee() {
    const values = await refereeForm.validateFields();

    setIsSaving(true);

    try {
      await assignRaceReferee(assigningRefereeRace.id, values.refereeId);
      message.success("Referee assigned");
      setAssigningRefereeRace(null);
      await loadRaces();
    } catch (error) {
      message.error(error?.message || "Unable to assign referee");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAssignRaceCourse() {
    const values = await raceCourseForm.validateFields();

    setIsSaving(true);

    try {
      await assignRaceCourse(assigningCourseRace.id, values.raceCourseId);
      message.success("Race course assigned");
      setAssigningCourseRace(null);
      await loadRaces();
    } catch (error) {
      message.error(error?.message || "Unable to assign race course");
    } finally {
      setIsSaving(false);
    }
  }

  function getRefereeDisplayName(record) {
    return (
      record.refereeName ||
      referees.find((referee) => referee.value === record.refereeId)?.label ||
      "N/A"
    );
  }

  function getRaceCourseDisplayName(record) {
    return (
      record.raceCourseName || raceCoursesById[record.raceCourseId] || "N/A"
    );
  }

  const round1Races = useMemo(
    () => races.filter((race) => Number(race.roundNumber) === 1),
    [races],
  );

  const round2Races = useMemo(
    () => races.filter((race) => Number(race.roundNumber) === 2),
    [races],
  );

  const columns = useMemo(
    () => [
      {
        title: "Race",
        dataIndex: "name",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 220,
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: "Tournament",
        dataIndex: "tournamentTitle",
        width: 260,
        ellipsis: true,
      },
      {
        title: "Round",
        dataIndex: "roundNumber",
        width: 90,
      },
      {
        title: "Order",
        dataIndex: "raceOrder",
        width: 90,
      },
      {
        title: "Date",
        dataIndex: "date",
        width: 130,
        render: formatDate,
      },
      {
        title: "Start Time",
        dataIndex: "startTime",
        width: 180,
        render: formatDateTime,
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 130,
        render: (status) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      {
        title: "Referee",
        key: "referee",
        width: 220,
        ellipsis: true,
        render: (_, record) => getRefereeDisplayName(record),
      },
      {
        title: "Race Course",
        key: "raceCourse",
        width: 220,
        ellipsis: true,
        render: (_, record) => getRaceCourseDisplayName(record),
      },
      {
        title: "Slots",
        key: "slots",
        width: 150,
        render: (_, record) =>
          `${record.filledSlots ?? "N/A"} / ${record.totalSlots ?? "N/A"}`,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 430,
        render: (_, record) => (
          <Space>
            <Button
              className="race-management-link-btn"
              size="small"
              onClick={() => openDetailModal(record)}
            >
              Detail
            </Button>

            <Button
              className="race-management-link-btn"
              size="small"
              onClick={() => openAssignRefereeModal(record)}
            >
              Assign Referee
            </Button>

            <Button
              className="race-management-link-btn"
              size="small"
              onClick={() => openAssignRaceCourseModal(record)}
            >
              Assign Course
            </Button>
          </Space>
        ),
      },
    ],
    [raceCoursesById, referees, shouldFixColumns],
  );

  return (
    <section className="race-management">
      <style>{`
        .race-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .race-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .race-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: 0;
        }

        .race-management-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .race-round-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-bottom: 20px;
          border-top: 1px solid #ccefe7;
          border-bottom: 1px solid #ccefe7;
          background: #f7fffd;
        }

        .race-round-action {
          min-height: 86px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 20px;
        }

        .race-round-action + .race-round-action {
          border-left: 1px solid #ccefe7;
        }

        .race-round-label {
          display: block;
          margin-bottom: 3px;
          color: #007a68;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .race-round-title {
          color: #06332e;
          font-size: 16px;
          font-weight: 900;
        }

        .race-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .race-list-section + .race-list-section {
          margin-top: 24px;
        }

        .race-list-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 10px;
        }

        .race-list-heading h3.ant-typography {
          margin: 0;
          color: #06332e;
          font-size: 18px;
        }

        .race-list-count {
          min-width: 30px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 9px;
          border-radius: 14px;
          color: #006755;
          background: #dffff8;
          font-size: 13px;
          font-weight: 900;
        }

        .race-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .race-management-table.ant-table-wrapper .ant-table-tbody > tr > td {
          color: #0d2321;
        }

        .race-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
        }

        .race-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }

        .race-management-primary.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        .race-management-primary.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }

        .race-management-dynamic-row {
          display: grid;
          grid-template-columns: minmax(180px, 1fr) 150px minmax(230px, 1fr) auto;
          gap: 10px;
          align-items: flex-start;
        }

        .race-batch-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .race-batch-mode {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
          padding-bottom: 16px;
          border-bottom: 1px solid #dff3ee;
        }

        .race-batch-mode-label {
          color: #06332e;
          font-weight: 900;
        }

        .race-batch-panel {
          padding: 18px;
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #f9fffd;
        }

        .race-batch-title {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 16px;
          color: #06332e;
          font-size: 16px;
          font-weight: 950;
        }

        .race-batch-number {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #69f8dd;
          font-size: 13px;
        }

        .race-tournament-period {
          margin: -6px 0 18px;
          padding: 12px 14px;
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #f7fffd;
        }

        .race-tournament-period-label {
          display: block;
          color: #007a68;
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .race-tournament-period-range {
          display: block;
          margin-top: 3px;
          color: #06332e;
          font-size: 16px;
          font-weight: 950;
        }

        .race-tournament-period-note {
          display: block;
          margin-top: 5px;
        }

        @media (max-width: 920px) {
          .race-management-header,
          .race-management-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .race-round-actions {
            grid-template-columns: 1fr;
          }

          .race-round-action + .race-round-action {
            border-top: 1px solid #ccefe7;
            border-left: 0;
          }

          .race-management-dynamic-row {
            grid-template-columns: 1fr;
          }

          .race-batch-grid {
            grid-template-columns: 1fr;
          }

          .race-batch-mode {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="race-management-header">
        <div>
          <div className="race-management-kicker">Admin dashboard</div>
          <Title level={1}>Race Management</Title>
        </div>
      </div>

      <div className="race-round-actions">
        <section className="race-round-action">
          <div>
            <span className="race-round-label">Round 1</span>
            <div className="race-round-title">Qualifying Races</div>
          </div>

          <Button
            className="race-management-primary"
            onClick={openBatchModal}
          >
            Create Round 1 Races
          </Button>
        </section>

        <section className="race-round-action">
          <div>
            <span className="race-round-label">Round 2</span>
            <div className="race-round-title">Final Race</div>
          </div>

          <Button
            className="race-management-link-btn"
            onClick={openRound2Modal}
          >
            Create Final Race
          </Button>
        </section>
      </div>

      <div className="race-management-toolbar">
        <Form form={searchForm} layout="inline">
          <Form.Item
            name="tournamentId"
            rules={[{ required: true, message: "Tournament is required" }]}
          >
            <Select
              showSearch
              placeholder="Select tournament"
              optionFilterProp="label"
              style={{ width: 300 }}
              options={tournaments}
              onChange={() => loadRaces()}
            />
          </Form.Item>

          <Form.Item name="status">
            <Select
              allowClear
              placeholder="All Status"
              style={{ width: 170 }}
              onChange={() => loadRaces()}
              options={RACE_STATUSES.map((status) => ({
                label: status,
                value: status,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Button
              className="race-management-link-btn"
              loading={isLoading}
              onClick={loadRaces}
            >
              Load Races
            </Button>
          </Form.Item>
        </Form>
      </div>

      <section className="race-list-section">
        <div className="race-list-heading">
          <Title level={3}>Round 1 Races</Title>
          <span className="race-list-count">{round1Races.length}</span>
        </div>
        <div className="race-management-card">
          <Table
            className="race-management-table"
            columns={columns}
            dataSource={round1Races}
            loading={isLoading}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `${total} Round 1 races`,
            }}
            locale={{ emptyText: "No Round 1 races found" }}
            scroll={{ x: 1950 }}
          />
        </div>
      </section>

      <section className="race-list-section">
        <div className="race-list-heading">
          <Title level={3}>Round 2 Final</Title>
          <span className="race-list-count">{round2Races.length}</span>
        </div>
        <div className="race-management-card">
          <Table
            className="race-management-table"
            columns={columns}
            dataSource={round2Races}
            loading={isLoading}
            pagination={false}
            locale={{ emptyText: "No Round 2 final found" }}
            scroll={{ x: 1950 }}
          />
        </div>
      </section>

      <Modal
        title="Create Round 1 Races"
        open={isBatchModalOpen}
        okText={`Create ${batchRaceCount} Race${batchRaceCount > 1 ? "s" : ""}`}
        cancelText="Cancel"
        width={960}
        confirmLoading={isSaving}
        onOk={handleCreateBatch}
        onCancel={() => setIsBatchModalOpen(false)}
        destroyOnClose
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            label="Tournament"
            name="tournamentId"
            rules={[{ required: true, message: "Tournament is required" }]}
          >
            <Select
              showSearch
              placeholder="Select tournament"
              optionFilterProp="label"
              options={tournaments}
              onChange={applyBatchTournamentDefaults}
            />
          </Form.Item>

          {renderTournamentPeriodHint(batchTournamentId)}

          <div className="race-batch-mode">
            <span className="race-batch-mode-label">Number of races</span>
            <Segmented
              value={batchRaceCount}
              options={[
                { label: "1 Race", value: 1 },
                { label: "2 Races", value: 2 },
              ]}
              onChange={handleBatchRaceCountChange}
            />
          </div>

          <Form.List name="races">
            {(fields) => (
              <div className="race-batch-grid">
                {fields.map(({ key, name, ...restField }, index) => (
                  <section className="race-batch-panel" key={key}>
                    <div className="race-batch-title">
                      <span className="race-batch-number">{index + 1}</span>
                      Race {index + 1}
                    </div>

                    <Form.Item
                      {...restField}
                      label="Race Name"
                      name={[name, "name"]}
                      rules={[{ required: true, message: "Name is required" }]}
                    >
                      <Input placeholder={`Vong 1 - Race ${index + 1}`} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      label="Date"
                      name={[name, "date"]}
                      extra={getTournamentPeriodText(batchTournamentId)}
                      rules={[{ required: true, message: "Date is required" }]}
                    >
                      <DatePicker
                        format="DD/MM/YYYY"
                        placeholder="DD/MM/YYYY"
                        style={{ width: "100%" }}
                        disabledDate={(date) =>
                          isOutsideTournament(date, batchTournamentId)
                        }
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      label="Start Time"
                      name={[name, "startTime"]}
                      rules={[
                        { required: true, message: "Start time is required" },
                      ]}
                    >
                      <Input type="time" placeholder="08:00" />
                    </Form.Item>
                  </section>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title="Create Round 2 Race"
        open={isRound2ModalOpen}
        okText="Create"
        cancelText="Cancel"
        confirmLoading={isSaving}
        onOk={handleCreateRound2}
        onCancel={() => setIsRound2ModalOpen(false)}
      >
        <Form form={round2Form} layout="vertical">
          <Form.Item
            label="Tournament"
            name="tournamentId"
            rules={[{ required: true, message: "Tournament is required" }]}
          >
            <Select
              showSearch
              placeholder="Select tournament"
              optionFilterProp="label"
              options={tournaments}
              onChange={(tournamentId) =>
                round2Form.setFieldsValue({
                  date: getTournamentDate(tournamentId, "endDate"),
                  startTime: round2Form.getFieldValue("startTime") || "08:00",
                })
              }
            />
          </Form.Item>

          {renderTournamentPeriodHint(round2TournamentId)}

          <Form.Item
            label="Date"
            name="date"
            extra={getTournamentPeriodText(round2TournamentId)}
            rules={[{ required: true, message: "Date is required" }]}
          >
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="DD/MM/YYYY"
              style={{ width: "100%" }}
              disabledDate={(date) =>
                isOutsideTournament(date, round2TournamentId)
              }
            />
          </Form.Item>

          <Form.Item
            label="Start Time"
            name="startTime"
            rules={[{ required: true, message: "Start time is required" }]}
          >
            <Input type="time" placeholder="08:00" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Assign Referee"
        open={Boolean(assigningRefereeRace)}
        okText="Assign"
        cancelText="Cancel"
        confirmLoading={isSaving}
        onOk={handleAssignReferee}
        onCancel={() => setAssigningRefereeRace(null)}
      >
        <Form form={refereeForm} layout="vertical">
          <Form.Item
            label="Referee"
            name="refereeId"
            rules={[{ required: true, message: "Referee is required" }]}
          >
            <Select
              showSearch
              placeholder="Select referee"
              optionFilterProp="label"
              options={referees}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Assign Race Course"
        open={Boolean(assigningCourseRace)}
        okText="Assign"
        cancelText="Cancel"
        confirmLoading={isSaving}
        onOk={handleAssignRaceCourse}
        onCancel={() => setAssigningCourseRace(null)}
      >
        <Form form={raceCourseForm} layout="vertical">
          <Form.Item
            label="Race Course"
            name="raceCourseId"
            rules={[{ required: true, message: "Race course is required" }]}
          >
            <Select
              showSearch
              placeholder="Select race course"
              optionFilterProp="label"
              options={raceCourses}
              notFoundContent="No race courses found"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Race Detail"
        open={Boolean(detailRace)}
        footer={null}
        width={900}
        onCancel={() => setDetailRace(null)}
      >
        {detailRace && (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="ID">{detailRace.id}</Descriptions.Item>
              <Descriptions.Item label="Name">
                {detailRace.name}
              </Descriptions.Item>
              <Descriptions.Item label="Tournament">
                {detailRace.tournamentTitle}
              </Descriptions.Item>
              <Descriptions.Item label="Tournament ID">
                <Text code>{detailRace.tournamentId || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Round">
                {detailRace.roundNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Race Order">
                {detailRace.raceOrder}
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {formatDate(detailRace.date)}
              </Descriptions.Item>
              <Descriptions.Item label="Start Time">
                {formatDateTime(detailRace.startTime)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColor(detailRace.status)}>
                  {detailRace.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Referee">
                {getRefereeDisplayName(detailRace)}
              </Descriptions.Item>
              <Descriptions.Item label="Referee ID">
                <Text code>{detailRace.refereeId || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Race Course">
                {getRaceCourseDisplayName(detailRace)}
              </Descriptions.Item>
              <Descriptions.Item label="Race Course ID">
                <Text code>{detailRace.raceCourseId || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Total Bettors">
                {detailRace.totalBettors}
              </Descriptions.Item>
              <Descriptions.Item label="Slots">
                {detailRace.filledSlots ?? "N/A"} /{" "}
                {detailRace.totalSlots ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Available Slots">
                {detailRace.availableSlots ?? "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Horses">
                {detailRace.participants.length}
              </Descriptions.Item>
              <Descriptions.Item label="Referee Confirmed At">
                {formatDateTime(detailRace.refereeConfirmedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Simulated At">
                {formatDateTime(detailRace.simulatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {formatDateTime(detailRace.createdAt)}
              </Descriptions.Item>
            </Descriptions>

            <Table
              rowKey="key"
              size="small"
              pagination={false}
              dataSource={detailRace.participants}
              locale={{ emptyText: "No participants in this race" }}
              columns={[
                {
                  title: "Gate",
                  dataIndex: "gateNumber",
                  width: 100,
                  sorter: (a, b) => Number(a.gateNumber) - Number(b.gateNumber),
                  defaultSortOrder: "ascend",
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
                  title: "Jockey",
                  dataIndex: "jockeyName",
                },
                {
                  title: "Jockey ID",
                  dataIndex: "jockeyId",
                  width: 190,
                  render: (value) => <Text code>{value}</Text>,
                },
              ]}
            />
          </Space>
        )}
      </Modal>
    </section>
  );
}

export default RaceManagement;
