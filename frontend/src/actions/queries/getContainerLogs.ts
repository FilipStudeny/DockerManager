import { useInfiniteQuery } from "@tanstack/react-query";

import { getContainerLogs } from "@/client/sdk.gen";

export function useInfiniteContainerLogs(
	containerId: string,
	tail = 100,
	fromDate?: number,
	toDate?: number,
) {
	return useInfiniteQuery({
		queryKey: ["containerLogs", containerId, fromDate, toDate],
		queryFn: async ({ pageParam }) => {
			const since = pageParam ?? fromDate;

			const { data } = await getContainerLogs({
				path: { container_id: containerId },
				query: {
					tail,
					since,
					until: toDate,
				},
				throwOnError: true,
			});

			return data;
		},
		initialPageParam: fromDate,
		getNextPageParam: (lastPage) => {
			if (!lastPage?.next_since) return undefined;

			return lastPage.next_since + 1; // avoid duplicate log
		},
	});
}
