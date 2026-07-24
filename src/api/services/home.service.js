import { getRacesByTournament } from "./race.service";
import { getRaceCourses } from "./race-course.service";
import { getTournamentResults, getTournaments } from "./tournament.service";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const delay = (value, ms = 180) =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  for (const key of ["data", "items", "races", "content", "records", "result"]) {
    if (Array.isArray(response[key])) return response[key];
    const nested = resolveList(response[key]);
    if (nested.length) return nested;
  }

  return [];
}

function getId(item) {
  const value = item?._id || item?.id;
  return typeof value === "object" ? value?._id || value?.id : value;
}

function resolveRaceCourse(race, raceCoursesById) {
  const populatedCourse =
    [race?.raceCourse, race?.raceCourseId].find(
      (value) => value && typeof value === "object",
    ) || {};
  const courseId =
    getId(race?.raceCourseId) ||
    getId(race?.raceCourse) ||
    race?.raceCourseId ||
    race?.raceCourse;
  const fetchedCourse = raceCoursesById.get(String(courseId || "")) || {};

  return { ...fetchedCourse, ...populatedCourse };
}

function formatRaceTime(race) {
  const startTime =
    race?.startTime || race?.startAt || race?.scheduledAt || race?.date;
  if (!startTime) return "TBA";

  const date = dayjs.utc(startTime);
  return date.isValid() ? date.format("HH:mm") : String(startTime);
}

function formatResultTime(value) {
  if (!value) return "—";

  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm:ss DD/MM/YYYY") : String(value);
}

function getDateSortValue(value, fallback = 0) {
  const date = dayjs(value);
  return date.isValid() ? date.valueOf() : fallback;
}

function normalizeHomeRace(race, tournament, index, raceCourse) {
  const status = String(race?.status || "");
  const isOngoing = ["ongoing", "live", "in progress", "in_progress"].includes(
    status.trim().toLowerCase(),
  );
  const course = raceCourse || {};
  const scheduleTime =
    race?.startAt || race?.scheduledAt || race?.startTime || race?.date || "";
  const distance = race?.distance ?? course?.distance;
  const distanceLabel = distance
    ? /(?:m|km)$/i.test(String(distance))
      ? String(distance)
      : `${distance}m`
    : "Distance TBA";

  return {
    id: getId(race),
    status: isOngoing ? "LIVE" : null,
    rawStatus: status,
    time: isOngoing ? null : formatRaceTime(race),
    name:
      race?.name ||
      race?.title ||
      `Race ${race?.raceOrder || race?.roundNumber || index + 1}`,
    venue:
      race?.raceCourseName ||
      race?.courseName ||
      course?.name ||
      tournament?.title ||
      tournament?.name ||
      "GoldenHoof Racecourse",
    distance: distanceLabel,
    surface: race?.surface || course?.surface || course?.trackType || "Track",
    image: race?.image || course?.image || "/goldenhoof-hero.png",
    date: scheduleTime,
    tournament:
      race?.tournamentTitle ||
      race?.tournamentName ||
      tournament?.title ||
      tournament?.name ||
      "GoldenHoof Tournament",
    round: race?.roundNumber ?? "—",
    raceOrder: race?.raceOrder ?? "—",
    horseCount:
      race?.horseCount ??
      race?.totalHorses ??
      race?.filledSlots ??
      (Array.isArray(race?.horses) ? race.horses.length : 0),
    sortTime: scheduleTime,
  };
}

const topHorses = [
  {
    id: 1,
    rank: 1,
    name: "Silver Bullet",
    age: "6 yrs",
    breed: "Thoroughbred",
    owner: "Greenfield Stable",
    rating: 98,
    wins: 12,
    image: "/goldenhoof-hero.png",
  },
  {
    id: 2,
    rank: 2,
    name: "Emerald Dream",
    age: "5 yrs",
    breed: "Thoroughbred",
    owner: "Skyline Racing",
    rating: 96,
    wins: 10,
    image: "/goldenhoof-hero.png",
  },
  {
    id: 3,
    rank: 3,
    name: "Midnight Runner",
    age: "7 yrs",
    breed: "Thoroughbred",
    owner: "Victory Stables",
    rating: 95,
    wins: 14,
    image: "/goldenhoof-hero.png",
  },
  {
    id: 4,
    rank: 4,
    name: "Thunder King",
    age: "6 yrs",
    breed: "Thoroughbred",
    owner: "Royal Bloodstock",
    rating: 94,
    wins: 9,
    image: "/goldenhoof-hero.png",
  },
];

const topJockeys = [
  { id: 1, rank: 1, name: "Liam O'Connor", wins: 120, winRate: "24%" },
  { id: 2, rank: 2, name: "Sophia Martinez", wins: 98, winRate: "21%" },
  { id: 3, rank: 3, name: "Noah Henderson", wins: 87, winRate: "19%" },
  { id: 4, rank: 4, name: "Ava Thompson", wins: 76, winRate: "18%" },
  { id: 5, rank: 5, name: "Ethan Walker", wins: 65, winRate: "17%" },
];

export async function getUpcomingRaces() {
  return (await loadRaceCollections()).upcoming.slice(0, 5);
}

export async function getTopHorses() {
  return delay(topHorses);
}

export async function getTopJockeys() {
  return delay(topJockeys);
}

function normalizeFinishedRace(race, tournament, index, raceCourse) {
  const course = raceCourse || {};
  const results =
    race?.results ||
    race?.rankings ||
    race?.officialResults ||
    (Array.isArray(race?.result) ? race.result : []);
  const winnerResult = Array.isArray(results)
    ? [...results].sort(
        (first, second) =>
          Number(first.finalRank ?? first.rawRank ?? first.rank ?? 999) -
          Number(second.finalRank ?? second.rawRank ?? second.rank ?? 999),
      )[0]
    : null;
  const winnerHorse = winnerResult?.horseId || winnerResult?.horse || {};
  const winnerJockey = winnerResult?.jockeyId || winnerResult?.jockey || {};
  const distance = race?.distance ?? course?.distance;
  const date = race?.date || "";

  return {
    id: getId(race) || race?.raceId || `${getId(tournament)}-result-${index}`,
    status: race?.status || "Finished",
    race:
      race?.raceName ||
      race?.name ||
      race?.title ||
      `Race ${race?.raceOrder || race?.roundNumber || index + 1}`,
    tournament:
      race?.tournamentTitle ||
      race?.tournamentName ||
      tournament?.title ||
      tournament?.name ||
      "GoldenHoof Tournament",
    venue:
      race?.raceCourseName ||
      race?.courseName ||
      course?.name ||
      "GoldenHoof Racecourse",
    distance: distance
      ? /(?:m|km)$/i.test(String(distance))
        ? String(distance)
        : `${distance}m`
      : "Distance TBA",
    trackType: race?.trackType || "Track",
    winner: winnerResult?.horseName || "Awaiting confirmation",
    jockey: winnerResult?.jockeyName || "—",
    time: formatResultTime(race?.startTime),
    date,
    image: race?.image || course?.image || "/goldenhoof-hero.png",
    results: Array.isArray(results) ? results : [],
  };
}

const HOME_RACE_CACHE_MS = 30_000;
let raceCollectionsPromise = null;
let raceCollectionsExpiresAt = 0;

async function loadRaceCollections() {
  if (raceCollectionsPromise && Date.now() < raceCollectionsExpiresAt) {
    return raceCollectionsPromise;
  }

  raceCollectionsExpiresAt = Date.now() + HOME_RACE_CACHE_MS;
  raceCollectionsPromise = (async () => {
    try {
      const [tournamentResponse, raceCourseResponse] = await Promise.all([
        getTournaments(),
        getRaceCourses().catch(() => []),
      ]);
      const tournaments = resolveList(tournamentResponse);
      const raceCoursesById = new Map(
        resolveList(raceCourseResponse)
          .filter((course) => getId(course))
          .map((course) => [String(getId(course)), course]),
      );
      const responses = await Promise.allSettled(
        tournaments.map(async (tournament) => {
          const tournamentId = getId(tournament);
          if (!tournamentId) return { tournament, races: [], resultRaces: [] };

          const [raceResponse, resultResponse] = await Promise.all([
            getRacesByTournament(tournamentId).catch(() => []),
            getTournamentResults(tournamentId).catch(() => []),
          ]);

          return {
            tournament,
            races: resolveList(raceResponse),
            resultRaces: resolveList(resultResponse),
          };
        }),
      );
      const groups = responses.flatMap((response) =>
        response.status === "fulfilled" ? [response.value] : [],
      );
      const upcomingStatuses = new Set([
        "ongoing",
        "live",
        "in progress",
        "in_progress",
        "scheduled",
        "ready",
      ]);
      const upcoming = groups.flatMap(({ tournament, races }) =>
        races
          .filter((race) =>
            upcomingStatuses.has(
              String(race?.status || "").trim().toLowerCase(),
            ),
          )
          .map((race, index) =>
            normalizeHomeRace(
              race,
              tournament,
              index,
              resolveRaceCourse(race, raceCoursesById),
            ),
          ),
      );
      const finished = groups.flatMap(({ tournament, resultRaces }) =>
        resultRaces
          .filter((race) => Array.isArray(race?.results) && race.results.length)
          .map((race, index) =>
            normalizeFinishedRace(
              race,
              tournament,
              index,
              resolveRaceCourse(race, raceCoursesById),
            ),
          ),
      );

      const uniqueUpcoming = Array.from(
        new Map(
          upcoming.filter((race) => race.id).map((race) => [race.id, race]),
        ).values(),
      ).sort((first, second) => {
        if (Boolean(first.status) !== Boolean(second.status)) {
          return first.status ? -1 : 1;
        }
        const firstTime = getDateSortValue(
          first.sortTime,
          Number.MAX_SAFE_INTEGER,
        );
        const secondTime = getDateSortValue(
          second.sortTime,
          Number.MAX_SAFE_INTEGER,
        );
        return (
          (Number.isNaN(firstTime) ? Number.MAX_SAFE_INTEGER : firstTime) -
          (Number.isNaN(secondTime) ? Number.MAX_SAFE_INTEGER : secondTime)
        );
      });
      const uniqueFinished = Array.from(
        new Map(
          finished.filter((race) => race.id).map((race) => [race.id, race]),
        ).values(),
      ).sort(
        (first, second) =>
          getDateSortValue(second.date) - getDateSortValue(first.date),
      );

      return { upcoming: uniqueUpcoming, finished: uniqueFinished };
    } catch {
      return { upcoming: [], finished: [] };
    }
  })();

  return raceCollectionsPromise;
}

export async function getFinishedRaceResults() {
  return (await loadRaceCollections()).finished;
}

export async function getLatestResults() {
  return (await getFinishedRaceResults()).slice(0, 4);
}

export async function getHomePageData() {
  const [races, results] =
    await Promise.all([
      getUpcomingRaces(),
      getLatestResults(),
    ]);

  return {
    races,
    results,
  };
}
