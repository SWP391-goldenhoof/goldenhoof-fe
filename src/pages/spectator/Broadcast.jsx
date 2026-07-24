import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Link, useParams } from "react-router-dom";
import { createReplaySession } from "../../api/services/broadcast.service";
import { getRaceById } from "../../api/services/race.service";
import { getSimulationResult } from "../../api/services/simulation.service";
import { getAccessToken } from "../../utils/storage";
import "./Broadcast.css";
import { getHorses } from "../../api/services/horse.service";

const TICK_DURATION_SECONDS = 0.5;
// v2 only contains results received from the spectator socket's race_finished.
// The previous cache could contain referee/raw simulation data.
const RESULT_CACHE_PREFIX = "goldenhoof_broadcast_result_v2_";
const FINISHED_TRACK_CACHE_PREFIX = "goldenhoof_finished_track_v1_";

const COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#14b8a6",
  "#f97316",
  "#ec4899",
];

const HORSE_ICONS = ["🐴", "🐎", "🦄", "🐴", "🐎", "🦄", "🐴", "🐎"];

const EVENT_META = {
  stumble: { icon: "💥", label: "Vấp ngã", className: "stumble" },
  burst: { icon: "⚡", label: "Tăng tốc", className: "burst" },
  overtake: { icon: "🔄", label: "Vượt mặt", className: "overtake" },
  lead_change: {
    icon: "🚩",
    label: "Đổi dẫn đầu",
    className: "lead-change",
  },
};

function normalizeServerUrl(value) {
  const fallback = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000";
  const host = value.trim() || fallback;
  const withProtocol = /^https?:\/\//i.test(host) ? host : `http://${host}`;
  return `${withProtocol.replace(/\/+$/, "")}/race`;
}

function withBearer(token) {
  const cleanToken = token.trim();
  return /^Bearer\s/i.test(cleanToken) ? cleanToken : `Bearer ${cleanToken}`;
}

function shortId(value, length = 10) {
  if (!value) return "—";
  return value.length > length ? `…${value.slice(-length)}` : value;
}

function formatSeconds(value) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return "—";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const secondLabel = remainingSeconds.toFixed(3).padStart(6, "0");

  return hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}:${secondLabel}`
    : `${String(minutes).padStart(2, "0")}:${secondLabel}`;
}

function parseDuration(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const durationParts = value.match(
    /^(\d{1,2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?$/,
  );
  if (!durationParts) return null;
  if (durationParts[3] !== undefined) {
    return (
      Number(durationParts[1]) * 3600 +
      Number(durationParts[2]) * 60 +
      Number(durationParts[3])
    );
  }
  return Number(durationParts[1]) * 60 + Number(durationParts[2]);
}

function resolveRaceStart(raceResponse) {
  const race =
    raceResponse?.data?.race ||
    raceResponse?.data ||
    raceResponse?.result ||
    raceResponse?.race ||
    raceResponse;
  if (!race || typeof race !== "object") return null;

  const directValue =
    race.startAt || race.startDateTime || race.scheduledAt || race.startedAt;
  if (directValue) {
    const directDate = new Date(directValue);
    if (!Number.isNaN(directDate.getTime())) return directDate.getTime();
  }

  if (race.date && race.startTime) {
    const datePart = String(race.date).split("T")[0].replace(/\//g, "-");
    const combinedDate = new Date(`${datePart}T${race.startTime}`);
    if (!Number.isNaN(combinedDate.getTime())) return combinedDate.getTime();
  }

  return null;
}

function finishElapsedSeconds(value, raceStartAt) {
  const duration = parseDuration(value);
  if (duration !== null) return duration;

  const finishDate = new Date(value);
  if (Number.isNaN(finishDate.getTime())) return null;

  if (raceStartAt) {
    const difference = (finishDate.getTime() - raceStartAt) / 1000;
    if (difference >= 0 && difference < 24 * 60 * 60) return difference;
  }

  // Some simulation payloads encode a stopwatch in an ISO date. Horse races
  // are shorter than one hour, so the UTC minute/second fields are the fallback.
  return (
    finishDate.getUTCMinutes() * 60 +
    finishDate.getUTCSeconds() +
    finishDate.getUTCMilliseconds() / 1000
  );
}

function normalizeResults(response) {
  const queue = [response];
  const visited = new Set();

  while (queue.length) {
    const value = queue.shift();
    if (!value || visited.has(value)) continue;
    if (typeof value === "object") visited.add(value);

    if (Array.isArray(value)) {
      if (
        value.some(
          (item) =>
            item?.rawRank != null ||
            item?.finalRank != null ||
            item?.rank != null,
        )
      ) {
        return value
          .map((item) => ({
            ...item,
            rawRank: Number(item.rawRank ?? item.finalRank ?? item.rank),
            horseId:
              item.horseId?._id ||
              item.horseId?.id ||
              item.horseId ||
              item.horse?._id ||
              item.horse?.id ||
              item.horse ||
              "—",
            finishedTime:
              item.finishedTime ?? item.finishTime ?? item.time ?? null,
          }))
          .filter((item) => Number.isFinite(item.rawRank))
          .sort((first, second) => first.rawRank - second.rawRank);
      }
      continue;
    }

    if (typeof value === "object") {
      for (const key of [
        "results",
        "rankings",
        "rawResult",
        "data",
        "result",
        "simulation",
      ]) {
        if (value[key] != null) queue.push(value[key]);
      }
    }
  }

  return [];
}

const RESULT_RETRY_DELAYS_MS = [0, 300, 800, 1500];

async function fetchPersistedResults(raceId) {
  let latestResults = [];

  for (const delay of RESULT_RETRY_DELAYS_MS) {
    if (delay) {
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }

    try {
      latestResults = normalizeResults(await getSimulationResult(raceId));
      if (latestResults.length) return latestResults;
    } catch {
      // The result may not be persisted yet when race_finished first arrives.
    }
  }

  return latestResults;
}

function readCachedResults(raceId) {
  try {
    const cached = JSON.parse(
      window.localStorage.getItem(`${RESULT_CACHE_PREFIX}${raceId}`),
    );
    return normalizeResults(cached?.results);
  } catch {
    return [];
  }
}

function saveCachedResults(raceId, results) {
  if (!raceId || !results.length) return;
  try {
    window.localStorage.setItem(
      `${RESULT_CACHE_PREFIX}${raceId}`,
      JSON.stringify({ results, savedAt: new Date().toISOString() }),
    );
  } catch {
    // The API remains the primary persisted source when storage is unavailable.
  }
}

function clearCachedResults(raceId) {
  if (!raceId) return;
  try {
    window.localStorage.removeItem(`${RESULT_CACHE_PREFIX}${raceId}`);
  } catch {
    // A live socket session can continue even when storage is unavailable.
  }
}

function normalizeHorseId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;

  return (
    value.horseId?._id ||
    value.horseId?.id ||
    value.horseId?.horseId ||
    value.horseId ||
    value.horse?._id ||
    value.horse?.id ||
    value.horse?.horseId?._id ||
    value.horse?.horseId?.id ||
    value.horse?.horseId ||
    value._id ||
    value.id ||
    ""
  );
}

function readCachedFinishedTrack(raceId) {
  if (!raceId) return [];
  try {
    const cached = JSON.parse(
      window.localStorage.getItem(`${FINISHED_TRACK_CACHE_PREFIX}${raceId}`),
    );
    return Array.isArray(cached?.horses) ? cached.horses : [];
  } catch {
    return [];
  }
}

function saveCachedFinishedTrack(raceId, horses) {
  if (!raceId || !Array.isArray(horses)) return;
  const finishedHorses = horses
    .filter((horse) => Number(horse.progress) >= 1)
    .map((horse) => ({
      horseId: normalizeHorseId(horse),
      lane: horse.lane,
      progress: 1,
      color: horse.color,
      icon: horse.icon,
      instant: true,
      finished: true,
    }))
    .filter((horse) => horse.horseId);

  try {
    const previous = readCachedFinishedTrack(raceId);
    const byHorseId = new Map(
      previous.map((horse) => [String(horse.horseId), horse]),
    );
    finishedHorses.forEach((horse) => {
      byHorseId.set(String(horse.horseId), horse);
    });

    window.localStorage.setItem(
      `${FINISHED_TRACK_CACHE_PREFIX}${raceId}`,
      JSON.stringify({
        horses: [...byHorseId.values()],
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Track cache is only a UI recovery path.
  }
}

function clearCachedFinishedTrack(raceId) {
  if (!raceId) return;
  try {
    window.localStorage.removeItem(`${FINISHED_TRACK_CACHE_PREFIX}${raceId}`);
  } catch {
    // A live socket session can continue even when storage is unavailable.
  }
}

function mergeTrackHorses(primary, fallback) {
  const byHorseId = new Map();

  [...fallback, ...primary].forEach((horse) => {
    const horseId = normalizeHorseId(horse);
    if (!horseId) return;
    byHorseId.set(String(horseId), {
      ...horse,
      horseId: String(horseId),
      progress: Math.min(1, Math.max(0, Number(horse.progress) || 0)),
    });
  });

  return [...byHorseId.values()].sort(
    (first, second) => Number(first.lane) - Number(second.lane),
  );
}

function createTrack(horses) {
  return [...horses]
    .sort((a, b) => a.lane - b.lane)
    .map((horse, index) => ({
      horseId: normalizeHorseId(horse),
      lane: horse.lane,
      progress: Math.min(1, Math.max(0, Number(horse.progress) || 0)),
      color: COLORS[index % COLORS.length],
      icon: HORSE_ICONS[index % HORSE_ICONS.length],
      instant: true,
    }));
}

export function BroadcastExperience({ mode = "live" }) {
  const { raceId = "" } = useParams();
  const isReplayMode = mode === "replay";
  const token = getAccessToken() || "";
  const host = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000";
  const [connection, setConnection] = useState({
    state: "disconnected",
    message: "Disconnected",
  });
  const [joinedRaceId, setJoinedRaceId] = useState("");
  const [horses, setHorses] = useState([]);
  const [currentTick, setCurrentTick] = useState(null);
  const [isCatchUp, setIsCatchUp] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [, setLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [raceStartAt, setRaceStartAt] = useState(null);
  const [allHorsesMap, setAllHorsesMap] = useState(new Map());
  const [isReplayStarting, setIsReplayStarting] = useState(false);
  const [replayMessage, setReplayMessage] = useState("");

  const socketRef = useRef(null);
  const activeRaceRef = useRef("");
  const requestedRaceRef = useRef("");
  const trackInitializedRef = useRef(false);
  const finishedRef = useRef(false);
  const replayStartedRef = useRef("");
  const sessionVersionRef = useRef(0);
  const logIdRef = useRef(0);

  const addLog = useCallback((message, type = "system", eventType = "") => {
    const entry = {
      id: ++logIdRef.current,
      time: new Date().toLocaleTimeString("vi-VN"),
      message,
      type,
      eventType,
    };

    // Functional update is important: multiple events in one tick are never
    // based on a stale render, so consecutive overtakes keep every log line.
    setLogs((previous) => [...previous, entry]);
  }, []);

  const resetRace = useCallback(() => {
    sessionVersionRef.current += 1;
    activeRaceRef.current = "";
    requestedRaceRef.current = "";
    trackInitializedRef.current = false;
    finishedRef.current = false;
    setJoinedRaceId("");
    setHorses([]);
    setCurrentTick(null);
    setIsCatchUp(false);
    setIsFinished(false);
    setResults([]);
  }, []);

  const beginLiveSession = useCallback(() => {
    // A race can be simulated again with the same raceId. Any incoming live
    // frame is newer than the browser cache, even when the backend result was
    // deleted outside this tab.
    clearCachedResults(raceId);
    sessionVersionRef.current += 1;
    finishedRef.current = false;
    setIsFinished(false);
    setResults([]);
  }, [raceId]);

  const initializeTrack = useCallback((horseList) => {
    if (!Array.isArray(horseList) || !horseList.length) return;
    trackInitializedRef.current = true;
    const cachedFinished = readCachedFinishedTrack(raceId);
    setHorses(createTrack(mergeTrackHorses(horseList, cachedFinished)));
  }, [raceId]);

  const updateTrack = useCallback((horseList, instant) => {
    if (!Array.isArray(horseList)) return;
    const progressById = new Map(
      horseList.map((horse) => [
        horse.horseId,
        Math.min(1, Math.max(0, Number(horse.progress) || 0)),
      ]),
    );

    setHorses((previous) => {
      const next = previous.map((horse) =>
        progressById.has(horse.horseId)
          ? {
              ...horse,
              progress: progressById.get(horse.horseId),
              instant,
            }
          : horse,
      );

      saveCachedFinishedTrack(raceId, next);
      return next;
    });
  }, [raceId]);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const raceToLeave = activeRaceRef.current || requestedRaceRef.current;
    if (socket.connected && raceToLeave) {
      socket.emit("leave_race", { raceId: raceToLeave });
    }
    socket.disconnect();
    socketRef.current = null;
    resetRace();
    setConnection({ state: "disconnected", message: "Disconnected" });
  }, [resetRace]);

  const connect = useCallback(() => {
    if (!token.trim()) {
      addLog("Vui lòng nhập JWT trước khi kết nối.", "error");
      setConnection({ state: "error", message: "Lỗi: thiếu JWT" });
      return;
    }

    if (socketRef.current?.connected) {
      addLog("Socket đã được kết nối.", "system");
      return;
    }

    socketRef.current?.disconnect();
    resetRace();
    setConnection({ state: "connecting", message: "Connecting…" });

    const namespaceUrl = normalizeServerUrl(host);
    addLog(`Đang kết nối ${namespaceUrl}`, "system");

    const socket = io(namespaceUrl, {
      auth: { token: withBearer(token) },
      transports: ["polling", "websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnection({
        state: "connected",
        message: `Connected · ${shortId(socket.id, 12)}`,
      });
      addLog(`Đã kết nối: ${socket.id}`, "system");

      const selectedRaceId = raceId.trim();
      if (selectedRaceId) {
        requestedRaceRef.current = selectedRaceId;
        socket.emit("join_race", { raceId: selectedRaceId });
        addLog("Đang vào race đã chọn…", "system");
      }
    });

    socket.on("disconnect", (reason) => {
      setConnection({ state: "disconnected", message: "Disconnected" });
      activeRaceRef.current = "";
      setJoinedRaceId("");
      addLog(`Mất kết nối: ${reason}`, "error");
    });

    socket.on("connect_error", (error) => {
      setConnection({
        state: "error",
        message: `Lỗi kết nối: ${error.message}`,
      });
      addLog(`Lỗi kết nối: ${error.message}`, "error");
    });

    socket.on("joined", (data) => {
      const confirmedRaceId = data?.raceId || requestedRaceRef.current;
      activeRaceRef.current = confirmedRaceId;
      setJoinedRaceId(confirmedRaceId);
      addLog("Đã vào race thành công.", "system");
    });

    socket.on("race_snapshot", (data) => {
      if (!Array.isArray(data?.horses)) return;

      if (finishedRef.current || !trackInitializedRef.current) {
        beginLiveSession();
        initializeTrack(data.horses);
      }
      updateTrack(data.horses, true);
      setCurrentTick(data.tickNumber);
      setIsCatchUp(true);
      addLog(
        `Catch-up tại tick ${data.tickNumber} · ${data.horses.length} ngựa`,
        "snapshot",
      );
    });

    socket.on("race_tick", (frame) => {
      if (!Array.isArray(frame?.horses)) return;

      // A live tick is authoritative evidence of a running simulation. The
      // extra checks cover both a rerun with the same raceId and joining after
      // tick zero when no snapshot was delivered.
      if (
        frame.tickNumber === 0 ||
        finishedRef.current ||
        !trackInitializedRef.current
      ) {
        beginLiveSession();
        initializeTrack(frame.horses);
      }

      if (!trackInitializedRef.current) return;
      updateTrack(frame.horses, false);
      setCurrentTick(frame.tickNumber);
      setIsCatchUp(false);

      if (frame.tickNumber % 10 === 0) {
        addLog(`Tick ${frame.tickNumber}`, "tick");
      }
    });

    socket.on("race_event", (event) => {
      if (finishedRef.current) return;
      const meta = EVENT_META[event?.eventType] || {
        icon: "❓",
        label: event?.eventType || "Sự kiện",
        className: "unknown",
      };
      const secondary =
        event?.eventType === "overtake" && event.secondaryHorseId
          ? ` vượt ${shortId(event.secondaryHorseId)}`
          : "";

      addLog(
        `${meta.icon} ${meta.label} · tick ${event.tickNumber} · ${shortId(
          event.primaryHorseId,
        )}${secondary}`,
        "event",
        meta.className,
      );
    });

    socket.on("race_finished", async (data) => {
      const finishedSessionVersion = sessionVersionRef.current;
      finishedRef.current = true;
      setIsFinished(true);
      setIsCatchUp(false);
      if (data?.tickNumber != null) setCurrentTick(data.tickNumber);
      const sortedResults = normalizeResults(data?.results || data);
      setHorses((previous) => {
        const finishedFromResults = sortedResults.map((result, index) => {
          const previousHorse = previous.find(
            (horse) => horse.horseId === result.horseId,
          );

          return {
            horseId: result.horseId,
            lane: previousHorse?.lane || index + 1,
            progress: 1,
            color: previousHorse?.color,
            icon: previousHorse?.icon,
            instant: true,
            finished: true,
          };
        });
        const next = createTrack(mergeTrackHorses(previous, finishedFromResults));
        saveCachedFinishedTrack(raceId, next);
        return next;
      });
      setResults(sortedResults);
      saveCachedResults(raceId, sortedResults);
      try {
        const simulationResults = await fetchPersistedResults(raceId);
        if (
          simulationResults.length &&
          finishedRef.current &&
          sessionVersionRef.current === finishedSessionVersion
        ) {
          setResults(simulationResults);
          saveCachedResults(raceId, simulationResults);
        }
      } catch {
        // Keep the socket result when the persisted simulation is unavailable.
      }
      addLog(`Race kết thúc · nhận ${sortedResults.length} kết quả`, "finish");
    });
  }, [
    addLog,
    beginLiveSession,
    host,
    initializeTrack,
    raceId,
    resetRace,
    token,
    updateTrack,
  ]);

  const joinRace = useCallback(() => {
    const cleanRaceId = raceId.trim();
    if (!socketRef.current?.connected) {
      addLog("Hãy kết nối socket trước.", "error");
      return;
    }
    if (!cleanRaceId) {
      addLog("Vui lòng nhập Race ID.", "error");
      return;
    }

    const previousRace = activeRaceRef.current || requestedRaceRef.current;
    if (previousRace && previousRace !== cleanRaceId) {
      socketRef.current.emit("leave_race", { raceId: previousRace });
    }
    resetRace();
    requestedRaceRef.current = cleanRaceId;
    socketRef.current.emit("join_race", { raceId: cleanRaceId });
    addLog("Đang kết nối lại race đã chọn…", "system");
  }, [addLog, raceId, resetRace]);

  const leaveRace = useCallback(() => {
    const raceToLeave =
      activeRaceRef.current || requestedRaceRef.current || raceId.trim();
    if (!socketRef.current?.connected || !raceToLeave) return;

    socketRef.current.emit("leave_race", { raceId: raceToLeave });
    addLog("Đã rời race.", "system");
    resetRace();
  }, [addLog, raceId, resetRace]);

  const handleReplay = useCallback(async () => {
    const cleanRaceId = raceId.trim();
    if (!cleanRaceId) {
      setReplayMessage("Missing race ID.");
      return;
    }

    sessionVersionRef.current += 1;
    trackInitializedRef.current = false;
    finishedRef.current = false;
    setHorses([]);
    setCurrentTick(null);
    setIsCatchUp(false);
    setIsFinished(false);
    setResults([]);
    setIsReplayStarting(true);
    setReplayMessage("Starting replay...");

    try {
      await createReplaySession(cleanRaceId);
      clearCachedFinishedTrack(cleanRaceId);
      setReplayMessage("Replay started.");
      addLog("Replay started.", "system");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Cannot start replay.";
      setReplayMessage(message);
      addLog(message, "error");
    } finally {
      setIsReplayStarting(false);
    }
  }, [addLog, raceId]);

  useEffect(() => {
    const fetchAllHorses = async () => {
      try {
        // Giả sử getMyHorses trả về array chứa object có name và id/_id
        const data = await getHorses();
        const horseMap = new Map();
        if (Array.isArray(data)) {
          data.forEach((h) => {
            const id = h.id || h._id;
            if (id) horseMap.set(id, h.name || "Unknown");
          });
        }
        setAllHorsesMap(horseMap);
      } catch (error) {
        console.error("Could not load horses mapping:", error);
      }
    };
    fetchAllHorses();
  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    replayStartedRef.current = "";
    setReplayMessage("");
  }, [isReplayMode, raceId]);

  useEffect(() => {
    const cleanRaceId = raceId.trim();
    if (
      !isReplayMode ||
      !cleanRaceId ||
      joinedRaceId !== cleanRaceId ||
      replayStartedRef.current === cleanRaceId
    ) {
      return;
    }

    replayStartedRef.current = cleanRaceId;
    handleReplay();
  }, [handleReplay, isReplayMode, joinedRaceId, raceId]);

  useEffect(() => {
    let isMounted = true;
    setResults([]);
    setRaceStartAt(null);
    setIsFinished(false);
    finishedRef.current = false;

    const cachedResults = readCachedResults(raceId);
    const cachedFinishedTrack = readCachedFinishedTrack(raceId);
    if (cachedFinishedTrack.length) {
      trackInitializedRef.current = true;
      setHorses(createTrack(cachedFinishedTrack));
    }
    if (cachedResults.length) {
      setResults(cachedResults);
      setIsFinished(true);
      finishedRef.current = true;
    }

    getRaceById(raceId)
      .then((raceData) => {
        if (!isMounted) return;

        setRaceStartAt(resolveRaceStart(raceData));
      })
      .catch(() => {
        // Live socket and the local race_finished cache remain available.
      });

    return () => {
      isMounted = false;
    };
  }, [raceId]);

  useEffect(
    () => () => {
      const socket = socketRef.current;
      const raceToLeave = activeRaceRef.current || requestedRaceRef.current;
      if (socket?.connected && raceToLeave) {
        socket.emit("leave_race", { raceId: raceToLeave });
      }
      socket?.disconnect();
    },
    [],
  );

  const statusLabel = useMemo(() => {
    if (isFinished) {
      return currentTick === null
        ? "FINISHED"
        : `${(currentTick * TICK_DURATION_SECONDS).toFixed(1)} giây · FINISHED`;
    }
    if (currentTick === null) return "Waiting for race...";
    const elapsedSeconds = currentTick * TICK_DURATION_SECONDS;
    return `${elapsedSeconds.toFixed(1)} giây${isCatchUp ? " · catch-up" : ""}`;
  }, [currentTick, isCatchUp, isFinished]);

  const liveLeaderboard = useMemo(() => {
    if (results.length) {
      return results.map((result) => ({
        rank: result.rawRank,
        horseId: result.horseId,
        lane:
          horses.find((horse) => horse.horseId === result.horseId)?.lane ?? "—",
        progress: 1,
      }));
    }

    return [...horses]
      .sort(
        (first, second) =>
          second.progress - first.progress || first.lane - second.lane,
      )
      .map((horse, index) => ({ ...horse, rank: index + 1 }));
  }, [horses, results]);

  return (
    <main className="broadcast-page">
      <section className="broadcast-shell">
        <header className="broadcast-header">
          <div>
            <p className="broadcast-eyebrow">GOLDEN HOOF · LIVE</p>
            <h1>🏇 Race Broadcast</h1>
            <p>Watch the race progress in real time.</p>
          </div>
          <span className={`broadcast-status ${connection.state}`}>
            <i aria-hidden="true" />
            {connection.message}
          </span>
        </header>

        <section className="broadcast-controls" aria-label="Socket controls">
          {isReplayMode && (
            <button
              type="button"
              className="replay-action"
              onClick={handleReplay}
              disabled={isReplayStarting}
            >
              {isReplayStarting ? "Starting replay..." : "Watch replay"}
            </button>
          )}
          <Link className="channel-back-link" to="/spectator/broadcast">
            ← Select another channel
          </Link>
        </section>

        {isReplayMode && replayMessage && (
          <p className="replay-status" role="status">
            {replayMessage}
          </p>
        )}

        <section className="broadcast-grid">
          <div className="broadcast-card track-card">
            <div className="card-heading">
              <div>
                <span>Race Track</span>
                <strong>
                  {isFinished ? statusLabel : `Time: ${statusLabel}`}
                </strong>
              </div>
              <span className={isFinished ? "race-ended" : "race-live"}>
                {isFinished ? "FINISHED" : "LIVE"}
              </span>
            </div>

            <div className="track-list">
              {!horses.length && (
                <div className="track-empty">
                  {results.length
                    ? "The race has finished. View results below."
                    : "Waiting for track to start."}
                </div>
              )}
              {horses.map((horse) => (
                <div className="track-lane" key={horse.horseId}>
                  <span className="lane-number">Lane {horse.lane}</span>
                  <div className="lane-rail">
                    <span className="start-line">START</span>
                    <span className="finish-line">FINISH</span>
                    <span
                      className="horse-runner"
                      title={allHorsesMap.get(horse.horseId) || horse.horseId}
                      style={{
                        "--horse-color": horse.color,
                        "--horse-progress": `${horse.progress * 100}%`,
                        transitionDuration: horse.instant ? "0s" : "0.45s",
                      }}
                    >
                      {horse.icon}
                    </span>
                  </div>
                  <span className="lane-progress">
                    {(horse.progress * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="broadcast-card leaderboard-card">
            <div className="card-heading">
              <div>
                <span>Real-Time Leaderboard</span>
                <strong>🏆 Live leaderboard</strong>
              </div>
              <span>{liveLeaderboard.length} horses</span>
            </div>
            <div className="live-leaderboard">
              <div className="leaderboard-head">
                <span>Rank</span>
                <span>Horse</span>
                <span>Lane</span>
                <span>Progress</span>
              </div>
              {!liveLeaderboard.length && (
                <p className="leaderboard-empty">
                  Waiting for horse information.
                </p>
              )}
              {liveLeaderboard.map((horse) => (
                <div
                  className={`leaderboard-row ${
                    horse.rank <= 3 ? `top-${horse.rank}` : ""
                  }`}
                  key={horse.horseId}
                >
                  <strong>
                    {["🥇", "🥈", "🥉"][horse.rank - 1] || `#${horse.rank}`}
                  </strong>
                  <span title={horse.horseId}>
                    {allHorsesMap.get(horse.horseId) ||
                      shortId(horse.horseId, 8)}
                  </span>
                  <span>{horse.lane}</span>
                  <span>{(horse.progress * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {results.length > 0 && (
          <section className="broadcast-card result-card">
            <div className="card-heading">
              <div>
                <span>Official Results</span>
                <strong>🏆 Finish Standings</strong>
              </div>
              <span>{results.length} horses</span>
            </div>
            <div className="result-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Horse ID</th>
                    <th>Finish Time</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => {
                    const medal = ["🥇", "🥈", "🥉"][result.rawRank - 1];
                    return (
                      <tr
                        key={`${result.horseId}-${result.rawRank}`}
                        className={
                          result.rawRank <= 3
                            ? `podium rank-${result.rawRank}`
                            : ""
                        }
                      >
                        <td>
                          <strong>
                            {medal || `#${result.rawRank}`}{" "}
                            {medal && `#${result.rawRank}`}
                          </strong>
                        </td>
                        <td title={result.horseId}>
                          {allHorsesMap.get(result.horseId)
                            ? `${allHorsesMap.get(result.horseId)} (${shortId(result.horseId, 6)})`
                            : result.horseId}
                        </td>
                        <td>
                          {formatSeconds(
                            finishElapsedSeconds(
                              result.finishedTime,
                              raceStartAt,
                            ),
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default function Broadcast() {
  return <BroadcastExperience mode="live" />;
}
