import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal as XTerm } from "@xterm/xterm";
import { TerminalSquare, ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";

import { useContainerTerminal } from "@/actions/queries/getContainerTerminal";
export const Route = createFileRoute("/containers/$id/terminal")({
	component: TerminalPage,
});

function TerminalPage() {
	const { id } = useParams({ strict: false }) as { id: string };
	const containerRef = useRef<HTMLDivElement>(null);
	const termRef = useRef<XTerm | null>(null);
	const fitRef = useRef<FitAddon | null>(null);
	const inputBuffer = useRef<string>("");

	const navigate = useNavigate();

	const { send } = useContainerTerminal(id, (data) => {
		if (termRef.current) {
			termRef.current.write(data);
		}
	});

	useEffect(() => {
		const term = new XTerm({
			cursorBlink: true,
			convertEol: true,
			fontSize: 14,
			scrollback: 1000,
			theme: {
				background: "#1e1e1e",
				foreground: "#d4d4d4",
			},
		});

		const fitAddon = new FitAddon();
		term.loadAddon(fitAddon);

		termRef.current = term;
		fitRef.current = fitAddon;

		if (containerRef.current) {
			term.open(containerRef.current);
		}

		const resizeObserver = new ResizeObserver(() => {
			if (fitRef.current) {
				fitRef.current.fit();
			}
		});
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		term.focus();

		term.onData((data) => {
			if (data === "\r") {
				send(inputBuffer.current + "\n");
				term.write("\r\n");
				inputBuffer.current = "";
			} else if (data === "\u007f") {
				if (inputBuffer.current.length > 0) {
					inputBuffer.current = inputBuffer.current.slice(0, -1);
					term.write("\b \b");
				}
			} else {
				inputBuffer.current += data;
				term.write(data);
			}
		});

		return () => {
			resizeObserver.disconnect();
			term.dispose();
		};
	}, [send]);

	return (
		<div className="flex flex-col min-h-screen bg-gray-100 overflow-hidden">
			{/* Header */}
			<div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4 shadow-sm flex items-center justify-between">
				<div className="flex items-center gap-3">
					<TerminalSquare className="text-blue-600 w-6 h-6" />
					<div className="flex flex-col">
						<h1 className="text-xl font-semibold text-gray-900">Terminal</h1>
						<span className="text-xs text-gray-500 font-mono">Container ID: {id}</span>
					</div>
				</div>

				<button
					onClick={() => navigate({ to: "/containers/$id", params: { id } })}
					className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
				>
					<ArrowLeft size={16} />
					Back
				</button>
			</div>

			{/* Terminal */}
			<div className="flex-1 m-6 rounded-xl border border-gray-300 bg-black overflow-hidden relative shadow-lg">
				<div
					ref={containerRef}
					className="absolute inset-0 w-full h-full overflow-hidden"
				/>
			</div>
		</div>
	);
}

export default TerminalPage;
