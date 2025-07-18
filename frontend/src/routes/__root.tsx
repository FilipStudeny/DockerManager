import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";

import { DockerStatusWatcher } from "@/actions/guards/dockerStatusWatcher";
import { useGetDockerStatus } from "@/actions/queries/getDockerStatus";
import { LoadingPage } from "@/components/LoadinPage";
import { SidebarLayout } from "@/components/NavBar";

interface MyRouterContext {
	queryClient: QueryClient,
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	pendingComponent: LoadingPage,
});

export function RootComponent() {
	const { data, isLoading, isError } = useGetDockerStatus();
	const queryClient = useQueryClient();

	const retry = () => {
		queryClient.invalidateQueries({ queryKey: ["dockerStatus"] });
	};

	if (isLoading) return <LoadingPage />;

	if (isError || !data?.success) {
		return (
			<ErrorPage
				message={data?.message ?? "Docker is not running or unreachable. Please start Docker and try again."}
				onRetry={retry}
			/>
		);
	}

	return (
		<div className="relative flex h-screen">
			<DockerStatusWatcher />
			<SidebarLayout />
			<main className="flex-1 bg-gray-100 overflow-auto pt-14 sm:pt-0">
				<Outlet />
			</main>
		</div>
	);
}

export function ErrorPage({ message, onRetry }: { message: string, onRetry?: ()=> void }) {
	return (
		<div className="flex items-center justify-center min-h-screen bg-red-50 px-4">
			<div className="bg-white border border-red-300 shadow-lg rounded-xl p-10 max-w-md w-full text-center">
				<div className="flex justify-center mb-4">
					<svg
						className="w-12 h-12 text-red-500"
						fill="none"
						stroke="currentColor"
						strokeWidth={2}
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
						/>
					</svg>
				</div>
				<h1 className="text-2xl font-bold text-red-700 mb-2">Docker Not Running</h1>
				<p className="text-gray-600 mb-6">{message}</p>

				{onRetry && (
					<button
						onClick={onRetry}
						className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
					>
						<RefreshCw className="w-4 h-4" />
						Try Again
					</button>
				)}
			</div>
		</div>
	);
}
