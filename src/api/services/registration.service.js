import { apiClient } from "../client";
import { REGISTRATION_ENDPOINTS } from "../endpoints/registration.endpoint";

function unwrapData(response) {
  const data = response?.data;

  return data?.data || data?.result || data?.registration || data;
}

export async function createRegistration(payload) {
  const response = await apiClient.post(REGISTRATION_ENDPOINTS.CREATE, payload, {
    includeAuth: true,
  });

  return unwrapData(response);
}

export async function getRegistrations({ status, tournamentId } = {}) {
  const response = await apiClient.get(REGISTRATION_ENDPOINTS.ROOT, {
    includeAuth: true,
    params: {
      ...(status ? { status } : {}),
      ...(tournamentId ? { tournamentId } : {}),
    },
  });

  return response.data;
}

export async function getAdminRegistrationStats() {
  const response = await apiClient.get(
    REGISTRATION_ENDPOINTS.ADMIN_DASHBOARD_STATS,
    { includeAuth: true },
  );

  return unwrapData(response);
}

export async function getRegistrationById(id) {
  const response = await apiClient.get(REGISTRATION_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });

  return response.data;
}

export async function confirmRegistration(id, payload) {
  const response = await apiClient.patch(
    REGISTRATION_ENDPOINTS.CONFIRM(id),
    payload,
    { includeAuth: true },
  );

  return response.data;
}

export async function rejectRegistration(id, payload) {
  const response = await apiClient.patch(
    REGISTRATION_ENDPOINTS.REJECT(id),
    payload,
    { includeAuth: true },
  );

  return response.data;
}

export async function acceptRegistrationToWaitlist(id, payload) {
  const response = await apiClient.patch(
    REGISTRATION_ENDPOINTS.ACCEPT_TO_WAITLIST(id),
    payload,
    { includeAuth: true },
  );

  return response.data;
}
