import { apiClient } from "../client";
import { HORSE_ENDPOINTS } from "../endpoints/horse.endpoint";

function unwrapData(response) {
  const data = response?.data;

  return data?.data || data?.result || data?.horse || data;
}

function unwrapCollection(response) {
  const data = unwrapData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.horses)) return data.horses;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

function authConfig() {
  return { includeAuth: true };
}

export async function createHorse(payload) {
  const response = await apiClient.post(HORSE_ENDPOINTS.ROOT, payload, authConfig());

  return unwrapData(response);
}

export async function getHorses(params = {}) {
  const response = await apiClient.get(
    HORSE_ENDPOINTS.ROOT,
    {
      ...authConfig(),
      params,
    },
  );

  return unwrapCollection(response);
}

export async function getAdminHorseStats() {
  const response = await apiClient.get(
    HORSE_ENDPOINTS.ADMIN_DASHBOARD_STATS,
    authConfig(),
  );

  return unwrapData(response);
}

export async function getMyHorses(params = {}) {
  const response = await apiClient.get(
    HORSE_ENDPOINTS.MY_HORSES,
    {
      ...authConfig(),
      params,
    },
  );

  return unwrapCollection(response);
}

export async function getHorseById(id) {
  const response = await apiClient.get(HORSE_ENDPOINTS.DETAIL(id), authConfig());

  return unwrapData(response);
}

export async function updateHorse(id, payload) {
  const response = await apiClient.put(HORSE_ENDPOINTS.DETAIL(id), payload, authConfig());

  return unwrapData(response);
}

export async function uploadHorseAvatar(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post(HORSE_ENDPOINTS.UPLOAD_AVATAR, formData, {
    includeAuth: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return unwrapData(response);
}

export async function deleteHorse(id) {
  const response = await apiClient.delete(HORSE_ENDPOINTS.DETAIL(id), authConfig());

  return unwrapData(response);
}
