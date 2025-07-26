import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Plus, Trash2, Settings, Cpu, HardDrive, RefreshCcw, Shield,
	Sliders, Network, Terminal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { DashboardCard } from "..";

import type { CreateContainerRequest, RestartPolicyModel } from "@/client";

import { useCreateNewContainer } from "@/actions/commands/createNewContainer";
import { useGetDockerNetworksSelectList } from "@/actions/queries/getDockerNetworksSelectList";
import { HelpTooltip } from "@/components/HelpTooltip";

type FormState = {
	name: string,
	image: string,
	command: string,
	entrypoint: string,
	env: string[],
	ports: string[],
	volumes: string[],
	restartPolicy: string,
	privileged: boolean,
	cpuLimit: string,
	memoryLimit: string,
	labels: string[],
	networkMode: string,
	buildArgs: string[],
	links: string[],
	capabilities: string[],
	healthchecks: string[],
	bindMounts: string[],
};

export const Route = createFileRoute("/containers/create")({
	component: CreateContainerPage,
});

function CreateContainerPage() {
	const [form, setForm] = useState<FormState>({
		name: "",
		image: "",
		command: "",
		entrypoint: "",
		env: [""],
		ports: [""],
		volumes: [""],
		restartPolicy: "no",
		privileged: false,
		cpuLimit: "",
		memoryLimit: "",
		labels: [""],
		networkMode: "",
		buildArgs: [""],
		links: [""],
		capabilities: [""],
		healthchecks: [""],
		bindMounts: [""],
	});

	const [showAdvanced, setShowAdvanced] = useState(false);
	const [logLines, setLogLines] = useState<string[]>([]);
	const { mutate: createNewContainer, isPending: isPendingCreatingNewContainer } = useCreateNewContainer();
	const { data: networkOptions, isLoading: loadingNetworks } = useGetDockerNetworksSelectList();
	function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
		setForm((prev) => ({ ...prev, [key]: value }));
	}

	function updateArrayField<K extends keyof FormState>(key: K, idx: number, value: string) {
		if (!Array.isArray(form[key])) return;
		setForm((prev) => ({
			...prev,
			[key]: (prev[key] as string[]).map((item, i) => (i === idx ? value : item)) as FormState[K],
		}));
	}

	function addArrayField<K extends keyof FormState>(key: K) {
		if (!Array.isArray(form[key])) return;
		setForm((prev) => ({
			...prev,
			[key]: [...(prev[key] as string[]), ""] as FormState[K],
		}));
	}

	function removeArrayField<K extends keyof FormState>(key: K, idx: number) {
		if (!Array.isArray(form[key])) return;
		setForm((prev) => ({
			...prev,
			[key]: (prev[key] as string[]).filter((_, i) => i !== idx) as FormState[K],
		}));
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const ports: Record<number, number> = {};
		for (const entry of form.ports.filter(Boolean)) {
			const [host, container] = entry.split(":").map(Number);
			if (!isNaN(host) && !isNaN(container)) {
				ports[container] = host;
			}
		}

		const env: Record<string, string> = {};
		form.env.filter(Boolean).forEach((e) => {
			const [k, ...v] = e.split("=");
			if (k) env[k] = v.join("=");
		});

		const labels: Record<string, string> = {};
		form.labels.filter(Boolean).forEach((e) => {
			const [k, ...v] = e.split("=");
			if (k) labels[k] = v.join("=");
		});

		const volume_mounts = form.volumes.filter(Boolean).map((v) => {
			const [source, target] = v.split(":");

			return { volume_name: source, mount_path: target, read_only: false };
		});

		const validRestartPolicies: RestartPolicyModel["name"][] = [
			"no",
			"always",
			"on-failure",
			"unless-stopped",
		];

		const restartPolicyName = validRestartPolicies.includes(form.restartPolicy as any)
			? (form.restartPolicy as RestartPolicyModel["name"])
			: "no";

		const payload: CreateContainerRequest = {
			name: form.name,
			image: form.image,
			command: form.command ? form.command.trim().split(" ") : undefined,
			entrypoint: form.entrypoint ? form.entrypoint.trim().split(" ") : undefined,
			ports: Object.keys(ports).length > 0 ? ports : undefined,
			environment: Object.keys(env).length > 0 ? env : undefined,
			labels: Object.keys(labels).length > 0 ? labels : undefined,
			volume_mounts: volume_mounts.length > 0 ? volume_mounts : undefined,
			networks: form.networkMode ? [form.networkMode] : undefined,
			restart_policy:
				  restartPolicyName !== "no"
				  	? {
				  		name: restartPolicyName,
				  		maximum_retry_count: 0,
				  	}
				  	: undefined,
			start_after_create: true,
		};

		setLogLines([]);
		createNewContainer(
			{
				request: payload,
				onLine: (line) => {
					setLogLines((prev) => [...prev, line]);
				},
			},
			{
				onSuccess: () => {
					toast.success("Container created successfully");
				},
				onError: () => {
					toast.error("Failed to create container");
				},
			},
		);
	};

	return (
		<div className="p-6 mx-auto space-y-8">
			<h1 className="text-3xl font-bold text-gray-900">Create New Container</h1>
			{logLines.length > 0 && (
				<pre className="mt-6 p-4 bg-black text-white text-sm rounded-md max-h-96 overflow-auto border">
					{logLines.join("\n")}
				</pre>
			)}
			<form onSubmit={handleSubmit} className="space-y-8">
				<SectionCard icon={<Settings size={20} />} title="Basic Configuration">
					<div className="grid md:grid-cols-2 gap-6">
						<TextInput label="Name" value={form.name} onChange={(v) => updateField("name", v)} required help="Unique name for the container" />
						<TextInput label="Image" value={form.image} onChange={(v) => updateField("image", v)} required help="Docker image to use (e.g., nginx:latest)" />
						<TextInput label="Command" value={form.command} onChange={(v) => updateField("command", v)} help="Command to run inside the container (optional override)" />
						<TextInput label="Entrypoint" value={form.entrypoint} onChange={(v) => updateField("entrypoint", v)} help="Custom entrypoint to override default image behavior" />
					</div>
				</SectionCard>

				<SectionCard icon={<Sliders size={20} />} title="Quick Options">
					<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
						<DashboardCard label="Restart Policy" value={form.restartPolicy} icon={<RefreshCcw size={20} />} selected onClick={() => {
							const options = ["no", "always", "on-failure", "unless-stopped"];
							const currentIdx = options.indexOf(form.restartPolicy);
							const next = options[(currentIdx + 1) % options.length];
							updateField("restartPolicy", next);
						}} />
						<DashboardCard label="Privileged" value={form.privileged ? "Yes" : "No"} icon={<Shield size={20} />} selected={form.privileged} onClick={() => updateField("privileged", !form.privileged)} />
						<DashboardCard label="Env Vars" value={form.env.filter(Boolean).length} icon={<Settings size={20} />} />
						<DashboardCard label="Ports" value={form.ports.filter(Boolean).length} icon={<Cpu size={20} />} />
						<DashboardCard label="Volumes" value={form.volumes.filter(Boolean).length} icon={<HardDrive size={20} />} />
					</div>
				</SectionCard>

				{showAdvanced && (
					<>
						<SectionCard icon={<Terminal size={20} />} title="Advanced Configuration">
							<div className="grid md:grid-cols-2 gap-6">
								<ArrayField label="Environment Variables (KEY=VALUE)" help="Format: KEY=value" values={form.env} onChange={(i, v) => updateArrayField("env", i, v)} onAdd={() => addArrayField("env")} onRemove={(i) => removeArrayField("env", i)} />
								<ArrayField label="Ports (e.g., 8080:80)" help="Expose container ports (host:container)" values={form.ports} onChange={(i, v) => updateArrayField("ports", i, v)} onAdd={() => addArrayField("ports")} onRemove={(i) => removeArrayField("ports", i)} />
								<ArrayField label="Volumes (/host:/container)" help="Mount volumes from host" values={form.volumes} onChange={(i, v) => updateArrayField("volumes", i, v)} onAdd={() => addArrayField("volumes")} onRemove={(i) => removeArrayField("volumes", i)} />
								<ArrayField label="Labels (key=value)" help="Metadata for organizing containers" values={form.labels} onChange={(i, v) => updateArrayField("labels", i, v)} onAdd={() => addArrayField("labels")} onRemove={(i) => removeArrayField("labels", i)} />
							</div>
						</SectionCard>

						<SectionCard icon={<Network size={20} />} title="Networking">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
									Network Mode
									<HelpTooltip text="Select a Docker network to attach this container to" />
								</label>
								<select
									value={form.networkMode}
									onChange={(e) => updateField("networkMode", e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
								>
									<option value="">-- Select Network --</option>
									{loadingNetworks && <option disabled>Loading...</option>}
									{networkOptions?.map((network) => (
										<option key={network.id} value={network.name}>
											{network.name} {network.gateway ? `(${network.gateway})` : ""}
										</option>
									))}
								</select>
							</div>
						</SectionCard>
					</>
				)}

				<button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setShowAdvanced((v) => !v)}>
					{showAdvanced ? "Hide advanced options" : "Show advanced options"}
				</button>

				<div className="flex justify-end">
					<button
						type="submit"
						className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 shadow-sm"
						disabled={isPendingCreatingNewContainer}
					>
						{isPendingCreatingNewContainer ? "Creating..." : "Create Container"}
					</button>

				</div>
			</form>
		</div>
	);
}

function TextInput({ label, value, onChange, placeholder, required = false, help }: {
	label: string,
	value: string,
	onChange: (val: string)=> void,
	placeholder?: string,
	required?: boolean,
	help?: string,
}) {
	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
				{label}
				{help && <HelpTooltip text={help} />}
			</label>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required={required}
				placeholder={placeholder}
				className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-100"
			/>
		</div>
	);
}

function ArrayField({
	label,
	values,
	onChange,
	onAdd,
	onRemove,
	help,
}: {
	label: string,
	values: string[],
	onChange: (index: number, value: string)=> void,
	onAdd: ()=> void,
	onRemove: (index: number)=> void,
	help?: string,
}) {
	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
				{label}
				{help && <HelpTooltip text={help} />}
			</label>
			<div className="space-y-2">
				{values.map((val, i) => (
					<div key={i} className="flex items-center gap-2">
						<input
							type="text"
							value={val}
							onChange={(e) => onChange(i, e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
						/>
						<button
							type="button"
							onClick={() => onRemove(i)}
							className="text-red-500 hover:text-red-700"
							title="Remove"
						>
							<Trash2 size={16} />
						</button>
					</div>
				))}
				<button
					type="button"
					onClick={onAdd}
					className="text-blue-600 flex items-center gap-1 text-sm hover:underline"
				>
					<Plus size={14} />
					Add
				</button>
			</div>
		</div>
	);
}

function SectionCard({
	icon,
	title,
	children,
}: {
	icon: React.ReactNode,
	title: string,
	children: React.ReactNode,
}) {
	return (
		<section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
			<div className="flex items-center gap-3">
				<div className="bg-blue-100 text-blue-600 p-2 rounded-full">{icon}</div>
				<h2 className="text-lg font-semibold text-gray-800">{title}</h2>
			</div>
			<div>{children}</div>
		</section>
	);
}
