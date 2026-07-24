import { apiClient } from "../client";
import { BET_ENDPOINTS } from "../endpoints/bet.endpoint";

function unwrapData(response) {
  const data = response?.data;

  if (data?.data !== undefined) return data.data;
  if (data?.bet !== undefined) return data.bet;
  if (data?.user !== undefined) return data.user;
  if (data?.result && typeof data.result === "object") return data.result;

  return data;
}

export async function createBet(payload) {
  const response = await apiClient.post(BET_ENDPOINTS.ROOT, payload, {
    includeAuth: true,
  });

  return unwrapData(response);
}

export async function getAllBets({ result } = {}) {
  const response = await apiClient.get(BET_ENDPOINTS.ROOT, {
    includeAuth: true,
    params: {
      ...(result ? { result } : {}),
    },
  });

  return unwrapData(response);
}

export async function getAdminBetStats() {
  const response = await apiClient.get(BET_ENDPOINTS.ADMIN_DASHBOARD_STATS, {
    includeAuth: true,
  });

  return unwrapData(response);
}

// 3. API Lấy toàn bộ các bet đặt cược của tài khoản hiện tại
export async function getMyBets(params = {}) {
  const response = await apiClient.get(
    BET_ENDPOINTS.MY_BET,
    {
      includeAuth: true,
      params,
    },
  );

  return unwrapData(response);
}

export async function getBetDetail(id) {
  const response = await apiClient.get(BET_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });

  return unwrapData(response);
}

export async function updateBet(id, payload) {
  const response = await apiClient.patch(BET_ENDPOINTS.DETAIL(id), payload, {
    includeAuth: true,
  });

  return unwrapData(response);
}
