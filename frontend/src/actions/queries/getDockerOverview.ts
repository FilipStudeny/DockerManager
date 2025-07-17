import { useQuery } from "@tanstack/react-query";

import { getDockerOverviewDockerOverviewGetOptions } from "@/client/@tanstack/react-query.gen";

export function useDockerOverview() {
	return useQuery(getDockerOverviewDockerOverviewGetOptions());
}
