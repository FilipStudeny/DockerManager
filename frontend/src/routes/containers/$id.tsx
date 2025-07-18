import { createFileRoute, useParams } from "@tanstack/react-router";
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
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { useGetContainerDetails } from "@/actions/queries/getContainerDetails";
import { useContainerStats } from "@/actions/queries/getContainerLiveStats";
import { LiveStatChart } from "@/components/LiveStatChart";
import { LoadingPage } from "@/components/LoadinPage";

export const Route = createFileRoute("/containers/$id")({
	component: ContainerDetailsPage,
});

function ContainerDetailsPage() {
	const { id } = useParams({ strict: false }) as { id: string };
	const { data, isLoading, isError, refetch } = useGetContainerDetails(id);
	const [confirmDeleteStage, setConfirmDeleteStage] = useState<0 | 1 | 2>(0);

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

	const handleAction = async (action: "start" | "stop" | "restart" | "delete") => {
		if (action === "delete") {
			if (confirmDeleteStage === 0) {
				setConfirmDeleteStage(1);
				toast("Press delete again to confirm", { icon: "⚠️" });

				return;
			}

			if (confirmDeleteStage === 1) {
				setConfirmDeleteStage(2);
				toast("Final confirmation required", { icon: "⚠️" });

				return;
			}

			try {
				await fetch(`/containers/${id}`, { method: "DELETE" });
				toast.success("Container deleted");
			} catch {
				toast.error("Failed to delete container");
			}

			return;
		}

		try {
			await fetch(`/containers/${id}/${action}`, { method: "POST" });
			toast.success(`Container ${action}ed`);
			refetch();
		} catch {
			toast.error(`Failed to ${action} container`);
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
					<ActionButton icon={<Play size={16} />} label="Start" color="green" onClick={() => handleAction("start")} />
					<ActionButton icon={<RotateCcw size={16} />} label="Restart" color="yellow" onClick={() => handleAction("restart")} />
					<ActionButton icon={<StopCircle size={16} />} label="Stop" color="red" onClick={() => handleAction("stop")} />
					<ActionButton
						icon={<Trash2 size={16} />}
						label={["Delete", "Confirm Delete", "Are you sure?"][confirmDeleteStage]}
						color="red"
						darker={confirmDeleteStage > 0}
						onClick={() => handleAction("delete")}
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
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailItem label="IP Address" value={data.ip_address} />
						<DetailItem label="Network Mode" value={data.network_mode} />
						<DetailItem label="Ports" value={data.ports?.length || 0} />
					</div>
				</DataSection>
				<DataSection title="Runtime Info" icon={<Play size={20} />}>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailItem label="Status" value={data.status} />
						<DetailItem label="State" value={data.state ?? "—"} />
						<DetailItem label="Uptime" value={extraStats.uptime_seconds ? `${extraStats.uptime_seconds}s` : "—"} />
						<DetailItem label="PID" value={data.pid ?? "—"} />
						<DetailItem label="Exit Code" value={data.exit_code ?? "—"} />
						<DetailItem label="CPU Limit" value={data.cpu_limit != null ? `${data.cpu_limit.toFixed(2)} cores` : "—"} />
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
						<DetailItem label="Memory %" value={extraStats.memory_percent != null ? `${extraStats.memory_percent.toFixed(1)}%` : "—"} />
						<DetailItem label="Volumes Count" value={data.volumes} />
					</div>
				</DataSection>

				<DataSection title="Disk & Network I/O" icon={<HardDrive size={20} />}>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailItem label="Net RX" value={`${(extraStats.network_rx / 1024).toFixed(1)} KB`} />
						<DetailItem label="Net TX" value={`${(extraStats.network_tx / 1024).toFixed(1)} KB`} />
						<DetailItem label="Block Read" value={`${(extraStats.blk_read / 1024).toFixed(1)} KB`} />
						<DetailItem label="Block Write" value={`${(extraStats.blk_write / 1024).toFixed(1)} KB`} />
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
				<DataSection title="Mounts">
					<div className="space-y-3">
						{data.mounts!.map((m, i) => (
							<div
								key={i}
								className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
							>
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
									<div className="text-sm font-medium text-gray-800">
										{m.destination}
									</div>
									<span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 border border-gray-200 w-fit">
										{m.type ?? "unknown"}
									</span>
								</div>
								<div className="text-xs text-gray-600 mt-1 break-all">
									<span className="font-semibold">Source:</span>{" "}
									{m.source ?? "—"}
								</div>
								<div className="text-xs text-gray-600 break-all">
									<span className="font-semibold">Mode:</span>{" "}
									{m.mode ?? "—"}
								</div>
							</div>
						))}
					</div>
				</DataSection>
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
}: {
	icon: React.ReactNode,
	label: string,
	color: "green" | "yellow" | "red",
	onClick: ()=> void,
	darker?: boolean,
}) {
	const base = {
		green: "bg-green-500 hover:bg-green-600",
		yellow: "bg-yellow-400 hover:bg-yellow-500",
		red: darker ? "bg-red-700 hover:bg-red-800" : "bg-red-500 hover:bg-red-600",
	}[color];

	return (
		<button
			onClick={onClick}
			className={`${base} text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 shadow-sm transition whitespace-nowrap`}
		>
			{icon}
			{label}
		</button>
	);
}

function DataSection({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) {
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
