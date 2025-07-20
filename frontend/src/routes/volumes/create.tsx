import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "react-hot-toast";

import type { CreateVolumeRequest } from "@/client";

import { useCreateDockerVolume } from "@/actions/commands/createDockerVolume";

export const Route = createFileRoute("/volumes/create")({
	component: CreateVolumePage,
});

function CreateVolumePage() {
	const [name, setName] = useState("");
	const [driver, setDriver] = useState("local");

	const [labelKey, setLabelKey] = useState("");
	const [labelValue, setLabelValue] = useState("");
	const [labels, setLabels] = useState<Record<string, string>>({});

	const [optKey, setOptKey] = useState("");
	const [optValue, setOptValue] = useState("");
	const [driverOpts, setDriverOpts] = useState<Record<string, string>>({});

	const { mutate: createVolume, isPending } = useCreateDockerVolume();

	const handleAddLabel = () => {
		if (labelKey && labelValue) {
			setLabels((prev) => ({ ...prev, [labelKey]: labelValue }));
			setLabelKey("");
			setLabelValue("");
		}
	};

	const handleAddDriverOpt = () => {
		if (optKey && optValue) {
			setDriverOpts((prev) => ({ ...prev, [optKey]: optValue }));
			setOptKey("");
			setOptValue("");
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const payload: CreateVolumeRequest = {
			name,
			driver,
			labels,
			driver_opts: driverOpts,
		};

		toast.promise(
			new Promise((resolve, reject) => {
				createVolume(payload, {
					onSuccess: (data) => {
						resolve(data);
						toast.success(`Volume "${data.name}" created successfully.`);
					},
					onError: (err) => {
						reject(err);
						toast.error(err.message ?? "Failed to create volume.");
					},
				});
			}),
			{
				loading: "Creating volume...",
				success: () => null, // handled inside onSuccess
				error: () => null, // handled inside onError
			},
		);
	};

	return (
		<div className="p-6 space-y-8 bg-neutral-50 min-h-screen">
			<h1 className="text-3xl font-bold text-neutral-900">Create Docker Volume</h1>

			<form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow space-y-6 border border-neutral-200">
				{/* Volume Name */}
				<div>
					<label className="block text-sm font-medium text-neutral-700">Volume Name</label>
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
					<input
						value={driver}
						onChange={(e) => setDriver(e.target.value)}
						className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm"
					/>
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

				{/* Driver Options */}
				<div>
					<label className="block text-sm font-medium text-neutral-700 mb-1">Driver Options (optional)</label>
					<div className="flex gap-2 mb-2">
						<input
							value={optKey}
							onChange={(e) => setOptKey(e.target.value)}
							placeholder="Key"
							className="flex-1 px-3 py-2 border border-gray-300 rounded"
						/>
						<input
							value={optValue}
							onChange={(e) => setOptValue(e.target.value)}
							placeholder="Value"
							className="flex-1 px-3 py-2 border border-gray-300 rounded"
						/>
						<button type="button" onClick={handleAddDriverOpt} className="px-3 py-2 bg-gray-800 text-white rounded">
							Add
						</button>
					</div>
					{Object.entries(driverOpts).length > 0 && (
						<ul className="text-sm text-neutral-700">
							{Object.entries(driverOpts).map(([k, v]) => (
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
					{isPending ? "Creating..." : "Create Volume"}
				</button>
			</form>
		</div>
	);
}
