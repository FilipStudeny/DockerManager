from typing import List
from Utils.getDocker import get_docker_client
from Models.models import DockerVolumeSummary

def get_docker_volumes_query() -> List[DockerVolumeSummary]:
    volumes = get_docker_client().volumes.list()
    summaries: List[DockerVolumeSummary] = []

    for v in volumes:
        attrs = v.attrs or {}
        labels = attrs.get("Labels") or {}

        summaries.append(DockerVolumeSummary(
            name=v.name,
            type="volume",
            source=v.name,
            destination=f"/var/lib/docker/volumes/{v.name}/_data",
            driver=attrs.get("Driver", ""),
            mountpoint=attrs.get("Mountpoint", ""),
            created_at=attrs.get("CreatedAt", ""),
            labels=labels,
        ))

    return summaries
