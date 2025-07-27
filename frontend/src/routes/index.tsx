import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	ServerCog,
	Boxes,
	HardDrive,
	FolderOpen,
	Layers3,
	AlertTriangle,
	ScrollText,
} from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	Cell,
	LabelList,
} from "recharts";

import { useGetDockerLatestLog } from "@/actions/queries/getDockerLatestLog";
import { useDockerOverview } from "@/actions/queries/getDockerOverview";
import { useGetDockerPerformanceWarning } from "@/actions/queries/getDockerPerformanceWarning";
import { useGetDockerTopContainers } from "@/actions/queries/getDockerTopContainers";
import { DashboardCard, DashboardCardSkeleton } from "@/components/DashBoardCard";
import { LoadingPage } from "@/components/LoadinPage";

export const Route = createFileRoute("/")({
	component: DockerDashboard,
	pendingComponent: () => LoadingPage,
});

function DockerDashboard() {
	const router = useRouter();

	const { data: dockerOverviewData, isLoading: isLoadingDockerOverviewData } = useDockerOverview();
	const { data: dockerGraphData, isLoading: isLoadingDockerGraphData } = useGetDockerTopContainers();
	const { data: dockerLatestLog, isLoading: isLoadingLatestLog } = useGetDockerLatestLog();
	const { data: dockerPerformanceWarning, isLoading: isLoadingPerformanceWarning } = useGetDockerPerformanceWarning();

	const cards = [
		{ label: "Docker Version", value: dockerOverviewData?.version, icon: <ServerCog size={20} />, to: "/about" },
		{ label: "Total Containers", value: dockerOverviewData?.total_containers, icon: <Boxes size={20} />, to: "/containers" },
		{ label: "Running Containers", value: dockerOverviewData?.running_containers, icon: <Layers3 size={20} />, to: "/containers?status=running" },
		{ label: "Failed Containers", value: dockerOverviewData?.failed_containers, icon: <AlertTriangle size={20} className="text-red-500" />, to: "/containers?status=exited" },
		{ label: "Images", value: dockerOverviewData?.images, icon: <HardDrive size={20} />, to: "/images" },
		{ label: "Volumes", value: dockerOverviewData?.volumes, icon: <FolderOpen size={20} />, to: "/volumes" },
		{ label: "Total Logs", value: dockerOverviewData?.logs_count, icon: <ScrollText size={20} />, to: "/logs" },
	];

	return (
		<div className="p-6 space-y-10 bg-gray-50 min-h-screen">
			<h1 className="text-3xl font-bold text-gray-900">Docker Dashboard</h1>

			{/* Dashboard Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
				{isLoadingDockerOverviewData
					? Array.from({ length: 7 }).map((_, idx) => <DashboardCardSkeleton key={idx} />)
					: cards.map((card) => (
						<DashboardCard
							key={card.label}
							to={card.to}
							label={card.label}
							value={card.value ?? ""}
							icon={card.icon}
						/>
					))}
			</div>

			{/* Resource Usage Chart */}
			<section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-800 mb-4">Container Resource Usage</h2>

				{isLoadingDockerGraphData ? (
					<div className="h-[340px] flex items-center justify-center text-gray-400 animate-pulse">
						Loading container stats...
					</div>
				) : (
					<ResponsiveContainer width="100%" height={340}>
						<BarChart
							data={dockerGraphData ?? []}
							layout="vertical"
							margin={{ left: 80, right: 20 }}
							barSize={20}
						>
							<XAxis type="number" domain={[0, 100]} unit="%" />
							<YAxis
								type="category"
								dataKey="name"
								tick={{ fontSize: 13, fill: "#334155" }}
							/>
							<Tooltip
								formatter={(value: unknown, name: string) =>
									typeof value === "number"
										? [`${value.toFixed(1)}%`, name.toUpperCase()]
										: [String(value), name.toUpperCase()]
								}
							/>
							{/* CPU Usage */}
							<Bar
								dataKey="cpu"
								name="CPU"
								radius={[0, 8, 8, 0]}
								onClick={(entry) =>
									router.navigate({ to: `/containers/${entry.id}` })
								}
							>
								<LabelList
									dataKey="cpu"
									position="right"
									formatter={(v) =>
										typeof v === "number" ? `${v.toFixed(1)}%` : String(v)
									}
								/>
								{dockerGraphData?.map((entry, index) => (
									<Cell
										key={`cpu-${index}`}
										fill={
											entry.cpu > 80
												? "#dc2626"
												: entry.cpu > 50
													? "#facc15"
													: "#22c55e"
										}
									/>
								))}
							</Bar>

							{/* Memory Usage */}
							<Bar
								dataKey="memory"
								name="Memory"
								radius={[0, 8, 8, 0]}
								onClick={(entry) =>
									router.navigate({ to: `/containers/${entry.id}` })
								}
							>
								<LabelList
									dataKey="memory"
									position="right"
									formatter={(v) =>
										typeof v === "number" ? `${v.toFixed(1)}%` : String(v)
									}
								/>
								{dockerGraphData?.map((entry, index) => (
									<Cell
										key={`mem-${index}`}
										fill={
											entry.memory > 80
												? "#dc2626"
												: entry.memory > 50
													? "#facc15"
													: "#3b82f6"
										}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				)}

				<p className="text-xs text-gray-500 mt-3">
					Click any bar to open container details.
				</p>
			</section>

			{/* Latest Log */}
			<section className="bg-white p-5 rounded-xl shadow border border-gray-200">
				<h2 className="text-lg font-semibold text-gray-800 mb-2">Latest Log Entry</h2>
				{isLoadingLatestLog ? (
					<div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
				) : (
					<p className="text-sm text-gray-700">{dockerLatestLog?.latest}</p>
				)}
			</section>

			{/* Performance Warning */}
			{isLoadingPerformanceWarning ? (
				<div className="h-12 bg-yellow-100 border border-yellow-300 rounded-lg animate-pulse" />
			) : dockerPerformanceWarning ? (
				<div className="flex items-start gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg shadow-sm">
					<AlertTriangle size={20} className="mt-1" />
					<span className="text-sm font-medium">{dockerPerformanceWarning.message}</span>
				</div>
			) : null}
		</div>
	);
}

