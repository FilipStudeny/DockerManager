from typing import List
from docker.errors import DockerException
from fastapi import HTTPException

from Models.models import NetworkContainerInfo, DockerNetworkOverview
from Utils.getDocker import get_docker_client
from Utils.logger import logger

PROTECTED_NETWORKS = {"bridge", "host", "none"}

def get_docker_networks_overview_query() -> List[DockerNetworkOverview]:
    try:
        client = get_docker_client()
        networks = client.networks.list()
        containers = client.containers.list(all=True)

        results: List[DockerNetworkOverview] = []

        for net in networks:
            net_name = net.name
            if net_name in PROTECTED_NETWORKS:
                continue

            net_id = net.id
            net_attrs = net.attrs

            container_infos: List[NetworkContainerInfo] = []

            for container in containers:
                container_attrs = container.attrs
                network_settings = container_attrs.get("NetworkSettings", {}).get("Networks", {})

                if net_name in network_settings:
                    net_data = network_settings[net_name]
                    container_infos.append(NetworkContainerInfo(
                        id=container.id,
                        name=container.name,
                        status=container.status,
                        ipv4_address=net_data.get("IPAddress")
                    ))

            results.append(DockerNetworkOverview(
                id=net_id,
                name=net_name,
                driver=net_attrs.get("Driver", "unknown"),
                scope=net_attrs.get("Scope", "unknown"),
                labels=net_attrs.get("Labels", {}),
                internal=net_attrs.get("Internal", False),
                attachable=net_attrs.get("Attachable", False),
                containers=container_infos,
                containers_count=len(container_infos),
                running_containers_count=sum(1 for c in container_infos if c.status == "running")
            ))

        return results

    except DockerException as e:
        logger.error(f"Failed to fetch Docker networks: {str(e)}")
        raise HTTPException(status_code=503, detail="Docker is unreachable")
