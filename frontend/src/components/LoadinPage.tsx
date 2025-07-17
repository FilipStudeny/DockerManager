import { Loader2 } from "lucide-react";

export function LoadingPage() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-neutral-50">
			<div className="flex flex-col items-center gap-4 text-neutral-600">
				<Loader2 className="animate-spin" size={48} />
				<p className="text-lg font-medium">Loading...</p>
			</div>
		</div>
	);
}
