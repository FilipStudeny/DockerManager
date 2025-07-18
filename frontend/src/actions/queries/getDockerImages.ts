import { useQuery } from "@tanstack/react-query";

import { listDockerImagesOptions } from "@/client/@tanstack/react-query.gen";

export function useGetDockerImages() {
	return useQuery(listDockerImagesOptions());
}
