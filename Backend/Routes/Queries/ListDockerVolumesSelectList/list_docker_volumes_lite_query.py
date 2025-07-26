from docker.errors import DockerException
from fastapi import HTTPException

from Models.models import VolumeSelectListItem, VolumeSelectList
from Utils.getDocker import get_docker_client
from Utils.logger import logger


def list_docker_volumes_lite_query():
    try:
        client = get_docker_client()
        volumes = client.volumes.list()

        volume_items = [
            VolumeSelectListItem(
                id=volume.attrs["Name"],
                name=volume.attrs["Name"]
            )
            for volume in volumes
        ]

        return VolumeSelectList(volumes=volume_items)

    except DockerException as e:
        logger.error(f"Error retrieving volumes: {e}")
        raise HTTPException(status_code=503, detail="Docker is unreachable.")
