import { apiClient } from "../client";
import { REWARD_ENDPOINTS } from "../endpoints/reward.endpoint";

function unwrapData(response) {
  const data = response?.data;
  return data?.data || data?.result || data?.reward || data;
}

function unwrapCollection(response) {
  const data = unwrapData(response);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.rewards)) return data.rewards;
  return [];
}

export async function createReward(payload) {
  const response = await apiClient.post(REWARD_ENDPOINTS.ROOT, payload, {
    includeAuth: true,
  });
  return response.data;
}

export async function getRewards(rewardType, conditionType) {
  const response = await apiClient.get(REWARD_ENDPOINTS.ROOT, {
    includeAuth: true,
    params: {
      ...(conditionType ? { conditionType } : {}),
      ...(rewardType ? { rewardType } : {}),
    },
  });
  return response.data;
}

export async function getRewardById(id) {
  const response = await apiClient.get(REWARD_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });
  return response.data;
}

export async function getRewardsDashboard() {
  const response = await apiClient.get(REWARD_ENDPOINTS.DASHBOARD, {
    includeAuth: true,
  });
  return response.data;
}

export async function getMyAssets() {
  const response = await apiClient.get(REWARD_ENDPOINTS.MY_ASSETS, {
    includeAuth: true,
  });
  return response.data;
}

export async function claimReward(rewardId) {
  const response = await apiClient.post(
    REWARD_ENDPOINTS.CLAIM(rewardId),
    {},
    { includeAuth: true },
  );
  return response.data;
}

export async function updateReward(id, payload) {
  const response = await apiClient.put(REWARD_ENDPOINTS.DETAIL(id), payload, {
    includeAuth: true,
  });
  return response.data;
}

export async function deleteReward(id) {
  const response = await apiClient.delete(REWARD_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });
  return response.data;
}
