import { useQuery } from "@tanstack/react-query";

import { listContainersOptions } from "@/client/@tanstack/react-query.gen";

export function useGetContainersList() {
	return useQuery(listContainersOptions());
}
