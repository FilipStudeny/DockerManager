import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import type { DockerVolumeSummary } from "@/client";

import { useGetDockerVolumes } from "@/actions/queries/getDockerVolumes";
import { DataTable, type ColumnConfig } from "@/components/DataTable";
import { NavItem } from "@/components/NavBar";

export const Route = createFileRoute("/volumes/")({
	component: VolumesPage,
});

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
			v.labels && Object.keys(v.labels).length > 0
				? Object.entries(v.labels)
					.map(([k, val]) => `${k}=${val}`)
					.join(", ")
				: "—",
	},
];

function VolumesPage() {
	const { data: volumes, isLoading } = useGetDockerVolumes();
	const [search, setSearch] = useState("");

	const filtered = volumes?.filter((v) =>
		`${v.name ?? ""} ${v.source ?? ""}`.toLowerCase().includes(search.toLowerCase()),
	) ?? [];

	return (
		<div className="p-6 space-y-10 bg-neutral-50 min-h-screen">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-neutral-900">Docker Volumes</h1>

				<NavItem
					to="/volumes/create"
					icon={<PlusIcon size={16} />}
					className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
				>
					Create volume
				</NavItem>
			</div>
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
					keyAccessor={(row, index) => row.name || index}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
}
