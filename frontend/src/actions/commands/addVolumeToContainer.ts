import { useMutation } from "@tanstack/react-query";

import type {
	AttachVolumeRequest,
	GenericMessageResponse,
} from "@/client";
import type { AxiosError } from "axios";

import { attachVolumeToContainer } from "@/client/sdk.gen";

export function useAttachVolumeToContainer(container_id: string) {
	return useMutation<GenericMessageResponse, AxiosError, AttachVolumeRequest>({
		mutationFn: async (body) => {
			const { data } = await attachVolumeToContainer({
				path: { container_id },
				body,
				throwOnError: true,
			});

			return data;
		},
	});
}
