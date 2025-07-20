import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Plus,
	Trash2,
	Settings,
	Cpu,
	HardDrive,
	RefreshCcw,
	Shield,
	Sliders,
	Network,
	Terminal,
	Info,
	Activity,
	Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { DashboardCard } from "..";

import { HelpTooltip } from "@/components/HelpTooltip";

export const Route = createFileRoute("/containers/create")({
	component: CreateContainerPage,
});

function CreateContainerPage() {
	const navigate = useNavigate();
	const [form, setForm] = useState({
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

	const updateField = (key: string, value: any) =>
		setForm((prev) => ({ ...prev, [key]: value }));

	const updateArrayField = (key: string, idx: number, value: string) => {
		setForm((prev) => ({
			...prev,
			[key]: prev[key].map((item, i) => (i === idx ? value : item)),
		}));
	};

	const addArrayField = (key: string) =>
		setForm((prev) => ({ ...prev, [key]: [...prev[key], ""] }));

	const removeArrayField = (key: string, idx: number) => {
		setForm((prev) => ({
			...prev,
			[key]: prev[key].filter((_, i) => i !== idx),
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const payload = {
			...form,
			env: form.env.filter(Boolean),
			ports: form.ports.filter(Boolean),
			volumes: form.volumes.filter(Boolean),
			labels: form.labels.filter(Boolean),
			build_args: form.buildArgs.filter(Boolean),
			links: form.links.filter(Boolean),
			capabilities: form.capabilities.filter(Boolean),
			healthchecks: form.healthchecks.filter(Boolean),
			bind_mounts: form.bindMounts.filter(Boolean),
			cpu_limit: form.cpuLimit ? parseFloat(form.cpuLimit) : undefined,
			memory_limit: form.memoryLimit ? parseInt(form.memoryLimit, 10) : undefined,
		};

		try {
			const res = await fetch("/containers", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) throw new Error("Failed");

			toast.success("Container created successfully");
			navigate({ to: "/containers" });
		} catch {
			toast.error("Failed to create container");
		}
	};

	return (
		<div className="p-6 mx-auto space-y-8">
			<h1 className="text-3xl font-bold text-gray-900">Create New Container</h1>

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
								<TextInput label="CPU Limit" value={form.cpuLimit} onChange={(v) => updateField("cpuLimit", v)} placeholder="e.g., 1.5" help="Maximum number of CPU cores (e.g., 0.5, 2)" />
								<TextInput label="Memory Limit (MB)" value={form.memoryLimit} onChange={(v) => updateField("memoryLimit", v)} placeholder="e.g., 512" help="Max memory in megabytes (e.g., 256, 2048)" />
							</div>
						</SectionCard>

						<SectionCard icon={<Network size={20} />} title="Networking">
							<div className="grid md:grid-cols-2 gap-6">
								<TextInput label="Network Mode" value={form.networkMode} onChange={(v) => updateField("networkMode", v)} placeholder="bridge, host..." help="Docker network mode to attach to (e.g., bridge, host)" />
								<ArrayField label="Links (container:alias)" help="Connect to other containers by alias" values={form.links} onChange={(i, v) => updateArrayField("links", i, v)} onAdd={() => addArrayField("links")} onRemove={(i) => removeArrayField("links", i)} />
							</div>
						</SectionCard>

						<SectionCard icon={<Info size={20} />} title="Build Arguments">
							<ArrayField label="Build Args (key=value)" help="Arguments passed during build phase" values={form.buildArgs} onChange={(i, v) => updateArrayField("buildArgs", i, v)} onAdd={() => addArrayField("buildArgs")} onRemove={(i) => removeArrayField("buildArgs", i)} />
						</SectionCard>

						<SectionCard icon={<Activity size={20} />} title="Capabilities">
							<ArrayField label="Linux Capabilities (e.g., NET_ADMIN)" help="Grant additional privileges" values={form.capabilities} onChange={(i, v) => updateArrayField("capabilities", i, v)} onAdd={() => addArrayField("capabilities")} onRemove={(i) => removeArrayField("capabilities", i)} />
						</SectionCard>

						<SectionCard icon={<Stethoscope size={20} />} title="Healthchecks">
							<ArrayField label="Healthcheck Command" help="Command to run for checking container health" values={form.healthchecks} onChange={(i, v) => updateArrayField("healthchecks", i, v)} onAdd={() => addArrayField("healthchecks")} onRemove={(i) => removeArrayField("healthchecks", i)} />
						</SectionCard>

						<SectionCard icon={<HardDrive size={20} />} title="Bind Mounts">
							<ArrayField label="Bind Mounts (/host:/container)" help="Host file system mounts" values={form.bindMounts} onChange={(i, v) => updateArrayField("bindMounts", i, v)} onAdd={() => addArrayField("bindMounts")} onRemove={(i) => removeArrayField("bindMounts", i)} />
						</SectionCard>
					</>
				)}

				<button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => setShowAdvanced((v) => !v)}>
					{showAdvanced ? "Hide advanced options" : "Show advanced options"}
				</button>

				<div className="flex justify-end">
					<button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 shadow-sm">
						Create Container
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

export function SectionCard({
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
