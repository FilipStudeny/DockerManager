from fastapi import HTTPException
from datetime import datetime, timedelta
from typing import Optional

from Models.models import ContainerLogsResponse, LogEntry
from Utils.getDocker import get_container


def get_container_logs_query(
	container_id: str,
	tail: int = 500,
	since: Optional[int] = None,
	until: Optional[int] = None
) -> ContainerLogsResponse:
	try:
		container = get_container(container_id)

		since_adjusted = since + 1 if since else None

		logs_bytes = container.logs(
			tail=tail if not since_adjusted and not until else "all",
			since=since_adjusted,
			until=until,
			timestamps=True,
		)
		raw_logs = logs_bytes.decode("utf-8").strip()
		lines = raw_logs.splitlines()

		parsed_logs = []
		for line in lines:
			# Format: "timestampZ message"
			if " " in line:
				timestamp_str, message = line.split(" ", 1)
				parsed_logs.append(LogEntry(
					timestamp=timestamp_str,
					message=message,
				))

		next_cursor = None
		if parsed_logs:
			last_ts_str = parsed_logs[-1].timestamp
			last_dt = datetime.fromisoformat(last_ts_str.replace("Z", "+00:00"))
			next_cursor = int(last_dt.timestamp())

		return ContainerLogsResponse(
			logs=parsed_logs,
			next_since=next_cursor,
			count=len(parsed_logs),
		)

	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f"Failed to fetch logs for container '{container_id}': {str(e)}"
		)
