from typing import List
from docker.models.images import Image

from Models.models import DockerImageSummary
from Utils.getDocker import get_docker_client


def get_docker_images_query() -> List[DockerImageSummary]:
    images: List[Image] = get_docker_client().images.list()
    summaries = []

    for img in images:
        summaries.append(DockerImageSummary(
            id=img.short_id,
            tags=img.tags,
            size=img.attrs.get("Size", 0),
            created=img.attrs.get("Created", ""),
            architecture=img.attrs.get("Architecture", ""),
            os=img.attrs.get("Os", ""),
        ))

    return summaries
