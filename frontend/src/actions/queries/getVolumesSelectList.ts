import { useQuery } from "@tanstack/react-query";

import { listDockerVolumesLiteOptions } from "@/client/@tanstack/react-query.gen";

export function useGetVolumesSelectList() {
	return useQuery({
		...listDockerVolumesLiteOptions(),
		refetchInterval: 5000,
	});
}
