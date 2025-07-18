import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import type { DockerNetworkOverview } from "@/client";

import { useGetDockerNetworks } from "@/actions/queries/getDockerNetworks";
import { DataTable, type ColumnConfig } from "@/components/DataTable";

export const Route = createFileRoute("/networks/")({
	component: DockerNetworksPage,
});

function DockerNetworksPage() {
	const [search, setSearch] = useState("");
	const { data: networks, isLoading } = useGetDockerNetworks();

	const filtered = networks
		? networks.filter((net) =>
			net.name.toLowerCase().includes(search.toLowerCase()),
		)
		: [];

	const columns: ColumnConfig<DockerNetworkOverview>[] = [
		{ label: "Name", accessor: "name" },
		{ label: "Driver", accessor: "driver" },
		{ label: "Scope", accessor: "scope" },
		{
			label: "Containers",
			render: (net) => `${net.running_containers_count} / ${net.containers_count}`,
		},
		{
			label: "Internal",
			render: (net) => (net.internal ? "Yes" : "No"),
		},
		{
			label: "Attachable",
			render: (net) => (net.attachable ? "Yes" : "No"),
		},
	];

	return (
		<div className="p-6 space-y-10 bg-neutral-50 min-h-screen">
			<h1 className="text-3xl font-bold text-neutral-900">Docker Networks</h1>

			<div className="rounded-2xl overflow-hidden shadow border border-neutral-200 bg-white">
				<div className="bg-gray-900 border-b border-neutral-700 px-6 py-4">
					<input
						type="text"
						placeholder="🔍 Search networks..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-lg w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<DataTable
					data={filtered}
					columns={columns}
					keyAccessor={(row) => row.id}
					isLoading={isLoading}
				/>
			</div>
		</div>
	);
}
