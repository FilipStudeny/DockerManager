import { createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	Terminal,
	Layers3,
	PauseOctagon,
	RefreshCcw,
	Plus,
	Boxes,
} from "lucide-react";
import { useState, type JSX } from "react";

import { DashboardCard } from ".";

import { DataTable, type ColumnConfig } from "@/components/DataTable";

export const Route = createFileRoute("/containers")({
	component: ContainersPage,
});

type ContainerStatus = "RUNNING" | "STOPPED" | "RESTARTED" | "FAILED";

interface Container {
	id: string,
	name: string,
	status: ContainerStatus,
	image: string[],
	volumes: number,
	error_count: number,
	created_at: string,
}

const mockContainers: Container[] = [
	{ id: "a1", name: "web-app", status: "RUNNING", image: ["web-app:latest"], volumes: 2, error_count: 0, created_at: "2025-07-17T10:00:00Z" },
	{ id: "b2", name: "db", status: "FAILED", image: ["postgres:15"], volumes: 1, error_count: 3, created_at: "2025-07-17T09:00:00Z" },
	{ id: "c3", name: "nginx", status: "STOPPED", image: ["nginx:1.25"], volumes: 0, error_count: 0, created_at: "2025-07-16T08:30:00Z" },
	{ id: "d4", name: "redis", status: "RESTARTED", image: ["redis:7"], volumes: 1, error_count: 1, created_at: "2025-07-17T11:00:00Z" },
];

const badgeStyles: Record<ContainerStatus, string> = {
	RUNNING: "bg-emerald-100 text-emerald-700",
	STOPPED: "bg-gray-200 text-gray-800",
	RESTARTED: "bg-indigo-100 text-indigo-700",
	FAILED: "bg-rose-100 text-rose-700",
};

const statusIcons: Record<ContainerStatus, JSX.Element> = {
	RUNNING: <Layers3 size={20} />,
	STOPPED: <PauseOctagon size={20} />,
	RESTARTED: <RefreshCcw size={20} />,
	FAILED: <AlertTriangle size={20} className="text-red-500" />,
};

function ContainersPage() {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<ContainerStatus | "">("");

	const filtered = mockContainers.filter(
		(c) =>
			c.name.toLowerCase().includes(search.toLowerCase()) &&
			(statusFilter === "" || c.status === statusFilter),
	);

	const statusCounts = {
		RUNNING: mockContainers.filter((c) => c.status === "RUNNING").length,
		STOPPED: mockContainers.filter((c) => c.status === "STOPPED").length,
		RESTARTED: mockContainers.filter((c) => c.status === "RESTARTED").length,
		FAILED: mockContainers.filter((c) => c.status === "FAILED").length,
	};

	const columns: ColumnConfig<Container>[] = [
		{ label: "Name", accessor: "name" },
		{ label: "ID", accessor: "id" },
		{ label: "Image", render: (c) => c.image.join(", ") },
		{ label: "Volumes", accessor: "volumes" },
		{
			label: "Status",
			render: (c) => (
				<span
					className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${badgeStyles[c.status]}`}
				>
					{c.status.charAt(0) + c.status.slice(1).toLowerCase()}
				</span>
			),
		},
		{
			label: "Errors",
			render: (c) =>
				c.error_count > 0 ? (
					<span className="inline-flex items-center gap-1 text-rose-600 font-medium">
						<AlertTriangle size={16} />
						{c.error_count}
					</span>
				) : (
					<span className="text-neutral-300">—</span>
				),
		},
		{
			label: "Logs",
			align: "right",
			render: (c) => (
				<button
					className="text-sm text-blue-600 hover:underline inline-flex items-center"
					onClick={() => alert(`Logs for ${c.name}`)}
				>
					<Terminal size={16} className="mr-1" />
					View Logs
				</button>
			),
		},
	];

	return (
		<div className="px-4 sm:px-6 md:px-10 py-6 space-y-10 bg-neutral-50 min-h-screen">
			<div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
				<h1 className="text-3xl font-bold text-neutral-900">Containers</h1>
				<button
					className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
					onClick={() => alert("Open create container modal or redirect")}
				>
					<Plus size={16} />
					Create New Container
				</button>
			</div>

			{/* Filter cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
				<DashboardCard
					key="ALL"
					label="All"
					value={mockContainers.length}
					icon={<Boxes size={20} />}
					selected={statusFilter === ""}
					onClick={() => setStatusFilter("")}
				/>

				{(Object.keys(statusCounts) as ContainerStatus[]).map((status) => (
					<DashboardCard
						key={status}
						label={status.charAt(0) + status.slice(1).toLowerCase()}
						value={statusCounts[status]}
						icon={statusIcons[status]}
						selected={statusFilter === status}
						onClick={() => setStatusFilter(status)}
					/>
				))}
			</div>

			{/* Table with search */}
			<div className="rounded-2xl overflow-hidden shadow border border-neutral-200 bg-white">
				<div className="bg-gray-900 border-b border-neutral-700 px-6 py-4">
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
						<input
							type="text"
							placeholder="🔍 Search containers..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<DataTable
					data={filtered}
					columns={columns}
					keyAccessor={(row) => row.id}
				/>
			</div>
		</div>
	);
}
