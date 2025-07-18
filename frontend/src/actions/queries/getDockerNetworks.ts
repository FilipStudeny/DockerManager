import { useQuery } from "@tanstack/react-query";

import { getDockerNetworksOverviewOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerNetworks() {
	return useQuery(getDockerNetworksOverviewOptions());
}
