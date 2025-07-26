from typing import List
from docker.errors import DockerException
from docker.models.images import Image
from fastapi import HTTPException

from Utils.getDocker import get_docker_client
from Models.models import DockerImageSummary, ImageContainerInfo, map_status_to_enum
from Utils.logger import logger


def get_docker_images_query() -> List[DockerImageSummary]:
    try:
        client = get_docker_client()
        images: List[Image] = client.images.list()
        containers = client.containers.list(all=True)

        summaries = []

        for img in images:
            used_by = []
            for container in containers:
                if container.image.id == img.id:
                    used_by.append(ImageContainerInfo(
                        id=container.id,
                        name=container.name,
                        status=map_status_to_enum(container.status)
                    ))

            summaries.append(DockerImageSummary(
                id=img.short_id,
                tags=img.tags,
                size=img.attrs.get("Size", 0),
                created=img.attrs.get("Created", ""),
                architecture=img.attrs.get("Architecture", ""),
                os=img.attrs.get("Os", ""),
                containers=used_by
            ))

        return summaries

    except DockerException as e:
        logger.error(f"Failed to fetch Docker images: {str(e)}")
        raise HTTPException(status_code=503, detail="Docker is unreachable")
