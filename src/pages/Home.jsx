import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { getHomePageData } from "../api/services/home.service";
import { API_BASE_URL } from "../api/client";
import { getHorses } from "../api/services/horse.service";
import { getUsersByRole, searchJockeys } from "../api/services/user.service";
import { getRoleHomePath } from "../utils/roles";
import {
  clearAuthSession,
  getAccessToken,
  getAuthSession,
} from "../utils/storage";
import {
  BellOutlined,
  FileTextOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import {
  getMyNotifications,
  markNotificationAsRead,
} from "../api/services/notification.service";

dayjs.extend(utc);

// function formatRaceDateTime(value, fallback = "TBA") {
//   if (!value) return fallback;
//   const date = new Date(value);
//   if (Number.isNaN(date.getTime())) return fallback;

//   return new Intl.DateTimeFormat("vi-VN", {
//     dateStyle: "medium",
//     timeStyle: "short",
//   }).format(date);
// }

function formatRaceDateTime(value) {
  if (!value) return "N/A";
  if (typeof value === "string" && value.includes("/")) {
    return value;
  }
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : value;
}

function formatDateTime(value, fallback = "N/A") {
  if (!value) return fallback;
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm DD/MM/YYYY") : fallback;
}

function Icon({ name, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    logo: (
      <>
        <path d="M7 20c0-7 3-10 8-12l2-4 1 6c2 2 3 4 3 7v3" />
        <path d="M7 20h9c2 0 3-1 3-3" />
        <path d="M10 10 5 6" />
        <path d="M15 12h.01" />
        <path d="M11 15h5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 5 7 7-7 7" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20V8" />
      </>
    ),
    horse: (
      <>
        <path d="M4 18v-5l4-4 5 1 3-3 4 4-3 2v5" />
        <path d="M8 14v4" />
        <path d="M13 14v4" />
        <path d="M16 8V4" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path d="M5 6H3v3a4 4 0 0 0 4 4" />
        <path d="M19 6h2v3a4 4 0 0 1-4 4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    map: (
      <>
        <path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
        <path d="M9 3v15" />
        <path d="M15 6v15" />
      </>
    ),
    crown: (
      <>
        <path d="m3 8 4 8 5-10 5 10 4-8v11H3V8Z" />
        <path d="M3 21h18" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    chevron: <path d="m6 9 6 6 6-6" />,
    logout: (
      <>
        <path d="M10 17 15 12l-5-5" />
        <path d="M15 12H3" />
        <path d="M21 3v18" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="8" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="15" width="7" height="6" rx="1" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function SectionTitle({ title, action }) {
  return (
    <div className="home-section-title">
      <h2>{title}</h2>
      {action?.onClick ? (
        <button type="button" onClick={action.onClick}>
          {action.label}
          <Icon name="arrow" size={16} />
        </button>
      ) : action ? (
        <a href={action.href}>
          {action.label}
          <Icon name="arrow" size={16} />
        </a>
      ) : null}
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="home-stat">
      <Icon name={icon} size={30} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function Avatar({ name, rank }) {
  return (
    <span className={`home-avatar home-avatar-${rank}`}>
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </span>
  );
}

function decodeJwtClaims(token) {
  if (!token || !token.includes(".")) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const json = decodeURIComponent(
      atob(paddedPayload)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function pickFirstValue(source, keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return null;
}

function normalizeNotification(notification = {}) {
  return {
    id:
      notification._id || notification.id || notification.notificationId || "",
    title: notification.title || notification.type || "Notification",
    content: notification.content || notification.message || "",
    isRead: Boolean(notification.isRead ?? notification.read),
    createdAt:
      notification.createdAt ||
      notification.created_at ||
      notification.date ||
      "",
  };
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatWinRate(value) {
  return toNumber(value).toFixed(2);
}

function resolveImageUrl(path) {
  if (!path) return "/goldenhoof-hero.png";

  const value = String(path);
  if (value.startsWith("http")) return value;

  const base = API_BASE_URL || "";
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const cleanPath = value.replace(/^\//, "");

  return `${cleanBase}${cleanPath}`;
}

function normalizeHomeHorse(horse = {}, index = 0) {
  const totalWin = toNumber(horse.totalWin ?? horse.wins);
  const winRate = toNumber(horse.winRate);

  return {
    raw: horse,
    id: horse.id || horse._id || horse.horseId || `${horse.name}-${index}`,
    rank: index + 1,
    name: horse.name || horse.horseName || "Unnamed horse",
    breed: horse.breed || "Horse",
    color: horse.color || "",
    height: horse.height || "",
    weight: horse.weight || "",
    status: horse.horseStatus || horse.status || "",
    description: horse.description || "",
    owner:
      horse.ownerName ||
      horse.owner?.fullName ||
      horse.owner?.name ||
      horse.stable ||
      "N/A",
    rating: toNumber(horse.rating),
    totalWin,
    winRate,
    image: resolveImageUrl(
      horse.imageUrl || horse.avatar || horse.avatarUrl || horse.photoUrl,
    ),
  };
}

const ALLOWED_JOCKEY_STATUSES = new Set([
  "available",
  "contracted",
  "busy",
  "resting",
  "injured",
]);

function normalizeHomeJockey(jockey = {}, index = 0) {
  const profile = jockey.jockeyProfile || jockey.profile || {};
  const winRate = toNumber(jockey.winRate ?? profile.winRate);
  const wins = toNumber(
    jockey.totalWin ??
      jockey.totalWins ??
      jockey.careerWins ??
      jockey.wins ??
      profile.totalWin ??
      profile.careerWins ??
      profile.wins,
  );
  const status =
    jockey.jockeyStatus || profile.jockeyStatus || jockey.status || "";

  return {
    id:
      jockey.id ||
      jockey._id ||
      jockey.userId ||
      profile.id ||
      `${jockey.fullName}-${index}`,
    rank: index + 1,
    name:
      jockey.fullName ||
      jockey.name ||
      profile.fullName ||
      profile.name ||
      "Unnamed jockey",
    wins,
    winRate,
    status,
  };
}

const HOME_DIRECTORY_CACHE_MS = 30_000;
let homeDirectoryPromise = null;
let homeDirectoryExpiresAt = 0;

function loadHomeDirectories() {
  if (homeDirectoryPromise && Date.now() < homeDirectoryExpiresAt) {
    return homeDirectoryPromise;
  }

  homeDirectoryExpiresAt = Date.now() + HOME_DIRECTORY_CACHE_MS;
  homeDirectoryPromise = Promise.allSettled([
    getHorses(),
    getUsersByRole("Jockey"),
  ]);
  return homeDirectoryPromise;
}

function Home() {
  const [authSession, setAuthSession] = useState(() => getAuthSession());
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [horseSortOrder, setHorseSortOrder] = useState("desc");
  const [horseSearch, setHorseSearch] = useState("");
  const [jockeySearch, setJockeySearch] = useState("");
  const [jockeySortWinRate, setJockeySortWinRate] = useState("");
  const [jockeySortTotalWin, setJockeySortTotalWin] = useState("");
  const [homeData, setHomeData] = useState({
    races: [],
    horses: [],
    jockeys: [],
    results: [],
    predictors: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const params = {
          search: horseSearch,
          sortWinRate: horseSortOrder,
        };

        const horses = await getHorses(params);

        setHomeData((current) => ({
          ...current,
          horses: Array.isArray(horses) ? horses.map(normalizeHomeHorse) : [],
        }));
      } catch (error) {
        console.error(error);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [horseSearch, horseSortOrder]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const params = {
          fullName: jockeySearch || undefined,
          sortWinRate: jockeySortWinRate || undefined,
          sortTotalWin: jockeySortTotalWin || undefined,
        };

        const jockeys = await searchJockeys(params);

        setHomeData((current) => ({
          ...current,
          jockeys: Array.isArray(jockeys)
            ? jockeys.map(normalizeHomeJockey)
            : [],
        }));
      } catch (error) {
        console.error(error);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [jockeySearch, jockeySortWinRate, jockeySortTotalWin]);

  useEffect(() => {
    let isMounted = true;

    getHomePageData()
      .then((data) => {
        if (!isMounted) return;
        setHomeData((current) => ({ ...current, ...data }));
      })
      .catch(() => {
        // Each directory below still renders independently when race data fails.
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    loadHomeDirectories().then(([horsesResult, jockeysResult]) => {
      if (!isMounted) return;
      const horses =
        horsesResult.status === "fulfilled" && Array.isArray(horsesResult.value)
          ? horsesResult.value.map(normalizeHomeHorse)
          : [];
      const jockeys =
        jockeysResult.status === "fulfilled" &&
        Array.isArray(jockeysResult.value)
          ? jockeysResult.value
              .map(normalizeHomeJockey)
              .filter((jockey) =>
                ALLOWED_JOCKEY_STATUSES.has(
                  String(jockey.status).toLowerCase(),
                ),
              )
          : [];

      setHomeData((current) => ({
        ...current,
        horses: horses.map((horse, index) => ({ ...horse, rank: index + 1 })),
        jockeys: jockeys.map((jockey, index) => ({
          ...jockey,
          rank: index + 1,
        })),
      }));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!authSession) {
      return undefined;
    }

    getMyNotifications()
      .then((data) => {
        if (isMounted) {
          setNotifications(
            Array.isArray(data) ? data.map(normalizeNotification) : [],
          );
        }
      })
      .catch(() => {
        if (isMounted) {
          setNotifications([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authSession]);

  function handleLogout() {
    clearAuthSession();
    setAuthSession(null);
    setIsAccountMenuOpen(false);
    setIsNotificationMenuOpen(false);
  }

  async function handleNotificationClick(notification) {
    setIsNotificationMenuOpen(false);

    if (!notification?.id || notification.isRead) {
      return;
    }

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );

    try {
      await markNotificationAsRead(notification.id);
    } catch {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: false } : item,
        ),
      );
    }
  }

  const tokenClaims = decodeJwtClaims(getAccessToken());
  const currentUser = authSession?.user || {};
  const accountName =
    pickFirstValue(currentUser, [
      "fullName",
      "name",
      "displayName",
      "username",
      "email",
    ]) ||
    pickFirstValue(tokenClaims, [
      "fullName",
      "name",
      "displayName",
      "username",
      "email",
      "sub",
    ]) ||
    "Account";
  const accountRole =
    pickFirstValue(currentUser, ["role", "roleName"]) ||
    pickFirstValue(tokenClaims, ["role", "roleName", "roles", "authorities"]) ||
    "";
  const primaryRole = Array.isArray(accountRole) ? accountRole[0] : accountRole;
  const dashboardPath = getRoleHomePath(primaryRole);
  const isAdmin = Array.isArray(accountRole)
    ? accountRole.some((role) => String(role).toLowerCase().includes("admin"))
    : String(accountRole).toLowerCase().includes("admin");

  // Chuẩn hóa chuỗi role để kiểm tra điều kiện chính xác hơn
  const roleString = String(primaryRole).toLowerCase();
  const isSpectator = roleString.includes("spectator");
  const isOwnerOrJockey =
    roleString.includes("owner") || roleString.includes("jockey");
  const unreadNotificationCount = notifications.filter(
    (item) => !item.isRead,
  ).length;
  const notificationPreview = notifications.slice(0, 5);
  const filteredHorses = useMemo(() => {
    return (homeData.horses ?? []).map((horse, index) => ({
      ...horse,
      rank: index + 1,
    }));
  }, [homeData.horses]);
  const topHorses = filteredHorses.slice(0, 3);
  const topJockeys = (homeData.jockeys ?? [])
    .map((jockey, index) => ({
      ...jockey,
      rank: index + 1,
    }))
    .slice(0, 5);
  if (!authSession) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="home-page">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { min-height: 100%; margin: 0; }
        body {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #0d2321;
          background: #f7fffd;
        }
        button, input { font: inherit; }
        a { color: inherit; text-decoration: none; }

        .home-page {
          min-height: 100dvh;
          overflow-x: hidden;
          background: #f7fffd;
        }

        .home-nav {
          position: fixed;
          z-index: 20;
          inset: 0 0 auto;
          height: 86px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid rgba(105, 248, 221, 0.22);
          color: #f4fffb;
          background: rgba(0, 45, 40, 0.82);
          backdrop-filter: blur(18px);
        }

        .home-container {
          width: min(1230px, calc(100% - 44px));
          margin: 0 auto;
        }

        .home-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
        }

        .home-brand,
        .home-footer-brand {
          display: inline-flex;
          align-items: center;
          gap: 0;
          flex: 0 0 auto;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: 0;
          white-space: nowrap;
        }

        .home-brand-logo {
          height: 78px;
          width: auto;
          display: block;
        }

        .home-brand svg,
        .home-footer-brand svg {
          color: #5ef8d8;
        }

        .home-menu {
          display: flex;
          align-items: center;
          gap: clamp(18px, 2.1vw, 34px);
          color: rgba(244, 255, 251, 0.88);
          font-size: 14px;
          font-weight: 800;
        }

        .home-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .home-live-btn {
          min-height: 40px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 13px;
          border: 1px solid rgba(105, 248, 221, 0.55);
          border-radius: 8px;
          color: #06332e;
          background: #69f8dd;
          font-size: 12px;
          font-weight: 950;
          text-decoration: none;
          white-space: nowrap;
        }

        .home-live-btn i {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #dc2626;
          box-shadow: 0 0 8px #ef4444;
        }

        .home-mobile-action-icon {
          display: none;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .home-mobile-action-icon svg {
          display: block;
        }

        .home-icon-btn {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 0;
          color: #f4fffb;
          background: transparent;
          cursor: pointer;
        }

        .home-btn {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 0 24px;
          border: 1px solid rgba(94, 248, 216, 0.55);
          border-radius: 8px;
          color: #f4fffb;
          background: rgba(255, 255, 255, 0.04);
          font-weight: 900;
          cursor: pointer;
        }

        .home-btn-primary {
          border-color: transparent;
          color: #062724;
          background: #69f8dd;
        }

        .account-menu {
          position: relative;
        }

        .nav-dropdown-wrap {
          position: relative;
        }

        .notification-trigger {
          position: relative;
          border-radius: 50%;
        }

        .notification-trigger-open,
        .notification-trigger:hover {
          background: rgba(105, 248, 221, 0.12);
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 3px;
          min-width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid rgba(0, 45, 40, 0.96);
          border-radius: 999px;
          color: #062724;
          background: #69f8dd;
          font-size: 10px;
          font-weight: 950;
          line-height: 1;
        }

        .account-trigger {
          min-width: 210px;
          max-width: 320px;
          justify-content: space-between;
          font-size: 14px;
        }

        .account-trigger-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .account-trigger svg:last-child {
          transition: transform 0.18s ease;
        }

        .account-trigger-open svg:last-child {
          transform: rotate(180deg);
        }

        .account-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 190px;
          padding: 8px;
          border: 1px solid rgba(105, 248, 221, 0.22);
          border-radius: 8px;
          background: rgba(0, 45, 40, 0.96);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
        }

        .notification-dropdown {
          width: min(360px, calc(100vw - 28px));
          padding: 0;
          overflow: hidden;
        }

        .notification-dropdown-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 14px 12px;
          border-bottom: 1px solid rgba(105, 248, 221, 0.16);
        }

        .notification-dropdown-head strong {
          color: #f4fffb;
          font-size: 14px;
        }

        .notification-dropdown-head span {
          color: rgba(244, 255, 251, 0.68);
          font-size: 12px;
          font-weight: 800;
        }

        .notification-list {
          display: grid;
          max-height: 320px;
          overflow-y: auto;
        }

        .notification-item {
          display: grid;
          gap: 5px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(105, 248, 221, 0.1);
          color: #f4fffb;
        }

        .notification-item:hover {
          background: rgba(105, 248, 221, 0.1);
        }

        .notification-item-unread {
          background: rgba(105, 248, 221, 0.07);
        }

        .notification-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-dot {
          width: 8px;
          height: 8px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #69f8dd;
        }

        .notification-title {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 900;
        }

        .notification-content {
          margin: 0;
          display: -webkit-box;
          overflow: hidden;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          color: rgba(244, 255, 251, 0.72);
          font-size: 12px;
          line-height: 1.45;
        }

        .notification-time {
          color: rgba(244, 255, 251, 0.5);
          font-size: 11px;
          font-weight: 800;
        }

        .notification-empty {
          padding: 24px 14px;
          color: rgba(244, 255, 251, 0.68);
          text-align: center;
          font-size: 13px;
          font-weight: 800;
        }

        .notification-footer {
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 1px solid rgba(105, 248, 221, 0.16);
          color: #69f8dd;
          font-size: 13px;
          font-weight: 950;
        }

        .notification-footer:hover {
          background: rgba(105, 248, 221, 0.1);
        }

        .account-menu-item {
          width: 100%;
          min-height: 42px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border: 0;
          border-radius: 6px;
          color: #f4fffb;
          background: transparent;
          font-weight: 850;
          cursor: pointer;
        }

        .account-menu-item:hover {
          background: rgba(105, 248, 221, 0.12);
        }

        .account-menu-logout {
          color: #ffd9d9;
        }

        .home-hero {
          min-height: 720px;
          display: flex;
          align-items: center;
          color: #f4fffb;
          background-image:
            linear-gradient(90deg, rgba(0, 35, 32, 0.96) 0%, rgba(0, 48, 43, 0.82) 36%, rgba(0, 37, 35, 0.3) 69%, rgba(0, 28, 27, 0.25) 100%),
            linear-gradient(0deg, rgba(0, 21, 20, 0.22), rgba(0, 21, 20, 0.18)),
            url("/goldenhoof-hero.png");
          background-size: cover;
          background-position: center right;
        }

        .home-hero-content {
          width: min(610px, 100%);
          padding-top: 80px;
        }

        .home-kicker {
          width: max-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 26px;
          padding: 9px 18px;
          border-radius: 999px;
          color: #69f8dd;
          background: rgba(96, 248, 218, 0.14);
          font-size: 14px;
          font-weight: 950;
        }

        .home-kicker::before {
          content: "";
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #69f8dd;
        }

        .home-hero h1 {
          margin: 0;
          font-size: clamp(48px, 6vw, 76px);
          line-height: 1.06;
          font-weight: 950;
          letter-spacing: 0;
        }

        .home-hero h1 span {
          display: block;
          color: #69f8dd;
        }

        .home-hero p {
          max-width: 560px;
          margin: 28px 0 32px;
          color: rgba(244, 255, 251, 0.88);
          font-size: 18px;
          line-height: 1.7;
        }

        .home-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 70px;
        }

        .home-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(130px, 1fr));
          gap: 26px;
        }

        .home-stat {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .home-stat svg {
          color: #69f8dd;
          flex: 0 0 auto;
        }

        .home-stat strong {
          display: block;
          color: #fff;
          font-size: 21px;
          line-height: 1.1;
        }

        .home-stat span {
          display: block;
          margin-top: 3px;
          color: rgba(244, 255, 251, 0.76);
          font-size: 13px;
        }

        .home-content {
          padding: 42px 0 28px;
        }

        .home-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
        }

        .home-section-title h2 {
          margin: 0;
          font-size: 27px;
          line-height: 1.2;
          font-weight: 950;
          letter-spacing: 0;
        }

        .home-section-title a,
        .home-section-title button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 0;
          color: #007a68;
          background: transparent;
          font-size: 14px;
          font-weight: 900;
          white-space: nowrap;
          cursor: pointer;
        }

        .home-panel-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          margin-top: 18px;
          color: #007a68;
          font-size: 14px;
          font-weight: 900;
        }

        .horse-filter-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
          margin: -6px 0 20px;
          margin-bottom: 24px;
        }

        .horse-filter-bar select,
        .horse-filter-bar input {
          height: 38px;
          border: 1px solid #bfece5;
          border-radius: 7px;
          color: #06332e;
          background: #fafffe;
          font-size: 13px;
          font-weight: 850;
          outline: 0;
        }

        .horse-filter-bar select {
          width: 210px;
          min-width: 150px;
          padding: 0 10px;
          flex:0 0 220px;
        }

        .horse-search-input {
          width: 280px;
          flex:1;
        }

        .horse-range-input {
          width: 180px;
          flex:0 0 170px;
        }

        .horse-filter-bar input {
          padding: 0 12px;
        }

        .horse-filter-bar select:focus,
        .horse-filter-bar input:focus {
          border-color: #69f8dd;
          box-shadow: 0 0 0 3px rgba(105, 248, 221, 0.18);
        }

        .horse-modal-backdrop {
          position: fixed;
          z-index: 40;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 28px;
          background: rgba(0, 24, 22, 0.62);
          backdrop-filter: blur(8px);
        }

        .horse-modal {
          width: min(980px, 100%);
          max-height: min(760px, calc(100dvh - 56px));
          display: flex;
          flex-direction: column;
          border: 1px solid #cdeee8;
          border-radius: 8px;
          background: #ffffff;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
          overflow: hidden;
        }

        .horse-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid #e5f3f0;
        }

        .horse-modal-head h3 {
          margin: 0;
          color: #06332e;
          font-size: 22px;
          font-weight: 950;
        }

        .horse-modal-close {
          width: 34px;
          height: 34px;
          border: 1px solid #bfece5;
          border-radius: 50%;
          color: #006755;
          background: #f3fffc;
          font-size: 20px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
        }

        .horse-modal-body {
          padding: 18px;
          overflow-y: auto;
        }

        .race-detail-hero {
          position: relative;
          min-height: 220px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          padding: 24px;
          border-radius: 8px;
          color: #f4fffb;
          background:
            linear-gradient(0deg, rgba(0, 45, 40, 0.92), rgba(0, 45, 40, 0.1)),
            var(--race-detail-image) center / cover;
        }

        .race-detail-hero h4 {
          margin: 8px 0 0;
          color: #fff;
          font-size: clamp(25px, 4vw, 38px);
          font-weight: 950;
        }

        .race-detail-status {
          display: inline-flex;
          padding: 6px 9px;
          border-radius: 999px;
          color: #06332e;
          background: #69f8dd;
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .race-detail-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 16px;
        }

        .race-detail-item {
          display: grid;
          gap: 6px;
          min-height: 78px;
          align-content: center;
          padding: 13px;
          border: 1px solid #d9f3ed;
          border-radius: 8px;
          background: #fafffe;
        }

        .race-detail-item span {
          color: #6a817e;
          font-size: 11px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .race-detail-item strong {
          color: #06332e;
          font-size: 14px;
        }

        .horse-profile {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 22px;
        }

        .horse-profile-image {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          object-fit: cover;
          background: #f3fffc;
        }

        .horse-profile-main {
          min-width: 0;
        }

        .horse-profile-main h4 {
          margin: 0 0 8px;
          color: #06332e;
          font-size: 26px;
          font-weight: 950;
        }

        .horse-profile-meta {
          color: #6a817e;
          font-size: 14px;
          font-weight: 850;
        }

        .horse-profile-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin: 18px 0;
        }

        .horse-profile-stat {
          min-height: 74px;
          padding: 12px;
          border: 1px solid #d9f3ed;
          border-radius: 8px;
          background: #fafffe;
        }

        .horse-profile-stat span {
          display: block;
          color: #6a817e;
          font-size: 12px;
          font-weight: 850;
        }

        .horse-profile-stat strong {
          display: block;
          margin-top: 6px;
          color: #06332e;
          font-size: 20px;
          font-weight: 950;
        }

        .horse-profile-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 18px;
          margin-top: 16px;
        }

        .horse-profile-detail {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #e5f3f0;
          padding-bottom: 8px;
          color: #6a817e;
          font-size: 13px;
          font-weight: 850;
        }

        .horse-profile-detail strong {
          color: #06332e;
          text-align: right;
        }

        .horse-profile-description {
          margin: 18px 0 0;
          color: #315a56;
          line-height: 1.65;
          font-size: 14px;
          font-weight: 750;
        }

        .race-grid {
          position: relative;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 34px;
        }

        .race-card,
        .panel,
        .horse-card {
          border: 1px solid #cdeee8;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 18px 50px rgba(14, 71, 66, 0.06);
        }

        .race-card {
          min-height: 315px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 16px;
        }

        .race-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 34px;
          color: #315a56;
          font-size: 13px;
          font-weight: 900;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 12px;
          border-radius: 5px;
          color: #006755;
          background: #d9fbf4;
          font-size: 13px;
          font-weight: 950;
        }

        .pill-live {
          color: #fff;
          background: #18b99e;
        }

        .race-card h3,
        .horse-card h3 {
          margin: 18px 0 9px;
          font-size: 20px;
          line-height: 1.2;
          font-weight: 950;
        }

        .race-card h3 {
          min-height: 48px;
          max-height: 48px;
          display: -webkit-box;
          overflow: hidden;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .muted {
          color: #6a817e;
          font-size: 14px;
        }

        .race-card .muted {
          min-height: 36px;
          display: -webkit-box;
          overflow: hidden;
          overflow-wrap: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .race-date {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          max-width: 100%;
          min-width: 0;
          margin-top: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #214d48;
          font-size: 13px;
          font-weight: 850;
        }

        .race-date svg {
          width: 16px;
          height: 16px;
          flex: 0 0 auto;
          color: #0b8d78;
        }

        .race-preview {
          position: relative;
          width: 100%;
          height: 148px;
          margin: 18px 0 12px;
          overflow: hidden;
          border: 1px solid rgba(6, 103, 85, 0.12);
          border-radius: 10px;
          background: #dff5f0;
          box-shadow: 0 10px 24px rgba(6, 51, 46, 0.12);
        }

        .race-preview::after {
          position: absolute;
          inset: 0;
          content: "";
          pointer-events: none;
          background:
            linear-gradient(180deg, transparent 58%, rgba(1, 31, 28, 0.28)),
            linear-gradient(90deg, rgba(9, 78, 68, 0.08), transparent 45%);
        }

        .race-preview img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: 50% 43%;
          transform: scale(1.01);
          transition: transform 280ms ease, filter 280ms ease;
        }

        .race-card:hover .race-preview img {
          filter: saturate(1.06) contrast(1.03);
          transform: scale(1.045);
        }

        .card-action {
          display: grid;
          place-items: center;
          width: 100%;
          min-height: 42px;
          flex: 0 0 auto;
          margin-top: auto;
          border: 1px solid #bfece5;
          border-radius: 7px;
          color: #006755;
          background: #f3fffc;
          font-weight: 950;
          cursor: pointer;
        }

        .card-action.live-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-color: #0ba98f;
          color: #fff;
          background: linear-gradient(135deg, #16b99e, #078574);
          box-shadow: 0 9px 20px rgba(10, 153, 130, 0.25);
          text-decoration: none;
          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            filter 180ms ease;
        }

        .card-action.live-action::before {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
          content: "";
          animation: live-action-pulse 1.2s ease-in-out infinite;
        }

        .card-action.live-action:hover {
          color: #fff;
          filter: brightness(1.08);
          transform: translateY(-2px);
          box-shadow: 0 13px 26px rgba(10, 153, 130, 0.34);
        }

        @keyframes live-action-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.55;
            transform: scale(0.72);
          }
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .panel {
          padding: 24px;
        }

        .horse-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .top-horse-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .horse-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .horse-photo {
          position: relative;
          height: 138px;
        }

        .horse-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .rank-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #0d2321;
          background: #f9df94;
          font-size: 13px;
          font-weight: 950;
        }

        .horse-body {
          min-height: 230px;
          display: flex;
          flex-direction: column;
          padding: 14px;
        }

        .horse-body h3 {
          min-height: 44px;
          display: -webkit-box;
          margin: 0 0 8px;
          overflow: hidden;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          font-size: 18px;
          line-height: 1.2;
        }

        .horse-stat-row {
          min-height: 34px;
          display: grid;
          grid-template-columns: 62px minmax(0, 1fr);
          align-items: start;
          gap: 10px;
          margin-top: 8px;
          color: #6a817e;
          font-size: 12px;
        }

        .horse-stat-row strong {
          display: -webkit-box;
          overflow: hidden;
          color: #0d2321;
          text-align: right;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .horse-body .card-action {
          margin-top: auto;
        }

        .jockey-list,
        .result-list {
          display: grid;
          gap: 0;
        }

        .jockey-row,
        .result-row {
          display: grid;
          align-items: center;
          gap: 14px;
          border-bottom: 1px solid #e5f3f0;
        }

        .jockey-row {
          grid-template-columns: 28px 42px 1fr auto;
          min-height: 76px;
          font-size: 13px;
        }

        .home-avatar {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: #06332e;
          background: #d9fbf4;
          font-size: 12px;
          font-weight: 950;
        }

        .home-avatar-1 { background: #f9df94; }
        .home-avatar-2 { background: #d6f2f5; }
        .home-avatar-3 { background: #ffd7b8; }

        .rank-number {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #eef6f4;
          color: #315a56;
          font-weight: 950;
        }

        .jockey-row strong,
        .result-row strong {
          color: #0d2321;
          font-weight: 950;
        }

        .jockey-row span,
        .result-row span {
          color: #78918d;
        }

        .lower-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 20px;
          margin-bottom: 28px;
        }

        .lower-grid.results-only {
          grid-template-columns: 1fr;
        }

        .tabs {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-bottom: 18px;
          border: 1px solid #d9ece9;
          border-radius: 8px;
          overflow: hidden;
        }

        .tabs button {
          min-height: 43px;
          border: 0;
          border-right: 1px solid #d9ece9;
          padding: 0 18px;
          color: #53706c;
          background: #fff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .tabs button:first-child {
          color: #006755;
          background: #edfffb;
          box-shadow: inset 0 0 0 1px #bff1e8;
        }

        .tabs button:last-child {
          border-right: 0;
        }

        .home-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .home-table th {
          padding: 15px 10px;
          color: #6a817e;
          font-size: 12px;
          text-align: left;
        }

        .home-table td {
          padding: 15px 10px;
          border-top: 1px solid #e5f3f0;
          font-weight: 800;
        }

        .horse-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mini-thumb {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          object-fit: cover;
        }

        .result-row {
          grid-template-columns: 140px minmax(0, 1fr) 190px 220px;
          min-height: 112px;
        }

        .result-row img {
          width: 140px;
          height: 70px;
          border-radius: 8px;
          object-fit: cover;
        }

        .result-details {
          min-width: 0;
          display: grid;
          gap: 5px;
        }

        .result-details strong,
        .result-details span:not(.result-status) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .result-status {
          width: max-content;
          padding: 4px 8px;
          border-radius: 5px;
          color: #315a56;
          background: #eef6f4;
          font-size: 11px;
          font-weight: 950;
        }

        .result-status-live {
          color: #fff;
          background: #18b99e;
        }

        .winner {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .winner strong,
        .winner span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .winner-icon {
          color: #f0a826;
          font-weight: 950;
        }

        .result-row > strong:last-child {
          justify-self: start;
          white-space: nowrap;
        }

        .home-footer {
          color: #f4fffb;
          background: #002d28;
          padding: 34px 0 26px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr repeat(4, 1fr);
          gap: 50px;
        }

        .home-footer p,
        .home-footer a {
          color: rgba(244, 255, 251, 0.74);
          font-size: 14px;
          line-height: 1.7;
        }

        .home-footer h3 {
          margin: 0 0 14px;
          font-size: 15px;
        }

        .footer-links {
          display: grid;
          gap: 7px;
        }

        .newsletter {
          display: flex;
          align-items: center;
          height: 44px;
          border: 1px solid rgba(105, 248, 221, 0.38);
          border-radius: 6px;
          overflow: hidden;
        }

        .newsletter input {
          min-width: 0;
          flex: 1;
          height: 100%;
          border: 0;
          padding: 0 13px;
          color: #f4fffb;
          background: transparent;
          outline: 0;
        }

        .newsletter button {
          width: 44px;
          height: 44px;
          border: 0;
          color: #06332e;
          background: #69f8dd;
          cursor: pointer;
        }

        .loading-line {
          color: #53706c;
          font-weight: 800;
        }

        @media (max-width: 1120px) {
          .home-menu { display: none; }
          .race-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .result-row {
            grid-template-columns: 140px minmax(0, 1fr) 170px 190px;
          }
          .dashboard-grid,
          .lower-grid { grid-template-columns: 1fr; }
          .horse-grid,
          .top-horse-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .footer-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 720px) {
          .home-container { width: min(100% - 28px, 1230px); }
          .home-nav { height: 74px; }
          .home-nav-inner { gap: 10px; }
          .home-brand-logo { height: 62px; width: auto; }
          .home-actions { gap: 8px; min-width: 0; }
          .account-trigger { min-width: 0; max-width: 156px; }
          .home-icon-btn {
            width: 38px;
            height: 38px;
          }
          .home-live-btn {
            min-height: 38px;
            padding: 0 10px;
            font-size: 11px;
          }
          .home-btn { min-height: 42px; padding: 0 14px; font-size: 13px; }
          .home-hero {
            min-height: 660px;
            background-position: center;
          }
          .home-hero h1 { font-size: clamp(42px, 13vw, 58px); }
          .home-stats,
          .race-grid,
          .horse-grid,
          .top-horse-grid,
          .footer-grid { grid-template-columns: 1fr; }
          .panel { padding: 18px; }
          .jockey-row { grid-template-columns: 26px 38px 1fr; }
          .jockey-row > span:last-child { display: none; }
          .result-row {
            grid-template-columns: 92px 1fr;
            padding: 14px 0;
          }
          .result-row img {
            width: 92px;
            height: 72px;
          }
          .winner,
          .result-row > strong:last-child { display: none; }
          .home-table th:nth-child(4),
          .home-table td:nth-child(4),
          .home-table th:nth-child(6),
          .home-table td:nth-child(6) { display: none; }
          .horse-modal-backdrop { padding: 14px; }
          .race-detail-grid { grid-template-columns: 1fr 1fr; }
          .horse-profile { grid-template-columns: 1fr; }
          .horse-profile-stats,
          .horse-profile-details { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .home-container { width: min(100% - 22px, 1230px); }
          .home-brand-logo { height: 54px; }
          .home-nav-inner { gap: 8px; }
          .home-actions { gap: 6px; }
          .home-live-btn {
            width: 42px;
            min-height: 40px;
            padding: 0;
            gap: 0;
            font-size: 0;
            justify-content: center;
          }
          .home-action-label {
            display: none;
          }
          .home-live-btn i {
            display: none;
          }
          .home-mobile-action-icon {
            display: inline-flex;
          }
          .home-icon-btn {
            width: 40px;
            height: 40px;
          }
          .notification-dropdown {
            position: fixed;
            top: 84px;
            right: 11px;
            left: 11px;
            width: auto;
          }
          .notification-dropdown-head {
            padding: 10px 12px;
          }
          .notification-dropdown-head strong {
            font-size: 13px;
          }
          .notification-dropdown-head span {
            font-size: 11px;
          }
          .notification-list {
            max-height: 250px;
          }
          .notification-item {
            gap: 4px;
            padding: 10px 12px;
          }
          .notification-title {
            font-size: 12px;
          }
          .notification-content {
            font-size: 11px;
            line-height: 1.35;
            -webkit-line-clamp: 1;
          }
          .notification-time {
            font-size: 10px;
          }
          .notification-footer {
            min-height: 38px;
            font-size: 12px;
          }
          .account-trigger {
            width: 44px;
            max-width: 44px;
            min-width: 44px;
            padding: 0;
            justify-content: center;
          }
          .account-trigger-name,
          .account-trigger svg:last-child { display: none; }
          .home-hero {
            min-height: 620px;
          }
          .home-hero-content {
            padding-top: 72px;
          }
          .home-hero h1 { font-size: clamp(38px, 12vw, 52px); }
          .home-hero p {
            font-size: 16px;
            line-height: 1.65;
          }
          .home-hero-actions {
            display: grid;
            grid-template-columns: 1fr;
            margin-bottom: 44px;
          }
        }
      `}</style>

      <header className="home-nav">
        <div className="home-container home-nav-inner">
          <a className="home-brand" href="#top" aria-label="GoldenHoof home">
            <img
              className="home-brand-logo"
              src="/goldenhoof-logo.png"
              alt=""
            />
          </a>

          <nav className="home-menu" aria-label="Primary navigation">
            {["Races", "Horses", "Jockeys", "Results", "Predictions"].map(
              (item) => (
                <a href={`#${item.toLowerCase()}`} key={item}>
                  {item}
                </a>
              ),
            )}
          </nav>

          <div className="home-actions">
            {isSpectator && (
              <Link className="home-live-btn home-bet-btn" to="/spectator/bets">
                <span className="home-mobile-action-icon">
                  <Icon name="trophy" size={18} />
                </span>
                <span className="home-action-label">Bet Points</span>
              </Link>
            )}
            <Link className="home-live-btn" to="/spectator/broadcast">
              <i aria-hidden="true" />
              <span className="home-mobile-action-icon">
                <Icon name="horse" size={18} />
              </span>
              <span className="home-action-label">Live Broadcast</span>
            </Link>
            <div className="nav-dropdown-wrap">
              <button
                className={`home-icon-btn notification-trigger ${
                  isNotificationMenuOpen ? "notification-trigger-open" : ""
                }`}
                type="button"
                aria-label="Notifications"
                aria-expanded={isNotificationMenuOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setIsNotificationMenuOpen((current) => !current);
                  setIsAccountMenuOpen(false);
                }}
              >
                <BellOutlined style={{ fontSize: "20px" }} />
                {unreadNotificationCount > 0 && (
                  <span className="notification-badge">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>

              {isNotificationMenuOpen && (
                <div
                  className="account-dropdown notification-dropdown"
                  role="menu"
                  aria-label="Notifications"
                >
                  <div className="notification-dropdown-head">
                    <strong>Notifications</strong>
                    <span>{unreadNotificationCount} unread</span>
                  </div>
                  {notificationPreview.length > 0 ? (
                    <div className="notification-list">
                      {notificationPreview.map((notification) => (
                        <Link
                          className={`notification-item ${
                            notification.isRead
                              ? ""
                              : "notification-item-unread"
                          }`}
                          key={
                            notification.id ||
                            `${notification.title}-${notification.createdAt}`
                          }
                          role="menuitem"
                          to="/notification"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className="notification-title-row">
                            {!notification.isRead && (
                              <span className="notification-dot" />
                            )}
                            <span className="notification-title">
                              {notification.title}
                            </span>
                          </span>
                          {notification.content && (
                            <p className="notification-content">
                              {notification.content}
                            </p>
                          )}
                          {notification.createdAt && (
                            <span className="notification-time">
                              {formatDateTime(notification.createdAt)}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="notification-empty">No notifications</div>
                  )}
                  <Link
                    className="notification-footer"
                    role="menuitem"
                    to="/notification"
                    onClick={() => setIsNotificationMenuOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
            <div className="account-menu">
              <button
                className={`home-btn account-trigger ${
                  isAccountMenuOpen ? "account-trigger-open" : ""
                }`}
                type="button"
                aria-expanded={isAccountMenuOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setIsAccountMenuOpen((current) => !current);
                  setIsNotificationMenuOpen(false);
                }}
              >
                <Icon name="user" size={20} />
                <span className="account-trigger-name">{accountName}</span>
                <Icon name="chevron" size={18} />
              </button>

              {isAccountMenuOpen && (
                <div className="account-dropdown" role="menu">
                  {!isSpectator && (
                    <Link
                      className="account-menu-item"
                      role="menuitem"
                      to={isAdmin ? "/admin/dashboard" : dashboardPath}
                    >
                      <Icon name="dashboard" size={18} />
                      <span>Dashboard</span>
                    </Link>
                  )}
                  <Link
                    className="account-menu-item"
                    role="menuitem"
                    to="/profile"
                  >
                    <Icon name="user" size={18} />
                    <span>Profile</span>
                  </Link>
                  {/* Phân quyền hiển thị Points/Transactions và Notifications */}
                  {isSpectator && (
                    <>
                      <Link
                        className="account-menu-item"
                        role="menuitem"
                        to="/spectator/points-transaction"
                      >
                        <Icon name="chart" size={18} />
                        <span>Points</span>
                      </Link>
                      <Link
                        className="account-menu-item"
                        role="menuitem"
                        to="/report"
                      >
                        <FileTextOutlined style={{ fontSize: "18px" }} />
                        <span>Report</span>
                      </Link>
                    </>
                  )}

                  {isOwnerOrJockey && (
                    <>
                      <Link
                        className="account-menu-item"
                        role="menuitem"
                        to="/money-transaction"
                      >
                        <Icon name="chart" size={18} />
                        <span>Transactions</span>
                      </Link>
                      <Link
                        className="account-menu-item"
                        role="menuitem"
                        to="/wallet"
                      >
                        <WalletOutlined style={{ fontSize: "18px" }} />
                        <span>Wallet</span>
                      </Link>
                      <Link
                        className="account-menu-item"
                        role="menuitem"
                        to="/report"
                      >
                        <FileTextOutlined style={{ fontSize: "18px" }} />
                        <span>Report</span>
                      </Link>
                    </>
                  )}
                  <button
                    className="account-menu-item account-menu-logout"
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <Icon name="logout" size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="home-hero" id="top">
        <div className="home-container">
          <div className="home-hero-content">
            <span className="home-kicker">LIVE THE THRILL</span>
            <h1>
              Where Champions
              <span>Run to Glory</span>
            </h1>
            <p>
              GoldenHoof is your ultimate destination for horse racing. Follow
              the races, track the champions, and be part of every thrilling
              moment.
            </p>
            <div className="home-hero-actions">
              <a className="home-btn home-btn-primary" href="#races">
                Explore Races
                <Icon name="arrow" size={20} />
              </a>
              <a className="home-btn" href="#results">
                View Live Results
                <Icon name="chart" size={20} />
              </a>
            </div>

            <div className="home-stats">
              <Stat icon="trophy" value="120+" label="Races This Season" />
              <Stat icon="horse" value="200+" label="Horses" />
              <Stat icon="users" value="150+" label="Jockeys" />
              <Stat icon="crown" value="50K+" label="Active Fans" />
            </div>
          </div>
        </div>
      </section>

      <section className="home-content">
        <div className="home-container">
          <section id="races">
            <SectionTitle
              title="Upcoming Races"
              action={{ label: "View Full Schedule", href: "#races" }}
            />
            {isLoading ? (
              <p className="loading-line">Loading races...</p>
            ) : (
              <div className="race-grid">
                {homeData.races.map((race) => (
                  <article className="race-card" key={race.id}>
                    <div className="race-meta">
                      <span
                        className={`pill ${race.status ? "pill-live" : ""}`}
                      >
                        {race.status ? "Live" : "Upcoming"}
                      </span>
                    </div>
                    <h3 title={race.name}>{race.name}</h3>
                    <span className="muted" title={race.venue}>
                      {race.venue}
                    </span>
                    <span className="race-date">
                      <Icon name="clock" size={16} />
                      {formatRaceDateTime(race.date || race.sortTime)}
                    </span>
                    {race.status && (
                      <div className="race-preview">
                        <img src={race.image} alt={`${race.name} race`} />
                      </div>
                    )}
                    {race.status ? (
                      <Link
                        className="card-action live-action"
                        to={`/spectator/broadcast/${encodeURIComponent(race.id)}`}
                      >
                        Watch Live
                      </Link>
                    ) : (
                      <button
                        className="card-action"
                        type="button"
                        onClick={() => setSelectedRace(race)}
                      >
                        {race.status ? "Live Race" : "View Details"}
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="dashboard-grid" id="horses">
            <section className="panel">
              <SectionTitle
                title="Top Horses"
                action={{
                  label: "View All Horses",
                  href: "/horses",
                }}
              />
              <div className="horse-filter-bar" aria-label="Horse filters">
                <input
                  type="text"
                  className="horse-search-input"
                  placeholder="Search horse name..."
                  value={horseSearch}
                  onChange={(e) => setHorseSearch(e.target.value)}
                />

                <select
                  value={horseSortOrder}
                  onChange={(e) => setHorseSortOrder(e.target.value)}
                >
                  <option value="desc">Win rate descending</option>

                  <option value="asc">Win rate ascending</option>
                </select>
              </div>
              <div className="horse-grid top-horse-grid">
                {topHorses.map((horse) => (
                  <article className="horse-card" key={horse.id}>
                    <div className="horse-photo">
                      <img src={horse.image} alt={horse.name} />
                      <span className="rank-badge">{horse.rank}</span>
                    </div>
                    <div className="horse-body">
                      <h3>{horse.name}</h3>
                      <div className="horse-stat-row">
                        <span>Owner</span>
                        <strong>{horse.owner}</strong>
                      </div>
                      <div className="horse-stat-row">
                        <span>Win rate</span>
                        <strong>{formatWinRate(horse.winRate)}%</strong>
                      </div>
                      <div className="horse-stat-row">
                        <span>Wins</span>
                        <strong>{horse.totalWin || 0}</strong>
                      </div>
                      <button
                        className="card-action"
                        type="button"
                        onClick={() => setSelectedHorse(horse)}
                      >
                        View Profile
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {topHorses.length === 0 && (
                <p className="loading-line">
                  No horses match the current filters.
                </p>
              )}
            </section>

            <section className="panel" id="jockeys">
              <SectionTitle
                title="Top Jockeys"
                action={{ label: "View All Jockeys", href: "/jockeys" }}
              />
              <div className="horse-filter-bar" aria-label="Jockey filters">
                <input
                  type="text"
                  placeholder="Search jockey..."
                  value={jockeySearch}
                  onChange={(e) => setJockeySearch(e.target.value)}
                />
              </div>
              <div className="jockey-list">
                {topJockeys.map((jockey) => (
                  <div className="jockey-row" key={jockey.id}>
                    <span className="rank-number">{jockey.rank}</span>
                    <Avatar name={jockey.name} rank={jockey.rank} />
                    <strong>{jockey.name}</strong>
                    <span>Win Rate {formatWinRate(jockey.winRate)}%</span>
                  </div>
                ))}
              </div>
              {topJockeys.length === 0 && (
                <p className="loading-line">
                  No jockeys match the current filters.
                </p>
              )}
            </section>
          </div>

          {selectedRace && (
            <div
              className="horse-modal-backdrop"
              role="presentation"
              onClick={() => setSelectedRace(null)}
            >
              <section
                className="horse-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`${selectedRace.name} details`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="horse-modal-head">
                  <h3>Race Details</h3>
                  <button
                    className="horse-modal-close"
                    type="button"
                    aria-label="Close race details"
                    onClick={() => setSelectedRace(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="horse-modal-body">
                  <div
                    className="race-detail-hero"
                    style={{
                      "--race-detail-image": `url("${selectedRace.image}")`,
                    }}
                  >
                    <div>
                      <span className="race-detail-status">
                        {selectedRace.status || selectedRace.rawStatus}
                      </span>
                      <h4>{selectedRace.name}</h4>
                    </div>
                  </div>
                  <div className="race-detail-grid">
                    <div className="race-detail-item">
                      <span>Tournament</span>
                      <strong>{selectedRace.tournament}</strong>
                    </div>
                    <div className="race-detail-item">
                      <span>Time</span>
                      <strong>
                        {formatRaceDateTime(
                          selectedRace.sortTime,
                          selectedRace.time,
                        )}
                      </strong>
                    </div>
                    <div className="race-detail-item">
                      <span>Race Course</span>
                      <strong>{selectedRace.venue}</strong>
                    </div>
                    <div className="race-detail-item">
                      <span>Distance</span>
                      <strong>{selectedRace.distance}</strong>
                    </div>
                    <div className="race-detail-item">
                      <span>Race Track</span>
                      <strong>{selectedRace.surface}</strong>
                    </div>
                    <div className="race-detail-item">
                      <span>Round</span>
                      <strong>{selectedRace.round}</strong>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {selectedHorse && (
            <div
              className="horse-modal-backdrop"
              role="presentation"
              onClick={() => setSelectedHorse(null)}
            >
              <section
                className="horse-modal"
                role="dialog"
                aria-modal="true"
                aria-label={`${selectedHorse.name} profile`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="horse-modal-head">
                  <h3>Horse Profile</h3>
                  <button
                    className="horse-modal-close"
                    type="button"
                    aria-label="Close horse profile"
                    onClick={() => setSelectedHorse(null)}
                  >
                    x
                  </button>
                </div>
                <div className="horse-modal-body">
                  <div className="horse-profile">
                    <img
                      className="horse-profile-image"
                      src={selectedHorse.image}
                      alt={selectedHorse.name}
                    />
                    <div className="horse-profile-main">
                      <h4>{selectedHorse.name}</h4>
                      <div className="horse-profile-meta">
                        {selectedHorse.breed}
                        {selectedHorse.color ? ` · ${selectedHorse.color}` : ""}
                      </div>

                      <div className="horse-profile-stats">
                        <div className="horse-profile-stat">
                          <span>Win rate</span>
                          <strong>
                            {formatWinRate(selectedHorse.winRate)}%
                          </strong>
                        </div>
                        <div className="horse-profile-stat">
                          <span>Total wins</span>
                          <strong>{selectedHorse.totalWin || 0}</strong>
                        </div>
                        <div className="horse-profile-stat">
                          <span>Rating</span>
                          <strong>{selectedHorse.rating || 0}</strong>
                        </div>
                      </div>

                      <div className="horse-profile-details">
                        <div className="horse-profile-detail">
                          <span>Owner</span>
                          <strong>{selectedHorse.owner}</strong>
                        </div>
                        <div className="horse-profile-detail">
                          <span>Status</span>
                          <strong>{selectedHorse.status || "N/A"}</strong>
                        </div>
                        <div className="horse-profile-detail">
                          <span>Height</span>
                          <strong>
                            {selectedHorse.height
                              ? `${selectedHorse.height} m`
                              : "N/A"}
                          </strong>
                        </div>
                        <div className="horse-profile-detail">
                          <span>Weight</span>
                          <strong>
                            {selectedHorse.weight
                              ? `${selectedHorse.weight} kg`
                              : "N/A"}
                          </strong>
                        </div>
                        <div className="horse-profile-detail">
                          <span>Rank</span>
                          <strong>#{selectedHorse.rank}</strong>
                        </div>
                      </div>

                      {selectedHorse.description && (
                        <p className="horse-profile-description">
                          {selectedHorse.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          <div className="lower-grid results-only">
            <section className="panel" id="results">
              <SectionTitle
                title="Latest Race Results"
                action={{ label: "View All Results", href: "/race-results" }}
              />
              <div className="result-list">
                {homeData.results.map((result) => (
                  <article className="result-row" key={result.id}>
                    <img src={result.image} alt={result.race} />
                    <div className="result-details">
                      <span
                        className={`result-status ${
                          result.status === "LIVE" ? "result-status-live" : ""
                        }`}
                      >
                        {result.status}
                      </span>
                      <strong>{result.race}</strong>
                      <span>
                        {result.venue} · {result.distance} · {result.trackType}
                      </span>
                    </div>
                    <div className="winner">
                      <span className="winner-icon">1st</span>
                      <strong>{result.winner}</strong>
                      <span>{result.jockey}</span>
                    </div>
                    <strong>{formatRaceDateTime(result.date)}</strong>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* <section className="prediction-band" id="predictions">
            <div>
              <h2>Make Your Predictions</h2>
              <p>
                Predict race winners and compete with fans around the world. Win
                points and unlock exclusive rewards.
              </p>
              <a className="home-btn home-btn-primary" href="#predictions">
                Start Predicting
                <Icon name="arrow" size={20} />
              </a>
            </div>
            <div>
              <h3>Top Predictors This Week</h3>
              <div className="predictor-list">
                {homeData.predictors.map((predictor) => (
                  <div className="predictor-row" key={predictor.id}>
                    <span>{predictor.id}</span>
                    <Avatar name={predictor.name} rank={predictor.id} />
                    <strong>{predictor.name}</strong>
                    <span>{predictor.points.toLocaleString()} PTS</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="trophy-art">
              <Icon name="trophy" size={132} />
            </div>
          </section> */}
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-container footer-grid">
          <div>
            <a className="home-footer-brand" href="#top">
              <img
                className="home-footer-brand-logo"
                src="/goldenhoof-logo.png"
                alt=""
              />
              <span>GoldenHoof</span>
            </a>
            <p>
              The ultimate platform for horse racing enthusiasts. Stay updated,
              stay excited.
            </p>
          </div>
          <div>
            <h3>Explore</h3>
            <div className="footer-links">
              <a href="#races">Races</a>
              <a href="#horses">Horses</a>
              <a href="#jockeys">Jockeys</a>
              <a href="#results">Results</a>
              <a href="#rankings">Rankings</a>
            </div>
          </div>
          <div>
            <h3>Support</h3>
            <div className="footer-links">
              <a href="#support">Help Center</a>
              <a href="#support">Contact Us</a>
              <a href="#support">Terms of Use</a>
              <a href="#support">Privacy Policy</a>
              <a href="#support">FAQ</a>
            </div>
          </div>
          <div>
            <h3>Community</h3>
            <div className="footer-links">
              <a href="#news">News</a>
              <a href="#events">Events</a>
              <a href="#blog">Blog</a>
              <a href="#forum">Forum</a>
              <a href="#about">About Us</a>
            </div>
          </div>
          <div>
            <h3>Stay Updated</h3>
            <p>Subscribe to our newsletter</p>
            <div className="newsletter">
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
              />
              <button type="button" aria-label="Subscribe">
                <Icon name="mail" size={18} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Home;
