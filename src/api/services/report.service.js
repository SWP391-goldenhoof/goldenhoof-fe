import { apiClient } from "../client";
import { REPORT_ENDPOINTS } from "../endpoints/report.endpoint";

function unwrapData(response) {
  const data = response?.data;
  return data?.data || data?.result || data?.report || data;
}

function unwrapCollection(response) {
  const data = unwrapData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.reports)) return data.reports;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

export async function createReport(payload) {
  const response = await apiClient.post(REPORT_ENDPOINTS.ROOT, payload, {
    includeAuth: true,
  });
  return response.data;
}

export async function getMyReports() {
  const response = await apiClient.get(REPORT_ENDPOINTS.MY_REPORTS, {
    includeAuth: true,
  });
  return unwrapCollection(response);
}

export async function getAllReportsAdmin(filters = {}) {
  const response = await apiClient.get(REPORT_ENDPOINTS.ADMIN_ALL, {
    includeAuth: true,
    params: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.category ? { category: filters.category } : {}),
    },
  });
  return unwrapCollection(response);
}

export async function getReportStatsAdmin() {
  const response = await apiClient.get(REPORT_ENDPOINTS.ADMIN_STATS, {
    includeAuth: true,
  });
  return unwrapData(response);
}

export async function getReportById(id) {
  const response = await apiClient.get(REPORT_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });
  return unwrapData(response);
}

export async function deleteReport(id) {
  const response = await apiClient.delete(REPORT_ENDPOINTS.DETAIL(id), {
    includeAuth: true,
  });
  return response.data;
}

export async function resolveReport(id, payload) {
  const response = await apiClient.put(REPORT_ENDPOINTS.RESOLVE(id), payload, {
    includeAuth: true,
  });
  return response.data;
}
