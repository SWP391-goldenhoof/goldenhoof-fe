import { apiClient } from "../client";
import { JOCKEY_INVITATION_ENDPOINTS } from "../endpoints/jockeyInvitation.endpoint";
import { HORSE_ENDPOINTS } from "../endpoints/horse.endpoint";
import { SCHEDULE_ENDPOINTS } from "../endpoints/schedule.endpoint";
import { getProfile } from "./auth.service";
import { getAvailableJockeys, getUserById } from "./user.service";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const delay = (value, ms = 180) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(structuredClone(value)), ms);
  });

function unwrapData(response) {
  const data = response?.data;

  return data?.data || data?.result || data?.horse || data;
}

function unwrapCollection(response) {
  const data = unwrapData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.horses)) return data.horses;
  if (Array.isArray(data?.invitations)) return data.invitations;
  if (Array.isArray(data?.jockeyInvitations)) return data.jockeyInvitations;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.upcomingSchedules)) return data.upcomingSchedules;
  if (Array.isArray(data?.races)) return data.races;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

let jockeyWorkspace = {
  contracts: [
    {
      id: 501,
      invitationId: 101,
      horseId: 1,
      jockeyId: 11,
      raceId: 201,
      horse: "Thunder",
      jockey: "Liam O'Connor",
      race: "Emerald Stakes",
      status: "Active",
      ownerConfirmed: false,
      tournamentRegistered: false,
    },
  ],
  schedules: [
    {
      id: 201,
      race: "Emerald Stakes",
      tournament: "Summer Turf Championship",
      horseId: 1,
      horse: "Thunder",
      venue: "Royal Turf Club",
      date: "2026-06-18",
      time: "15:00",
      distance: "1,600m",
      surface: "Turf",
      horseConfirmed: false,
      jockeyConfirmed: false,
      tournamentRegistered: false,
    },
    {
      id: 202,
      race: "Golden Mile Cup",
      tournament: "Summer Turf Championship",
      horseId: 2,
      horse: "Storm",
      venue: "Sunshine Racecourse",
      date: "2026-06-22",
      time: "16:30",
      distance: "1,600m",
      surface: "Turf",
      horseConfirmed: false,
      jockeyConfirmed: false,
      tournamentRegistered: false,
    },
    {
      id: 203,
      race: "Thunderbolt Sprint",
      tournament: "National Sprint Series",
      horseId: 3,
      horse: "Midnight Arrow",
      venue: "Valley Racecourse",
      date: "2026-06-28",
      time: "14:15",
      distance: "1,200m",
      surface: "Dirt",
      horseConfirmed: true,
      jockeyConfirmed: false,
      tournamentRegistered: false,
    },
  ],
};

function pickFirstValue(source, keys, fallback = "") {
  if (!source || typeof source !== "object") return fallback;

  for (const key of keys) {
    const value = source[key];

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

function getReferenceId(reference, keys = ["id", "_id"]) {
  if (!reference) return "";
  if (typeof reference === "string") return reference;

  return pickFirstValue(reference, keys, "");
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toDateParts(race = {}) {
  const startTime = pickFirstValue(race, ["startTime", "scheduledAt", "dateTime"], "");
  const parsedStartTime = startTime ? new Date(startTime) : null;
  const hasValidStartTime = parsedStartTime && !Number.isNaN(parsedStartTime.getTime());

  return {
    date:
      pickFirstValue(race, ["date", "raceDate"]) ||
      (hasValidStartTime ? dayjs.utc(startTime).format("DD/MM/YYYY") : "N/A"),
    time:
      pickFirstValue(race, ["time"]) ||
      (hasValidStartTime
        ? dayjs.utc(startTime).format("HH:mm")
        : "N/A"),
  };
}

function normalizeRound(value, fallback = "") {
  if (value === undefined || value === null || value === "") return fallback;

  const match = String(value).match(/\d+/);
  return match ? match[0] : String(value);
}

function normalizeOwnerHistoryRace(item = {}, profile = {}, context = {}, index = 0) {
  const race = item.race || item.raceInfo || {};
  const tournament = item.tournament || item.tournamentInfo || {};
  const raceCourse = item.raceCourse || item.raceCourseInfo || race.raceCourse || race.raceCourseInfo || {};
  const horse = item.horse || item.horseInfo || race.horse || race.horseInfo || {};
  const jockey = item.jockey || item.jockeyInfo || race.jockey || race.jockeyInfo || {};
  const result = item.result || item.raceResult || item.finalResult || race.result || race.raceResult || null;
  const finalRank =
    pickFirstValue(item, ["finalRank", "rank", "rawRank"], null) ||
    pickFirstValue(result, ["finalRank", "rank", "rawRank"], null);
  const raceId =
    pickFirstValue(item, ["raceId", "race_id"]) ||
    getReferenceId(race, ["id", "_id", "raceId"]);

  if (!raceId && !item.raceName && !race.name) return null;

  const { date, time } = toDateParts({
    ...race,
    ...item,
  });

  return {
    ...item,
    id: raceId || `history-race-${index}`,
    name:
      pickFirstValue(item, ["raceName", "name", "title"]) ||
      pickFirstValue(race, ["name", "title", "raceName"], raceId ? `Race ${raceId}` : "Unnamed race"),
    tournament:
      pickFirstValue(item, ["tournamentName", "tournamentTitle"]) ||
      pickFirstValue(tournament, ["name", "title"]) ||
      context.tournamentId ||
      "N/A",
    tournamentId:
      pickFirstValue(item, ["tournamentId", "tournament_id"]) ||
      getReferenceId(tournament, ["id", "_id", "tournamentId"]) ||
      context.tournamentId ||
      "",
    round: normalizeRound(pickFirstValue(item, ["round", "roundNumber"]), context.round || ""),
    venue:
      pickFirstValue(item, ["venue", "location", "raceCourseName"]) ||
      pickFirstValue(race, ["venue", "location", "raceCourseName"]) ||
      pickFirstValue(raceCourse, ["name", "location"], "N/A"),
    date,
    time,
    distance:
      pickFirstValue(item, ["distance"]) ||
      pickFirstValue(race, ["distance"]) ||
      pickFirstValue(raceCourse, ["distance"], "N/A"),
    surface:
      pickFirstValue(item, ["surface", "trackType"]) ||
      pickFirstValue(race, ["surface", "trackType"]) ||
      pickFirstValue(raceCourse, ["surface", "trackType"], "N/A"),
    purse: pickFirstValue(
      item,
      ["purse", "prizePool", "totalPrize"],
      pickFirstValue(race, ["purse", "prizePool", "totalPrize"], 0),
    ),
    status: pickFirstValue(item, ["status", "raceStatus"], pickFirstValue(race, ["status"], result ? "Finished" : "Finished")),
    myHorse:
      pickFirstValue(item, ["horseName"]) ||
      pickFirstValue(horse, ["name", "horseName"], "N/A"),
    jockey:
      pickFirstValue(item, ["jockeyName"]) ||
      pickFirstValue(jockey, ["fullName", "name"], "N/A"),
    ownerName: profile.stableName || profile.fullName || "My stable",
    result: result || finalRank
      ? {
          rank: finalRank,
          time: pickFirstValue(result, ["finishedTime", "finishTime", "time"], ""),
          prize: pickFirstValue(result, ["prize", "prizeMoney", "reward"], 0),
          points: pickFirstValue(result, ["points", "score"], 0),
          status: pickFirstValue(result, ["status"], ""),
        }
      : null,
  };
}

function raceContextFrom(item = {}, context = {}) {
  const tournament = item.tournament || item.tournamentInfo || {};

  return {
    tournamentId:
      pickFirstValue(item, ["tournamentId", "tournament_id"]) ||
      getReferenceId(tournament, ["id", "_id", "tournamentId"]) ||
      context.tournamentId,
    round: normalizeRound(pickFirstValue(item, ["round", "roundNumber"]), context.round),
  };
}

function historyRaceOwnerToRaces(history = [], profile = {}) {
  const rows = [];

  function visit(value, context = {}) {
    asArray(value).forEach((item) => {
      if (!item || typeof item !== "object") return;

      const nextContext = raceContextFrom(item, context);

      if (Array.isArray(item.historyRace)) visit(item.historyRace, nextContext);
      if (Array.isArray(item.rounds)) visit(item.rounds, nextContext);
      if (Array.isArray(item.races)) visit(item.races, nextContext);
      if (Array.isArray(item.raceIds)) {
        visit(
          item.raceIds.map((raceId) => ({ raceId })),
          nextContext,
        );
      }

      Object.entries(item).forEach(([key, childValue]) => {
        const roundMatch = key.match(/^round\s*(\d+)$/i);
        if (roundMatch && Array.isArray(childValue)) {
          visit(childValue, { ...nextContext, round: roundMatch[1] });
        }
      });

      const normalized = normalizeOwnerHistoryRace(item, profile, nextContext, rows.length);
      if (normalized) rows.push(normalized);
    });
  }

  visit(history);

  return rows;
}

function buildOwnerStandings(races = []) {
  const byHorse = new Map();

  races.forEach((race) => {
    if (!race.myHorse || race.myHorse === "N/A") return;

    const current =
      byHorse.get(race.myHorse) ||
      {
        horse: race.myHorse,
        owner: race.ownerName,
        wins: 0,
        points: 0,
        prize: 0,
        bestRank: 999,
      };

    const rank = Number(race.result?.rank || 999);
    current.wins += rank === 1 ? 1 : 0;
    current.points += Number(race.result?.points || 0);
    current.prize += Number(race.result?.prize || 0);
    current.bestRank = Math.min(current.bestRank, rank);

    byHorse.set(race.myHorse, current);
  });

  return [...byHorse.values()]
    .sort((first, second) => {
      if (second.points !== first.points) return second.points - first.points;
      if (second.prize !== first.prize) return second.prize - first.prize;
      return first.bestRank - second.bestRank;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

function normalizeOwnerUpcomingRace(item = {}, index = 0) {
  const race = item.race || item.raceInfo || {};
  const tournament =
    item.tournament ||
    item.tournamentInfo ||
    race.tournament ||
    race.tournamentInfo ||
    {};
  const horse = item.horse || item.horseInfo || race.horse || race.horseInfo || {};
  const jockey = item.jockey || item.jockeyInfo || race.jockey || race.jockeyInfo || {};
  const raceCourse =
    item.raceCourse ||
    item.raceCourseInfo ||
    race.raceCourse ||
    race.raceCourseInfo ||
    {};
  const startTime = pickFirstValue(
    item,
    ["startTime", "scheduledAt"],
    pickFirstValue(race, ["startTime", "scheduledAt"], ""),
  );
  const parsedStartTime = startTime ? new Date(startTime) : null;
  const hasValidStartTime = parsedStartTime && !Number.isNaN(parsedStartTime.getTime());
  const raceId =
    pickFirstValue(item, ["raceId", "race_id"]) ||
    getReferenceId(race, ["id", "_id", "raceId"]);
  const horseId =
    pickFirstValue(item, ["horseId", "horse_id"]) ||
    getReferenceId(horse, ["id", "_id", "horseId"]);
  const jockeyId =
    pickFirstValue(item, ["jockeyId", "jockey_id"]) ||
    getReferenceId(jockey, ["id", "_id", "jockeyId"]);

  return {
    ...item,
    id: pickFirstValue(item, ["id", "_id", "scheduleId"]) || `${raceId || "race"}-${horseId || index}`,
    raceId,
    raceName:
      pickFirstValue(item, ["raceName", "name", "title"]) ||
      pickFirstValue(race, ["raceName", "name", "title"], "Unnamed race"),
    date:
      pickFirstValue(item, ["date", "raceDate"]) ||
      pickFirstValue(
        race,
        ["date", "raceDate"],
        hasValidStartTime ? parsedStartTime.toISOString() : "",
      ),
    startTime,
    status: pickFirstValue(item, ["status", "raceStatus"], pickFirstValue(race, ["status"], "Upcoming")),
    tournamentId:
      pickFirstValue(item, ["tournamentId", "tournament_id"]) ||
      getReferenceId(tournament, ["id", "_id", "tournamentId"]) ||
      pickFirstValue(race, ["tournamentId"], ""),
    tournamentName:
      pickFirstValue(item, ["tournamentName", "tournamentTitle"]) ||
      pickFirstValue(tournament, ["name", "title"], "N/A"),
    raceCourseName:
      pickFirstValue(item, ["raceCourseName", "venue", "location"]) ||
      pickFirstValue(race, ["raceCourseName", "venue", "location"]) ||
      pickFirstValue(raceCourse, ["name", "location"], "N/A"),
    totalSlots: Number(pickFirstValue(item, ["totalSlots"], pickFirstValue(race, ["totalSlots"], 0))),
    filledSlots: Number(pickFirstValue(item, ["filledSlots"], pickFirstValue(race, ["filledSlots"], 0))),
    availableSlots: Number(pickFirstValue(item, ["availableSlots"], pickFirstValue(race, ["availableSlots"], 0))),
    jockeyId,
    jockeyName:
      pickFirstValue(item, ["jockeyName", "jockeyFullName"]) ||
      pickFirstValue(jockey, ["fullName", "name", "jockeyName"], "N/A"),
    horseId,
    horseName:
      pickFirstValue(item, ["horseName"]) ||
      pickFirstValue(horse, ["name", "horseName"], "N/A"),
  };
}

export async function getOwnerJockeyWorkspace() {
  const [horsesResponse, jockeys] = await Promise.all([
    apiClient.get(HORSE_ENDPOINTS.MY_HORSES, { includeAuth: true }),
    getAvailableJockeys(),
  ]);

  return {
    ...jockeyWorkspace,
    horses: unwrapCollection(horsesResponse),
    jockeys,
  };
}

export async function sendJockeyInvitation(payload) {
  const response = await apiClient.post(
    JOCKEY_INVITATION_ENDPOINTS.ROOT,
    payload,
    { includeAuth: true },
  );

  return unwrapData(response);
}

export async function getSentJockeyInvitations() {
  const response = await apiClient.get(JOCKEY_INVITATION_ENDPOINTS.SENT, {
    includeAuth: true,
  });

  return unwrapCollection(response);
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

export async function confirmJockeyForRace(contractId) {
  jockeyWorkspace = {
    ...jockeyWorkspace,
    contracts: jockeyWorkspace.contracts.map((contract) =>
      contract.id === contractId ? { ...contract, ownerConfirmed: true } : contract,
    ),
    schedules: jockeyWorkspace.schedules.map((schedule) =>
      jockeyWorkspace.contracts.some(
        (contract) => contract.id === contractId && contract.raceId === schedule.id,
      )
        ? { ...schedule, jockeyConfirmed: true }
        : schedule,
    ),
  };

  return delay({ success: true });
}

export async function confirmHorseRaceEntry(scheduleId) {
  jockeyWorkspace = {
    ...jockeyWorkspace,
    schedules: jockeyWorkspace.schedules.map((schedule) =>
      schedule.id === scheduleId ? { ...schedule, horseConfirmed: true } : schedule,
    ),
  };

  return delay({ success: true });
}

export async function registerContractToTournament(contractId) {
  const contract = jockeyWorkspace.contracts.find((item) => item.id === contractId);

  if (!contract?.ownerConfirmed) {
    throw new Error("Confirm the jockey contract before tournament registration.");
  }

  jockeyWorkspace = {
    ...jockeyWorkspace,
    contracts: jockeyWorkspace.contracts.map((item) =>
      item.id === contractId ? { ...item, tournamentRegistered: true } : item,
    ),
    schedules: jockeyWorkspace.schedules.map((schedule) =>
      schedule.id === contract.raceId ? { ...schedule, tournamentRegistered: true } : schedule,
    ),
  };

  return delay({ success: true });
}

export async function getOwnerRaceCenter() {
  const [profile, upcomingRaces] = await Promise.all([
    getOwnerProfile(),
    getOwnerUpcomingRaces(),
  ]);
  const normalizedRaces = historyRaceOwnerToRaces(profile?.historyRaceOwner || [], profile || {});

  return {
    races: upcomingRaces,
    standings: buildOwnerStandings(normalizedRaces),
    historyRaceOwner: profile?.historyRaceOwner || [],
  };
}

export async function getOwnerUpcomingRaces() {
  const response = await apiClient.get(SCHEDULE_ENDPOINTS.UPCOMING_OWNER, {
    includeAuth: true,
  });

  return unwrapCollection(response).map(normalizeOwnerUpcomingRace);
}

export async function getOwnerProfile() {
  const profile = await getProfile();
  const userIds = pickExistingValues(profile, ["id", "_id", "userId", "accountId", "profileId"]);

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
