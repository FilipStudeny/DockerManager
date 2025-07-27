import { useNavigate } from "@tanstack/react-router";
import { Play, RotateCcw, StopCircle, Terminal } from "lucide-react";
import { toast } from "react-hot-toast";

import { DeleteButtonGroup } from "./DeleteButtonGroup";

import type { AxiosError } from "axios";

import { useDeleteDockerContainer } from "@/actions/commands/deleteContainer";
import { useRestartContainer } from "@/actions/commands/restartContainer";
import { useStartContainer } from "@/actions/commands/startContainer";
import { useStopContainer } from "@/actions/commands/stopContainer";
import { ActionButton } from "@/components/ActionButton";

interface Props {
	id: string,
	isRunning: boolean,
	refetch: ()=> void,
}

export function ContainerStatusActions({
	id,
	isRunning,
	refetch,
}: Props) {
	const navigate = useNavigate();

	const { mutate: startContainer, isPending: isStartingContainer } = useStartContainer(id);
	const {
		mutate: restartContainer,
		isPending: isRestartingContainer,
	} = useRestartContainer(id);

	const {
		mutate: stopContainer,
		isPending: isStoppingContainer,
	} = useStopContainer(id);
	const { mutate: deleteContainer, isPending: isDeletingContainer } = useDeleteDockerContainer();

	const isAnyPending = isStartingContainer || isStoppingContainer || isRestartingContainer;

	const handleAction = (action: "delete" | "forceDelete") => {
		const force = action === "forceDelete";
		deleteContainer(
			{ containerId: id, force },
			{
				onSuccess: () => {
					toast.success("Container deleted successfully");
					navigate({ to: "/containers" });
				},
				onError: (error: any) => {
					const message = (error as AxiosError<{ detail: string }>).response?.data?.detail ??
            "Failed to delete container";
					toast.error(message);
				},
			},
		);
	};

	return (
		<div className="flex gap-2 flex-wrap">
			<ActionButton
				icon={<Play size={16} />}
				label={isStartingContainer ? "Starting..." : "Start"}
				color="green"
				disabled={isAnyPending || isRunning}
				onClick={() => {
					toast.promise(
						new Promise<void>((resolve, reject) => {
							startContainer(undefined, {
								onSuccess: () => {
									refetch();
									resolve();
								},
								onError: (err: any) => reject(err),
							});
						}),
						{
							loading: "Starting container...",
							success: "Container started successfully",
							error: "Failed to start container",
						},
					);
				}}
			/>
			<ActionButton
				icon={<RotateCcw size={16} />}
				label={isRestartingContainer ? "Restarting..." : "Restart"}
				color="yellow"
				disabled={isAnyPending || !isRunning}
				onClick={() => {
					toast.promise(
						new Promise<void>((resolve, reject) => {
							restartContainer(undefined, {
								onSuccess: () => {
									refetch();
									resolve();
								},
								onError: (err: any) => reject(err),
							});
						}),
						{
							loading: "Restarting container...",
							success: "Container restarted",
							error: "Failed to restart container",
						},
					);
				}}
			/>
			<ActionButton
				icon={<StopCircle size={16} />}
				label={isStoppingContainer ? "Stopping..." : "Stop"}
				color="red"
				disabled={isAnyPending || !isRunning}
				onClick={() => {
					toast.promise(
						new Promise<void>((resolve, reject) => {
							stopContainer(undefined, {
								onSuccess: () => {
									refetch();
									resolve();
								},
								onError: (err: any) => reject(err),
							});
						}),
						{
							loading: "Stopping container...",
							success: "Container stopped",
							error: "Failed to stop container",
						},
					);
				}}
			/>
			<DeleteButtonGroup
				onAction={handleAction}
				isLoading={isDeletingContainer}
				disabled={isAnyPending}
			/>
			{ isRunning === true &&
			<ActionButton
				icon={<Terminal size={16} />}
				label="Terminal"
				color="yellow"
				onClick={() => {
					navigate({ to: "/containers/$id/terminal", params: { id } });
				}}
			/>
			}
		</div>
	);
}
