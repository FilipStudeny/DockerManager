import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

import type { DockerImageSummary } from "@/client";

import { usePullDockerImageStream } from "@/actions/commands/pullDockerImageStream";

export const Route = createFileRoute("/images/pull")({
	component: PullImagePage,
});

function PullImagePage() {
	const [repository, setRepository] = useState("");
	const [tag, setTag] = useState("latest");
	const [logs, setLogs] = useState<string[]>([]);
	const [summary, setSummary] = useState<DockerImageSummary | null>(null);

	const progressRef = useRef<Record<string, number>>({}); // track per-layer progress

	const { mutate: pullImage, isPending } = usePullDockerImageStream();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setLogs([]);
		setSummary(null);
		progressRef.current = {};

		const toastId = toast.loading("Pulling image...");

		pullImage({
			repository,
			tag,
			onLine: (line) => {
				if (line.status) {
					setLogs((prev) => [...prev, `[${line.id ?? "system"}] ${line.status}`]);
				}

				if (line.progress_percent != null && line.id) {
					progressRef.current[line.id] = line.progress_percent;

					const totalLayers = Object.keys(progressRef.current).length;
					const averageProgress =
						Object.values(progressRef.current).reduce((a, b) => a + b, 0) /
						totalLayers;

					toast.loading(`Pulling: ${averageProgress.toFixed(1)}%`, { id: toastId });
				}
			},
			onDone: (summaryData) => {
				setSummary(summaryData);
				toast.success("Image pulled successfully!", { id: toastId });
			},
		});
	};

	return (
		<div className="p-6 space-y-10 bg-neutral-50 min-h-screen">
			<h1 className="text-3xl font-bold text-neutral-900">Pull Docker Image</h1>

			<form
				onSubmit={handleSubmit}
				className="bg-white rounded-xl p-6 shadow space-y-4 border border-neutral-200"
			>
				<div className="space-y-2">
					<label className="block text-sm font-medium text-neutral-700">Repository</label>
					<input
						value={repository}
						onChange={(e) => setRepository(e.target.value)}
						required
						className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring focus:ring-blue-500"
						placeholder="e.g. nginx"
					/>
				</div>

				<div className="space-y-2">
					<label className="block text-sm font-medium text-neutral-700">Tag (optional)</label>
					<input
						value={tag}
						onChange={(e) => setTag(e.target.value)}
						className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring focus:ring-blue-500"
						placeholder="e.g. latest"
					/>
				</div>

				<button
					type="submit"
					disabled={isPending}
					className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
				>
					{isPending ? "Pulling..." : "Pull Image"}
				</button>
			</form>

			{Object.keys(progressRef.current).length > 0 && (
				<div className="space-y-2">
					<h2 className="text-sm text-neutral-700 font-semibold">Progress</h2>
					{Object.entries(progressRef.current).map(([layer, percent]) => (
						<div key={layer}>
							<div className="text-xs text-neutral-600 mb-1">{layer}</div>
							<div className="w-full bg-neutral-200 rounded">
								<div
									className="bg-blue-600 h-2 rounded"
									style={{ width: `${percent}%` }}
								/>
							</div>
						</div>
					))}
				</div>
			)}

			{logs.length > 0 && (
				<div className="bg-black text-green-300 font-mono p-4 rounded-lg text-sm overflow-auto max-h-64 shadow-inner border border-gray-800">
					{logs.map((log, idx) => (
						<div key={idx}>{log}</div>
					))}
				</div>
			)}

			{summary && (
				<div className="bg-white border border-neutral-200 rounded-xl p-6 shadow space-y-2">
					<h2 className="text-lg font-semibold text-neutral-800">Image Summary</h2>
					<div><strong>ID:</strong> {summary.id}</div>
					<div><strong>Tags:</strong> {summary.tags.join(", ")}</div>
					<div><strong>Size:</strong> {(summary.size / 1024 / 1024).toFixed(1)} MB</div>
					<div><strong>Created:</strong> {summary.created}</div>
					<div><strong>Architecture:</strong> {summary.architecture}</div>
					<div><strong>OS:</strong> {summary.os}</div>
				</div>
			)}
		</div>
	);
}
