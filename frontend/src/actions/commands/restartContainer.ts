import { useMutation } from "@tanstack/react-query";

import type { GenericMessageResponse } from "@/client";
import type { AxiosError } from "axios";

import { restartContainer } from "@/client/sdk.gen";

export function useRestartContainer(container_id: string) {
	return useMutation<GenericMessageResponse, AxiosError, void>({
		mutationFn: async () => {
			const { data } = await restartContainer({
				path: { container_id },
				throwOnError: true,
			});

			return data;
		},
	});
}
