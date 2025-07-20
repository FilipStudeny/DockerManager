import { Info } from "lucide-react";
import { useState } from "react";

export function HelpTooltip({ text }: { text: string }) {
	const [open, setOpen] = useState(false);

	return (
		<div className="relative inline-block">
			<button
				type="button"
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				className="ml-1 text-gray-400 hover:text-gray-600"
			>
				<Info size={14} />
			</button>
			{open && (
				<div className="absolute z-10 w-64 p-2 text-xs text-white bg-gray-800 rounded shadow-md left-4 top-0">
					{text}
				</div>
			)}
		</div>
	);
}
