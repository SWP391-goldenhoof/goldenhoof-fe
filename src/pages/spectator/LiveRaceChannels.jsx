import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getRacesByTournament } from "../../api/services/race.service";
import { getTournaments } from "../../api/services/tournament.service";
import "./LiveRaceChannels.css";

dayjs.extend(utc);

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  for (const key of [
    "data",
    "items",
    "races",
    "content",
    "records",
    "result",
  ]) {
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

function getTournamentName(tournament) {
  return (
    tournament?.title ||
    tournament?.name ||
    tournament?.tournamentName ||
    "GoldenHoof Tournament"
  );
}

function normalizeRace(race, tournament, index) {
  const id = getId(race);
  const horses = Array.isArray(race?.horses)
    ? race.horses
    : Array.isArray(race?.participants)
      ? race.participants
      : [];

  return {
    id,
    name:
      race?.name ||
      race?.title ||
      `Race ${race?.raceOrder || race?.roundNumber || index + 1}`,
    status: race?.status || "Ongoing",
    tournamentName:
      race?.tournamentTitle ||
      race?.tournamentName ||
      getTournamentName(tournament),
    course:
      race?.raceCourseName ||
      race?.courseName ||
      race?.raceCourseId?.name ||
      "Race course",
    startAt:
      race?.startAt ||
      race?.startDateTime ||
      race?.scheduledAt ||
      race?.startTime ||
      race?.date,
    finishedAt:
      race?.finishedAt ||
      race?.completedAt ||
      race?.updatedAt ||
      race?.startAt ||
      race?.date,
    horseCount:
      race?.horseCount ??
      race?.totalHorses ??
      race?.filledSlots ??
      horses.length,
    round: race?.roundNumber,
    order: race?.raceOrder,
  };
}

function isLive(status) {
  return ["ongoing", "live", "in progress", "in_progress"].includes(
    String(status || "")
      .trim()
      .toLowerCase(),
  );
}

function isFinished(status) {
  return ["finished", "completed"].includes(
    String(status || "")
      .trim()
      .toLowerCase(),
  );
}

function formatStartTime(value) {
  if (!value) return "Live Now";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : String(value);
}

function RaceChannelCard({ race, index, replay = false }) {
  return (
    <article className={`live-channel-card ${replay ? "finished" : ""}`}>
      <div className="channel-preview">
        <div className="channel-number">
          {replay ? "REPLAY" : "LIVE"} {String(index + 1).padStart(2, "0")}
        </div>
        <div className="channel-horses" aria-hidden="true">
          <span>🏇</span>
          <span>🏇</span>
          <span>🏇</span>
        </div>
        <span className={`channel-live-badge ${replay ? "finished" : ""}`}>
          {!replay && <i aria-hidden="true" />}
          {replay ? "REPLAY" : "LIVE"}
        </span>
      </div>

      <div className="channel-content">
        <p>{race.tournamentName}</p>
        <h2>{race.name}</h2>
        <div className="channel-meta">
          <span>📍 {race.course}</span>
          <span>🕐 {formatStartTime(race.startAt)}</span>
          <span>🐎 {race.horseCount || "—"} horses</span>
          {race.round != null && <span>Vòng {race.round}</span>}
        </div>
        <Link
          className="watch-channel-button"
          to={`/spectator/${replay ? "replay" : "broadcast"}/${encodeURIComponent(
            race.id,
          )}`}
        >
          {replay ? "Watch replay" : "Watch live"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export default function LiveRaceChannels() {
  const [races, setRaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const initialLoadStartedRef = useRef(false);

  const loadLiveRaces = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const tournaments = resolveList(await getTournaments());
      const raceResponses = await Promise.allSettled(
        tournaments.map(async (tournament) => {
          const tournamentId = getId(tournament);
          if (!tournamentId) return [];
          const response = await getRacesByTournament(tournamentId);
          return resolveList(response).map((race, index) =>
            normalizeRace(race, tournament, index),
          );
        }),
      );

      const loadedRaces = raceResponses
        .flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        )
        .filter(
          (race) => race.id && (isLive(race.status) || isFinished(race.status)),
        );

      const uniqueRaces = Array.from(
        new Map(loadedRaces.map((race) => [race.id, race])).values(),
      ).sort((first, second) => {
        if (isLive(first.status) !== isLive(second.status)) {
          return isLive(first.status) ? -1 : 1;
        }
        return (
          (new Date(second.finishedAt || second.startAt || 0).getTime() || 0) -
          (new Date(first.finishedAt || first.startAt || 0).getTime() || 0)
        );
      });

      setRaces(uniqueRaces);
      setLastUpdated(new Date());

      if (
        tournaments.length > 0 &&
        raceResponses.every((result) => result.status === "rejected")
      ) {
        setError("Không thể tải danh sách race từ Backend.");
      }
    } catch (loadError) {
      setRaces([]);
      setError(
        loadError?.message || "Không thể tải danh sách race đang trực tiếp.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    loadLiveRaces();
  }, [loadLiveRaces]);

  const updateLabel = useMemo(
    () =>
      lastUpdated
        ? `Last updated ${lastUpdated.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}`
        : "Syncing with racetrack",
    [lastUpdated],
  );
  const liveRaces = races.filter((race) => isLive(race.status));
  const replayRaces = races
    .filter((race) => isFinished(race.status))
    .slice(0, 6);

  return (
    <main className="live-channels-page">
      <div className="live-channels-shell">
        <header className="live-channels-header">
          <div>
            <p className="live-channels-eyebrow">GOLDEN HOOF · LIVE TV</p>
          </div>
          <div className="live-channels-actions">
            <span>{updateLabel}</span>
            <button type="button" onClick={loadLiveRaces} disabled={isLoading}>
              {isLoading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>
        </header>

        <section className="live-channel-summary" aria-label="Live summary">
          <div>
            <span className="live-dot" aria-hidden="true" />
            <strong>{liveRaces.length}</strong>
            <span>live races · {replayRaces.length} recent replays</span>
          </div>
          <Link to="/home">Back to Home</Link>
        </section>

        {error && (
          <section className="live-channel-state error" role="alert">
            <strong>Failed to load list</strong>
            <span>{error}</span>
            <button type="button" onClick={loadLiveRaces}>
              Retry
            </button>
          </section>
        )}

        {!error && isLoading && (
          <section className="live-channel-grid" aria-label="Loading races">
            {[1, 2, 3].map((item) => (
              <div className="live-channel-card skeleton" key={item}>
                <div />
                <span />
                <span />
              </div>
            ))}
          </section>
        )}

        {!error && !isLoading && races.length === 0 && (
          <section className="live-channel-state">
            <span className="empty-icon">🏁</span>
            <strong>Chưa có race nào để theo dõi</strong>
            <button type="button" onClick={loadLiveRaces}>
              Check again
            </button>
          </section>
        )}

        {!error && !isLoading && races.length > 0 && (
          <div className="channel-sections">
            <section
              className="channel-section"
              aria-labelledby="live-races-title"
            >
              <div className="channel-section-heading">
                <div>
                  <span className="live-dot" aria-hidden="true" />
                  <h2 id="live-races-title">Live Broadcasts</h2>
                </div>
                <span>{liveRaces.length} race</span>
              </div>
              {liveRaces.length ? (
                <div className="live-channel-grid">
                  {liveRaces.map((race, index) => (
                    <RaceChannelCard race={race} index={index} key={race.id} />
                  ))}
                </div>
              ) : (
                <div className="channel-section-empty">
                  There are currently no live races broadcasting.
                </div>
              )}
            </section>

            <section
              className="channel-section"
              aria-labelledby="replay-races-title"
            >
              <div className="channel-section-heading">
                <div>
                  <span className="replay-icon" aria-hidden="true">
                    ↻
                  </span>
                  <h2 id="replay-races-title">Recent Replays</h2>
                </div>
              </div>
              {replayRaces.length ? (
                <div className="live-channel-grid">
                  {replayRaces.map((race, index) => (
                    <RaceChannelCard
                      race={race}
                      index={index}
                      replay
                      key={race.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="channel-section-empty">
                  No completed broadcasts available for replay yet.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
