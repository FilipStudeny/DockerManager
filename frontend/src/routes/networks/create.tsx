import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "react-hot-toast";

import type { CreateDockerNetworkRequest } from "@/client";

import { useCreateDockerNetwork } from "@/actions/commands/createDockerNetwork";
import { useDockerOverview } from "@/actions/queries/getDockerOverview";

export const Route = createFileRoute("/networks/create")({
	component: CreateNetworkPage,
});

function CreateNetworkPage() {
	const { data: dockerStatus } = useDockerOverview();
	const [name, setName] = useState("");
	const [driver, setDriver] = useState("bridge");

	const [labelKey, setLabelKey] = useState("");
	const [labelValue, setLabelValue] = useState("");
	const [labels, setLabels] = useState<Record<string, string>>({});

	const { mutate: createNetwork, isPending } = useCreateDockerNetwork();

	const handleAddLabel = () => {
		if (labelKey && labelValue) {
			setLabels((prev) => ({ ...prev, [labelKey]: labelValue }));
			setLabelKey("");
			setLabelValue("");
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const payload: CreateDockerNetworkRequest = {
			name,
			driver,
			labels,
		};

		toast.promise(
			new Promise((resolve, reject) => {
				createNetwork(payload, {
					onSuccess: (data) => {
						resolve(data);
						toast.success(`Network "${payload.name}" created successfully.`);
					},
					onError: (err) => {
						reject(err);
						toast.error(err.message ?? "Failed to create network.");
					},
				});
			}),
			{
				loading: "Creating network...",
				success: () => null,
				error: () => null,
			},
		);
	};

	return (
		<div className="p-6 space-y-8 bg-neutral-50 min-h-screen">
			<h1 className="text-3xl font-bold text-neutral-900">Create Docker Network</h1>

			<form
				onSubmit={handleSubmit}
				className="bg-white rounded-xl p-6 shadow space-y-6 border border-neutral-200"
			>
				{/* Network Name */}
				<div>
					<label className="block text-sm font-medium text-neutral-700">Network Name</label>
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
						className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring focus:ring-blue-500"
					/>
				</div>

				{/* Driver */}
				<div>
					<label className="block text-sm font-medium text-neutral-700">Driver</label>
					<select
						value={driver}
						onChange={(e) => setDriver(e.target.value)}
						className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm"
					>
						<option value="bridge">bridge – private network on host (default)</option>
						{dockerStatus?.is_swarm_active ? (
							<option value="overlay">overlay – multi-host communication (Swarm)</option>
						) : (
							<option value="overlay" disabled>
								overlay – requires Swarm (inactive)
							</option>
						)}
						<option value="macvlan">macvlan – assign MAC address, LAN visible</option>
					</select>
					<p className="mt-1 text-sm text-neutral-500">
						Choose how containers communicate. Some drivers require special host or cluster setup.
					</p>
					{driver === "overlay" && !dockerStatus?.is_swarm_active && (
						<p className="mt-1 text-sm text-red-600">
							⚠️ Swarm mode is not active. Run <code>docker swarm init</code> to use overlay networking.
						</p>
					)}
				</div>

				{/* Labels */}
				<div>
					<label className="block text-sm font-medium text-neutral-700 mb-1">Labels (optional)</label>
					<div className="flex gap-2 mb-2">
						<input
							value={labelKey}
							onChange={(e) => setLabelKey(e.target.value)}
							placeholder="Key"
							className="flex-1 px-3 py-2 border border-gray-300 rounded"
						/>
						<input
							value={labelValue}
							onChange={(e) => setLabelValue(e.target.value)}
							placeholder="Value"
							className="flex-1 px-3 py-2 border border-gray-300 rounded"
						/>
						<button type="button" onClick={handleAddLabel} className="px-3 py-2 bg-gray-800 text-white rounded">
							Add
						</button>
					</div>
					{Object.entries(labels).length > 0 && (
						<ul className="text-sm text-neutral-700">
							{Object.entries(labels).map(([k, v]) => (
								<li key={k}>
									<strong>{k}</strong>: {v}
								</li>
							))}
						</ul>
					)}
				</div>

				{/* Submit */}
				<button
					type="submit"
					disabled={isPending}
					className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
				>
					{isPending ? "Creating..." : "Create Network"}
				</button>
			</form>
		</div>
	);
}
