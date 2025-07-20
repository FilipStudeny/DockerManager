import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import type { DockerImageSummary } from "@/client";

import { useGetDockerImages } from "@/actions/queries/getDockerImages";
import { DataTable, type ColumnConfig } from "@/components/DataTable";
import { NavItem } from "@/components/NavBar";

export const Route = createFileRoute("/images/")({
	component: DockerImagesPage,
});

function DockerImagesPage() {
	const [search, setSearch] = useState("");
	const { data: imagesList, isLoading: isLoadingDockerImages } = useGetDockerImages();

	const filtered = imagesList
		? imagesList.filter((img) =>
			img.tags.some((tag) =>
				tag.toLowerCase().includes(search.toLowerCase()),
			),
		)
		: [];

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
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-neutral-900">Docker Images</h1>

				<NavItem
					to="/images/pull"
					icon={<PlusIcon size={16} />}
					className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
				>
					Pull New Image
				</NavItem>
			</div>
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
					isLoading={isLoadingDockerImages}
				/>
			</div>
		</div>
	);
}
