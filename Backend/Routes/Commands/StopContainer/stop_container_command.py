from fastapi import HTTPException
from docker.errors import NotFound
from Models.models import GenericMessageResponse
from Utils.getDocker import get_container
from Utils.logger import logger
import traceback

def stop_container_command(container_id: str) -> GenericMessageResponse:
    try:
        logger.info(f"Stopping container: {container_id}")
        container = get_container(container_id)
        container.stop()
        logger.info(f"Container stopped: {container.name} ({container.id})")
        return GenericMessageResponse(success=True, code=200, message=f"Container '{container.name}' stopped.")
    except NotFound:
        logger.warning(f"Container not found when stopping: {container_id}")
        raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")
    except Exception as e:
        full_trace = traceback.format_exc()
        logger.error(f"Error stopping container '{container_id}': {e}\n{full_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to stop container: {str(e)}")
