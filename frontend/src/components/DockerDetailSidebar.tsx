import type { ReactNode } from "react";

interface DockerDetailSidebarProps {
	title: string,
	icon?: ReactNode,
	children?: ReactNode,
	footer?: ReactNode,
	onClose: ()=> void,
}

export function DockerDetailSidebar({
	title,
	icon,
	children,
	footer,
	onClose,
}: DockerDetailSidebarProps) {
	return (
		<div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white border-l border-neutral-200 shadow-lg z-50 flex flex-col">
			<div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
				<div className="flex items-center gap-2 overflow-hidden">
					{icon}
					<h2 className="text-lg font-semibold text-ellipsis whitespace-nowrap overflow-hidden max-w-[300px]">
						{title}
					</h2>
				</div>
				<button
					onClick={onClose}
					className="text-2xl font-bold text-neutral-500 hover:text-neutral-800 shrink-0"
				>
					×
				</button>
			</div>

			<div className="p-4 overflow-y-auto flex-1 space-y-4">{children}</div>

			{footer && <div className="border-t border-neutral-200 px-6 py-4">{footer}</div>}
		</div>
	);
}

interface ContainerBase {
	id: string,
	name?: string | null,
	status?: string | null,
	[key: string]: any,
}

export interface SidebarColumnConfig<T> {
	header: string,
	accessor?: keyof T,
	render?: (row: T)=> ReactNode,
	align?: "left" | "center" | "right",
	className?: string,
}

interface SidebarContainerTableProps<T extends ContainerBase> {
	containers: T[],
	columns: SidebarColumnConfig<T>[],
	emptyMessage?: string,
}

export function SidebarContainerTable<T extends ContainerBase>({
	containers,
	columns,
	emptyMessage = "No containers attached.",
}: SidebarContainerTableProps<T>) {
	if (!containers || containers.length === 0) {
		return <p className="text-sm text-neutral-500">{emptyMessage}</p>;
	}

	return (
		<table className="min-w-full text-sm text-left text-neutral-700">
			<thead>
				<tr className="border-b border-neutral-300">
					{columns.map((col, i) => (
						<th
							key={i}
							className={`py-2 pr-4 text-${col.align ?? "left"} font-medium ${col.className ?? ""}`}
						>
							{col.header}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{containers.map((container) => (
					<tr key={container.id} className="border-t border-neutral-100">
						{columns.map((col, i) => (
							<td
								key={i}
								className={`py-2 pr-4 text-${col.align ?? "left"} ${col.className ?? ""}`}
							>
								{col.render
									? col.render(container)
									: col.accessor
										? (container[col.accessor] as ReactNode)
										: null}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}
