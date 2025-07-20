from docker.errors import APIError
from fastapi import HTTPException
from Models.models import CreateVolumeRequest, CreatedVolumeResponse
from Utils.getDocker import get_docker_client
from Utils.logger import logger

def create_volume_command(body: CreateVolumeRequest) -> CreatedVolumeResponse:
    try:
        client = get_docker_client()
        logger.info(f"Creating volume '{body.name}'")

        volume = client.volumes.create(
            name=body.name,
            driver=body.driver,
            labels=body.labels,
            driver_opts=body.driver_opts
        )

        attrs = volume.attrs

        return CreatedVolumeResponse(
            name=attrs["Name"],
            driver=attrs.get("Driver", "unknown"),
            mountpoint=attrs.get("Mountpoint", ""),
            created_at=attrs.get("CreatedAt"),
            labels=attrs.get("Labels"),
            options=attrs.get("Options")
        )

    except APIError as e:
        logger.warning(f"Docker API error while creating volume '{body.name}': {e.explanation}")
        raise HTTPException(status_code=400, detail=f"Error creating volume: {e.explanation}")
    except Exception as e:
        logger.error(f"Unexpected error while creating volume '{body.name}': {str(e)}")
        raise HTTPException(status_code=500, detail="Unexpected error occurred while creating the volume.")
