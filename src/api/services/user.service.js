import { apiClient } from "../client";
import { USER_ENDPOINTS } from "../endpoints/user.endpoint";

function unwrapData(response) {
  const data = response?.data;

  return data?.data || data?.result || data?.user || data;
}

function unwrapCollection(response) {
  const data = unwrapData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

export async function createUser(payload) {
  const response = await apiClient.post(USER_ENDPOINTS.ROOT, payload);
  return response.data;
}

export async function getUsers() {
  const response = await apiClient.get(USER_ENDPOINTS.ROOT, {
    includeAuth: true,
  });

  return response.data;
}

export async function getAdminDashboardStats() {
  const response = await apiClient.get(USER_ENDPOINTS.ADMIN_DASHBOARD_STATS, {
    includeAuth: true,
  });

  return unwrapData(response);
}

export async function getUserById(id) {
  const response = await apiClient.get(USER_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });

  return unwrapData(response);
}

export async function searchUsersByName(fullName) {
  const response = await apiClient.get(USER_ENDPOINTS.SEARCH, {
    includeAuth: true,
    params: {
      fullName: fullName,
    },
  });

  return response.data;
}

// export async function getUsersByRole(role) {
//   const response = await apiClient.get(USER_ENDPOINTS.BY_ROLE, {
//     includeAuth: true,
//     params: { role },
//   });

//   return unwrapCollection(response);
// }

export async function getUsersByRole(role, jockeyStatus, status) {
  const params = {};

  if (role) {
    params.role = role;
  }

  if (role === "Jockey" && jockeyStatus) {
    params.jockeyStatus = jockeyStatus;
  }

  if (status) {
    params.status = status;
  }

  const response = await apiClient.get(USER_ENDPOINTS.BY_ROLE, {
    includeAuth: true,
    params,
  });

  return unwrapCollection(response);
}

export async function getJockeysWithLicenses(jockeyStatus = "") {
  const params = { role: "Jockey" };
  if (jockeyStatus) {
    params.jockeyStatus = jockeyStatus;
  }

  const response = await apiClient.get(USER_ENDPOINTS.BY_ROLE, {
    includeAuth: true,
    params,
  });

  return unwrapCollection(response);
}

export async function getAvailableJockeys() {
  const response = await apiClient.get(USER_ENDPOINTS.BY_ROLE, {
    includeAuth: true,
    params: {
      role: "Jockey",
      jockeyStatus: "Available",
    },
  });

  const jockeys = unwrapCollection(response);

  return jockeys.filter((jockey) => jockey?.jockeyStatus === "Available");
}

export async function updateAccountStatus(id, accountStatus) {
  const response = await apiClient.patch(
    USER_ENDPOINTS.UPDATE_STATUS(id),
    { accountStatus }, // Body gửi lên khớp định dạng { "accountStatus": "..." }
    { includeAuth: true },
  );
  return response.data;
}

export async function deleteUser(id) {
  const response = await apiClient.delete(USER_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });

  return response.data;
}

export async function updateUser(id, payload) {
  const response = await apiClient.put(USER_ENDPOINTS.DETAIL(id), payload, {
    includeAuth: true,
  });

  return response.data;
}

export async function updateSpectator(id, payload) {
  const response = await apiClient.put(
    USER_ENDPOINTS.UPDATE_SPECTATOR(id),
    payload,
    {
      includeAuth: true,
    },
  );

  return response.data;
}

export async function updateJockey(id, payload) {
  const response = await apiClient.put(
    USER_ENDPOINTS.UPDATE_JOCKEY(id),
    payload,
    {
      includeAuth: true,
    },
  );

  return response.data;
}

export async function updateHorseOwner(id, payload) {
  const response = await apiClient.put(
    USER_ENDPOINTS.UPDATE_HORSE_OWNER(id),
    payload,
    {
      includeAuth: true,
    },
  );

  return response.data;
}

export async function updateReferee(id, payload) {
  const response = await apiClient.put(
    USER_ENDPOINTS.UPDATE_REFEREE(id),
    payload,
    {
      includeAuth: true,
    },
  );

  return response.data;
}

export async function updateUserAccount(id, role, payload) {
  let endpoint;

  // Chuẩn hóa chuỗi role về dạng viết thường để kiểm tra chuẩn xác
  const userRole = role?.toLowerCase();

  switch (userRole) {
    case "spectator":
      endpoint = USER_ENDPOINTS.UPDATE_SPECTATOR(id);
      break;
    case "jockey":
      endpoint = USER_ENDPOINTS.UPDATE_JOCKEY(id);
      break;
    case "referee":
      endpoint = USER_ENDPOINTS.UPDATE_REFEREE(id);
      break;
    case "horseowner":
    case "horse owner":
    case "horse-owner":
    case "horse_owner":
      endpoint = USER_ENDPOINTS.UPDATE_HORSE_OWNER(id);
      break;
    default:
      // Trường hợp không khớp role đặc thù nào, fallback về route cơ bản (nếu sau này có dùng)
      endpoint = USER_ENDPOINTS.DETAIL(id);
  }

  const response = await apiClient.put(endpoint, payload, {
    includeAuth: true,
  });

  return response.data;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(
    USER_ENDPOINTS.UPLOAD_AVATAR,
    formData,
    {
      includeAuth: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function changePassword(payload) {
  const response = await apiClient.put(
    USER_ENDPOINTS.CHANGE_PASSWORD,
    payload,
    {
      includeAuth: true,
    },
  );

  return response.data;
}

export async function adjustSpectatorPoints(userId, amount) {
  const response = await apiClient.patch(
    USER_ENDPOINTS.ADJUST_SPECTATOR_POINTS(userId),
    { amount },
    { includeAuth: true },
  );

  return response.data;
}

export async function adjustJockeyReputation(userId, amount) {
  const response = await apiClient.patch(
    USER_ENDPOINTS.ADJUST_JOCKEY_REPUTATION(userId),
    { amount },
    { includeAuth: true },
  );

  return response.data;
}

export async function adjustHorseOwnerReputation(userId, amount) {
  const response = await apiClient.patch(
    USER_ENDPOINTS.ADJUST_HORSE_OWNER_REPUTATION(userId),
    { amount },
    { includeAuth: true },
  );

  return response.data;
}

export async function searchJockeys(params) {
  const response = await apiClient.get(
    USER_ENDPOINTS.SEARCH_JOCKEY_BY_NAME,
    {
      includeAuth: true,
      params,
    }
  );

  return unwrapCollection(response);
}