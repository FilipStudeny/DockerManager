import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

export type RawStats = {
	cpu_percent: number,
	cpu_cores: number,
	per_cpu_usage: number[],
	memory_usage: number,
	memory_limit: number,
	memory_percent: number,
	network_rx: number,
	network_tx: number,
	blk_read: number,
	blk_write: number,
	uptime_seconds: number,
};

export function useContainerStats(containerId: string | null, enabled: boolean = true) {
	const [cpuData, setCpuData] = useState<{ time: number, value: number }[]>([]);
	const [memData, setMemData] = useState<{ time: number, value: number }[]>([]);
	const [memLimit, setMemLimit] = useState<number | null>(null);
	const [networkRx, setNetworkRx] = useState<number[]>([]);
	const [networkTx, setNetworkTx] = useState<number[]>([]);
	const [blockRead, setBlockRead] = useState<number[]>([]);
	const [blockWrite, setBlockWrite] = useState<number[]>([]);
	const [perCpuData, setPerCpuData] = useState<number[][]>([]);
	const [uptime, setUptime] = useState<number>(0);

	const wsRef = useRef<WebSocket | null>(null);
	const timestampRef = useRef(Date.now());
	const toastId = useRef<string | null>(null);
	const maxPoints = 60;

	useEffect(() => {
		if (!enabled || !containerId) return;

		const wsUrl = `ws://localhost:8000/ws/containers/${containerId}/stats`;
		const ws = new WebSocket(wsUrl);
		wsRef.current = ws;

		console.debug("[WebSocket] Connecting to", wsUrl);

		ws.onopen = () => {
			console.debug("[WebSocket] Connected");
			if (toastId.current) toast.dismiss(toastId.current);
			toastId.current = toast.success("Connected to live container stats", {
				id: "ws-connection",
			});
		};

		ws.onmessage = (event) => {
			try {
				const data: RawStats | { error: string } = JSON.parse(event.data);

				if ("error" in data) {
					console.error("[WebSocket] Error from backend:", data.error);
					toast.error("Backend error: " + data.error);
					ws.close();

					return;
				}

				const now = Date.now() - timestampRef.current;

				setCpuData((prev) => {
					const updated = [...prev, { time: now, value: data.cpu_percent }];

					return updated.length > maxPoints ? updated.slice(-maxPoints) : updated;
				});

				const usageMB = data.memory_usage / 1024 ** 2;
				const limitMB = data.memory_limit / 1024 ** 2;
				setMemLimit(limitMB);

				setMemData((prev) => {
					const updated = [...prev, { time: now, value: usageMB }];

					return updated.length > maxPoints ? updated.slice(-maxPoints) : updated;
				});

				setNetworkRx((prev) => {
					const updated = [...prev, data.network_rx];

					return updated.length > maxPoints ? updated.slice(-maxPoints) : updated;
				});
				setNetworkTx((prev) => {
					const updated = [...prev, data.network_tx];

					return updated.length > maxPoints ? updated.slice(-maxPoints) : updated;
				});
				setBlockRead((prev) => {
					const updated = [...prev, data.blk_read];

					return updated.length > maxPoints ? updated.slice(-maxPoints) : updated;
				});
				setBlockWrite((prev) => {
					const updated = [...prev, data.blk_write];

					return updated.length > maxPoints ? updated.slice(-maxPoints) : updated;
				});
				setPerCpuData((prev) => {
					const updated = [...prev, data.per_cpu_usage];

					return updated.length > maxPoints ? updated.slice(-maxPoints) : updated;
				});
				setUptime(data.uptime_seconds);
			} catch (err) {
				console.error("[WebSocket] Failed to parse message:", event.data, err);
			}
		};

		ws.onerror = (event) => {
			console.error("[WebSocket] Error occurred:", event);
			if (toastId.current) toast.dismiss(toastId.current);
			toastId.current = toast.error("WebSocket connection failed", {
				id: "ws-error",
			});
		};

		ws.onclose = (event) => {
			console.warn("[WebSocket] Connection closed:", event.reason || "No reason");
			if (toastId.current) toast.dismiss(toastId.current);
			toastId.current = toast("Disconnected from live stats", {
				id: "ws-close",
				icon: "⚠️",
			});
		};

		return () => {
			console.debug("[WebSocket] Cleanup");
			ws.close();
			toast.dismiss("ws-connection");
			toast.dismiss("ws-error");
			toast.dismiss("ws-close");
		};
	}, [containerId, enabled]);

	return {
		cpuData,
		memData,
		memLimit,
		perCpuData,
		networkRx,
		networkTx,
		blockRead,
		blockWrite,
		uptime,
	};
}
