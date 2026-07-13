import { apiClient } from "../client";

export const createEndReport =
    async (raceId, payload) => {

        console.log("Create End Report");
        console.log(raceId);
        console.log(payload);
        const response =
            await apiClient.post(
                `/referee-reports/${raceId}/end`,
                payload,
                {
                    includeAuth: true,
                }
            );

        return response.data;
    };

export const getReports =
    async (raceId) => {
        const response =
            await apiClient.get(
                `/referee-reports/${raceId}`,
                {
                    includeAuth: true,
                }
            );

        return response.data;
    };
