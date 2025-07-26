import { useMutation } from "@tanstack/react-query";

import type { GenericMessageResponse } from "@/client/types.gen";
import type { AxiosError } from "axios";

import { assignNetworkToContainer } from "@/client/sdk.gen";

export function useAssignNetworkToContainer(containerId: string) {
	return useMutation<GenericMessageResponse, AxiosError, { network_name: string }>({
		mutationFn: async (payload) => {
			const { data } = await assignNetworkToContainer({
				path: { container_id: containerId },
				body: payload,
				throwOnError: true,
			});

			return data;
		},
	});
}
