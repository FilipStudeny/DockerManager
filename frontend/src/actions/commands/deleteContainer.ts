import { useMutation } from "@tanstack/react-query";

import type { GenericMessageResponse } from "@/client/types.gen";
import type { AxiosError } from "axios";

import { deleteContainer } from "@/client/sdk.gen";

export function useDeleteDockerContainer() {
	return useMutation<
		GenericMessageResponse,
		AxiosError,
		{ containerId: string, force?: boolean }
	>({
		mutationFn: async ({ containerId, force = false }) => {
			const { data } = await deleteContainer({
				path: { container_id: containerId },
				query: { force },
				throwOnError: true,
			});

			return data;
		},
	});
}
