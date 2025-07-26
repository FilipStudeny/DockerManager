import { useMutation } from "@tanstack/react-query";

import type { GenericMessageResponse } from "@/client/types.gen";
import type { AxiosError } from "axios";

import { deleteDockerImage } from "@/client/sdk.gen";

export function useDeleteDockerImage() {
	return useMutation<GenericMessageResponse, AxiosError, string>({
		mutationFn: async (imageName: string) => {
			const { data } = await deleteDockerImage({
				path: { image_id: imageName },
				throwOnError: true,
			});

			return data;
		},
	});
}
