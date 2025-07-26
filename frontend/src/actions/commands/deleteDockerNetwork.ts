import { useMutation } from "@tanstack/react-query";

import type { GenericMessageResponse } from "@/client";
import type { AxiosError } from "axios";

import { deleteDockerNetwork } from "@/client/sdk.gen";

export function useDeleteDockerNetwork() {
	return useMutation<
		GenericMessageResponse,
		AxiosError,
		{ networkId: string, force?: boolean, dry_run?: boolean }
	>({
		mutationFn: async ({ networkId, force = false, dry_run = false }) => {
			const { data } = await deleteDockerNetwork({
				path: { network_id: networkId },
				query: { dry_run },
				throwOnError: true,
			});

			return data;
		},
	});
}
