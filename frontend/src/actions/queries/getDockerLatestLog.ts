import { useQuery } from "@tanstack/react-query";

import { getLatestLogDockerLogsLatestGetOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerLatestLog() {
	return useQuery(getLatestLogDockerLogsLatestGetOptions());
}
