import { useQuery } from "@tanstack/react-query";

import { type Options, type GetContainerDetailsData } from "@/client";
import { getContainerDetailsOptions } from "@/client/@tanstack/react-query.gen";

export function useGetContainerDetails(containerId: string) {
	const opts: Options<GetContainerDetailsData> = {
		path: { container_id: containerId },
	};

	return useQuery(getContainerDetailsOptions(opts));
}
