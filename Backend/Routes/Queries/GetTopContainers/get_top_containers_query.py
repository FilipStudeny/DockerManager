from fastapi import HTTPException

from Models.models import ContainerStats
from Utils.getDocker import get_docker_client
from Utils.logger import logger

def get_top_containers_query():
    try:
        client = get_docker_client()
        containers = client.containers.list()
        dummy_data = [{"id": c.id[:12], "name": c.name, "cpu": 42.3, "memory": 30.4} for c in containers[:4]]
        return [ContainerStats(**d) for d in dummy_data]
    except Exception as e:
        logger.error("Docker connection error: %s", str(e))
        raise HTTPException(status_code=503, detail="Docker is not running or unreachable.")
