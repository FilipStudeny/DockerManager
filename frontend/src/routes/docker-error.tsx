import { createFileRoute } from "@tanstack/react-router";

import { ErrorPage } from "./__root";

export const Route = createFileRoute("/docker-error")({
	component: () => (
		<ErrorPage
			message="Docker became unreachable. Please restart it and try again."
		/>
	),
});
