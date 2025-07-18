import { useQuery } from "@tanstack/react-query";

import { getDockerOverviewOptions } from "@/client/@tanstack/react-query.gen";

export function useDockerOverview() {
	return useQuery(getDockerOverviewOptions());
}
