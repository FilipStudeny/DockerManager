import { useMutation } from "@tanstack/react-query";

import type { GenericMessageResponse } from "@/client/types.gen";
import type { AxiosError } from "axios";

import { deleteDockerVolume } from "@/client/sdk.gen";

export function useDeleteDockerVolume() {
	return useMutation<GenericMessageResponse, AxiosError, string>({
		mutationFn: async (volumeName: string) => {
			const { data } = await deleteDockerVolume({
				path: { volume_name: volumeName },
				throwOnError: true,
			});

			return data;
		},
	});
}
