import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

export function useContainerTerminal(
	containerId: string | null,
	onData: (data: string)=> void,
) {
	const wsRef = useRef<WebSocket | null>(null);
	const toastId = useRef<string | null>(null);
	const decoder = useRef(new TextDecoder());

	useEffect(() => {
		if (!containerId) return;

		const ws = new WebSocket(
			`ws://localhost:8000/ws/containers/${containerId}/terminal`,
		);
		ws.binaryType = "arraybuffer";
		wsRef.current = ws;

		ws.onopen = () => {
			toastId.current = toast.success("Connected to terminal", { id: "terminal-connected" });
		};

		ws.onmessage = (event) => {
			if (event.data instanceof ArrayBuffer) {
				const text = decoder.current.decode(event.data);
				onData(text);
			} else if (typeof event.data === "string") {
				try {
					const json = JSON.parse(event.data);
					if (json?.error) {
						toast.error("Terminal error: " + json.error);
					}
				} catch {
					onData(event.data);
				}
			}
		};

		ws.onerror = () => {
			toast.error("WebSocket terminal error", { id: "terminal-error" });
		};

		ws.onclose = () => {
			toast("Disconnected from terminal", { icon: "⚠️", id: "terminal-closed" });
		};

		return () => {
			ws.close();
			toast.dismiss("terminal-connected");
			toast.dismiss("terminal-error");
			toast.dismiss("terminal-closed");
		};
	}, [containerId, onData]);

	const send = useCallback((data: string) => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			wsRef.current.send(data);
		}
	}, []);

	return { send };
}
