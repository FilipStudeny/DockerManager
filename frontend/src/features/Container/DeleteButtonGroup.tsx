import { Flame, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export function DeleteButtonGroup({
	onAction,
	isLoading,
	disabled,
}: {
	onAction: (type: "delete" | "forceDelete")=> void,
	isLoading: boolean,
	disabled?: boolean,
}) {
	const [open, setOpen] = useState(false);
	const [confirmStage, setConfirmStage] = useState<0 | 1 | 2>(0);
	const [actionType, setActionType] = useState<"delete" | "forceDelete" | null>(null);

	const getLabel = (type: "delete" | "forceDelete") => {
		const stages = {
			delete: ["Delete", "Confirm Delete", "Are you sure?"],
			forceDelete: ["Force Delete", "Confirm Force", "Force?"],
		};

		return stages[type][confirmStage] || stages[type][0];
	};

	const handleClick = (type: "delete" | "forceDelete") => {
		if (actionType !== type) {
			setActionType(type);
			setConfirmStage(1);

			return;
		}

		if (confirmStage === 1) {
			setConfirmStage(2);

			return;
		}

		onAction(type);
		setConfirmStage(0);
		setActionType(null);
		setOpen(false);
	};

	useEffect(() => {
		if (confirmStage > 0) {
			const timeout = setTimeout(() => {
				setConfirmStage(0);
				setActionType(null);
			}, 8000);

			return () => clearTimeout(timeout);
		}
	}, [confirmStage]);

	return (
		<div className="relative inline-block">
			<button
				onClick={() => setOpen(prev => !prev)}
				disabled={isLoading || disabled}
				className={`bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 shadow-sm transition 
                ${isLoading || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
			>
				<Trash2 size={16} />
				Delete
				<span className="ml-1">▾</span>
			</button>

			{open && (
				<div className="absolute mt-1 right-0 bg-white border rounded shadow-lg z-10 text-sm w-48">
					{(["delete", "forceDelete"] as const).map((type) => (
						<button
							key={type}
							className={`flex w-full items-center justify-between px-3 py-2 hover:bg-gray-100 text-left 
                                ${actionType === type && confirmStage > 0 ? "bg-yellow-100 font-semibold" : ""}`}
							onClick={() => handleClick(type)}
							disabled={isLoading}
						>
							<span className="flex items-center gap-2">
								{type === "delete" ? <Trash2 size={14} /> : <Flame size={14} className="text-red-600" />}
								{getLabel(type)}
							</span>
							{actionType === type && confirmStage > 0 && <span className="text-yellow-600 text-xs">⚠</span>}
						</button>
					))}
					{confirmStage > 0 && (
						<div className="text-xs text-gray-500 px-3 py-2 border-t">
							Click again to confirm. Auto-cancels in 8s.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
