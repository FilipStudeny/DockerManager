import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, PlusIcon, XCircle, ImageIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import type { DockerImageSummary, ImageContainerInfo } from "@/client";
import type { AxiosError } from "axios";

import { useDeleteDockerImage } from "@/actions/commands/deleteDockerImage";
import { useGetDockerImages } from "@/actions/queries/getDockerImages";
import { listDockerImagesQueryKey } from "@/client/@tanstack/react-query.gen";
import { DataTable, type ColumnConfig } from "@/components/DataTable";
import { DockerDetailSidebar, SidebarContainerTable, type SidebarColumnConfig } from "@/components/DockerDetailSidebar";
import { NavItem } from "@/components/NavBar";

export const Route = createFileRoute("/images/")({
	component: ImagesPage,
});

const columns: ColumnConfig<DockerImageSummary>[] = [
	{ label: "ID", accessor: "id" },
	{ label: "Tags", render: (img) => img.tags.join(", ") || "—" },
	{
		label: "Size",
		render: (img) => `${(img.size / (1024 * 1024)).toFixed(1)} MB`,
	},
	{ label: "Created", accessor: "created" },
	{ label: "Architecture", accessor: "architecture" },
	{ label: "OS", accessor: "os" },
];

const imageContainerColumns: SidebarColumnConfig<ImageContainerInfo>[] = [
	{ header: "Name", accessor: "name" },
	{
		header: "Status",
		render: (c) => (
			<span className="flex items-center gap-1">
				{c.status === "RUNNING" ? (
					<CheckCircle className="h-4 w-4 text-green-600" />
				) : (
					<XCircle className="h-4 w-4 text-red-500" />
				)}
				<span>{c.status}</span>
			</span>
		),
	},
];

function ImagesPage() {
	const [search, setSearch] = useState("");
	const [selectedImage, setSelectedImage] = useState<DockerImageSummary | null>(null);
	const { data: imagesList, isLoading } = useGetDockerImages();
	const { mutate: deleteImage, isPending: isDeleting } = useDeleteDockerImage();
	const queryClient = useQueryClient();
	const isFetchingImages = useIsFetching({ queryKey: listDockerImagesQueryKey() }) > 0;
	const isTableLoading = isLoading || isFetchingImages;

	const filtered = imagesList?.filter((img) =>
		img.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())),
	) ?? [];

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
					isLoading={isTableLoading}
					onRowClick={(row) => setSelectedImage(row)}
					selectedRow={selectedImage}
				/>
			</div>

			{selectedImage && (
				<DockerDetailSidebar
					title={selectedImage.tags.join(", ") || "Unnamed Image"}
					icon={<ImageIcon className="h-5 w-5 text-blue-500" />}
					onClose={() => setSelectedImage(null)}
					footer={
						<button
							onClick={() => {
								toast.promise(
									new Promise((resolve, reject) => {
										deleteImage(selectedImage.id, {
											onSuccess: () => {
												queryClient.invalidateQueries({ queryKey: listDockerImagesQueryKey() });
												setSelectedImage(null);
												resolve("Image deleted");
											},
											onError: (error) => {
												const msg =
													(error as AxiosError<{ detail: string }>).response?.data?.detail ??
													"Failed to delete image";
												reject(msg);
											},
										});
									}),
									{
										loading: "Deleting image...",
										success: "Image deleted",
										error: (msg) => msg,
									},
								);
							}}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm w-full disabled:opacity-60"
						>
							Delete Image
						</button>
					}
				>
					<h3 className="text-sm font-medium text-neutral-600 uppercase tracking-wide">
						Used By Containers
					</h3>
					<SidebarContainerTable
						containers={selectedImage.containers ?? []}
						columns={imageContainerColumns}
						emptyMessage="This image is not used by any containers."
					/>

					<div className="mt-6 text-sm text-neutral-500">
						<span>
							ID: <strong>{selectedImage.id}</strong> | Size: <strong>{(selectedImage.size / 1024 / 1024).toFixed(1)} MB</strong>
						</span>
					</div>
				</DockerDetailSidebar>
			)}
		</div>
	);
}
