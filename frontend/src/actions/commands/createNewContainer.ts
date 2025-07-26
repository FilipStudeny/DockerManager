import { useMutation } from "@tanstack/react-query";

import type { CreateContainerRequest } from "@/client";
import type { AxiosError } from "axios";

interface StreamContainerLogsInput {
	request: CreateContainerRequest,
	onLine?: (line: string)=> void,
}

export function useCreateNewContainer() {
	return useMutation<void, AxiosError, StreamContainerLogsInput>({
		mutationFn: async ({ request, onLine }) => {
			const response = await fetch("http://localhost:8000/containers/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(request),
			});

			if (!response.ok) {
				throw new Error(`Failed to create container: ${response.statusText}`);
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
					onLine?.(line);
				}
			}
		},
	});
}
