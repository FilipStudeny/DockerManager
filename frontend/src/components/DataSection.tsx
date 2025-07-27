export function DataSection({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) {
	return (
		<section className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
			<h2 className="text-base font-semibold mb-3 text-gray-800 flex items-center gap-2">
				{icon}
				{title}
			</h2>
			{children}
		</section>
	);
}

export function DetailItem({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) {
	return (
		<div className="flex items-start gap-2">
			{icon && <span className="mt-0.5 text-gray-400">{icon}</span>}
			<div>
				<p className="text-xs text-gray-500">{label}</p>
				<p className="text-sm font-medium text-gray-900 break-all">{value}</p>
			</div>
		</div>
	);
}
