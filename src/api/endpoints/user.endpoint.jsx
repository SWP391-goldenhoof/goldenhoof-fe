export const USER_ENDPOINTS = {
  ROOT: "/users",
  ADMIN_DASHBOARD_STATS: "/users/admin/dashboard/stats",
  DETAIL: (id) => `/users/${id}`,
  UPDATE_SPECTATOR: (id) => `/users/spectator/${id}`,
  UPDATE_JOCKEY: (id) => `/users/jockey/${id}`,
  UPDATE_HORSE_OWNER: (id) => `/users/horse-owner/${id}`,
  UPDATE_REFEREE: (id) => `/users/referee/${id}`,
  SEARCH: "/users/search/by-name",
  BY_ROLE: "/users/role",
  UPLOAD_AVATAR: "/upload/avatar",
  CHANGE_PASSWORD: "/users/change-password",
  UPDATE_STATUS: (id) => `/users/${id}/status`,
  ADJUST_SPECTATOR_POINTS: (id) => `/users/spectator/${id}/adjust-points`,
  ADJUST_JOCKEY_REPUTATION: (id) => `/users/jockey/${id}/adjust-reputation`,
  ADJUST_HORSE_OWNER_REPUTATION: (id) =>
    `/users/horse-owner/${id}/adjust-reputation`,
  SEARCH_JOCKEY_BY_NAME: "/users/search/jockey/by-name",
};
