import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  Alert,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileDoneOutlined,
  FlagOutlined,
  FundOutlined,
  TeamOutlined,
  TrophyOutlined,
  WarningOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { getAdminBetStats } from "../../api/services/bet.service";
import { getAdminHorseStats } from "../../api/services/horse.service";
import { getRaceCourses } from "../../api/services/race-course.service";
import { getAdminRaceStats } from "../../api/services/race.service";
import { getAdminRegistrationStats } from "../../api/services/registration.service";
import { getReportStatsAdmin } from "../../api/services/report.service";
import { getUpcomingSchedule } from "../../api/services/schedule.service";
import { getAdminTournamentStats } from "../../api/services/tournament.service";
import { getAdminDashboardStats } from "../../api/services/user.service";
import { getSystemWalletOverview } from "../../api/services/wallet.service";

dayjs.extend(utc);

const ROLE_ORDER = ["Spectator", "Horse Owner", "Jockey", "Referee"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const ROLE_COLORS = {
  Spectator: "#0f9f89",
  "Horse Owner": "#7c3aed",
  Jockey: "#d97706",
  Referee: "#2563eb",
};

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  for (const key of [
    "data",
    "items",
    "users",
    "horses",
    "tournaments",
    "races",
    "raceCourses",
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

function normalizeRole(value) {
  const role = String(value || "").toLowerCase();

  if (role.includes("admin")) return "Admin";
  if (role.includes("referee")) return "Referee";
  if (role.includes("jockey")) return "Jockey";
  if (role.includes("owner") || role.includes("horse")) return "Horse Owner";

  return "Spectator";
}

function formatStatusLabel(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("DD/MM/YYYY") : "N/A";
}

function formatTime(value) {
  if (!value) return "N/A";
  const date = dayjs.utc(value);
  return date.isValid() ? date.format("HH:mm") : "N/A";
}

function getRaceStatusColor(status) {
  const value = String(status || "").toLowerCase();

  if (value === "ready") return "gold";
  if (value === "scheduled") return "blue";
  if (value === "ongoing") return "green";
  if (value === "finished" || value === "completed") return "default";
  if (value === "cancelled" || value === "canceled") return "red";

  return "cyan";
}

function getAccountStatusMeta(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("active")) {
    return {
      color: "#087a6d",
      border: "#9be5d9",
      background: "#e8fff9",
      icon: <CheckCircleOutlined />,
    };
  }

  return {
    color: "#be123c",
    border: "#fecdd3",
    background: "#fff1f2",
    icon: <WarningOutlined />,
  };
}

function getJockeyStatusMeta(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("available")) {
    return {
      color: "#0f9f89",
      border: "#9be5d9",
      background: "#e8fff9",
    };
  }

  return {
    color: "#d97706",
    border: "#fed7aa",
    background: "#fff8e6",
  };
}

function getHorseStatusMeta(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("idle")) {
    return { color: "#0f9f89", border: "#9be5d9", background: "#e8fff9" };
  }
  if (normalizedStatus.includes("registered")) {
    return { color: "#2563eb", border: "#bfdbfe", background: "#edf4ff" };
  }
  if (normalizedStatus.includes("injured")) {
    return { color: "#be123c", border: "#fecdd3", background: "#fff1f2" };
  }

  return { color: "#d97706", border: "#fed7aa", background: "#fff8e6" };
}

function getBetStatusMeta(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("win")) {
    return { color: "#0f9f89", border: "#9be5d9", background: "#e8fff9" };
  }
  if (normalizedStatus.includes("lose")) {
    return { color: "#be123c", border: "#fecdd3", background: "#fff1f2" };
  }

  return { color: "#d97706", border: "#fed7aa", background: "#fff8e6" };
}

function getReportStatusMeta(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus.includes("resolved")) {
    return { color: "#0f9f89", border: "#9be5d9", background: "#e8fff9" };
  }
  if (normalizedStatus.includes("rejected")) {
    return { color: "#be123c", border: "#fecdd3", background: "#fff1f2" };
  }

  return { color: "#d97706", border: "#fed7aa", background: "#fff8e6" };
}

function getStatusDonutGradient(entries, total) {
  if (!total || !entries.length) return "#edf5f3";

  let cursor = 0;
  const segments = entries.map(([status, count]) => {
    const value = Number(count) || 0;
    const start = cursor;
    const end = cursor + (value / total) * 360;
    cursor = end;

    return `${getHorseStatusMeta(status).color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

function formatVnd(value) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatCompactVnd(value) {
  return new Intl.NumberFormat("vi-VN", {
    compactDisplay: "short",
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(Number(value) || 0);
}

function getMonthlyRevenueData(walletOverview, selectedYear) {
  const byMonth = new Map(
    MONTH_LABELS.map((label, index) => [
      index + 1,
      {
        month: `${selectedYear}-${String(index + 1).padStart(2, "0")}`,
        label,
        entryFee: 0,
        penaltyCommission: 0,
        totalMonthlyRevenue: 0,
      },
    ]),
  );

  (walletOverview?.monthlyChartData || []).forEach((item) => {
    const [year, month] = String(item?.month || "").split("-");
    const monthIndex = Number(month);

    if (year !== String(selectedYear) || !byMonth.has(monthIndex)) {
      return;
    }

    byMonth.set(monthIndex, {
      month: item.month,
      label: MONTH_LABELS[monthIndex - 1],
      entryFee: Number(item?.entryFee) || 0,
      penaltyCommission: Number(item?.penaltyCommission) || 0,
      totalMonthlyRevenue: Number(item?.totalMonthlyRevenue) || 0,
    });
  });

  return Array.from(byMonth.values());
}

function RevenueChart({ data }) {
  const chartWidth = 900;
  const chartHeight = 320;
  const padding = { top: 28, right: 24, bottom: 48, left: 68 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const maxValue = Math.max(
    1,
    ...data.map((item) => Math.max(item.totalMonthlyRevenue, item.entryFee)),
  );
  const roundedMax = Math.ceil(maxValue / 1000000) * 1000000 || 1;
  const barSlot = plotWidth / data.length;
  const scaleY = (value) =>
    padding.top + plotHeight - (value / roundedMax) * plotHeight;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: roundedMax * ratio,
    y: padding.top + plotHeight - plotHeight * ratio,
  }));

  return (
    <div className="wallet-chart-wrap">
      <svg
        className="wallet-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Monthly system wallet revenue chart"
      >
        {yTicks.map((tick) => (
          <g key={tick.value}>
            <line
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={tick.y}
              y2={tick.y}
              stroke="#e2efec"
              strokeWidth="1"
            />
            <text
              x={padding.left - 12}
              y={tick.y + 4}
              fill="#65817d"
              fontSize="12"
              textAnchor="end"
            >
              {formatCompactVnd(tick.value)}
            </text>
          </g>
        ))}

        {data.map((item, index) => {
          const groupCenter = padding.left + barSlot * index + barSlot / 2;
          const groupedBarWidth = Math.min(28, barSlot * 0.32);
          const gap = Math.min(8, barSlot * 0.1);
          const entryX = groupCenter - groupedBarWidth - gap / 2;
          const totalX = groupCenter + gap / 2;
          const entryHeight = ((item.entryFee || 0) / roundedMax) * plotHeight;
          const totalHeight =
            ((item.totalMonthlyRevenue || 0) / roundedMax) * plotHeight;
          const entryY = padding.top + plotHeight - entryHeight;
          const totalY = padding.top + plotHeight - totalHeight;

          return (
            <g key={item.month}>
              <rect
                x={entryX}
                y={entryY}
                width={groupedBarWidth}
                height={Math.max(entryHeight, item.entryFee ? 2 : 0)}
                rx="5"
                fill="#0f9f89"
              >
                <title>{`${item.label} entryFee: ${formatVnd(
                  item.entryFee,
                )} VND`}</title>
              </rect>
              <rect
                x={totalX}
                y={totalY}
                width={groupedBarWidth}
                height={Math.max(totalHeight, item.totalMonthlyRevenue ? 2 : 0)}
                rx="5"
                fill="#2563eb"
              >
                <title>{`${item.label} totalRevenue: ${formatVnd(
                  item.totalMonthlyRevenue,
                )} VND`}</title>
              </rect>
              <text
                x={groupCenter}
                y={chartHeight - 18}
                fill="#42625e"
                fontSize="12"
                fontWeight="700"
                textAnchor="middle"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminDashboard() {
  const currentYear = new Date().getFullYear();
  const [dashboard, setDashboard] = useState({
    adminStats: {
      totalUsers: 0,
      roles: {},
      accountStatuses: {},
      jockeyStatuses: {},
    },
    registrationStats: {
      totalRegistrations: 0,
      statuses: {},
    },
    tournamentStats: {
      totalTournaments: 0,
      statuses: {},
    },
    raceStats: {
      totalRaces: 0,
      statuses: {},
    },
    horseStats: {
      totalHorses: 0,
      statuses: {},
    },
    betStats: {
      totalBets: 0,
      statuses: {},
    },
    reportStats: {
      totalReports: 0,
      statuses: {},
    },
    raceCourses: [],
    upcomingRaces: [],
    walletOverview: null,
  });
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [
        adminStatsResult,
        horseStatsResult,
        betStatsResult,
        reportStatsResult,
        coursesResult,
        tournamentStatsResult,
        raceStatsResult,
        registrationStatsResult,
        walletResult,
        upcomingResult,
      ] = await Promise.allSettled([
        getAdminDashboardStats(),
        getAdminHorseStats(),
        getAdminBetStats(),
        getReportStatsAdmin(),
        getRaceCourses(),
        getAdminTournamentStats(),
        getAdminRaceStats(),
        getAdminRegistrationStats(),
        getSystemWalletOverview(),
        getUpcomingSchedule(),
      ]);

      const adminStats =
        adminStatsResult.status === "fulfilled" && adminStatsResult.value
          ? {
              totalUsers: Number(adminStatsResult.value?.totalUsers) || 0,
              roles: adminStatsResult.value?.roles || {},
              accountStatuses: adminStatsResult.value?.accountStatuses || {},
              jockeyStatuses: adminStatsResult.value?.jockeyStatuses || {},
            }
          : {
              totalUsers: 0,
              roles: {},
              accountStatuses: {},
              jockeyStatuses: {},
            };
      const horseStats =
        horseStatsResult.status === "fulfilled" && horseStatsResult.value
          ? {
              totalHorses: Number(horseStatsResult.value?.totalHorses) || 0,
              statuses: horseStatsResult.value?.statuses || {},
            }
          : {
              totalHorses: 0,
              statuses: {},
            };
      const betStats =
        betStatsResult.status === "fulfilled" && betStatsResult.value
          ? {
              totalBets: Number(betStatsResult.value?.totalBets) || 0,
              statuses: betStatsResult.value?.statuses || {},
            }
          : {
              totalBets: 0,
              statuses: {},
            };
      const reportStatuses =
        reportStatsResult.status === "fulfilled" && reportStatsResult.value
          ? toRecord(reportStatsResult.value)
          : {};
      const reportStats = {
        totalReports: Object.values(reportStatuses).reduce(
          (sum, count) => sum + (Number(count) || 0),
          0,
        ),
        statuses: reportStatuses,
      };
      const raceCourses =
        coursesResult.status === "fulfilled"
          ? resolveList(coursesResult.value)
          : [];
      const walletOverview =
        walletResult.status === "fulfilled"
          ? toRecord(walletResult.value)
          : null;
      const upcomingRaces =
        upcomingResult.status === "fulfilled"
          ? resolveList(upcomingResult.value)
          : [];
      const registrationStats =
        registrationStatsResult.status === "fulfilled" &&
        registrationStatsResult.value
          ? {
              totalRegistrations:
                Number(registrationStatsResult.value?.totalRegistrations) || 0,
              statuses: registrationStatsResult.value?.statuses || {},
            }
          : {
              totalRegistrations: 0,
              statuses: {},
            };
      const tournamentStats =
        tournamentStatsResult.status === "fulfilled" &&
        tournamentStatsResult.value
          ? {
              totalTournaments:
                Number(tournamentStatsResult.value?.totalTournaments) || 0,
              statuses: tournamentStatsResult.value?.statuses || {},
            }
          : {
              totalTournaments: 0,
              statuses: {},
            };
      const raceStats =
        raceStatsResult.status === "fulfilled" && raceStatsResult.value
          ? {
              totalRaces: Number(raceStatsResult.value?.totalRaces) || 0,
              statuses: raceStatsResult.value?.statuses || {},
            }
          : {
              totalRaces: 0,
              statuses: {},
            };
      const failedMainRequests = [
        adminStatsResult,
        horseStatsResult,
        betStatsResult,
        reportStatsResult,
        coursesResult,
        tournamentStatsResult,
        raceStatsResult,
        registrationStatsResult,
      ].filter((result) => result.status === "rejected").length;

      setDashboard({
        adminStats,
        registrationStats,
        tournamentStats,
        raceStats,
        horseStats,
        betStats,
        reportStats,
        raceCourses,
        upcomingRaces,
        walletOverview,
      });

      if (failedMainRequests > 0) {
        setErrorMessage(
          `${failedMainRequests} dashboard data source(s) could not be loaded.`,
        );
      }

      if (walletResult.status === "rejected") {
        setErrorMessage((message) =>
          message
            ? `${message} System wallet overview could not be loaded.`
            : "System wallet overview could not be loaded.",
        );
      }
    } catch (error) {
      setErrorMessage(error?.message || "Unable to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const availableYears = useMemo(() => {
    const years = new Set([String(currentYear)]);

    (dashboard.walletOverview?.monthlyChartData || []).forEach((item) => {
      const year = String(item?.month || "").split("-")[0];
      if (/^\d{4}$/.test(year)) years.add(year);
    });

    return Array.from(years)
      .sort((first, second) => Number(second) - Number(first))
      .map((year) => ({
        label: year,
        value: Number(year),
      }));
  }, [currentYear, dashboard.walletOverview]);

  useEffect(() => {
    if (!availableYears.some((year) => year.value === selectedYear)) {
      setSelectedYear(availableYears[0]?.value || currentYear);
    }
  }, [availableYears, currentYear, selectedYear]);

  const roleCounts = useMemo(() => {
    const counts = Object.fromEntries(ROLE_ORDER.map((role) => [role, 0]));

    Object.entries(toRecord(dashboard.adminStats.roles)).forEach(
      ([role, count]) => {
        const normalizedRole = normalizeRole(role);
        counts[normalizedRole] =
          (counts[normalizedRole] || 0) + (Number(count) || 0);
      },
    );

    return counts;
  }, [dashboard.adminStats.roles]);

  const totalUsers = dashboard.adminStats.totalUsers;
  const accountStatusEntries = Object.entries(
    toRecord(dashboard.adminStats.accountStatuses),
  );
  const jockeyStatusEntries = Object.entries(
    toRecord(dashboard.adminStats.jockeyStatuses),
  );
  const horseStatusEntries = Object.entries(
    toRecord(dashboard.horseStats.statuses),
  );
  const betStatusEntries = Object.entries(
    toRecord(dashboard.betStats.statuses),
  );
  const reportStatusEntries = Object.entries(
    toRecord(dashboard.reportStats.statuses),
  );
  const raceCourses = toArray(dashboard.raceCourses);
  const upcomingRaces = toArray(dashboard.upcomingRaces);
  const maxBetStatusCount = Math.max(
    1,
    ...betStatusEntries.map(([, count]) => Number(count) || 0),
  );
  const competitionCards = [
    {
      title: "Tournaments",
      value: dashboard.tournamentStats.totalTournaments,
      icon: <TrophyOutlined />,
      color: "#7c3aed",
      background: "#f4efff",
    },
    {
      title: "Races",
      value: dashboard.raceStats.totalRaces,
      icon: <FlagOutlined />,
      color: "#2563eb",
      background: "#edf4ff",
    },
    {
      title: "Registrations",
      value: dashboard.registrationStats.totalRegistrations,
      icon: <FileDoneOutlined />,
      color: "#087a6d",
      background: "#e8fff9",
    },
  ];

  const walletMonthlyData = useMemo(
    () => getMonthlyRevenueData(dashboard.walletOverview, selectedYear),
    [dashboard.walletOverview, selectedYear],
  );

  const yearlyWalletTotal = useMemo(
    () =>
      walletMonthlyData.reduce(
        (sum, item) => sum + item.totalMonthlyRevenue,
        0,
      ),
    [walletMonthlyData],
  );

  const summaryCards = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: <TeamOutlined />,
      color: "#087a6d",
      background: "#e8fff9",
    },
    {
      title: "Horses",
      value: dashboard.horseStats.totalHorses,
      icon: <TrophyOutlined />,
      color: "#b45309",
      background: "#fff8e6",
    },
    {
      title: "Bets",
      value: dashboard.betStats.totalBets,
      icon: <DollarOutlined />,
      color: "#d97706",
      background: "#fff8e6",
    },
    {
      title: "Reports",
      value: dashboard.reportStats.totalReports,
      icon: <WarningOutlined />,
      color: "#be123c",
      background: "#fff0f4",
    },
    {
      title: "Race Courses",
      value: raceCourses.length,
      icon: <EnvironmentOutlined />,
      color: "#be123c",
      background: "#fff0f4",
    },
  ];

  const upcomingRaceColumns = [
    {
      title: "Race",
      dataIndex: "raceName",
      key: "raceName",
      fixed: "left",
      width: 230,
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value || "Unnamed race"}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.tournamentName || "N/A"}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: formatDate,
    },
    {
      title: "Start",
      dataIndex: "startTime",
      key: "startTime",
      width: 90,
      render: formatTime,
    },
    {
      title: "Race Course",
      dataIndex: "raceCourseName",
      key: "raceCourseName",
      width: 220,
      render: (value) => value || "N/A",
    },
    {
      title: "Slots",
      key: "slots",
      width: 110,
      render: (_, record) =>
        `${record.filledSlots ?? 0}/${record.totalSlots ?? 0}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value) => (
        <Tag color={getRaceStatusColor(value)}>{value || "Unknown"}</Tag>
      ),
    },
  ];

  return (
    <section className="admin-dashboard">
      <style>{`
        .admin-dashboard {
          color: #0d2321;
        }

        .admin-dashboard-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .admin-dashboard-kicker {
          color: #087a6d;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 1.5px;
        }

        .admin-dashboard-title.ant-typography {
          margin: 5px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          font-weight: 950;
        }

        .admin-dashboard-refresh.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          background: #fff;
          font-weight: 850;
        }

        .admin-stat-card {
          height: 100%;
          border: 1px solid #ccefe7;
          border-radius: 12px;
          box-shadow: 0 14px 36px rgba(13, 70, 63, 0.07);
        }

        .admin-stat-card .ant-statistic-title {
          color: #52726e;
          font-weight: 800;
        }

        .admin-stat-card .ant-statistic-content {
          color: #06332e;
          font-weight: 950;
        }

        .admin-wallet-card .ant-statistic-content-value,
        .admin-wallet-card .ant-statistic-content-suffix {
          font-size: 23px;
        }

        .admin-stat-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          font-size: 20px;
        }

        .admin-dashboard-panel {
          height: 100%;
          border: 1px solid #ccefe7;
          border-radius: 12px;
          box-shadow: 0 14px 36px rgba(13, 70, 63, 0.06);
        }

        .admin-role-panel {
          height: auto;
        }

        .role-breakdown-row {
          display: grid;
          grid-template-columns: 120px 1fr 44px;
          align-items: center;
          gap: 14px;
          margin-top: 17px;
        }

        .role-breakdown-row strong {
          color: #244a46;
        }

        .account-health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 10px;
        }

        .status-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 9px;
        }

        .status-section-title strong {
          color: #06332e;
          font-size: 15px;
          font-weight: 900;
        }

        .user-status-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 20px;
        }

        .account-health-card {
          position: relative;
          overflow: hidden;
          min-height: 72px;
          padding: 10px 12px;
          border: 1px solid var(--status-border);
          border-radius: 10px;
          background: linear-gradient(135deg, var(--status-bg), #ffffff 76%);
          box-shadow: 0 8px 18px rgba(13, 70, 63, 0.04);
        }

        .account-health-card::before {
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: var(--status-color);
          content: "";
        }

        .account-health-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .account-health-icon {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: var(--status-color);
          background: rgba(255, 255, 255, 0.8);
          font-size: 14px;
        }

        .account-health-value {
          margin-top: 5px;
          color: #06332e;
          font-size: 22px;
          font-weight: 950;
          line-height: 1;
        }

        .account-health-name {
          margin-top: 3px;
          color: #456560;
          font-size: 12px;
          font-weight: 800;
        }

        .race-status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 18px;
        }

        .race-status-item {
          padding: 20px 12px;
          border-radius: 10px;
          background: #f3fffc;
          text-align: center;
        }

        .competition-overview-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .horse-overview {
          display: grid;
          grid-template-columns: minmax(180px, 240px) 1fr;
          gap: 22px;
          align-items: center;
        }

        .horse-donut-wrap {
          display: grid;
          place-items: center;
        }

        .horse-donut {
          width: 176px;
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: var(--horse-donut);
          box-shadow: inset 0 0 0 1px rgba(13, 70, 63, 0.06);
        }

        .horse-donut-center {
          width: 104px;
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 10px 28px rgba(13, 70, 63, 0.08);
          text-align: center;
        }

        .horse-donut-center strong {
          display: block;
          color: #06332e;
          font-size: 30px;
          font-weight: 950;
          line-height: 1;
        }

        .horse-donut-center span {
          display: block;
          margin-top: 5px;
          color: #52726e;
          font-size: 12px;
          font-weight: 850;
        }

        .horse-status-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 10px;
        }

        .horse-status-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 13px;
          border: 1px solid var(--horse-status-border);
          border-radius: 10px;
          background: var(--horse-status-bg);
        }

        .horse-status-name {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          color: #244a46;
          font-size: 13px;
          font-weight: 850;
        }

        .horse-status-dot {
          width: 9px;
          height: 9px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--horse-status-color);
        }

        .horse-status-count {
          color: #06332e;
          font-size: 18px;
          font-weight: 950;
        }

        .competition-overview-item {
          display: flex;
          align-items: center;
          gap: 14px;
          min-height: 82px;
          padding: 16px;
          border: 1px solid #ccefe7;
          border-radius: 10px;
          background: #fbfffe;
        }

        .competition-overview-icon {
          width: 42px;
          height: 42px;
          position: relative;
          display: block;
          flex: 0 0 auto;
          border-radius: 10px;
          color: var(--competition-color);
          background: var(--competition-bg);
          font-size: 20px;
          line-height: 1;
        }

        .competition-overview-icon .anticon {
          position: absolute;
          inset: 50% auto auto 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transform: translate(-50%, -50%);
        }

        .competition-overview-icon .anticon svg {
          display: block;
          width: 20px;
          height: 20px;
        }

        .bet-chart {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          min-height: 220px;
          align-items: end;
          padding: 16px 0 2px;
        }

        .bet-bar-item {
          display: grid;
          gap: 10px;
          justify-items: center;
          min-width: 0;
        }

        .bet-bar-track {
          width: min(48px, 100%);
          height: 140px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          border-radius: 12px;
          background: #edf5f3;
          overflow: hidden;
        }

        .bet-bar-fill {
          width: 100%;
          min-height: 8px;
          height: var(--bet-bar-height);
          border-radius: 12px 12px 0 0;
          background: var(--bet-color);
        }

        .bet-bar-value {
          color: #06332e;
          font-size: 24px;
          font-weight: 950;
          line-height: 1;
        }

        .bet-bar-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #456560;
          font-size: 12px;
          font-weight: 850;
          white-space: nowrap;
        }

        .bet-bar-dot {
          width: 8px;
          height: 8px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--bet-color);
        }

        .report-stack {
          display: grid;
          gap: 18px;
          min-height: 220px;
          align-content: center;
          padding: 18px 8px 6px;
        }

        .report-stack-total {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }

        .report-stack-total strong {
          color: #06332e;
          font-size: 34px;
          font-weight: 950;
          line-height: 1;
        }

        .report-stack-total span {
          color: #52726e;
          font-size: 13px;
          font-weight: 850;
        }

        .report-stack-bar {
          height: 22px;
          display: flex;
          overflow: hidden;
          border-radius: 999px;
          background: #edf5f3;
        }

        .report-stack-segment {
          width: var(--report-segment-width);
          min-width: var(--report-segment-min-width);
          background: var(--report-color);
        }

        .report-stack-legend {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
          gap: 10px;
        }

        .report-stack-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 12px;
          border: 1px solid var(--report-border);
          border-radius: 10px;
          background: var(--report-bg);
        }

        .report-stack-name {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          color: #244a46;
          font-size: 13px;
          font-weight: 850;
        }

        .report-stack-dot {
          width: 8px;
          height: 8px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--report-color);
        }

        .report-stack-count {
          color: #06332e;
          font-size: 18px;
          font-weight: 950;
        }

        .admin-bet-report-row {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
          gap: 20px;
        }

        .competition-overview-item strong {
          display: block;
          color: #06332e;
          font-size: 28px;
          font-weight: 950;
          line-height: 1;
        }

        .competition-overview-item span {
          display: block;
          margin-top: 5px;
          color: #456560;
          font-size: 13px;
          font-weight: 850;
        }

        .wallet-overview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
        }

        .wallet-overview-title {
          margin: 0;
          color: #06332e;
          font-size: 18px;
          font-weight: 900;
        }

        .wallet-year-select.ant-select {
          min-width: 112px;
        }

        .wallet-chart-wrap {
          width: 100%;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .wallet-chart {
          display: block;
          min-width: 720px;
          width: 100%;
          height: auto;
        }

        .wallet-chart-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 8px;
        }

        .wallet-chart-legend span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #456560;
          font-weight: 750;
        }

        .wallet-chart-legend i {
          width: 11px;
          height: 11px;
          border-radius: 999px;
        }

        .race-status-item strong {
          display: block;
          margin-bottom: 4px;
          color: #06332e;
          font-size: 28px;
        }

        @media (max-width: 640px) {
          .admin-dashboard-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .race-status-grid {
            grid-template-columns: 1fr;
          }
          .role-breakdown-row {
            grid-template-columns: 100px 1fr 36px;
          }
          .account-health-grid {
            grid-template-columns: 1fr;
          }
          .user-status-row {
            grid-template-columns: 1fr;
          }
          .horse-overview {
            grid-template-columns: 1fr;
          }
          .competition-overview-grid {
            grid-template-columns: 1fr;
          }
          .admin-bet-report-row {
            grid-template-columns: 1fr;
          }
          .wallet-overview-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <header className="admin-dashboard-header">
        <div>
          <div className="admin-dashboard-kicker">SYSTEM OVERVIEW</div>
          <Typography.Title level={1} className="admin-dashboard-title">
            Admin Dashboard
          </Typography.Title>
          <Typography.Text type="secondary">
            Live statistics across the GoldenHoof platform
          </Typography.Text>
        </div>
        <Button
          className="admin-dashboard-refresh"
          loading={isLoading}
          onClick={loadDashboard}
        >
          Refresh
        </Button>
      </header>

      {errorMessage ? (
        <Alert
          type="warning"
          showIcon
          message={errorMessage}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      {isLoading ? (
        <Card className="admin-dashboard-panel">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      ) : (
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Row gutter={[20, 20]}>
            <Col xs={24}>
              <Card className="admin-dashboard-panel" title="System Wallet">
                <Space direction="vertical" size={18} style={{ width: "100%" }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12} xl={6}>
                      <Card className="admin-stat-card admin-wallet-card">
                        <Statistic
                          title="Balance"
                          value={dashboard.walletOverview?.balance || 0}
                          formatter={(value) => `${formatVnd(value)} VND`}
                          prefix={<WalletOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} md={12} xl={6}>
                      <Card className="admin-stat-card admin-wallet-card">
                        <Statistic
                          title="Total Revenue"
                          value={dashboard.walletOverview?.totalRevenue || 0}
                          formatter={(value) => `${formatVnd(value)} VND`}
                          prefix={<FundOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} md={12} xl={6}>
                      <Card className="admin-stat-card admin-wallet-card">
                        <Statistic
                          title="Entry Fee Revenue"
                          value={
                            dashboard.walletOverview?.revenueBreakdown
                              ?.entryFeeRevenue || 0
                          }
                          formatter={(value) => `${formatVnd(value)} VND`}
                          prefix={<DollarOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} md={12} xl={6}>
                      <Card className="admin-stat-card admin-wallet-card">
                        <Statistic
                          title="Penalty Commission Count"
                          value={
                            dashboard.walletOverview?.revenueBreakdown
                              ?.penaltyCommissionRevenue || 0
                          }
                          formatter={(value) => `${formatVnd(value)} `}
                          prefix={<WarningOutlined />}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <div>
                    <div className="wallet-overview-header">
                      <div>
                        <h2 className="wallet-overview-title">
                          Monthly Revenue in {selectedYear}
                        </h2>
                        <Typography.Text type="secondary">
                          Year total: {formatVnd(yearlyWalletTotal)} VND
                        </Typography.Text>
                      </div>
                      <Select
                        className="wallet-year-select"
                        options={availableYears}
                        value={selectedYear}
                        onChange={setSelectedYear}
                        size="small"
                      />
                    </div>

                    <RevenueChart data={walletMonthlyData} />
                    <div className="wallet-chart-legend">
                      <span>
                        <i style={{ background: "#0f9f89" }} />
                        Entry fee
                      </span>
                      <span>
                        <i style={{ background: "#2563eb" }} />
                        Total revenue
                      </span>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24}>
              <Card
                className="admin-dashboard-panel admin-role-panel"
                title="Users by Role"
                extra={<Tag color="green">{totalUsers} accounts</Tag>}
              >
                {ROLE_ORDER.map((role) => {
                  const count = roleCounts[role];
                  const percent = totalUsers
                    ? Math.round((count / totalUsers) * 100)
                    : 0;

                  return (
                    <div className="role-breakdown-row" key={role}>
                      <strong>{role}</strong>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor={ROLE_COLORS[role]}
                        trailColor="#edf5f3"
                      />
                      <Typography.Text strong>{count}</Typography.Text>
                    </div>
                  );
                })}

                <div className="user-status-row">
                  <div>
                    <div className="status-section-title">
                      <strong>Account Status</strong>
                    </div>
                    <div className="account-health-grid">
                      {accountStatusEntries.length ? (
                        accountStatusEntries.map(([status, count]) => {
                          const numericCount = Number(count) || 0;
                          const meta = getAccountStatusMeta(status);

                          return (
                            <div
                              className="account-health-card"
                              key={status}
                              style={{
                                "--status-bg": meta.background,
                                "--status-border": meta.border,
                                "--status-color": meta.color,
                              }}
                            >
                              <div className="account-health-top">
                                <span className="account-health-icon">
                                  {meta.icon}
                                </span>
                              </div>
                              <div className="account-health-value">
                                {numericCount}
                              </div>
                              <div className="account-health-name">
                                {formatStatusLabel(status)}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <Typography.Text type="secondary">
                          No account status data
                        </Typography.Text>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="status-section-title">
                      <strong>Jockey Status</strong>
                    </div>
                    <div className="account-health-grid">
                      {jockeyStatusEntries.length ? (
                        jockeyStatusEntries.map(([status, count]) => {
                          const numericCount = Number(count) || 0;
                          const meta = getJockeyStatusMeta(status);

                          return (
                            <div
                              className="account-health-card"
                              key={status}
                              style={{
                                "--status-bg": meta.background,
                                "--status-border": meta.border,
                                "--status-color": meta.color,
                              }}
                            >
                              <div className="account-health-top">
                                <span className="account-health-icon">
                                  <TeamOutlined />
                                </span>
                              </div>
                              <div className="account-health-value">
                                {numericCount}
                              </div>
                              <div className="account-health-name">
                                {formatStatusLabel(status)}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <Typography.Text type="secondary">
                          No jockey status data
                        </Typography.Text>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                className="admin-dashboard-panel"
                title="Horses"
                extra={
                  <Tag color="gold">
                    {dashboard.horseStats.totalHorses} total
                  </Tag>
                }
              >
                <div
                  className="horse-overview"
                  style={{
                    "--horse-donut": getStatusDonutGradient(
                      horseStatusEntries,
                      dashboard.horseStats.totalHorses,
                    ),
                  }}
                >
                  <div className="horse-donut-wrap">
                    <div className="horse-donut">
                      <div className="horse-donut-center">
                        <div>
                          <strong>{dashboard.horseStats.totalHorses}</strong>
                          <span>Horses</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {horseStatusEntries.length ? (
                    <div className="horse-status-list">
                      {horseStatusEntries.map(([status, count]) => {
                        const numericCount = Number(count) || 0;
                        const meta = getHorseStatusMeta(status);

                        return (
                          <div
                            className="horse-status-row"
                            key={status}
                            style={{
                              "--horse-status-bg": meta.background,
                              "--horse-status-border": meta.border,
                              "--horse-status-color": meta.color,
                            }}
                          >
                            <span className="horse-status-name">
                              <span className="horse-status-dot" />
                              {formatStatusLabel(status)}
                            </span>
                            <span className="horse-status-count">
                              {numericCount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Typography.Text type="secondary">
                      No horse status data
                    </Typography.Text>
                  )}
                </div>
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                className="admin-dashboard-panel"
                title="Competition Overview"
              >
                <div className="competition-overview-grid">
                  {competitionCards.map((item) => (
                    <div
                      className="competition-overview-item"
                      key={item.title}
                      style={{
                        "--competition-bg": item.background,
                        "--competition-color": item.color,
                      }}
                    >
                      <span className="competition-overview-icon">
                        {item.icon}
                      </span>
                      <div>
                        <strong>{item.value}</strong>
                        <span>{item.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>

            <Col xs={24}>
              <div className="admin-bet-report-row">
                <Card
                  className="admin-dashboard-panel"
                  title="Bets"
                  extra={
                    <Tag color="gold">{dashboard.betStats.totalBets} total</Tag>
                  }
                >
                  <div className="bet-chart">
                    {betStatusEntries.length ? (
                      betStatusEntries.map(([status, count]) => {
                        const numericCount = Number(count) || 0;
                        const meta = getBetStatusMeta(status);
                        const barHeight = Math.max(
                          8,
                          Math.round((numericCount / maxBetStatusCount) * 100),
                        );

                        return (
                          <div
                            className="bet-bar-item"
                            key={status}
                            style={{
                              "--bet-color": meta.color,
                              "--bet-bar-height": `${barHeight}%`,
                            }}
                          >
                            <div className="bet-bar-value">{numericCount}</div>
                            <div className="bet-bar-track">
                              <div className="bet-bar-fill" />
                            </div>
                            <div className="bet-bar-label">
                              <span className="bet-bar-dot" />
                              {formatStatusLabel(status)}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <Typography.Text type="secondary">
                        No bet status data
                      </Typography.Text>
                    )}
                  </div>
                </Card>

                <Card
                  className="admin-dashboard-panel"
                  title="Reports"
                  extra={
                    <Tag color="red">
                      {dashboard.reportStats.totalReports} total
                    </Tag>
                  }
                >
                  <div className="report-stack">
                    {reportStatusEntries.length ? (
                      <>
                        <div className="report-stack-total">
                          <div>
                            <strong>
                              {dashboard.reportStats.totalReports}
                            </strong>
                            <span>Reports</span>
                          </div>
                          <Tag color="orange">Status mix</Tag>
                        </div>
                        <div className="report-stack-bar">
                          {reportStatusEntries.map(([status, count]) => {
                            const numericCount = Number(count) || 0;
                            const meta = getReportStatusMeta(status);
                            const percent = dashboard.reportStats.totalReports
                              ? (numericCount /
                                  dashboard.reportStats.totalReports) *
                                100
                              : 0;

                            return (
                              <span
                                className="report-stack-segment"
                                key={status}
                                style={{
                                  "--report-color": meta.color,
                                  "--report-segment-width": `${percent}%`,
                                  "--report-segment-min-width": numericCount
                                    ? "8px"
                                    : "0",
                                }}
                                title={`${formatStatusLabel(
                                  status,
                                )}: ${numericCount}`}
                              />
                            );
                          })}
                        </div>
                        <div className="report-stack-legend">
                          {reportStatusEntries.map(([status, count]) => {
                            const numericCount = Number(count) || 0;
                            const meta = getReportStatusMeta(status);

                            return (
                              <div
                                className="report-stack-item"
                                key={status}
                                style={{
                                  "--report-bg": meta.background,
                                  "--report-border": meta.border,
                                  "--report-color": meta.color,
                                }}
                              >
                                <span className="report-stack-name">
                                  <span className="report-stack-dot" />
                                  {formatStatusLabel(status)}
                                </span>
                                <span className="report-stack-count">
                                  {numericCount}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <Typography.Text type="secondary">
                        No report status data
                      </Typography.Text>
                    )}
                  </div>
                </Card>
              </div>
            </Col>

            <Col xs={24}>
              <Card
                className="admin-dashboard-panel"
                title="Upcoming Races"
                extra={<Tag color="cyan">{upcomingRaces.length} races</Tag>}
              >
                <Table
                  columns={upcomingRaceColumns}
                  dataSource={upcomingRaces}
                  rowKey={(record, index) =>
                    record.raceId || record._id || record.id || `race-${index}`
                  }
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: 870 }}
                  size="middle"
                />
              </Card>
            </Col>
          </Row>
        </Space>
      )}
    </section>
  );
}
