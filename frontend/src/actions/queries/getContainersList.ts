import { useQuery } from "@tanstack/react-query";

import { listContainersContainersGetOptions } from "@/client/@tanstack/react-query.gen";

export function useGetContainersList() {
	return useQuery(listContainersContainersGetOptions());
}
