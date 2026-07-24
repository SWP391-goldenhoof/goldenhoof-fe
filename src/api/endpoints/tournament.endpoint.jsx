export const TOURNAMENT_ENDPOINTS = {
  ROOT: "/tournaments",
  ADMIN_DASHBOARD_STATS: "/tournaments/admin/dashboard/stats",

  DETAIL: (id) => `/tournaments/${id}`,

  STATUS: (id) => `/tournaments/${id}/status`,

  ADVANCEMENTS: (id) => `/tournaments/${id}/advancements`,

  RESULTS: (id) => `/tournaments/${id}/results`,

  UPLOAD_BANNER: "/upload/tournament-banner",
  PARTICIPANTS: (tournamentId) =>
    `/tournaments/${tournamentId}/participants`,
};
