import { Link } from "@tanstack/react-router";

export function DashboardCard({
	to,
	label,
	value,
	icon,
	onClick,
	selected = false,
}: {
	to?: string,
	label: string,
	value: string | number,
	icon: React.ReactNode,
	onClick?: ()=> void,
	selected?: boolean,
}) {
	const baseClass =
		"bg-white border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all";
	const borderColor = selected ? "border-blue-500" : "border-gray-200";
	const bgColor = selected ? "bg-blue-50" : "bg-white";

	const content = (
		<div className={`${baseClass} ${borderColor} ${bgColor}`}>
			<div className="bg-blue-100 text-blue-600 p-2 rounded-full">{icon}</div>
			<div className="flex flex-col justify-center">
				<span className="text-xs text-gray-500">{label}</span>
				<span className="text-lg font-bold text-gray-800">{value}</span>
			</div>
		</div>
	);

	if (to) {
		return <Link to={to}>{content}</Link>;
	}

	return (
		<button type="button" onClick={onClick} className="w-full text-left">
			{content}
		</button>
	);

}

export function DashboardCardSkeleton() {
	return (
		<div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
			<div className="bg-gray-200 rounded-full w-10 h-10" />
			<div className="flex flex-col justify-center w-full space-y-2">
				<div className="h-3 w-1/3 bg-gray-200 rounded" />
				<div className="h-5 w-1/2 bg-gray-300 rounded" />
			</div>
		</div>
	);
}
