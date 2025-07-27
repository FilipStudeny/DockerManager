from docker.errors import DockerException
from fastapi import HTTPException

from Models.models import (
    DockerNetworkSelectItem
)
from Utils.getDocker import get_docker_client
from Utils.logger import logger


def list_docker_networks_lite_query():
    try:
        client = get_docker_client()
        networks = client.networks.list()

        result = []
        for network in networks:
            inspect = client.api.inspect_network(network.id)
            ipam_config = inspect.get("IPAM", {}).get("Config", [])
            gateway = ipam_config[0].get("Gateway") if ipam_config else None

            result.append(DockerNetworkSelectItem(
                id=network.id,
                name=network.name,
                gateway=gateway
            ))

        return result

    except DockerException as e:
        logger.error(f"Docker error while listing networks: {e}")
        raise HTTPException(status_code=503, detail="Docker is unreachable or misconfigured")
    except Exception as e:
        logger.exception("Unexpected error while listing networks")
        raise HTTPException(status_code=500, detail="Internal server error")
