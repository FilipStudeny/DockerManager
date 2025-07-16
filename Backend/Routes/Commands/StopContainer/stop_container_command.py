from fastapi import HTTPException
from docker.errors import NotFound
from Models.models import GenericMessageResponse
from Utils.getDocker import get_container


def stop_container_command(container_id: str) -> GenericMessageResponse:
    try:
        container = get_container(container_id)
        container.stop()
        return GenericMessageResponse(success=True, code=200, message=f"Container '{container.name}' stopped.")
    except NotFound:
        raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop container: {str(e)}")
