import { apiClient } from "../client";
import { JOCKEY_INVITATION_ENDPOINTS } from "../endpoints/jockeyInvitation.endpoint";
import { SCHEDULE_ENDPOINTS } from "../endpoints/schedule.endpoint";
import { getProfile } from "./auth.service";
import { getUserById } from "./user.service";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const delay = (value, ms = 180) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(structuredClone(value)), ms);
  });

function unwrapData(response) {
  const data = response?.data;

  return (
    data?.data || data?.result || data?.invitation || data?.contract || data
  );
}

function unwrapCollection(response) {
  const data = unwrapData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.invitations)) return data.invitations;
  if (Array.isArray(data?.jockeyInvitations)) return data.jockeyInvitations;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.upcomingSchedules)) return data.upcomingSchedules;
  if (Array.isArray(data?.races)) return data.races;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

function pickFirstValue(source, keys, fallback = "") {
  for (const key of keys) {
    const value = source?.[key];

    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
}

function pickExistingValues(source, keys) {
  if (!source || typeof source !== "object") return [];

  return keys
    .map((key) => source[key])
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(String)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function getReferenceId(reference) {
  if (!reference) return "";
  if (typeof reference === "string") return reference;

  return pickFirstValue(reference, ["id", "_id", "raceId", "scheduleId"], "");
}

function normalizeUpcomingSchedule(schedule = {}, index = 0) {
  const race = schedule.race || schedule.raceInfo || {};
  const tournament =
    schedule.tournament ||
    schedule.tournamentInfo ||
    race.tournament ||
    race.tournamentInfo ||
    {};
  const horse = schedule.horse || schedule.horseInfo || race.horse || {};
  const owner = schedule.owner || schedule.ownerInfo || horse.owner || {};
  const raceCourse =
    schedule.raceCourse ||
    schedule.raceCourseInfo ||
    race.raceCourse ||
    race.raceCourseInfo ||
    {};
  const startTime = pickFirstValue(
    schedule,
    ["startTime", "scheduledAt"],
    pickFirstValue(race, ["startTime", "scheduledAt"], ""),
  );
  const parsedStartTime = startTime ? new Date(startTime) : null;
  const hasValidStartTime =
    parsedStartTime && !Number.isNaN(parsedStartTime.getTime());

  return {
    ...schedule,
    raceId:
      pickFirstValue(schedule, ["raceId"], "") ||
      pickFirstValue(race, ["id", "_id", "raceId"], ""),
    raceName: pickFirstValue(
      schedule,
      ["raceName", "name", "title"],
      pickFirstValue(race, ["name", "title", "raceName"], "Unnamed race"),
    ),
    tournamentId:
      pickFirstValue(schedule, ["tournamentId"], "") ||
      pickFirstValue(race, ["tournamentId"], "") ||
      pickFirstValue(tournament, ["id", "_id", "tournamentId"], ""),
    raceCourseName: pickFirstValue(
      schedule,
      ["raceCourseName"],
      pickFirstValue(raceCourse, ["name"], "N/A"),
    ),
    totalSlots: pickFirstValue(
      schedule,
      ["totalSlots"],
      pickFirstValue(race, ["totalSlots"], 0),
    ),
    filledSlots: pickFirstValue(
      schedule,
      ["filledSlots"],
      pickFirstValue(race, ["filledSlots"], 0),
    ),
    availableSlots: pickFirstValue(
      schedule,
      ["availableSlots"],
      pickFirstValue(race, ["availableSlots"], 0),
    ),
    status: pickFirstValue(
      schedule,
      ["status", "assignmentStatus"],
      pickFirstValue(race, ["status"], "Upcoming"),
    ),
    id:
      pickFirstValue(schedule, ["id", "_id", "scheduleId", "raceId"], "") ||
      getReferenceId(race) ||
      `upcoming-${index}`,
    race: pickFirstValue(
      schedule,
      ["raceName", "name", "title"],
      pickFirstValue(race, ["name", "title", "raceName"], "Unnamed race"),
    ),
    tournament: pickFirstValue(
      schedule,
      ["tournamentName", "tournamentTitle"],
      pickFirstValue(tournament, ["title", "name"], "N/A"),
    ),
    horse: pickFirstValue(
      schedule,
      ["horseName"],
      pickFirstValue(horse, ["name", "horseName"], "N/A"),
    ),
    owner: pickFirstValue(
      schedule,
      ["ownerName", "ownerFullName"],
      pickFirstValue(owner, ["fullName", "name", "stableName"], "N/A"),
    ),
    date: pickFirstValue(
      schedule,
      ["date", "raceDate"],
      pickFirstValue(
        race,
        ["date", "raceDate"],
        hasValidStartTime ? dayjs.utc(startTime).format("DD/MM/YYYY") : "N/A",
      ),
    ),
    time: pickFirstValue(
      schedule,
      ["time"],
      pickFirstValue(
        race,
        ["time"],
        hasValidStartTime
          ? dayjs.utc(startTime).format("HH:mm")
          : "N/A",
      ),
    ),
    venue: pickFirstValue(
      schedule,
      ["venue", "location", "raceCourseName"],
      pickFirstValue(raceCourse, ["name", "location"], "N/A"),
    ),
    assignmentStatus: pickFirstValue(
      schedule,
      ["assignmentStatus", "status"],
      pickFirstValue(race, ["status"], "Upcoming"),
    ),
    gate: pickFirstValue(
      schedule,
      ["gate", "gateNumber"],
      pickFirstValue(race, ["gate", "gateNumber"], "N/A"),
    ),
    distance: pickFirstValue(
      schedule,
      ["distance"],
      pickFirstValue(
        race,
        ["distance"],
        pickFirstValue(raceCourse, ["distance"], "N/A"),
      ),
    ),
    surface: pickFirstValue(
      schedule,
      ["surface", "trackType"],
      pickFirstValue(
        race,
        ["surface", "trackType"],
        pickFirstValue(raceCourse, ["trackType", "surface"], "N/A"),
      ),
    ),
    purse: pickFirstValue(
      schedule,
      ["purse", "prizePool"],
      pickFirstValue(race, ["purse", "prizePool"], 0),
    ),
    horseInfo: typeof horse === "object" ? horse : {},
    result: schedule.result || race.result || null,
  };
}

let jockeyData = {
  profile: {
    name: "Demo Jockey",
    rank: 7,
    rating: 96.8,
    winRate: 24,
    careerWins: 120,
    seasonPrize: 420000,
  },
  invitations: [
    {
      id: 1001,
      owner: "Golden Hoof Stable",
      horse: "Thunder",
      race: "Emerald Stakes",
      tournament: "Summer Turf Championship",
      venue: "Royal Turf Club",
      date: "2026-06-18",
      time: "15:00",
      distance: "1,600m",
      surface: "Turf",
      fee: 3200,
      status: "Pending",
      horseInfo: {
        age: 4,
        breed: "Arabian",
        rating: 94,
        winRate: 65,
      },
    },
    {
      id: 1002,
      owner: "Greenfield Stable",
      horse: "Silver Bullet",
      race: "Champion's Cup",
      tournament: "National Racing League",
      venue: "Royal Turf Club",
      date: "2026-06-24",
      time: "16:45",
      distance: "2,400m",
      surface: "Turf",
      fee: 5200,
      status: "Pending",
      horseInfo: {
        age: 6,
        breed: "Thoroughbred",
        rating: 98,
        winRate: 71,
      },
    },
    {
      id: 1003,
      owner: "Skyline Racing",
      horse: "Emerald Dream",
      race: "Sunshine Cup",
      tournament: "Spring Classic",
      venue: "Sunshine Racecourse",
      date: "2026-05-26",
      time: "16:00",
      distance: "1,800m",
      surface: "Turf",
      fee: 2800,
      status: "Accepted",
      horseInfo: {
        age: 5,
        breed: "Thoroughbred",
        rating: 96,
        winRate: 62,
      },
    },
  ],
  schedules: [
    {
      id: 2001,
      assignmentStatus: "Confirmed",
      race: "Emerald Stakes",
      tournament: "Summer Turf Championship",
      horse: "Thunder",
      owner: "Golden Hoof Stable",
      venue: "Royal Turf Club",
      date: "2026-06-18",
      time: "15:00",
      gate: 4,
      distance: "1,600m",
      surface: "Turf",
      purse: 50000,
      horseInfo: {
        age: 4,
        breed: "Arabian",
        color: "Black",
        rating: 94,
        winRate: 65,
        starts: 21,
        podiums: 16,
      },
      result: null,
    },
    {
      id: 2002,
      assignmentStatus: "Confirmed",
      race: "Golden Mile Cup",
      tournament: "Summer Turf Championship",
      horse: "Storm",
      owner: "Golden Hoof Stable",
      venue: "Sunshine Racecourse",
      date: "2026-06-22",
      time: "16:30",
      gate: 2,
      distance: "1,600m",
      surface: "Turf",
      purse: 42000,
      horseInfo: {
        age: 5,
        breed: "Thoroughbred",
        color: "Bay",
        rating: 88,
        winRate: 48,
        starts: 18,
        podiums: 11,
      },
      result: null,
    },
    {
      id: 2003,
      assignmentStatus: "Finished",
      race: "Sunshine Cup",
      tournament: "Spring Classic",
      horse: "Emerald Dream",
      owner: "Skyline Racing",
      venue: "Sunshine Racecourse",
      date: "2026-05-26",
      time: "16:00",
      gate: 6,
      distance: "1,800m",
      surface: "Turf",
      purse: 42000,
      horseInfo: {
        age: 5,
        breed: "Thoroughbred",
        color: "Chestnut",
        rating: 96,
        winRate: 62,
        starts: 24,
        podiums: 18,
      },
      result: { rank: 2, time: "1:48.63", prize: 9000, points: 32 },
    },
    {
      id: 2004,
      assignmentStatus: "Finished",
      race: "Morning Sprint",
      tournament: "City Sprint Series",
      horse: "Rapid Crown",
      owner: "Royal Bloodstock",
      venue: "Valley Racecourse",
      date: "2026-05-12",
      time: "13:30",
      gate: 1,
      distance: "1,000m",
      surface: "Dirt",
      purse: 18000,
      horseInfo: {
        age: 4,
        breed: "Thoroughbred",
        color: "Bay",
        rating: 90,
        winRate: 58,
        starts: 16,
        podiums: 10,
      },
      result: { rank: 1, time: "0:58.34", prize: 12000, points: 40 },
    },
  ],
  standings: [
    {
      rank: 1,
      jockey: "Liam O'Connor",
      wins: 120,
      points: 1420,
      prize: 520000,
    },
    {
      rank: 2,
      jockey: "Sophia Martinez",
      wins: 98,
      points: 1280,
      prize: 460000,
    },
    { rank: 7, jockey: "Demo Jockey", wins: 64, points: 860, prize: 420000 },
    { rank: 8, jockey: "Noah Henderson", wins: 60, points: 820, prize: 360000 },
  ],
};

export async function getJockeyDashboard() {
  const [invitations, scheduleData, profile] = await Promise.all([
    getJockeyInvitations(),
    getJockeyRaceSchedule(),
    getJockeyProfile(),
  ]);

  return {
    ...structuredClone(jockeyData),
    profile: {
      ...structuredClone(jockeyData.profile),
      ...profile,
    },
    invitations,
    schedules: scheduleData.schedules,
    standings: scheduleData.standings,
  };
}

export async function getJockeyProfile() {
  const profile = await getProfile();
  const userIds = pickExistingValues(profile, [
    "id",
    "_id",
    "userId",
    "accountId",
    "profileId",
  ]);

  if (userIds.length === 0) return profile || {};

  for (const userId of userIds) {
    try {
      const userDetail = await getUserById(userId);

      return {
        ...(profile || {}),
        ...(userDetail || {}),
      };
    } catch {
      // Try the next possible id shape from the auth profile.
    }
  }

  return profile || {};
}

export async function getJockeyInvitations() {
  const response = await apiClient.get(
    JOCKEY_INVITATION_ENDPOINTS.MY_INVITATIONS,
    {
      includeAuth: true,
    },
  );

  return unwrapCollection(response);
}

export async function getJockeyInvitationById(invitationId) {
  const response = await apiClient.get(
    JOCKEY_INVITATION_ENDPOINTS.DETAIL(invitationId),
    {
      includeAuth: true,
    },
  );

  return unwrapData(response);
}

export async function respondToJockeyInvitation(invitationId, status) {
  if (!["Accepted", "Rejected"].includes(status)) {
    throw new Error("Invalid invitation response.");
  }

  const response = await apiClient.patch(
    JOCKEY_INVITATION_ENDPOINTS.RESPOND(invitationId),
    { status },
    { includeAuth: true },
  );

  return unwrapData(response);
}

export async function getJockeyInvitationContract(invitationId) {
  const response = await apiClient.get(
    JOCKEY_INVITATION_ENDPOINTS.CONTRACT(invitationId),
    {
      includeAuth: true,
    },
  );

  return unwrapData(response);
}

export async function getAllContracts(params = {}) {
  const response = await apiClient.get(
    JOCKEY_INVITATION_ENDPOINTS.ALL_CONTRACTS,
    {
      params,
      includeAuth: true,
    },
  );

  return unwrapCollection(response);
}

export async function getContractDetailByInvitationId(invitationId) {
  const response = await apiClient.get(
    JOCKEY_INVITATION_ENDPOINTS.CONTRACT_DETAIL(invitationId),
    { includeAuth: true },
  );
  return response.data;
}

export async function completeContract(contractId) {
  const response = await apiClient.patch(
    JOCKEY_INVITATION_ENDPOINTS.COMPLETE_CONTRACT(contractId),
    {},
    { includeAuth: true },
  );

  return unwrapData(response);
}

export async function getJockeyRaceSchedule() {
  const response = await apiClient.get(SCHEDULE_ENDPOINTS.UPCOMING_JOCKEY, {
    includeAuth: true,
  });

  return {
    schedules: unwrapCollection(response).map(normalizeUpcomingSchedule),
    standings: [],
  };
}

// Admin phê duyệt hoặc từ chối đơn tố cáo vi phạm hợp đồng
export async function processBreachReportByAdmin(
  breachId,
  { isApproved, adminReason },
) {
  const response = await apiClient.patch(
    JOCKEY_INVITATION_ENDPOINTS.PROCESS_BREACH(breachId),
    { isApproved, adminReason },
    { includeAuth: true },
  );
  return unwrapData(response);
}

// Lấy thông tin đơn tố cáo/vi phạm theo ID hợp đồng
export async function getBreachByContractId(contractId) {
  const response = await apiClient.get(
    JOCKEY_INVITATION_ENDPOINTS.GET_BREACH_BY_CONTRACT(contractId),
    { includeAuth: true },
  );
  return unwrapData(response);
}
