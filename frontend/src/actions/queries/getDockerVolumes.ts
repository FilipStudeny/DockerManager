import { useQuery } from "@tanstack/react-query";

import { listDockerVolumesOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerVolumes() {
	return useQuery(listDockerVolumesOptions());
}
