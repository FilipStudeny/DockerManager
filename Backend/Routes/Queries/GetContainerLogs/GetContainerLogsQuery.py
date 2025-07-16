from fastapi import HTTPException
from Utils.getDocker import get_container


def get_container_logs_query(container_id: str, tail: int = 100) -> str:
    try:
        container = get_container(container_id)
        logs = container.logs(tail=tail).decode()
        return logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs for container {container_id}: {str(e)}")
