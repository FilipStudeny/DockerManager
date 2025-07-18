import { createFileRoute } from "@tanstack/react-router";
import { Network, RefreshCw } from "lucide-react";
import { useRef, useMemo, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

import { useGetNetworkMap } from "@/actions/queries/getNetworkMap";

export const Route = createFileRoute("/networks/map")({
	component: NetworkMapPage,
});

type Node = {
	id: string,
	label: string,
	type: "network" | "container",
	clusterId?: string,
	x?: number,
	y?: number,
};

function NetworkMapPage() {
	const { data, isLoading } = useGetNetworkMap();
	const fgRef = useRef<any>(null);
	const [collapsedClusters, setCollapsedClusters] = useState<string[]>([]);
	const hasZoomed = useRef(false);
	const clusters = useMemo(() => {
		if (!data) return [];

		return data.nodes
			.filter((n) => n.type === "network")
			.map((n) => ({ id: n.id, label: n.label }));
	}, [data]);

	const graphData = useMemo(() => {
		if (!data) return { nodes: [], links: [] };

		const normalizedNodes = data.nodes.map((n) => {
			if (n.type === "container" && n.clusterId === null) {
				return { ...n, clusterId: undefined };
			}

			return n;
		});

		const visibleNodes = normalizedNodes.filter(
			(n) =>
				!(n.type === "container" && collapsedClusters.includes(n.clusterId ?? "")),
		);
		const visibleLinks = data.links.filter((l) => {
			const sourceId = typeof l.source === "object" ? (l.source as any).id : l.source;
			const targetId = typeof l.target === "object" ? (l.target as any).id : l.target;

			const sourceNode = normalizedNodes.find((n) => n.id === sourceId);
			const targetNode = normalizedNodes.find((n) => n.id === targetId);
			if (!sourceNode || !targetNode) return false;

			return !(
				(sourceNode.type === "container" &&
					collapsedClusters.includes(sourceNode.clusterId ?? "")) ||
				(targetNode.type === "container" &&
					collapsedClusters.includes(targetNode.clusterId ?? ""))
			);
		});

		return { nodes: visibleNodes, links: visibleLinks };
	}, [data, collapsedClusters]);

	const toggleCluster = (clusterId: string) => {
		setCollapsedClusters((prev) =>
			prev.includes(clusterId)
				? prev.filter((id) => id !== clusterId)
				: [...prev, clusterId],
		);
	};

	const handleNodeClick = (node: Node) => {
		if (node.type === "network") {
			const wasCollapsed = collapsedClusters.includes(node.id);
			toggleCluster(node.id);
			if (wasCollapsed) return;

		}
	};

	return (
		<div className="flex flex-col h-screen bg-white">
			{/* Header */}
			<header className="px-6 py-4 border-b bg-white shadow-sm flex items-center justify-between">
				<h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
					<Network className="w-6 h-6 text-blue-600" />
					<span>Docker Network Map</span>
				</h1>
				<button
					className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow"
					onClick={() => {
						fgRef.current?.zoomToFit(600);
						setCollapsedClusters([]);
					}}
				>
					<RefreshCw className="w-4 h-4" />
					Reset View
				</button>
			</header>

			{/* Main content area */}
			<main className="flex flex-1 overflow-hidden">
				{/* Sidebar */}
				<aside className="w-60 border-r bg-gray-50 px-4 py-5 space-y-3 overflow-y-auto">
					<p className="text-xs text-gray-600 font-medium tracking-wide mb-2">
						Toggle Networks
					</p>
					{clusters.map((c) => (
						<button
							key={c.id}
							onClick={() => toggleCluster(c.id)}
							className={`w-full text-sm px-3 py-2 rounded flex items-center gap-2 transition-all font-medium ${
								collapsedClusters.includes(c.id)
									? "bg-gray-300 text-gray-700"
									: "bg-green-500 hover:bg-green-600 text-white"
							}`}
						>
							<Network className="w-4 h-4" />
							{c.label}
						</button>
					))}
				</aside>

				{/* Graph canvas */}
				<section className="flex-1 relative">
					{isLoading && (
						<div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
							<p className="text-gray-600 text-sm">Loading network map...</p>
						</div>
					)}

					<div className="absolute inset-0">
						const hasZoomed = useRef(false);

						...

						<ForceGraph2D
							ref={fgRef}
							graphData={{ links: graphData.links, nodes: graphData.nodes as any }}
							onNodeClick={handleNodeClick}
							nodeLabel={(n: Node) => `${n.label} (${n.type})`}
							nodeCanvasObjectMode={() => "after"}
							nodeCanvasObject={(node: Node, ctx, globalScale) => {
								const fontSize = 12 / globalScale;
								ctx.font = `${fontSize}px sans-serif`;
								ctx.fillStyle = node.type === "container" ? "#3b82f6" : "#10b981";
								ctx.beginPath();
								ctx.arc(node.x!, node.y!, 6, 0, 2 * Math.PI, false);
								ctx.fill();
								ctx.fillStyle = "#111";
								ctx.fillText(node.label, node.x! + 8, node.y! + 4);
							}}
							linkColor={() => "rgba(120,120,120,0.6)"}
							enableNodeDrag={false}
							enableZoomInteraction={false}
							enablePanInteraction={false}
							cooldownTicks={40}
						/>

					</div>

				</section>
			</main>
		</div>
	);
}
