import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import {
	AlertTriangle,
	Play,
	Settings,
	Network,
	Disc,
	HardDrive,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { useAssignNetworkToContainer } from "@/actions/commands/addNetworkToContainer";
import { useGetContainerDetails } from "@/actions/queries/getContainerDetails";
import { useContainerStats } from "@/actions/queries/getContainerLiveStats";
import { useGetDockerNetworksSelectList } from "@/actions/queries/getDockerNetworksSelectList";
import { DataSection, DetailItem } from "@/components/DataSection";
import { LiveStatChart } from "@/components/LiveStatChart";
import { LoadingPage } from "@/components/LoadinPage";
import { ContainerLogsPanel } from "@/features/Container/ContainerLogsPanel";
import { ContainerStatusActions } from "@/features/Container/ContainerStatusActions";
import { ContainerVolumesPanel } from "@/features/Container/ContainerVolumesPanel";

export const Route = createFileRoute("/containers/$id/")({
	component: ContainerDetailsPage,
});

function ContainerDetailsPage() {
	const { id } = useParams({ strict: false }) as { id: string };
	const { data, isLoading, isError, refetch } = useGetContainerDetails(id);
	const isRunning = data?.status === "RUNNING";

	const isValidContainer = !isLoading && !isError && data && data.status?.toLowerCase().includes("run");

	const {
		cpuData,
		memData,
		memLimit,
		perCpuData,
		networkRx,
		networkTx,
		blockRead,
		blockWrite,
		uptime,
	} = useContainerStats(id, isValidContainer);

	const { data: networkList } = useGetDockerNetworksSelectList();
	const { mutate: assignNetwork, isPending: isAssigning } = useAssignNetworkToContainer(id);
	const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

	const extraStats = {
		cpu_cores: perCpuData.at(-1)?.length ?? 0,
		memory_percent:
            memData.at(-1)?.value && memLimit
            	? (memData.at(-1)!.value / memLimit) * 100
            	: null,
		network_rx: networkRx.at(-1) ?? 0,
		network_tx: networkTx.at(-1) ?? 0,
		blk_read: blockRead.at(-1) ?? 0,
		blk_write: blockWrite.at(-1) ?? 0,
		uptime_seconds: uptime,
	};

	if (isLoading) return <LoadingPage />;
	if (isError || !data) {
		return (
			<div className="p-6">
				<p className="text-red-600 font-semibold">Failed to load container details.</p>
			</div>
		);
	}

	return (
		<div className="p-4 space-y-6 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-4">
				<h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
					<Settings size={28} className="text-blue-600" />
					Container: {data.name}
				</h1>
				<ContainerStatusActions id={id} isRunning={isRunning} refetch={refetch}/>
			</div>

			{/* Metadata */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<DataSection title="General Info" icon={<Settings size={20} />}>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailItem label="ID" value={data.id} />
						<DetailItem label="Image" value={data.image.join(", ")} />
						<DetailItem label="Command" value={data.command} />
						<DetailItem label="Entrypoint" value={data.entrypoint ?? "—"} />
					</div>
				</DataSection>
				<DataSection title="Networking" icon={<Network size={20} />}>
					<div className="flex flex-col gap-4">
						{data.networks?.map((net) => (
							<div
								key={net.id}
								className="rounded-lg border border-gray-200 bg-white shadow-sm p-4 space-y-3"
							>
								<div className="flex items-center justify-between">
									<div className="text-lg font-semibold text-blue-800">{net.name}</div>
									<div className="flex gap-2">
										{net.internal && (
											<span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
												Internal
											</span>
										)}
										{net.attachable && (
											<span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
												Attachable
											</span>
										)}
									</div>
								</div>

								<hr className="border-t border-gray-200" />

								<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
									<DetailItem label="Driver" value={net.driver ?? "-"} />
									<DetailItem label="IP Address" value={net.ip_address ?? "—"} />
									<DetailItem label="Gateway" value={net.gateway ?? "—"} />
									<DetailItem label="Subnet" value={net.subnet ?? "—"} />
									<DetailItem label="Network ID" value={net.id} />
								</div>
							</div>
						))}

						{data.ports && data.ports?.length > 0 && (
							<div className="text-sm text-gray-700 mt-2">
								<DetailItem label="Ports" value={data.ports.length} />
							</div>
						)}
					</div>
				</DataSection>

				<DataSection title="Runtime Info" icon={<Play size={20} />}>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailItem label="Status" value={data.status} />
						<DetailItem label="State" value={data.state ?? "—"} />
						<DetailItem label="Uptime" value={extraStats.uptime_seconds ? "${extraStats.uptime_seconds}s" : "—"} />
						<DetailItem label="PID" value={data.pid ?? "—"} />
						<DetailItem label="Exit Code" value={data.exit_code ?? "—"} />
						<DetailItem label="CPU Limit" value={data.cpu_limit != null ? "${data.cpu_limit.toFixed(2)} cores" : "—"} />
						<DetailItem label="Platform" value={data.platform ?? "—"} />
						<DetailItem label="Privileged" value={data.privileged ? "Yes" : "No"} />
					</div>
				</DataSection>

				<DataSection title="Resources" icon={<Disc size={20} />}>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailItem label="CPU %" value={`${cpuData.at(-1)?.value?.toFixed(2) ?? "—"}%`} />
						<DetailItem label="Cores" value={extraStats.cpu_cores ?? "—"} />
						<DetailItem label="Memory Usage" value={`${memData.at(-1)?.value?.toFixed(2) ?? "—"} MB`} />
						<DetailItem label="Memory Limit" value={`${memLimit?.toFixed(2) ?? "—"} MB`} />
						<DetailItem label="Memory %" value={extraStats.memory_percent != null ? "${extraStats.memory_percent.toFixed(1)}%" : "—"} />
						<DetailItem label="Volumes Count" value={data.volumes} />
					</div>
				</DataSection>

				<DataSection title="Disk & Network I/O" icon={<HardDrive size={20} />}>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailItem label="Net RX" value={"${(extraStats.network_rx / 1024).toFixed(1)} KB"} />
						<DetailItem label="Net TX" value={"${(extraStats.network_tx / 1024).toFixed(1)} KB"} />
						<DetailItem label="Block Read" value={"${(extraStats.blk_read / 1024).toFixed(1)} KB"} />
						<DetailItem label="Block Write" value={"${(extraStats.blk_write / 1024).toFixed(1)} KB"} />
					</div>
				</DataSection>

				{data.restart_policy && (
					<DataSection title="Restart Policy">
						<ul className="text-sm text-gray-700 space-y-1">
							{Object.entries(data.restart_policy).map(([key, value]) => (
								<li key={key}>
									<span className="font-medium">{key}</span>: {String(value)}
								</li>
							))}
						</ul>
					</DataSection>
				)}

			</div>
			<DataSection title="Assign Network" icon={<Network size={20} />}>
				<div className="flex flex-col gap-3 max-w-sm">
					<select
						className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
						value={selectedNetwork ?? ""}
						onChange={(e) => {
							setSelectedNetwork(e.target.value);
						}}
					>
						<option value="" disabled>Select a network</option>
						{networkList?.map((net) => (
							<option key={net.id} value={net.name}>
								{net.name} — {net.gateway ?? "no gateway"}
							</option>
						))}
					</select>

					{selectedNetwork && (
						<div className="flex justify-between items-center gap-2">
							<p className="text-sm text-gray-600">
								Confirm assigning <strong>{selectedNetwork}</strong> to this container?
							</p>
							<button
								onClick={() => {
									assignNetwork(
										{ network_name: selectedNetwork },
										{
											onSuccess: () => {
												toast.success(`Network ${selectedNetwork} assigned to container`);
												setSelectedNetwork(null);
												refetch();
											},
											onError: (err) => {
												toast.error(err.message || "Failed to assign network");
											},
										},
									);
								}}
								disabled={isAssigning}
								className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded disabled:opacity-50"
							>
								{isAssigning ? "Assigning..." : "Confirm"}
							</button>
						</div>
					)}
				</div>
			</DataSection>

			{/* Charts */}
			{isValidContainer && (
				<DataSection title="Live Charts">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<LiveStatChart label="CPU %" data={cpuData} unit="%" />
						<LiveStatChart label="Memory MB" data={memData} unit="MB" limit={memLimit ?? undefined} />
						<LiveStatChart label="Network RX" data={networkRx.map((v, i) => ({ time: i, value: v / 1024 }))} unit="KB" />
						<LiveStatChart label="Network TX" data={networkTx.map((v, i) => ({ time: i, value: v / 1024 }))} unit="KB" />
						<LiveStatChart label="Block Read" data={blockRead.map((v, i) => ({ time: i, value: v / 1024 }))} unit="KB" />
						<LiveStatChart label="Block Write" data={blockWrite.map((v, i) => ({ time: i, value: v / 1024 }))} unit="KB" />
					</div>
				</DataSection>
			)}
			{(data?.mounts?.length ?? 0) > 0 && (
				<ContainerVolumesPanel
					mounts={data.mounts}
					containerId={id}
					onVolumeAttached={() => refetch()}
				/>
			)}

			{isValidContainer && perCpuData.length > 0 && (
				<DataSection title="Per-CPU Usage (nanoseconds)">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{perCpuData[perCpuData.length - 1].map((_, coreIndex) => {
							const coreSeries = perCpuData.map((values, i) => ({
								time: i,
								value: values[coreIndex] / 1_000_000_000, // to seconds
							}));

							return (
								<LiveStatChart
									key={coreIndex}
									label={`Core ${coreIndex}`}
									data={coreSeries}
									unit="s"
									compact
								/>
							);
						})}
					</div>
				</DataSection>
			)}

			{!isValidContainer && (
				<p className="text-sm text-gray-500 italic">Live charts are only available while the container is running.</p>
			)}

			{/* Env */}
			{(data?.env?.length ?? 0) > 0 && (
				<DataSection title="Environment Variables">
					<ul className="text-sm text-gray-700 space-y-1">
						{data.env!.map((e, idx) => (
							<li key={idx}>
								<code className="text-blue-600">{e}</code>
							</li>
						))}
					</ul>
				</DataSection>
			)}

			{/* Labels */}
			{data.labels && Object.keys(data.labels).length > 0 && (
				<DataSection title="Labels">
					<ul className="text-sm text-gray-700 space-y-1">
						{Object.entries(data.labels).map(([k, v]) => (
							<li key={k}><span className="font-medium">{k}</span>: {v}</li>
						))}
					</ul>
				</DataSection>
			)}

			{/* Logs */}
			{data.log_path && (
				<DataSection title="Log Path">
					<p className="text-sm text-gray-700">{data.log_path}</p>
				</DataSection>
			)}

			<DataSection title="Container Logs">
				<ContainerLogsPanel containerId={id} />
			</DataSection>

			{/* Errors */}
			{Boolean(data.error_count && data.error_count > 0) && (
				<section className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm">
					<h2 className="text-xl font-semibold text-red-800 mb-2 flex items-center gap-2">
						<AlertTriangle className="text-red-500" />
						Errors Detected
					</h2>
					<p className="text-red-700 text-sm">{data.latest_error_message}</p>
				</section>
			)}
			<Outlet />
		</div>

	);
}
