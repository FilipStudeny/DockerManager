import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, PlusIcon, XCircle, HardDrive } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import type { DockerVolumeSummary, VolumeContainerInfo } from "@/client";
import type { AxiosError } from "axios";

import { useDeleteDockerVolume } from "@/actions/commands/deleteDockerVolume";
import { useGetDockerVolumes } from "@/actions/queries/getDockerVolumes";
import { listDockerVolumesQueryKey } from "@/client/@tanstack/react-query.gen";
import { DataTable, type ColumnConfig } from "@/components/DataTable";
import { DockerDetailSidebar, SidebarContainerTable, type SidebarColumnConfig } from "@/components/DockerDetailSidebar";
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

const volumeContainerColumns: SidebarColumnConfig<VolumeContainerInfo>[] = [
	{ header: "Name", accessor: "name" },
	{
		header: "Status",
		render: (c) => (
			<span className="flex items-center gap-1">
				{c.status === "RUNNING" ? (
					<CheckCircle className="h-4 w-4 text-green-600" />
				) : (
					<XCircle className="h-4 w-4 text-red-500" />
				)}
				<span>{c.status}</span>
			</span>
		),
	},
	{ header: "Mount Path", accessor: "mountpoint" },
];

function VolumesPage() {
	const { data: volumes, isLoading } = useGetDockerVolumes();
	const [selectedVolume, setSelectedVolume] = useState<DockerVolumeSummary | null>(null);
	const [search, setSearch] = useState("");

	const queryClient = useQueryClient();
	const { mutate: deleteVolume, isPending: isDeleting } = useDeleteDockerVolume();
	const isFetchingVolumes = useIsFetching({ queryKey: listDockerVolumesQueryKey() }) > 0;
	const isTableLoading = isLoading || isFetchingVolumes;

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
					isLoading={isTableLoading}
					onRowClick={(row) => setSelectedVolume(row)}
					selectedRow={selectedVolume}
				/>
			</div>

			{selectedVolume && (
				<DockerDetailSidebar
					title={selectedVolume.name ?? "Unnamed Volume"}
					icon={<HardDrive className="h-5 w-5 text-blue-500" />}
					onClose={() => setSelectedVolume(null)}
					footer={
						<button
							onClick={() => {
								if (!selectedVolume?.name) return;
								toast.promise(
									new Promise((resolve, reject) => {
										deleteVolume(selectedVolume.name!, {
											onSuccess: () => {
												queryClient.invalidateQueries({ queryKey: listDockerVolumesQueryKey() });
												setSelectedVolume(null);
												resolve("Volume deleted");
											},
											onError: (error) => {
												const message =
													(error as AxiosError<{ detail: string }>).response?.data?.detail ??
													"Failed to delete volume";
												reject(message);
											},
										});
									}),
									{
										loading: "Deleting volume...",
										success: "Volume deleted",
										error: (errMsg) => errMsg,
									},
								);
							}}
							className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm w-full disabled:opacity-60"
							disabled={isDeleting}
						>
							Delete Volume
						</button>
					}
				>
					<h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
						Attached Containers
					</h3>

					<SidebarContainerTable
						containers={selectedVolume.containers ?? []}
						columns={volumeContainerColumns}
						emptyMessage="This volume is not attached to any containers."
					/>

					<div className="mt-6 text-sm text-neutral-500">
						<span>
							Driver: <strong>{selectedVolume.driver ?? "unknown"}</strong> | Mount Point: {" "}
							<strong>{selectedVolume.mountpoint ?? "unknown"}</strong>
						</span>
					</div>
				</DockerDetailSidebar>
			)}
		</div>
	);
}
