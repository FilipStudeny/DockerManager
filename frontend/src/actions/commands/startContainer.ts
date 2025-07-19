import { useMutation } from "@tanstack/react-query";

import type { GenericMessageResponse } from "@/client";
import type { AxiosError } from "axios";

import { startContainer } from "@/client/sdk.gen";

export function useStartContainer(container_id: string) {
	return useMutation<GenericMessageResponse, AxiosError, void>({
		mutationFn: async () => {
			const { data } = await startContainer({
				path: { container_id },
				throwOnError: true,
			});

			return data;
		},
	});
}
