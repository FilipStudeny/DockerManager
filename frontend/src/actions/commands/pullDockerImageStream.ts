import { useMutation } from "@tanstack/react-query";

import type { DockerImageSummary } from "@/client";
import type { AxiosError } from "axios";

interface PullImageInput {
	repository: string,
	tag?: string,
	onLine?: (line: DockerPullProgress)=> void,
	onDone?: (summary: DockerImageSummary)=> void,
}

interface DockerPullProgress {
	id?: string,
	status?: string,
	progress?: string,
	progress_percent?: number,
	download_speed?: number,
	[layerKey: string]: any,
}

/**
 * Custom mutation to stream Docker image pull progress and receive final summary.
 */
export function usePullDockerImageStream() {
	return useMutation<void, AxiosError, PullImageInput>({
		mutationFn: async ({ repository, tag = "latest", onLine, onDone }) => {
			const response = await fetch("http://localhost:8000/images/pull/full", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ repository, tag }),
			});

			if (!response.ok) {
				throw new Error(`Failed to pull image: ${response.statusText}`);
			}

			const reader = response.body?.getReader();
			if (!reader) throw new Error("Unable to read stream from response");

			const decoder = new TextDecoder("utf-8");
			let buffer = "";

			while (true) {
				const { value, done } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				let newlineIndex: number;
				while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
					const line = buffer.slice(0, newlineIndex);
					buffer = buffer.slice(newlineIndex + 1);

					if (!line.trim()) continue;

					try {
						const parsed = JSON.parse(line);

						if ("summary" in parsed) {
							onDone?.(parsed.summary);
						} else {
							onLine?.(parsed);
						}
					} catch (err) {
						console.warn("Failed to parse streamed line:", line);
					}
				}
			}
		},
	});
}
