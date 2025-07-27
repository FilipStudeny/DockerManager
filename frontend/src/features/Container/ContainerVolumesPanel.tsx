import { HardDriveIcon, LinkIcon, PlusCircleIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { useAttachVolumeToContainer } from "@/actions/commands/addVolumeToContainer";
import { useGetVolumesSelectList } from "@/actions/queries/getVolumesSelectList";
import { DataSection } from "@/components/DataSection";

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
				{mounts?.map((m: any, i: any) => (
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
