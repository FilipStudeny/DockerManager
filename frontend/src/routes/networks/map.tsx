import { createFileRoute } from "@tanstack/react-router";
import { Network, RefreshCw, Layers } from "lucide-react";
import { useRef, useMemo, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

import type { ContainerNode } from "@/client";

import { useGetNetworkMap } from "@/actions/queries/getNetworkMap";
import { DataSection } from "@/components/DataSection";

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

	const clusters = useMemo(() => {
		if (!data) return [];

		return data.nodes
			.filter((n) => n.type === "network")
			.map((n) => ({ id: n.id, label: n.label }));
	}, [data]);

	const toggleCluster = (clusterId: string) => {
		setCollapsedClusters((prev) =>
			prev.includes(clusterId)
				? prev.filter((id) => id !== clusterId)
				: [...prev, clusterId],
		);
	};

	const graphData = useMemo(() => {
		if (!data) return { nodes: [], links: [] };

		const normalizedNodes = data.nodes.map((n) =>
			n.type === "container" && n.clusterId === null
				? { ...n, clusterId: undefined }
				: n,
		);

		const visibleNodes = normalizedNodes.filter(
			(n) =>
				!(
					n.type === "container" &&
					collapsedClusters.includes(n.clusterId ?? "")
				),
		);

		const visibleLinks = data.links.filter((l) => {
			const sourceId =
				typeof l.source === "object" ? (l.source as any).id : l.source;
			const targetId =
				typeof l.target === "object" ? (l.target as any).id : l.target;

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

	const handleNodeClick = (node: Node) => {
		if (node.type === "network") {
			const wasCollapsed = collapsedClusters.includes(node.id);
			toggleCluster(node.id);
			if (wasCollapsed) return;
		}
	};

	return (
		<div className="flex flex-col h-screen text-gray-800">
			{/* Header */}
			<header className="px-6 py-3 flex items-center justify-between">
				<h1 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
					<Network className="w-5 h-5 text-blue-500" />
					Docker Network Map
				</h1>
				<button
					onClick={() => {
						fgRef.current?.zoomToFit(600);
						setCollapsedClusters([]);
					}}
					className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm"
				>
					<RefreshCw className="w-4 h-4" />
					Reset View
				</button>
			</header>

			<main className="flex flex-1 flex-col md:flex-row overflow-hidden">
				{/* Sidebar */}
				<aside className="w-full md:w-72 px-2 py-1 overflow-y-auto">
					<DataSection
						title="Networks"
						icon={<Layers className="w-4 h-4 text-blue-500" />}
					>
						<div className="flex items-center justify-between mb-3">
							<button
								onClick={() => setCollapsedClusters(clusters.map((c) => c.id))}
								className="text-xs text-blue-500 hover:underline"
							>
								Collapse All
							</button>
							<button
								onClick={() => setCollapsedClusters([])}
								className="text-xs text-blue-500 hover:underline"
							>
								Expand All
							</button>
						</div>

						<div className="space-y-2">
							{clusters.map((c) => {
								const isCollapsed = collapsedClusters.includes(c.id);
								const containerCount =
						data?.nodes.filter(
							(n): n is ContainerNode =>
								n.type === "container" && n.clusterId === c.id,
						).length ?? 0;

								return (
									<button
										key={c.id}
										onClick={() => toggleCluster(c.id)}
										className={`w-full text-left flex justify-between items-center px-3 py-2 text-sm font-medium rounded-md border transition-all ${
											isCollapsed
												? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
												: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200"
										}`}
									>
										<span>{c.label}</span>
										<span className="text-xs font-semibold">{containerCount}</span>
									</button>
								);
							})}
						</div>
					</DataSection>
				</aside>

				{/* Main Graph View */}
				<section className="flex-1 px-2 overflow-hidden py-1 ">
					<DataSection
						title="Network Graph"
						icon={<Network className="w-4 h-4 text-green-500" />}
					>
						<div className="relative w-full h-[60vh] md:h-[calc(100vh-180px)] overflow-hidden rounded border border-gray-200 bg-white">
							{isLoading && (
								<div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
									<p className="text-sm text-gray-700">Loading network map...</p>
								</div>
							)}

							<ForceGraph2D
								ref={fgRef}
								graphData={graphData as any}
								onNodeClick={handleNodeClick}
								nodeLabel={(n: Node) =>
									`${n.label}\nType: ${n.type}\nID: ${n.id}`
								}
								nodeCanvasObjectMode={() => "after"}
								nodeCanvasObject={(node: Node, ctx, globalScale) => {
									const fontSize = 14 / globalScale;
									ctx.font = `500 ${fontSize}px Inter, sans-serif`;
									ctx.fillStyle =
							node.type === "container" ? "#3b82f6" : "#10b981";

									ctx.beginPath();
									if (node.type === "network") {
										ctx.rect(node.x! - 7, node.y! - 7, 14, 14);
									} else {
										ctx.arc(node.x!, node.y!, 7, 0, 2 * Math.PI);
									}

									ctx.shadowColor = "rgba(0,0,0,0.2)";
									ctx.shadowBlur = 3;
									ctx.fill();

									ctx.shadowBlur = 0;
									ctx.fillStyle = "#374151";
									ctx.fillText(node.label, node.x! + 10, node.y! + 4);

									if (
										node.type === "network" &&
							collapsedClusters.includes(node.id)
									) {
										const count =
								data?.nodes.filter(
									(n): n is ContainerNode =>
										n.type === "container" && n.clusterId === node.id,
								).length ?? 0;

										ctx.fillStyle = "#ef4444";
										ctx.beginPath();
										ctx.arc(node.x! + 20, node.y! - 10, 6, 0, 2 * Math.PI);
										ctx.fill();

										ctx.fillStyle = "#fff";
										ctx.font = `bold ${10 / globalScale}px Inter`;
										ctx.fillText(`${count}`, node.x! + 17, node.y! - 7);
									}
								}}
								nodePointerAreaPaint={(node, color, ctx) => {
									ctx.fillStyle = color;
									if (node.type === "network") {
										ctx.fillRect(node.x! - 7, node.y! - 7, 14, 14);
									} else {
										ctx.beginPath();
										ctx.arc(node.x!, node.y!, 7, 0, 2 * Math.PI);
										ctx.fill();
									}
								}}
								linkColor={() => "rgba(120,120,120,0.25)"}
								enableNodeDrag={false}
								cooldownTicks={40}
							/>
						</div>
					</DataSection>
				</section>
			</main>

			<footer className="px-6 py-2 text-xs text-gray-500 border-t border-gray-200 bg-white">
				Showing {graphData.nodes.length} nodes and {graphData.links.length} links
			</footer>
		</div>
	);
}
