import { LoadingPage } from "@/components/LoadinPage";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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

export const Route = createFileRoute("/")({
	component: DockerDashboard,
	pendingComponent: () => LoadingPage,
});

function DockerDashboard() {
	const router = useRouter();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["dockerInfo"],
		queryFn: async () => {
			await new Promise((res) => setTimeout(res, 300));

			return {
				version: "24.0.7",
				total_containers: 14,
				running_containers: 8,
				failed_containers: 2,
				images: 10,
				volumes: 5,
				logs: {
					count: 157,
					latest: "Container 'web-app' restarted due to exit code 137.",
				},
				performance_warning: {
					message: "High CPU usage detected in container 'db'",
				},
				top_containers_stats: [
					{ id: "1", name: "web-app", cpu: 42.3, memory: 30.4 },
					{ id: "2", name: "db", cpu: 85.6, memory: 78.2 },
					{ id: "3", name: "redis", cpu: 12.7, memory: 25.9 },
					{ id: "4", name: "nginx", cpu: 65.1, memory: 48.0 },
				],
			};
		},
		refetchInterval: 5000,
	});

	if (isLoading) return <div className="p-6 text-gray-600">Loading Docker Info...</div>;
	if (isError) return <div className="p-6 text-red-500">Failed to load data.</div>;

	const cards = [
		{ label: "Docker Version", value: data.version, icon: <ServerCog size={20} />, to: "/about" },
		{ label: "Total Containers", value: data.total_containers, icon: <Boxes size={20} />, to: "/containers" },
		{ label: "Running Containers", value: data.running_containers, icon: <Layers3 size={20} />, to: "/containers?status=running" },
		{ label: "Failed Containers", value: data.failed_containers, icon: <AlertTriangle size={20} className="text-red-500" />, to: "/containers?status=exited" },
		{ label: "Images", value: data.images, icon: <HardDrive size={20} />, to: "/images" },
		{ label: "Volumes", value: data.volumes, icon: <FolderOpen size={20} />, to: "/volumes" },
		{ label: "Total Logs", value: data.logs.count, icon: <ScrollText size={20} />, to: "/logs" },
	];

	return (
		<div className="p-6 space-y-10 bg-gray-50 min-h-screen">
			<h1 className="text-3xl font-bold text-gray-900">Docker Dashboard</h1>

			{/* Dashboard Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
				{cards.map((card) => (
					<DashboardCard
						key={card.label}
						to={card.to}
						label={card.label}
						value={card.value}
						icon={card.icon}
					/>
				))}
			</div>

			{/* Resource Usage Chart */}
			<section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
				<h2 className="text-xl font-semibold text-gray-800 mb-4">Container Resource Usage</h2>
				<ResponsiveContainer width="100%" height={340}>
					<BarChart
						data={data.top_containers_stats}
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
							formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name.toUpperCase()]}
							contentStyle={{ fontSize: "14px", borderRadius: 8 }}
						/>
						<Bar
							dataKey="cpu"
							name="CPU"
							radius={[0, 8, 8, 0]}
							onClick={(entry) => router.navigate({ to: `/containers/${entry.id}` })}
						>
							<LabelList dataKey="cpu" position="right" formatter={(v) => `${v.toFixed(1)}%`} />
							{data.top_containers_stats.map((entry, index) => (
								<Cell
									key={`cpu-${index}`}
									fill={entry.cpu > 80 ? "#dc2626" : entry.cpu > 50 ? "#facc15" : "#22c55e"}
								/>
							))}
						</Bar>
						<Bar
							dataKey="memory"
							name="Memory"
							radius={[0, 8, 8, 0]}
							onClick={(entry) => router.navigate({ to: `/containers/${entry.id}` })}
						>
							<LabelList dataKey="memory" position="right" formatter={(v) => `${v.toFixed(1)}%`} />
							{data.top_containers_stats.map((entry, index) => (
								<Cell
									key={`mem-${index}`}
									fill={entry.memory > 80 ? "#dc2626" : entry.memory > 50 ? "#facc15" : "#3b82f6"}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
				<p className="text-xs text-gray-500 mt-3">Click any bar to open container details.</p>
			</section>

			{/* Latest Log */}
			<section className="bg-white p-5 rounded-xl shadow border border-gray-200">
				<h2 className="text-lg font-semibold text-gray-800 mb-2">Latest Log Entry</h2>
				<p className="text-sm text-gray-700">{data.logs.latest}</p>
			</section>

			{/* Performance Warning */}
			{data.performance_warning?.message && (
				<div className="flex items-start gap-2 bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg shadow-sm">
					<AlertTriangle size={20} className="mt-1" />
					<span className="text-sm font-medium">{data.performance_warning.message}</span>
				</div>
			)}
		</div>
	);
}

export function DashboardCard({
	to,
	label,
	value,
	icon,
	onClick,
	selected = false,
}: {
	to?: string,
	label: string,
	value: string | number,
	icon: React.ReactNode,
	onClick?: ()=> void,
	selected?: boolean,
}) {
	const baseClass =
		"bg-white border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all";
	const borderColor = selected ? "border-blue-500" : "border-gray-200";
	const bgColor = selected ? "bg-blue-50" : "bg-white";

	const content = (
		<div className={`${baseClass} ${borderColor} ${bgColor}`}>
			<div className="bg-blue-100 text-blue-600 p-2 rounded-full">
				{icon}
			</div>
			<div className="flex flex-col justify-center">
				<span className="text-xs text-gray-500">{label}</span>
				<span className="text-lg font-bold text-gray-800">{value}</span>
			</div>
		</div>
	);

	if (to) {
		return <Link to={to}>{content}</Link>;
	}

	return <button onClick={onClick} className="w-full text-left">{content}</button>;
}
