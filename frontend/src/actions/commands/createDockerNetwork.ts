import { useMutation } from "@tanstack/react-query";

import type {
	CreateDockerNetworkRequest,
	CreateDockerNetworkResponse,
} from "@/client/types.gen";
import type { AxiosError } from "axios";

import { createDockerNetwork } from "@/client/sdk.gen";

export function useCreateDockerNetwork() {
	return useMutation<CreateDockerNetworkResponse, AxiosError, CreateDockerNetworkRequest>({
		mutationFn: async (createNetworkRequest) => {
			const { data } = await createDockerNetwork({
				body: createNetworkRequest,
				throwOnError: true,
			});

			return data;
		},
	});
}
