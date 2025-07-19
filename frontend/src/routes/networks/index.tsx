import { createFileRoute } from "@tanstack/react-router";
import {
	CheckCircle,
	XCircle,
	Network,
	Globe,
} from "lucide-react";
import { useState } from "react";

import type { DockerNetworkOverview } from "@/client";

import { useGetDockerNetworks } from "@/actions/queries/getDockerNetworks";
import { DataTable, type ColumnConfig } from "@/components/DataTable";

export const Route = createFileRoute("/networks/")({
	component: DockerNetworksPage,
});

function DockerNetworksPage() {
	const [search, setSearch] = useState("");
	const [selectedNetwork, setSelectedNetwork] = useState<DockerNetworkOverview | null>(null);

	const { data: networks, isLoading } = useGetDockerNetworks();

	const filtered = networks?.filter((net) =>
		net.name.toLowerCase().includes(search.toLowerCase()),
	) ?? [];

	const columns: ColumnConfig<DockerNetworkOverview>[] = [
		{
			label: "Name",
			accessor: "name",
		},
		{ label: "Driver", accessor: "driver" },
		{ label: "Scope", accessor: "scope" },
		{
			label: "Containers (Running / Total )",
			render: (net) =>
				`${net.running_containers_count} / ${net.containers_count}`,
		},
		{
			label: "Internal",
			render: (net) => (
				<span
					className={
						net.internal ? "text-amber-600 font-medium" : "text-neutral-500"
					}
				>
					{net.internal ? "Yes" : "No"}
				</span>
			),
		},
		{
			label: "Attachable",
			render: (net) => (
				<span
					className={
						net.attachable ? "text-green-600 font-medium" : "text-neutral-500"
					}
				>
					{net.attachable ? "Yes" : "No"}
				</span>
			),
		},
	];

	return (
		<div className="p-6 space-y-10 bg-neutral-50 min-h-screen relative">
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
					onRowClick={(row) => setSelectedNetwork(row)}
					selectedRow={selectedNetwork}
				/>

			</div>

			{selectedNetwork && (
				<div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white border-l border-neutral-200 shadow-lg z-50 flex flex-col">
					<div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
						<div className="flex items-center gap-2">
							<Network className="h-5 w-5 text-blue-500" />
							<h2 className="text-lg font-semibold">
								{selectedNetwork.name}
							</h2>
						</div>
						<button
							onClick={() => setSelectedNetwork(null)}
							className="text-2xl font-bold text-neutral-500 hover:text-neutral-800"
						>
							×
						</button>
					</div>

					<div className="p-4 overflow-y-auto flex-1 space-y-4">
						<h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
							Connected Containers
						</h3>

						{selectedNetwork.containers.length > 0 ? (
							<table className="min-w-full text-sm text-left text-neutral-700">
								<thead>
									<tr className="border-b border-neutral-300">
										<th className="py-2 pr-4 font-medium">Name</th>
										<th className="py-2 pr-4 font-medium">Status</th>
										<th className="py-2 pr-4 font-medium">IPv4</th>
									</tr>
								</thead>
								<tbody>
									{selectedNetwork.containers.map((container) => (
										<tr key={container.id} className="border-t border-neutral-100">
											<td className="py-2 pr-4">{container.name ?? "N/A"}</td>
											<td className="py-2 pr-4 flex items-center gap-1">
												{container.status === "running" ? (
													<CheckCircle className="h-4 w-4 text-green-600" />
												) : (
													<XCircle className="h-4 w-4 text-red-500" />
												)}
												<span>{container.status}</span>
											</td>
											<td className="py-2 pr-4">
												{container.ipv4_address ?? "—"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<p className="text-sm text-neutral-500">
								No containers connected to this network.
							</p>
						)}

						<div className="mt-6 text-sm text-neutral-500">
							<Globe className="inline h-4 w-4 mr-1" />
							<span>
								Driver: <strong>{selectedNetwork.driver}</strong> | Scope:{" "}
								<strong>{selectedNetwork.scope}</strong>
							</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
