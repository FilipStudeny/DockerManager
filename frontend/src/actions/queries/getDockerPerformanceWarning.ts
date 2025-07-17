import { useQuery } from "@tanstack/react-query";

import { getPerformanceWarningDockerPerformanceWarningGetOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerPerformanceWarning() {
	return useQuery(getPerformanceWarningDockerPerformanceWarningGetOptions());
}
