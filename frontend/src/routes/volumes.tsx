import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { DataTable, type ColumnConfig } from "@/components/DataTable";

export const Route = createFileRoute("/volumes")({
	component: VolumesPage,
});

interface DockerVolumeSummary {
	name?: string,
	type: string,
	source: string,
	destination: string,
	driver?: string,
	mountpoint?: string,
	created_at?: string,
	size?: string,
	labels: Record<string, string>,
}

const mockVolumes: DockerVolumeSummary[] = [
	{
		name: "app-data",
		type: "volume",
		source: "app-data",
		destination: "/app/data",
		driver: "local",
		mountpoint: "/var/lib/docker/volumes/app-data/_data",
		created_at: "2025-07-17T08:00:00Z",
		size: "120MB",
		labels: { app: "web" },
	},
	{
		name: "db-storage",
		type: "volume",
		source: "db-storage",
		destination: "/var/lib/postgresql/data",
		driver: "local",
		mountpoint: "/var/lib/docker/volumes/db-storage/_data",
		created_at: "2025-07-16T12:00:00Z",
		size: "950MB",
		labels: { db: "postgres" },
	},
	{
		name: undefined,
		type: "bind",
		source: "/host/tmp",
		destination: "/container/tmp",
		driver: undefined,
		mountpoint: undefined,
		created_at: undefined,
		size: undefined,
		labels: {},
	},
];

const columns: ColumnConfig<DockerVolumeSummary>[] = [
	{ label: "Name", render: (v) => v.name || "—" },
	{ label: "Type", accessor: "type" },
	{ label: "Source", accessor: "source" },
	{ label: "Destination", accessor: "destination" },
	{ label: "Driver", render: (v) => v.driver || "—" },
	{ label: "Size", render: (v) => v.size || "—" },
	{
		label: "Labels",
		render: (v) =>
			Object.keys(v.labels).length > 0
				? Object.entries(v.labels)
					.map(([k, val]) => `${k}=${val}`)
					.join(", ")
				: "—",
	},
];

function VolumesPage() {
	const [search, setSearch] = useState("");
	const filtered = mockVolumes.filter((v) =>
		(v.name || v.source).toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="p-6 space-y-10 bg-neutral-50 min-h-screen">
			<h1 className="text-3xl font-bold text-neutral-900">Docker Volumes</h1>

			<div className="rounded-2xl overflow-hidden shadow border border-neutral-200 bg-white">
				<div className="bg-gray-900 border-b border-neutral-700 px-6 py-4">
					<input
						type="text"
						placeholder="🔍 Search volumes..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-lg w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<DataTable
					data={filtered}
					columns={columns}
					keyAccessor={(row, index) => row.name || index}				/>
			</div>
		</div>
	);
}
