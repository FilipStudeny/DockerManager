import { useQuery } from "@tanstack/react-query";

import { getTopContainersOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerTopContainers() {
	return useQuery(getTopContainersOptions());
}
