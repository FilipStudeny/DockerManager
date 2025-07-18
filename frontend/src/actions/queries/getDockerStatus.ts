import { useQuery } from "@tanstack/react-query";

import { checkDockerStatusOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerStatus() {
	return useQuery({
		...checkDockerStatusOptions(),
		refetchInterval: 5000,
	});
}
