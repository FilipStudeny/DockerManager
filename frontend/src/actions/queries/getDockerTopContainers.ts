import { useQuery } from "@tanstack/react-query";

import { getTopContainersDockerTopContainersGetOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerTopContainers() {
	return useQuery(getTopContainersDockerTopContainersGetOptions());
}
