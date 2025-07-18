import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ReferenceLine,
} from "recharts";

export type RawStats = {
	cpu_percent: number,
	memory_usage: number,
	memory_limit: number,
};

interface LiveStatChartProps {
	label: string,
	data: { time: number, value: number }[],
	unit: string,
	limit?: number,
	color?: string,
}
interface LiveStatChartProps {
	label: string,
	data: { time: number, value: number }[],
	unit: string,
	limit?: number,
	color?: string,
	compact?: boolean,
}

export function LiveStatChart({
	label,
	data,
	unit,
	limit,
	color = "#3b82f6",
	compact = false,
}: LiveStatChartProps) {
	const latest = data.at(-1)?.value;

	return (
		<div
			className={`w-full ${compact ? "h-40" : "h-64"} rounded-xl bg-[#1f1f2d] border border-[#2f2f40] shadow-md px-4 py-3`}
		>
			<div className="flex items-center justify-between mb-2">
				<div className="text-xs font-semibold text-gray-300">{label}</div>
				<div className="text-sm font-mono text-white">
					{latest != null ? `${latest.toFixed(2)} ${unit}` : "—"}
				</div>
			</div>
			<ResponsiveContainer width="100%" height="85%">
				<LineChart data={data}>
					<CartesianGrid stroke="#2f2f40" vertical={false} />
					<XAxis
						dataKey="time"
						tickFormatter={(t) => `${(t / 1000).toFixed(0)}s`}
						tick={{ fontSize: 10, fill: "#a1a1aa" }}
						axisLine={false}
						tickLine={false}
						padding={{ left: 4, right: 4 }}
					/>
					<YAxis
						tickFormatter={(v) => `${v}${unit}`}
						tick={{ fontSize: 10, fill: "#a1a1aa" }}
						axisLine={false}
						tickLine={false}
						width={50}
					/>
					<Tooltip
						contentStyle={{
							backgroundColor: "#28283a",
							border: "1px solid #444",
							borderRadius: 6,
							fontSize: "0.75rem",
							color: "#fff",
						}}
						labelFormatter={(label) => `Time: ${(label / 1000).toFixed(1)}s`}
						formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, label]}
					/>
					{limit != null && (
						<ReferenceLine
							y={limit}
							stroke="#ef4444"
							strokeDasharray="4 4"
							label={{
								value: `Limit: ${limit}${unit}`,
								position: "top",
								fill: "#ef4444",
								fontSize: 10,
							}}
						/>
					)}
					<Line
						type="monotone"
						dataKey="value"
						stroke={color}
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
						fillOpacity={0.05}
						fill={color}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
