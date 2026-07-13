import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import RoleLayout from "../layouts/RoleLayout";
import Home from "../pages/Home";
import JockeyProfile from "../pages/JockeyProfile";
import Landing from "../pages/Landing";
import Profile from "../pages/Profile";
import UserManagement from "../pages/admin/UserManagement";
import AdminDashboard from "../pages/admin/AdminDashboard";
import TournamentManagement from "../pages/admin/TournamentManagement";
import RegistrationManagement from "../pages/admin/RegistrationManagement";
import RaceManagement from "../pages/admin/RaceManagement";
import RaceCourseManagement from "../pages/admin/RaceCourseManagement";
import Prize from "../pages/admin/Prize";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ProtectedRoute from "../pages/auth/components/ProtectedRoute";
import JockeyDashboard from "../pages/jockey/JockeyDashboard";
import JockeyInvitations from "../pages/jockey/JockeyInvitations";
import JockeyLicenseSubmit from "../pages/jockey/JockeyLicenseSubmit";
import JockeyRaceSchedule from "../pages/jockey/JockeyRaceSchedule";
import OwnerDashboard from "../pages/owner/OwnerDashboard";
import OwnerHorseRegister from "../pages/owner/OwnerHorseRegister";
import OwnerHorses from "../pages/owner/OwnerHorses";
import OwnerJockeyRaceWorkspace from "../pages/owner/OwnerJockeyRaceWorkspace";
import OwnerRaceResults from "../pages/owner/OwnerRaceResults";
import OwnerTournaments from "../pages/owner/OwnerTournaments";
import RefereeDashboard from "../pages/referee/RefereeDashboard";
import RefereeRaceDetail from "../pages/referee/RefereeRaceDetail";
import RefereeTournamentList from "../pages/referee/RefereeTournamentList";
import RoleHome from "../pages/RoleHome";
import OAuthSuccess from "../pages/auth/OAuthSuccess";
import ForgotPassword from "../pages/auth/ForgotPassword";
import JockeyLicenseManagement from "../pages/admin/JockeyLicenseManagement";
import RewardManagement from "../pages/admin/RewardManagement";
import SpectatorRewards from "../pages/spectator/SpectatorReward";
import PointsTransactionHistory from "../pages/spectator/PointsTransaction";
import SpectatorBetting from "../pages/spectator/SpectatorBetting";
import NotificationHistory from "../pages/NotificationPage";
import MoneyTransactionHistory from "../pages/MoneyTransaction";
import Wallet from "../pages/Wallet";
import PaymentResult from "../pages/PaymentResult";
import Broadcast from "../pages/spectator/Broadcast";
import LiveRaceChannels from "../pages/spectator/LiveRaceChannels";
import AllHorses from "../pages/AllHorses";
import AllJockeys from "../pages/AllJockeys";
import AllRaceResults from "../pages/AllRaceResults";
import { getAuthSession } from "../utils/storage";
import AdminWithdrawalManagement from "../pages/admin/AdminWithdrawalManagement";
import AdminBetManagement from "../pages/admin/AdminBetManagement";
import BettingHistory from "../pages/spectator/BettingHistory";
import AdminReportManagement from "../pages/admin/AdminReportManagement";
import ReportPage from "../pages/ReportPage";

const OWNER_NAV = [
  { key: "owner-dashboard", to: "/owner", label: "Dashboard" },
  { key: "owner-horses", to: "/owner/horses", label: "My horses" },
  {
    key: "owner-register-horse",
    to: "/owner/horses/register",
    label: "Register horse",
  },
  {
    key: "owner-jockey-races",
    to: "/owner/jockey-races",
    label: "Jockey & entries",
  },
  { key: "owner-tournaments", to: "/owner/tournaments", label: "Tournaments" },
  { key: "owner-results", to: "/owner/race-results", label: "Race results" },
];

const REFEREE_NAV = [
  {
    key: "referee-dashboard",
    to: "/referee",
    label: "Assigned Races",
  },

  {
    key: "referee-tournaments",
    to: "/referee/tournaments",
    label: "Tournaments",
  },
];

const JOCKEY_NAV = [
  { key: "jockey-dashboard", to: "/jockey", label: "Dashboard" },
  {
    key: "jockey-invitations",
    to: "/jockey/invitations",
    label: "Invitations",
  },
  { key: "jockey-license", to: "/jockey/license", label: "My license" },
  { key: "jockey-schedule", to: "/jockey/schedule", label: "My race schedule" },
];

function AdminUsersPage() {
  return (
    <AdminLayout>
      <UserManagement />
      <JockeyLicenseManagement />
    </AdminLayout>
  );
}

function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}

function AdminTournamentsPage() {
  return (
    <AdminLayout>
      <TournamentManagement />
    </AdminLayout>
  );
}

function AdminRegistrationsPage() {
  return (
    <AdminLayout>
      <RegistrationManagement />
    </AdminLayout>
  );
}

function AdminRacesPage() {
  return (
    <AdminLayout>
      <RaceManagement />
    </AdminLayout>
  );
}

function AdminRaceCoursesPage() {
  return (
    <AdminLayout>
      <RaceCourseManagement />
    </AdminLayout>
  );
}

function AdminPrizePage() {
  return (
    <AdminLayout>
      <Prize />
    </AdminLayout>
  );
}

function LandingRoute() {
  return getAuthSession() ? <Navigate to="/home" replace /> : <Landing />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRoute />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/horses" element={<AllHorses />} />
        <Route path="/jockeys" element={<AllJockeys />} />
        <Route path="/race-results" element={<AllRaceResults />} />
        <Route path="/spectator/broadcast" element={<LiveRaceChannels />} />
        <Route path="/spectator/broadcast/:raceId" element={<Broadcast />} />
        <Route path="notification" element={<NotificationHistory />} />
        <Route path="report" element={<ReportPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Spectator"]} />}>
        <Route path="/spectator" element={<Navigate to="/profile" replace />} />
        <Route
          path="/spectator/reward"
          element={<SpectatorRewards allowedRole="Spectator" />}
        />
        <Route
          path="/spectator/points-transaction"
          element={<PointsTransactionHistory allowedRole="Spectator" />}
        />
        <Route path="/spectator/bets" element={<SpectatorBetting />} />

        <Route
          path="/spectator/bet-history"
          element={<BettingHistory allowedRole="Spectator" />}
        />
        <Route path="/spectator/bets" element={<SpectatorBetting />} />
      </Route>

      <Route
        element={<ProtectedRoute allowedRoles={["Horse Owner", "Jockey"]} />}
      >
        <Route
          path="/money-transaction"
          element={<MoneyTransactionHistory />}
        />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/payment-result" element={<PaymentResult />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route
          path="/admin/users"
          element={
            <AdminLayout>
              <UserManagement />
            </AdminLayout>
          }
        />
        <Route path="/admin/tournaments" element={<AdminTournamentsPage />} />
        <Route
          path="/admin/registrations"
          element={<AdminRegistrationsPage />}
        />
        <Route path="/admin/races" element={<AdminRacesPage />} />
        <Route path="/admin/raceCourse" element={<AdminRaceCoursesPage />} />
        <Route path="/admin/prize" element={<AdminPrizePage />} />

        <Route
          path="/admin/jockey-license"
          element={
            <AdminLayout>
              <JockeyLicenseManagement />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/reward"
          element={
            <AdminLayout>
              <RewardManagement />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/tournaments"
          element={
            <AdminLayout>
              <TournamentManagement />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/registrations"
          element={
            <AdminLayout>
              <RegistrationManagement />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/withdrawal"
          element={
            <AdminLayout>
              <AdminWithdrawalManagement />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/bet"
          element={
            <AdminLayout>
              <AdminBetManagement />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/report"
          element={
            <AdminLayout>
              <AdminReportManagement />
            </AdminLayout>
          }
        />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Horse Owner"]} />}>
        <Route
          element={
            <RoleLayout
              role="Horse Owner"
              title="Owner workspace"
              subtitle="Manage your stable and horses"
              navItems={OWNER_NAV}
            />
          }
        >
          <Route path="owner" element={<OwnerDashboard />} />
          <Route path="owner/horses" element={<OwnerHorses />} />
          <Route
            path="owner/horses/register"
            element={<OwnerHorseRegister />}
          />
          <Route
            path="owner/jockey-races"
            element={<OwnerJockeyRaceWorkspace />}
          />
          <Route path="owner/tournaments" element={<OwnerTournaments />} />
          <Route path="owner/race-results" element={<OwnerRaceResults />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Referee"]} />}>
        <Route
          element={
            <RoleLayout
              role="Referee"
              title="Referee workspace"
              subtitle="Review races and manage results"
              navItems={REFEREE_NAV}
            />
          }
        >
          <Route path="referee" element={<RefereeDashboard />} />
          <Route
            path="referee/tournaments"
            element={<RefereeTournamentList />}
          />

          <Route path="referee/races/:id" element={<RefereeRaceDetail />} />

          <Route
            path="referee/races/:id/results"
            element={<RefereeResultReview />}
          />

          <Route
            path="referee/races/:id/final"
            element={<RefereeFinalResults />}
          />

          <Route path="referee/horses/:id" element={<RefereeHorseDetail />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Jockey"]} />}>
        <Route
          element={
            <RoleLayout
              role="Jockey"
              title="Jockey workspace"
              subtitle="Manage invitations, assignments, and race performance"
              navItems={JOCKEY_NAV}
            />
          }
        >
          <Route path="/jockey" element={<JockeyDashboard />} />
          <Route path="/jockey/invitations" element={<JockeyInvitations />} />
          <Route path="/jockey/license" element={<JockeyLicenseSubmit />} />
          <Route path="/jockey/schedule" element={<JockeyRaceSchedule />} />
        </Route>

        <Route path="/jockey/profile" element={<JockeyProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
