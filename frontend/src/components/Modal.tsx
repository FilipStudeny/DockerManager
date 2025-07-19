import type { ReactNode } from "react";

export function Modal({
	title,
	onClose,
	children,
}: {
	title: string,
	onClose: ()=> void,
	children: ReactNode,
}) {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full">
				<div className="flex items-center justify-between p-4 border-b border-neutral-200">
					<h2 className="text-lg font-semibold">{title}</h2>
					<button
						onClick={onClose}
						className="text-neutral-500 hover:text-neutral-800 text-xl font-bold"
					>
						×
					</button>
				</div>
				<div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
			</div>
		</div>
	);
}
