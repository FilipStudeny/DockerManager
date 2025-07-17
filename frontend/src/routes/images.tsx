import { DataTable, type ColumnConfig } from "@/components/DataTable";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";


export const Route = createFileRoute("/images")({
	component: DockerImagesPage,
});

interface DockerImageSummary {
	id: string,
	tags: string[],
	size: number,
	created?: string,
	architecture?: string,
	os?: string,
}

const mockImages: DockerImageSummary[] = [
	{
		id: "sha256:abcd1234",
		tags: ["nginx:1.25", "nginx:latest"],
		size: 134217728,
		created: "2025-07-16T14:20:00Z",
		architecture: "amd64",
		os: "linux",
	},
	{
		id: "sha256:efgh5678",
		tags: ["postgres:15"],
		size: 268435456,
		created: "2025-07-15T11:00:00Z",
		architecture: "arm64",
		os: "linux",
	},
];

function DockerImagesPage() {
	const [search, setSearch] = useState("");

	const filtered = mockImages.filter((img) =>
		img.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
	);

	const columns: ColumnConfig<DockerImageSummary>[] = [
		{ label: "ID", accessor: "id" },
		{ label: "Tags", render: (img) => img.tags.join(", ") },
		{
			label: "Size",
			render: (img) => `${(img.size / (1024 * 1024)).toFixed(1)} MB`,
		},
		{ label: "Created", accessor: "created" },
		{ label: "Architecture", accessor: "architecture" },
		{ label: "OS", accessor: "os" },
	];

	return (
		<div className="p-6 space-y-10 bg-neutral-50 min-h-screen">
			<h1 className="text-3xl font-bold text-neutral-900">Docker Images</h1>

			<div className="rounded-2xl overflow-hidden shadow border border-neutral-200 bg-white">
				<div className="bg-gray-900 border-b border-neutral-700 px-6 py-4">
					<input
						type="text"
						placeholder="🔍 Search images..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="px-4 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-lg w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<DataTable
					data={filtered}
					columns={columns}
					keyAccessor={(row) => row.id}
				/>
			</div>
		</div>
	);
}
