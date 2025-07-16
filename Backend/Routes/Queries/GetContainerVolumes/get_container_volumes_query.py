from typing import List

from docker.errors import NotFound
from fastapi import HTTPException

from Models.models import DockerVolumeSummary
from Utils.getDocker import get_container, get_docker_client


def get_container_volumes_query(container_id: str) -> List[DockerVolumeSummary]:
    try:
        container = get_container(container_id)
        mounts = container.attrs.get("Mounts", [])
        volumes_client = get_docker_client().volumes
        used_volumes = []

        for mount in mounts:
            if mount.get("Type") == "volume":
                volume_name = mount.get("Name")
                if volume_name:
                    try:
                        volume = volumes_client.get(volume_name)
                        used_volumes.append(DockerVolumeSummary(
                            name=volume.name,
                            type=mount.get("Type", ""),
                            source=mount.get("Source", volume.name),  # fallback to volume name
                            destination=mount.get("Destination", ""),
                            driver=volume.attrs.get("Driver", ""),
                            mountpoint=volume.attrs.get("Mountpoint", ""),
                            created_at=volume.attrs.get("CreatedAt", ""),
                            labels=volume.attrs.get("Labels", {}),
                        ))
                    except NotFound:
                        continue  # Volume might have been removed externally

        return used_volumes
    except NotFound:
        raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve volumes: {str(e)}")
