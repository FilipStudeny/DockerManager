from fastapi import HTTPException
from docker.errors import NotFound
from Models.models import GenericMessageResponse
from Utils.getDocker import get_container
from Utils.logger import logger
import traceback

def start_container_command(container_id: str) -> GenericMessageResponse:
    try:
        logger.info(f"Attempting to start container: {container_id}")
        container = get_container(container_id)
        container.start()
        logger.info(f"Successfully started container: {container.name} ({container.id})")
        return GenericMessageResponse(success=True, code=200, message=f"Container '{container.name}' started.")
    except NotFound:
        logger.warning(f"Container not found: {container_id}")
        raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")
    except Exception as e:
        full_trace = traceback.format_exc()
        logger.error(f"Failed to start container '{container_id}': {e}\n{full_trace}")
        raise HTTPException(status_code=500, detail=f"Failed to start container: {str(e)}")
