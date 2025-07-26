from typing import List

from docker.errors import DockerException
from fastapi import HTTPException
from Utils.getDocker import get_docker_client
from Models.models import DockerVolumeSummary, VolumeContainerInfo, ContainerStatusEnum, map_status_to_enum
from Utils.logger import logger


def get_docker_volumes_query() -> List[DockerVolumeSummary]:
    try:
        client = get_docker_client()
        volumes = client.volumes.list()
        containers = client.containers.list(all=True)

        summaries = []

        for v in volumes:
            attrs = v.attrs or {}
            labels = attrs.get("Labels") or {}

            using_containers = []
            for container in containers:
                container_info = container.attrs
                mounts = container_info.get("Mounts", [])
                for mount in mounts:
                    if mount.get("Name") == v.name:
                        using_containers.append(VolumeContainerInfo(
                            id=container.id,
                            name=container.name,
                            status=map_status_to_enum(container.status),
                            mountpoint=mount.get("Destination", "")
                        ))
                        break

            summaries.append(DockerVolumeSummary(
                name=v.name,
                type="volume",
                source=v.name,
                destination=f"/var/lib/docker/volumes/{v.name}/_data",
                driver=attrs.get("Driver", ""),
                mountpoint=attrs.get("Mountpoint", ""),
                created_at=attrs.get("CreatedAt", ""),
                labels=labels,
                containers=using_containers
            ))

        return summaries

    except DockerException as e:
        logger.error(f"Failed to fetch Docker volumes: {str(e)}")
        raise HTTPException(status_code=503, detail="Docker is unreachable")
