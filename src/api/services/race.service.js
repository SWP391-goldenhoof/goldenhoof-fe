import { apiClient } from "../client";
import { RACE_ENDPOINTS } from "../endpoints/race.endpoint";

function unwrapData(response) {
    const data = response?.data;

    return (
        data?.data ||
        data?.result ||
        data?.race ||
        data
    );
}

function unwrapCollection(response) {
    const data = unwrapData(response);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.races)) return data.races;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.records)) return data.records;

    return [];
}

export async function getMyRaces() {
    const response = await apiClient.get(
        RACE_ENDPOINTS.MY_RACES,
        {
            includeAuth: true,
        }
    );

    return unwrapCollection(response);
}

export async function getAdminRaceStats() {
    const response = await apiClient.get(
        RACE_ENDPOINTS.ADMIN_DASHBOARD_STATS,
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function getRacesByTournament(
    tournamentId,
    status = ""
) {
    const response = await apiClient.get(
        RACE_ENDPOINTS.BY_TOURNAMENT(
            tournamentId
        ),
        {
            params: status
                ? { status }
                : undefined,
            includeAuth: true,
        }
    );

    return unwrapCollection(response);
}

export async function getRaceById(raceId) {
    const response = await apiClient.get(
        RACE_ENDPOINTS.DETAIL(raceId),
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function confirmRaceReady(
    raceId
) {
    const response = await apiClient.patch(
        RACE_ENDPOINTS.CONFIRM_READY(
            raceId
        ),
        {},
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function runSimulation(
    raceId
) {
    const response = await apiClient.post(
        RACE_ENDPOINTS.RUN_SIMULATION(
            raceId
        ),
        {},
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function getSimulationResult(
    raceId
) {
    const response = await apiClient.get(
        RACE_ENDPOINTS.SIMULATION_RESULT(
            raceId
        ),
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function resetSimulation(
    raceId
) {
    const response = await apiClient.delete(
        RACE_ENDPOINTS.RESET_SIMULATION(
            raceId
        ),
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function createRaceBatch(
    payload
) {
    const response = await apiClient.post(
        RACE_ENDPOINTS.BATCH,
        payload,
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export const createRound2Race = async (tournamentId, payload) => {
    const params = {
        startTime: payload.startTime,
        date: payload.date,
    };

    const response = await apiClient.post(
        RACE_ENDPOINTS.ROUND_2(
            tournamentId
        ),
        {},
        {
            params,
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function assignRaceReferee(
    raceId,
    refereeId
) {
    const response = await apiClient.patch(
        RACE_ENDPOINTS.ASSIGN_REFEREE(
            raceId
        ),
        {
            refereeId,
        },
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function assignRaceCourse(
    raceId,
    raceCourseId
) {
    const response = await apiClient.patch(
        RACE_ENDPOINTS.ASSIGN_RACE_COURSE(
            raceId
        ),
        {
            raceCourseId,
        },
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export async function bulkAssignRaceHorses(
    raceId,
    registrationIds
) {
    const response = await apiClient.post(
        RACE_ENDPOINTS.BULK_ASSIGN_HORSES(
            raceId
        ),
        {
            registrationIds,
        },
        {
            includeAuth: true,
        }
    );

    return unwrapData(response);
}

export const startRaceBroadcast = async (
    raceId,
    fromTick = 0
) => {
    const response = await apiClient.post(
        RACE_ENDPOINTS.START_BROADCAST(raceId),
        {},
        {
            params: {
                fromTick,
            },
            includeAuth: true,
        }
    );

    return response.data;
};

export const replayRaceBroadcast = async (
    raceId
) => {
    const response = await apiClient.post(
        RACE_ENDPOINTS.REPLAY_BROADCAST(raceId),
        {},
        {
            includeAuth: true,
        }
    );

    return response.data;
};

export const getBroadcastStatus =
    async (raceId) => {
        const response =
            await apiClient.get(
                RACE_ENDPOINTS.BROADCAST_STATUS(
                    raceId
                ),
                {
                    includeAuth: true,
                }
            );

        return response.data;
    };
