import { useQuery } from "@tanstack/react-query";

import { listDockerNetworksLiteOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerNetworksSelectList() {
	return useQuery(listDockerNetworksLiteOptions());
}
