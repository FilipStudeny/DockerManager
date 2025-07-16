from typing import List
from Utils.getDocker import get_docker_client
from Models.models import DockerVolumeSummary


def get_docker_volumes_query() -> List[DockerVolumeSummary]:
    volumes = get_docker_client().volumes.list()
    summaries = []

    for v in volumes:
        summaries.append(DockerVolumeSummary(
            name=v.name,
            type="volume",
            source=v.name,
            destination=f"/var/lib/docker/volumes/{v.name}/_data",
            driver=v.attrs.get("Driver", ""),
            mountpoint=v.attrs.get("Mountpoint", ""),
            created_at=v.attrs.get("CreatedAt", ""),
            labels=v.attrs.get("Labels", {}),
        ))

    return summaries
