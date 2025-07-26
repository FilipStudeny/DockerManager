from docker.errors import NotFound, APIError, DockerException
from fastapi import HTTPException

from Models.models import GenericMessageResponse
from Utils.getDocker import get_docker_client
from Utils.logger import logger


def delete_docker_volume_query(volume_name: str) -> GenericMessageResponse:
    try:
        client = get_docker_client()

        try:
            volume = client.volumes.get(volume_name)
        except NotFound:
            raise HTTPException(status_code=404, detail=f"Volume '{volume_name}' not found")

        # Check if the volume is used by any container
        for container in client.containers.list(all=True):
            for mount in container.attrs.get("Mounts", []):
                if mount.get("Name") == volume_name:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Cannot delete volume '{volume_name}': in use by container '{container.name}'"
                    )

        volume.remove()
        return GenericMessageResponse(
            success=True,
            code=200,
            message=f"Volume '{volume_name}' deleted successfully."
        )

    except HTTPException as e:
        raise e

    except APIError as e:
        logger.error(f"Docker API error while deleting volume '{volume_name}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Docker API error: {str(e)}")

    except DockerException as e:
        logger.error(f"Docker client error while deleting volume '{volume_name}': {str(e)}")
        raise HTTPException(status_code=503, detail="Docker is unreachable or misconfigured")

    except Exception as e:
        logger.exception(f"Unexpected error while deleting volume '{volume_name}'")
        raise HTTPException(status_code=500, detail="Internal server error")
