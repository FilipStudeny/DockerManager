import { useMutation } from "@tanstack/react-query";

import type { GenericMessageResponse } from "@/client";
import type { AxiosError } from "axios";

import { stopContainer } from "@/client/sdk.gen";

export function useStopContainer(container_id: string) {
	return useMutation<GenericMessageResponse, AxiosError, void>({
		mutationFn: async () => {
			const { data } = await stopContainer({
				path: { container_id },
				throwOnError: true,
			});

			return data;
		},
	});
}
