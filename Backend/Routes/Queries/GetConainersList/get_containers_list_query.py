from typing import List, Any, Optional, Dict
from fastapi import Query
import datetime

from Models.models import (
    ContainerSummary,
    PortBinding,
    ContainerStatusEnum,
    map_status_to_enum,
)
from Utils.getDocker import get_docker_client, detect_container_errors


def get_containers_list_query(
    all: bool = Query(True, description="Show all containers, including stopped")
) -> List[ContainerSummary]:
    containers = get_docker_client().containers.list(all=all)
    return [
        enrich_container_summary(
            c,
            map_status_to_enum(c.status),
            *detect_container_errors(c)
        )
        for c in containers
    ]


def enrich_container_summary(
    container: Any,
    status_enum: ContainerStatusEnum,
    error_count: int,
    latest_error: Optional[str]
) -> ContainerSummary:
    ports: List[PortBinding] = []
    raw_ports = container.attrs.get("NetworkSettings", {}).get("Ports") or {}

    for port, bindings in raw_ports.items():
        if bindings:
            for bind in bindings:
                ports.append(PortBinding(
                    container_port=port,
                    host_ip=bind.get("HostIp"),
                    host_port=bind.get("HostPort")
                ))
        else:
            ports.append(PortBinding(container_port=port))

    created_at = datetime.datetime.fromisoformat(
        container.attrs["Created"].replace("Z", "+00:00")
    ).astimezone(datetime.timezone.utc)

    uptime_seconds = (
        int((datetime.datetime.now(datetime.timezone.utc) - created_at).total_seconds())
        if container.status == "running" else None
    )

    mounts = container.attrs.get("Mounts", [])
    volume_count = len(mounts)

    return ContainerSummary(
        id=container.short_id,
        name=container.name,
        status=status_enum,
        image=container.image.tags,
        command=" ".join(container.attrs["Config"].get("Cmd") or []),
        created_at=created_at.isoformat(),
        uptime_seconds=uptime_seconds,
        ports=ports,
        error_count=error_count,
        latest_error_message=latest_error,
        volumes=volume_count
    )
