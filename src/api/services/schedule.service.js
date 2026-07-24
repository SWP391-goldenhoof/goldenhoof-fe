import { apiClient } from "../client";
import { SCHEDULE_ENDPOINTS } from "../endpoints/schedule.endpoint";

function unwrapData(response) {
  const data = response?.data;

  return data?.data || data?.result || data?.schedule || data;
}

function unwrapCollection(response) {
  const data = unwrapData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.upcomingSchedules)) return data.upcomingSchedules;
  if (Array.isArray(data?.races)) return data.races;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.records)) return data.records;

  return [];
}

export async function getUpcomingSchedule() {
  const response = await apiClient.get(SCHEDULE_ENDPOINTS.UPCOMING, {
    includeAuth: true,
  });

  return unwrapCollection(response);
}
