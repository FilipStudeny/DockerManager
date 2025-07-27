import { format } from "date-fns";
import { useMemo, useState } from "react";

import { useInfiniteContainerLogs } from "@/actions/queries/getContainerLogs";

export function ContainerLogsPanel({ containerId }: { containerId: string }) {
	const [fromDate, setFromDate] = useState<number | undefined>();
	const [toDate, setToDate] = useState<number | undefined>();

	const {
		data,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
	} = useInfiniteContainerLogs(containerId, 100, fromDate, toDate);

	const logs = useMemo(
		() => data?.pages.flatMap((page) => page.logs) ?? [],
		[data],
	);

	const handleDateFilter = (e: React.FormEvent) => {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const from = (form.elements.namedItem("from") as HTMLInputElement).value;
		const to = (form.elements.namedItem("to") as HTMLInputElement).value;

		setFromDate(from ? Math.floor(new Date(from).getTime() / 1000) : undefined);
		setToDate(to ? Math.floor(new Date(to).getTime() / 1000) : undefined);
	};

	return (
		<div className="flex flex-col gap-4">
			{/* Header */}
			<div className="flex flex-wrap justify-between gap-4 items-center">
				<p className="text-sm text-gray-600">
					{isLoading
						? "Loading logs..."
						: isError
							? "Failed to load logs."
							: `Showing ${logs.length} log lines`}
				</p>
				<form onSubmit={handleDateFilter} className="flex items-center gap-2 text-xs">
					<input
						type="datetime-local"
						name="from"
						className="border rounded px-2 py-1"
						defaultValue={
							fromDate ? format(new Date(fromDate * 1000), "yyyy-MM-dd'T'HH:mm") : ""
						}
					/>
					<span>to</span>
					<input
						type="datetime-local"
						name="to"
						className="border rounded px-2 py-1"
						defaultValue={
							fromDate ? format(new Date(fromDate * 1000), "yyyy-MM-dd'T'HH:mm") : ""
						}
					/>
					<button type="submit" className="text-blue-600 hover:underline">
						Apply
					</button>
				</form>
				<button
					onClick={() => refetch()}
					className="text-xs text-blue-600 hover:underline"
					disabled={isLoading}
				>
					Refresh
				</button>
			</div>

			{/* Logs Display */}
			<div className="bg-black text-green-400 text-sm rounded-md p-3 overflow-auto max-h-[300px] font-mono border border-gray-700 space-y-1">
				{isLoading && <p className="text-gray-400">Loading...</p>}
				{isError && <p className="text-red-400">Error loading logs.</p>}
				{!isLoading && logs.length === 0 && (
					<p className="text-gray-500">No logs available.</p>
				)}
				{logs.map((log, idx) => (
					<div key={idx} className="whitespace-pre-wrap">
						<span className="text-gray-500 mr-2">{log.timestamp}</span>
						{log.message}
					</div>
				))}
				{isFetchingNextPage && <p className="text-gray-400">Loading more...</p>}
			</div>

			{/* Load More */}
			{hasNextPage && (
				<div className="flex justify-end">
					<button
						className="text-sm text-blue-600 hover:underline"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? "Loading..." : "Load more"}
					</button>
				</div>
			)}
		</div>
	);
}
