import { useQuery } from "@tanstack/react-query";

import { getPerformanceWarningOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerPerformanceWarning() {
	return useQuery(getPerformanceWarningOptions());
}
