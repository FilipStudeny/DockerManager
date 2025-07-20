import { useMutation } from "@tanstack/react-query";

import type { CreatedVolumeResponse, CreateVolumeRequest } from "@/client/types.gen";
import type { AxiosError } from "axios";

import { createDockerVolume } from "@/client/sdk.gen";

export function useCreateDockerVolume() {
	return useMutation<CreatedVolumeResponse, AxiosError, CreateVolumeRequest>({
		mutationFn: async (createVolumeRequest) => {
			const { data } = await createDockerVolume({
				body: createVolumeRequest,
				throwOnError: true,
			});

			return data;
		},
	});
}
