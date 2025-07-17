import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import type { QueryClient } from "@tanstack/react-query";

import { LoadingPage } from "@/components/LoadinPage";
import { SidebarLayout } from "@/components/NavBar";

interface MyRouterContext {
	queryClient: QueryClient,
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: () => (
		<div className="relative flex h-screen">
			<SidebarLayout />
			<main className="flex-1 bg-gray-100 overflow-auto pt-14 sm:pt-0">
				<Outlet />
			</main>
		</div>
	),
	pendingComponent: LoadingPage,
});
