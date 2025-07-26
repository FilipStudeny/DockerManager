from docker.errors import DockerException, APIError
from fastapi import HTTPException, Query
from fastapi import Path

from Models.models import (
    GenericMessageResponse
)
from Utils.getDocker import get_container
from Utils.logger import logger


def delete_container_command(
        container_id: str = Path(..., description="Container ID or name"),
        force: bool = Query(False, description="Force remove running container")
):
    try:
        container = get_container(container_id)

        if not container:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")

        container.reload()
        if container.status == "running" and not force:
            raise HTTPException(
                status_code=400,
                detail=f"Container '{container.name}' is running. Use `force=true` to remove it."
            )

        container.remove(force=force)

        return GenericMessageResponse(
            success=True,
            code=200,
            message=f"Container '{container.name}' deleted successfully."
        )

    except APIError as e:
        logger.error(f"Docker API error while deleting container '{container_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Docker API error: {str(e)}")

    except DockerException as e:
        logger.error(f"Docker client error while deleting container '{container_id}': {str(e)}")
        raise HTTPException(status_code=503, detail="Docker is unreachable or misconfigured")

    except Exception as e:
        logger.exception(f"Unexpected error while deleting container '{container_id}'")
        raise HTTPException(status_code=500, detail="Internal server error")
