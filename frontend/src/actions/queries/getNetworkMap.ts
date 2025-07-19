import { useQuery } from "@tanstack/react-query";

import { getDockerNetworkMapOptions } from "@/client/@tanstack/react-query.gen";

export function useGetNetworkMap() {
	return useQuery({
		...getDockerNetworkMapOptions(),
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		refetchInterval: false,
		staleTime: Infinity,
	});
}

