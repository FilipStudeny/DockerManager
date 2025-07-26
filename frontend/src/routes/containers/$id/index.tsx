import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import {
	AlertTriangle,
	Play,
	RotateCcw,
	StopCircle,
	Trash2,
	Settings,
	Network,
	Disc,
	HardDrive,
	HardDriveIcon,
	LinkIcon,
	PlusCircleIcon,
	Flame,
	Terminal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import type { AxiosError } from "axios";

import { useAssignNetworkToContainer } from "@/actions/commands/addNetworkToContainer";
import { useAttachVolumeToContainer } from "@/actions/commands/addVolumeToContainer";
import { useDeleteDockerContainer } from "@/actions/commands/deleteContainer";
import { useRestartContainer } from "@/actions/commands/restartContainer";
import { useStartContainer } from "@/actions/commands/startContainer";
import { useStopContainer } from "@/actions/commands/stopContainer";
import { useGetContainerDetails } from "@/actions/queries/getContainerDetails";
import { useContainerStats } from "@/actions/queries/getContainerLiveStats";
import { useInfiniteContainerLogs } from "@/actions/queries/getContainerLogs";
import { useGetDockerNetworksSelectList } from "@/actions/queries/getDockerNetworksSelectList";
import { useGetVolumesSelectList } from "@/actions/queries/getVolumesSelectList";
import { LiveStatChart } from "@/components/LiveStatChart";
import { LoadingPage } from "@/components/LoadinPage";

export const Route = createFileRoute("/containers/$id/")({
	component: ContainerDetailsPage,
});

function ContainerDetailsPage() {
	const { id } = useParams({ strict: false }) as { id: string };
	const { data, isLoading, isError, refetch } = useGetContainerDetails(id);

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

	const { mutate: startContainer, isPending: isStartingContainer } = useStartContainer(id);
	const {
		mutate: restartContainer,
		isPending: isRestartingContainer,
	} = useRestartContainer(id);

	const {
		mutate: stopContainer,
		isPending: isStoppingContainer,
	} = useStopContainer(id);
	const navigate = useNavigate();
	const { mutate: deleteContainer, isPending: isDeletingContainer } = useDeleteDockerContainer();
	const isRunning = data?.status === "RUNNING";
	const isAnyPending = isStartingContainer || isStoppingContainer || isRestartingContainer;
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

	const handleAction = async (action: "start" | "stop" | "restart" | "delete" | "forceDelete") => {
		if (action === "delete" || action === "forceDelete") {
			const force = action === "forceDelete";

			deleteContainer(
				{ containerId: id, force },
				{
					onSuccess: () => {
						toast.success("Container deleted successfully");
						navigate({ to: "/containers" });
					},
					onError: (error) => {
						const message = (error as AxiosError<{ detail: string }>).response?.data?.detail ?? "Failed to delete container";
						toast.error(message);
					},
				},
			);

			return;
		}

	};

	return (
		<div className="p-4 space-y-6 bg-gray-50 min-h-screen">
			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-4">
				<h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
					<Settings size={28} className="text-blue-600" />
					Container: {data.name}
				</h1>
				<div className="flex gap-2 flex-wrap">
					<ActionButton
						icon={<Play size={16} />}
						label={isStartingContainer ? "Starting..." : "Start"}
						color="green"
						disabled={isAnyPending || isRunning}
						onClick={() => {
							toast.promise(
								new Promise<void>((resolve, reject) => {
									startContainer(undefined, {
										onSuccess: () => {
											refetch();
											resolve();
										},
										onError: (err) => reject(err),
									});
								}),
								{
									loading: "Starting container...",
									success: "Container started successfully",
									error: "Failed to start container",
								},
							);
						}}
					/>
					<ActionButton
						icon={<RotateCcw size={16} />}
						label={isRestartingContainer ? "Restarting..." : "Restart"}
						color="yellow"
						disabled={isAnyPending || !isRunning}
						onClick={() => {
							toast.promise(
								new Promise<void>((resolve, reject) => {
									restartContainer(undefined, {
										onSuccess: () => {
											refetch();
											resolve();
										},
										onError: (err) => reject(err),
									});
								}),
								{
									loading: "Restarting container...",
									success: "Container restarted",
									error: "Failed to restart container",
								},
							);
						}}
					/>
					<ActionButton
						icon={<StopCircle size={16} />}
						label={isStoppingContainer ? "Stopping..." : "Stop"}
						color="red"
						disabled={isAnyPending || !isRunning}
						onClick={() => {
							toast.promise(
								new Promise<void>((resolve, reject) => {
									stopContainer(undefined, {
										onSuccess: () => {
											refetch();
											resolve();
										},
										onError: (err) => reject(err),
									});
								}),
								{
									loading: "Stopping container...",
									success: "Container stopped",
									error: "Failed to stop container",
								},
							);
						}}
					/>
					<DeleteButtonGroup
						onAction={handleAction}
						isLoading={isDeletingContainer}
						disabled={isAnyPending}
					/>
					<ActionButton
						icon={<Terminal size={16} />}
						label="Terminal"
						color="yellow"
						onClick={() => {
							navigate({ to: "/containers/$id/terminal", params: { id } });
						}}
					/>

				</div>
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

function DetailItem({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) {
	return (
		<div className="flex items-start gap-2">
			{icon && <span className="mt-0.5 text-gray-400">{icon}</span>}
			<div>
				<p className="text-xs text-gray-500">{label}</p>
				<p className="text-sm font-medium text-gray-900 break-all">{value}</p>
			</div>
		</div>
	);
}

function ActionButton({
	icon,
	label,
	color,
	onClick,
	darker = false,
	disabled = false,
}: {
	icon: React.ReactNode,
	label: string,
	color: "green" | "yellow" | "red",
	onClick: ()=> void,
	darker?: boolean,
	disabled?: boolean,
}) {
	const base = {
		green: "bg-green-500 hover:bg-green-600",
		yellow: "bg-yellow-400 hover:bg-yellow-500",
		red: darker ? "bg-red-700 hover:bg-red-800" : "bg-red-500 hover:bg-red-600",
	}[color];

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`${base} text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 shadow-sm transition whitespace-nowrap 
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
		>
			{icon}
			{label}
		</button>
	);
}

export function DataSection({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) {
	return (
		<section className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
			<h2 className="text-base font-semibold mb-3 text-gray-800 flex items-center gap-2">
				{icon}
				{title}
			</h2>
			{children}
		</section>
	);
}

export function ContainerLogsPanel({ containerId }: { containerId: string }) {
	const [fromDate, setFromDate] = useState<number | undefined>();
	const [toDate, setToDate] = useState<number | undefined>();

	const {
		data,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
	} = useInfiniteContainerLogs(containerId, 100, fromDate, toDate);

	const logs = useMemo(
		() => data?.pages.flatMap((page) => page.logs) ?? [],
		[data],
	);

	const handleDateFilter = (e: React.FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const from = (form.elements.namedItem("from") as HTMLInputElement).value;
		const to = (form.elements.namedItem("to") as HTMLInputElement).value;

		setFromDate(from ? Math.floor(new Date(from).getTime() / 1000) : undefined);
		setToDate(to ? Math.floor(new Date(to).getTime() / 1000) : undefined);
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="flex flex-wrap justify-between gap-4 items-center">
				<p className="text-sm text-gray-600">
					{isLoading
						? "Loading logs..."
						: isError
							? "Failed to load logs."
							: `Showing ${logs.length} log lines`}
				</p>
				<form onSubmit={handleDateFilter} className="flex items-center gap-2 text-xs">
					<input
						type="datetime-local"
						name="from"
						className="border rounded px-2 py-1"
						defaultValue={
							fromDate ? format(new Date(fromDate * 1000), "yyyy-MM-dd'T'HH:mm") : ""
						}
					/>
					<span>to</span>
					<input
						type="datetime-local"
						name="to"
						className="border rounded px-2 py-1"
						defaultValue={
							fromDate ? format(new Date(fromDate * 1000), "yyyy-MM-dd'T'HH:mm") : ""
						}
					/>
					<button type="submit" className="text-blue-600 hover:underline">
						Apply
					</button>
				</form>
				<button
					onClick={() => refetch()}
					className="text-xs text-blue-600 hover:underline"
					disabled={isLoading}
				>
					Refresh
				</button>
			</div>

			{/* Logs Display */}
			<div className="bg-black text-green-400 text-sm rounded-md p-3 overflow-auto max-h-[300px] font-mono border border-gray-700 space-y-1">
				{isLoading && <p className="text-gray-400">Loading...</p>}
				{isError && <p className="text-red-400">Error loading logs.</p>}
				{!isLoading && logs.length === 0 && (
					<p className="text-gray-500">No logs available.</p>
				)}
				{logs.map((log, idx) => (
					<div key={idx} className="whitespace-pre-wrap">
						<span className="text-gray-500 mr-2">{log.timestamp}</span>
						{log.message}
					</div>
				))}
				{isFetchingNextPage && <p className="text-gray-400">Loading more...</p>}
			</div>

			{/* Load More */}
			{hasNextPage && (
				<div className="flex justify-end">
					<button
						className="text-sm text-blue-600 hover:underline"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? "Loading..." : "Load more"}
					</button>
				</div>
			)}
		</div>
	);
}

interface Props {
	mounts: any,
	containerId: string,
	onVolumeAttached?: ()=> void,
}
export function ContainerVolumesPanel({ mounts, containerId, onVolumeAttached }: Props) {
	const { data: volumeList } = useGetVolumesSelectList();
	const [selectedVolume, setSelectedVolume] = useState<string | null>(null);
	const [mountPath, setMountPath] = useState("");
	const [isAddingVolume, setIsAddingVolume] = useState(false);
	const { mutate: attachVolume, isPending: isAttaching } = useAttachVolumeToContainer(containerId);
	const handleAddVolume = () => {
		if (!selectedVolume || !mountPath) return;

		attachVolume(
			{
				volume_name: selectedVolume,
				mount_path: mountPath,
				read_only: false,
			},
			{
				onSuccess: (response) => {
					toast.success(response.message || "Volume attached");
					onVolumeAttached?.();
					setIsAddingVolume(false);
					setSelectedVolume(null);
					setMountPath("");
				},
				onError: (error) => {
					toast.error(error.message || "Failed to attach volume");
				},
			},
		);
	};

	return (
		<DataSection title="Mounts" icon={<HardDriveIcon className="w-5 h-5" />}>
			<div className="grid gap-4 sm:grid-cols-2">
				{mounts?.map((m, i) => (
					<div key={i} className="rounded-xl border bg-white px-4 py-3 shadow-sm">
						<div className="flex items-center gap-2 font-medium text-blue-600">
							<HardDriveIcon className="w-4 h-4" />
							{m.destination || <span className="text-gray-400 italic">Unknown destination</span>}
						</div>
						<div className="text-sm text-gray-600 truncate mt-1">
							<span className="font-semibold">Source:</span>{" "}
							{m.source || <span className="italic text-gray-400">Not available</span>}
						</div>
						<div className="flex justify-between text-xs text-gray-500 mt-2">
							<span><span className="font-semibold">Type:</span> {m.type ?? "—"}</span>
							<span><span className="font-semibold">Mode:</span> {m.mode ?? "—"}</span>
						</div>
					</div>
				))}
			</div>

			<div className="mt-6">
				{isAddingVolume ? (
					<div className="mt-4 border border-gray-200 rounded-xl bg-gray-50 p-5 shadow-sm">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div className="flex flex-col">
								<label className="text-sm font-medium text-gray-700 mb-1">Volume</label>
								<select
									value={selectedVolume ?? ""}
									onChange={(e) => setSelectedVolume(e.target.value)}
									className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
								>
									<option value="">Select a volume</option>
									{volumeList?.volumes.map((v) => (
										<option key={v.id} value={v.name}>{v.name}</option>
									))}
								</select>
							</div>

							<div className="flex flex-col">
								<label className="text-sm font-medium text-gray-700 mb-1">Mount Path</label>
								<input
									type="text"
									placeholder="/path/in/container"
									value={mountPath}
									onChange={(e) => setMountPath(e.target.value)}
									className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
								/>
							</div>

						</div>

						<div className="flex justify-end gap-3 mt-5">
							<button
								onClick={() => setIsAddingVolume(false)}
								className="text-gray-500 hover:text-gray-700 text-sm"
							>
								Cancel
							</button>
							<button
								onClick={handleAddVolume}
								disabled={isAttaching}
								className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 ${isAttaching ? "opacity-50 cursor-not-allowed" : ""}`}
							>
								{isAttaching ? (
									<span className="animate-pulse">Attaching...</span>
								) : (
									<>
										<LinkIcon className="w-4 h-4" />
										Attach Volume
									</>
								)}
							</button>

						</div>
					</div>
				) : (
					<button
						onClick={() => setIsAddingVolume(true)}
						className="mt-5 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
					>
						<PlusCircleIcon className="w-4 h-4" />
						Add Volume
					</button>
				)}
			</div>
		</DataSection>
	);
}

function DeleteButtonGroup({
	onAction,
	isLoading,
	disabled,
}: {
	onAction: (type: "delete" | "forceDelete")=> void,
	isLoading: boolean,
	disabled?: boolean,
}) {
	const [open, setOpen] = useState(false);
	const [confirmStage, setConfirmStage] = useState<0 | 1 | 2>(0);
	const [actionType, setActionType] = useState<"delete" | "forceDelete" | null>(null);

	const getLabel = (type: "delete" | "forceDelete") => {
		const stages = {
			delete: ["Delete", "Confirm Delete", "Are you sure?"],
			forceDelete: ["Force Delete", "Confirm Force", "Force?"],
		};

		return stages[type][confirmStage] || stages[type][0];
	};

	const handleClick = (type: "delete" | "forceDelete") => {
		if (actionType !== type) {
			setActionType(type);
			setConfirmStage(1);

			return;
		}

		if (confirmStage === 1) {
			setConfirmStage(2);

			return;
		}

		onAction(type);
		setConfirmStage(0);
		setActionType(null);
		setOpen(false);
	};

	useEffect(() => {
		if (confirmStage > 0) {
			const timeout = setTimeout(() => {
				setConfirmStage(0);
				setActionType(null);
			}, 8000);

			return () => clearTimeout(timeout);
		}
	}, [confirmStage]);

	return (
		<div className="relative inline-block">
			<button
				onClick={() => setOpen(prev => !prev)}
				disabled={isLoading || disabled}
				className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 shadow-sm transition 
                ${isLoading || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
			>
				<Trash2 size={16} />
				Delete
				<span className="ml-1">▾</span>
			</button>

			{open && (
				<div className="absolute mt-1 right-0 bg-white border rounded shadow-lg z-10 text-sm w-48">
					{(["delete", "forceDelete"] as const).map((type) => (
						<button
							key={type}
							className={`flex w-full items-center justify-between px-3 py-2 hover:bg-gray-100 text-left 
                                ${actionType === type && confirmStage > 0 ? "bg-yellow-100 font-semibold" : ""}`}
							onClick={() => handleClick(type)}
							disabled={isLoading}
						>
							<span className="flex items-center gap-2">
								{type === "delete" ? <Trash2 size={14} /> : <Flame size={14} className="text-red-600" />}
								{getLabel(type)}
							</span>
							{actionType === type && confirmStage > 0 && <span className="text-yellow-600 text-xs">⚠</span>}
						</button>
					))}
					{confirmStage > 0 && (
						<div className="text-xs text-gray-500 px-3 py-2 border-t">
							Click again to confirm. Auto-cancels in 8s.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
