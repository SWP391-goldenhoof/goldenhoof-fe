import { apiClient } from "../client";
import { WITHDRAWAL_ENDPOINTS } from "../endpoints/withdrawal.endpoint";

export async function requestWithdrawal(payload) {
  const response = await apiClient.post(WITHDRAWAL_ENDPOINTS.ROOT, payload, {
    includeAuth: true,
  });
  return response.data;
}

export async function getMyWithdrawalRequests() {
  const response = await apiClient.get(WITHDRAWAL_ENDPOINTS.MY_REQUESTS, {
    includeAuth: true,
  });
  return response.data;
}

export async function getAllWithdrawalRequests({ status, search } = {}) {
  const response = await apiClient.get(WITHDRAWAL_ENDPOINTS.ADMIN_ALL, {
    includeAuth: true,
    params: {
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    },
  });
  return response.data;
}

export async function getWithdrawalDetail(id) {
  const response = await apiClient.get(WITHDRAWAL_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });
  return response.data;
}

export async function approveWithdrawal(id, payload) {
  const response = await apiClient.post(
    WITHDRAWAL_ENDPOINTS.APPROVE(id),
    payload,
    {
      includeAuth: true,
    },
  );
  return response.data;
}

export async function rejectWithdrawal(id, payload) {
  const response = await apiClient.post(
    WITHDRAWAL_ENDPOINTS.REJECT(id),
    payload,
    {
      includeAuth: true,
    },
  );
  return response.data;
}
