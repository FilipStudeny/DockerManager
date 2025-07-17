import React from "react";

export interface ColumnConfig<T> {
	label: string,
	accessor?: keyof T,
	align?: "left" | "center" | "right",
	render?: (row: T)=> React.ReactNode,
	className?: string,
}

export interface DataTableProps<T> {
	data: T[],
	columns: ColumnConfig<T>[],
	keyAccessor?: (row: T, index: number)=> React.Key,
	emptyMessage?: string,
	isLoading?: boolean,
	skeletonRows?: number,
}

export function DataTable<T>({
	data,
	columns,
	keyAccessor,
	emptyMessage = "No data found.",
	isLoading = false,
	skeletonRows = 6,
}: DataTableProps<T>) {
	const rowsToRender = isLoading ? Array.from({ length: skeletonRows }) : data;

	return (
		<div className="rounded-2xl overflow-hidden shadow border border-neutral-200 bg-white">
			<div className="w-full overflow-x-auto">
				<table className="min-w-full text-sm text-neutral-800">
					<thead>
						<tr className="bg-neutral-100 text-xs font-semibold uppercase text-neutral-700 tracking-wider">
							{columns.map((col, i) => (
								<th
									key={i}
									className={`px-6 py-3 text-${col.align || "left"} ${col.className || ""}`}
								>
									{col.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-neutral-200">
						{!isLoading && data.length === 0 ? (
							<tr>
								<td colSpan={columns.length} className="px-6 py-8 text-center text-neutral-400">
									{emptyMessage}
								</td>
							</tr>
						) : (
							rowsToRender.map((_, index) => (
								<tr
									key={
										isLoading
											? `skeleton-${index}`
											: keyAccessor?.(data[index], index) ?? index
									}
									className="hover:bg-neutral-50 transition"
								>
									{columns.map((col, i) => (
										<td
											key={i}
											className={`px-6 py-4 text-${col.align || "left"}`}
										>
											{isLoading ? (
												<div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse"></div>
											) : col.render ? (
												col.render(data[index])
											) : (
												(data[index][col.accessor!] as React.ReactNode)
											)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
