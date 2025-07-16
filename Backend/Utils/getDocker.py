from typing import Optional, Any

import docker
from fastapi import HTTPException
from Utils.logger import logger

def get_docker_client() -> docker.DockerClient:
    try:
        return docker.from_env()
    except docker.errors.DockerException as e:
        logger.error(f"Docker connection error: {e}")
        raise HTTPException(status_code=503, detail="Docker is not running or unreachable")


def get_container(container_id: str) -> Any:
    try:
        return get_docker_client().containers.get(container_id)
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"Container {container_id} not found")


def detect_container_errors(container: Any) -> tuple[int, Optional[str]]:
    try:
        logs = container.logs(tail=100).decode("utf-8", errors="ignore").lower()
        error_lines = [line for line in logs.splitlines() if
                       any(word in line for word in ["error", "fail", "exception"])]
        count = len(error_lines)
        latest = error_lines[-1] if error_lines else None
        return count, latest
    except Exception as e:
        logger.warning(f"Could not read logs for {container.name}: {e}")
        return 0, None


