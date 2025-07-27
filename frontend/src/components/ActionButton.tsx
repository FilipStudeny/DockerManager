
export function ActionButton({
	icon,
	label,
	color,
	onClick,
	darker = false,
	disabled = false,
}: {
	icon: React.ReactNode,
	label: string,
	color: "green" | "yellow" | "red",
	onClick: ()=> void,
	darker?: boolean,
	disabled?: boolean,
}) {
	const base = {
		green: "bg-green-500 hover:bg-green-600",
		yellow: "bg-yellow-400 hover:bg-yellow-500",
		red: darker ? "bg-red-700 hover:bg-red-800" : "bg-red-500 hover:bg-red-600",
	}[color];

	return (
		<button
			onClick={onClick}
			disabled={disabled}
			className={`${base} text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 shadow-sm transition whitespace-nowrap 
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
		>
			{icon}
			{label}
		</button>
	);
}
