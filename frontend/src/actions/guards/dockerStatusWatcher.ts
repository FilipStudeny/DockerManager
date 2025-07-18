import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { useGetDockerStatus } from "@/actions/queries/getDockerStatus";

export function DockerStatusWatcher() {
	const router = useRouter();
	const { data, isError } = useGetDockerStatus();

	useEffect(() => {
		if (isError || !data?.success) {

			router.navigate({ to: "/docker-error" });
		}
	}, [data, isError, router]);

	return null;
}
