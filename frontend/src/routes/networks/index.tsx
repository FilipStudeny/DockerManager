import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, XCircle, Network, Globe, PlusIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import type { DockerNetworkOverview, NetworkContainerInfo } from "@/client";
import type { AxiosError } from "axios";

import { useDeleteDockerNetwork } from "@/actions/commands/deleteDockerNetwork";
import { useGetDockerNetworks } from "@/actions/queries/getDockerNetworks";
import { getDockerNetworksOverviewQueryKey } from "@/client/@tanstack/react-query.gen";
import { DataTable, type ColumnConfig } from "@/components/DataTable";
import {
	DockerDetailSidebar,
	SidebarContainerTable,
	type SidebarColumnConfig,
} from "@/components/DockerDetailSidebar";
import { NavItem } from "@/components/NavBar";

export const Route = createFileRoute("/networks/")({
	component: DockerNetworksPage,
});

const columns: ColumnConfig<DockerNetworkOverview>[] = [
	{ label: "Name", accessor: "name" },
	{ label: "Driver", accessor: "driver" },
	{ label: "Scope", accessor: "scope" },
	{
		label: "Containers (Running / Total )",
		render: (net) => `${net.running_containers_count} / ${net.containers_count}`,
	},
	{
		label: "Internal",
		render: (net) => (
			<span className={net.internal ? "text-amber-600 font-medium" : "text-neutral-500"}>
				{net.internal ? "Yes" : "No"}
			</span>
		),
	},
	{
		label: "Attachable",
		render: (net) => (
			<span className={net.attachable ? "text-green-600 font-medium" : "text-neutral-500"}>
				{net.attachable ? "Yes" : "No"}
			</span>
		),
	},
];

const networkContainerColumns: SidebarColumnConfig<NetworkContainerInfo>[] = [
	{ header: "Name", accessor: "name" },
	{
		header: "Status",
		render: (c) => (
			<span className="flex items-center gap-1">
				{c.status === "running" ? (
					<CheckCircle className="h-4 w-4 text-green-600" />
				) : (
					<XCircle className="h-4 w-4 text-red-500" />
				)}
				<span>{c.status}</span>
			</span>
		),
	},
	{ header: "IPv4", accessor: "ipv4_address" },
];

function DockerNetworksPage() {
	const [search, setSearch] = useState("");
	const [selectedNetwork, setSelectedNetwork] = useState<DockerNetworkOverview | null>(null);
	const [forceDelete, setForceDelete] = useState(false);
	const [dryRun, setDryRun] = useState(false);

	const { data: networks, isLoading } = useGetDockerNetworks();
	const queryClient = useQueryClient();
	const { mutate: deleteNetwork, isPending: isDeleting } = useDeleteDockerNetwork();
	const isFetching = useIsFetching({ queryKey: getDockerNetworksOverviewQueryKey() }) > 0;

	const filtered =
    networks?.filter((net) => net.name.toLowerCase().includes(search.toLowerCase())) ?? [];

	return (
		<div className="p-6 space-y-10 bg-neutral-50 min-h-screen relative">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-neutral-900">Docker Networks</h1>

				<NavItem
					to="/networks/create"
					icon={<PlusIcon size={16} />}
					className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
				>
					Create network
				</NavItem>
			</div>

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
					isLoading={isLoading || isFetching}
					onRowClick={(row) => setSelectedNetwork(row)}
					selectedRow={selectedNetwork}
				/>
			</div>

			{selectedNetwork && (
				<DockerDetailSidebar
					title={selectedNetwork.name}
					icon={<Network className="h-5 w-5 text-blue-500" />}
					onClose={() => setSelectedNetwork(null)}
					footer={
						<div className="space-y-3">
							<div className="flex items-center justify-between gap-4 text-sm">
								<label className="flex items-center gap-2">
									<input type="checkbox" checked={forceDelete} onChange={(e) => setForceDelete(e.target.checked)} />
									Force delete
								</label>
								<label className="flex items-center gap-2">
									<input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
									Dry run
								</label>
							</div>
							<button
								onClick={() => {
									if (!selectedNetwork?.id) return;
									toast.promise(
										new Promise<string>((resolve, reject) => {
											deleteNetwork(
												{ networkId: selectedNetwork.id, force: forceDelete, dry_run: dryRun },
												{
													onSuccess: (data) => {
														queryClient.invalidateQueries({ queryKey: getDockerNetworksOverviewQueryKey() });
														setSelectedNetwork(null);
														resolve(data.message ?? "Network deleted");
													},
													onError: (error) => {
														const message =
												  (error as AxiosError<{ detail: string }>).response?.data?.detail ??
												  "Failed to delete network";
														reject(message);
													},
												},
											);
										}),
										{
											loading: "Deleting network...",
											success: (msg) => String(msg),
											error: (err) => String(err),
										},
									);

								}}
								className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm w-full disabled:opacity-60"
								disabled={isDeleting}
							>
								Delete Network
							</button>
						</div>
					}
				>
					<h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
						Connected Containers
					</h3>

					<SidebarContainerTable
						containers={selectedNetwork.containers ?? []}
						columns={networkContainerColumns}
						emptyMessage="This network is not connected to any containers."
					/>

					<div className="mt-6 text-sm text-neutral-500">
						<Globe className="inline h-4 w-4 mr-1" />
						<span>
							Driver: <strong>{selectedNetwork.driver}</strong> | Scope: {" "}
							<strong>{selectedNetwork.scope}</strong>
						</span>
					</div>
				</DockerDetailSidebar>
			)}
		</div>
	);
}
