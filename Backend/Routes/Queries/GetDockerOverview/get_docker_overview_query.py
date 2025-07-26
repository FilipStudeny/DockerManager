from docker.errors import DockerException
from fastapi import HTTPException

from Models.models import DockerOverview
from Utils.getDocker import get_docker_client
from Utils.logger import logger


def get_docker_overview_query():
    try:
        client = get_docker_client()
        all_containers = client.containers.list(all=True)
        running = client.containers.list(filters={"status": "running"})
        exited = client.containers.list(filters={"status": "exited"})
        images = client.images.list()
        volumes = client.volumes.list()

        # Swarm status from client.info()
        try:
            docker_info = client.info()
            swarm_state = docker_info.get("Swarm", {}).get("LocalNodeState", "inactive")
            is_swarm_active = swarm_state == "active"
        except Exception:
            is_swarm_active = False

        total_log_lines = 0
        for container in all_containers:
            try:
                logs = container.logs(tail=1000)
                total_log_lines += len(logs.splitlines())
            except Exception:
                continue

        return DockerOverview(
            version=client.version()["Version"],
            total_containers=len(all_containers),
            running_containers=len(running),
            failed_containers=len(exited),
            images=len(images),
            volumes=len(volumes),
            logs_count=total_log_lines,
            is_swarm_active=is_swarm_active,
        )
    except Exception as e:
        logger.error("Docker connection error: %s", str(e))
        raise HTTPException(status_code=503, detail="Docker is not running or unreachable.")
