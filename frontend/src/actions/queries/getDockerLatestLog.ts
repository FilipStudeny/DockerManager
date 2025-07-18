import { useQuery } from "@tanstack/react-query";

import { getLatestLogOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerLatestLog() {
	return useQuery(getLatestLogOptions());
}
