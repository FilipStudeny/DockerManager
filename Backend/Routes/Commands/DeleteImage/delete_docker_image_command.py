from docker.errors import DockerException, ImageNotFound, APIError
from fastapi import HTTPException

from Models.models import (
    GenericMessageResponse
)
from Utils.getDocker import get_docker_client
from Utils.logger import logger


def delete_docker_image_command(image_id: str):
    client = get_docker_client()

    # Look up the image to get its full ID
    try:
        image = client.images.get(image_id)
    except ImageNotFound:
        raise HTTPException(status_code=404, detail=f"Image '{image_id}' not found")
    except DockerException as e:
        logger.error(f"Docker client error while fetching image '{image_id}': {e}")
        raise HTTPException(status_code=503, detail="Docker is unreachable or misconfigured")

    # Check for containers using this image
    try:
        all_containers = client.containers.list(all=True)
        using = [
            c.name for c in all_containers
            if c.image.id == image.id
        ]
        if using:
            names = ", ".join(using)
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete image '{image_id}': used by container(s) {names}"
            )
    except DockerException as e:
        logger.error(f"Error listing containers for image '{image_id}': {e}")
        raise HTTPException(status_code=503, detail="Failed to verify image usage")

    # Safe to remove
    try:
        client.images.remove(image=image.id, force=True)
        return GenericMessageResponse(
            success=True,
            code=200,
            message=f"Image '{image_id}' deleted successfully."
        )
    except APIError as e:
        logger.error(f"Docker API error while deleting image '{image_id}': {e}")
        raise HTTPException(status_code=500, detail=f"Docker API error: {e}")
    except DockerException as e:
        logger.error(f"Docker client error while deleting image '{image_id}': {e}")
        raise HTTPException(status_code=503, detail="Docker is unreachable or misconfigured")
    except Exception as e:
        logger.exception(f"Unexpected error while deleting image '{image_id}'")
        raise HTTPException(status_code=500, detail="Internal server error")

