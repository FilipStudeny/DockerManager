from fastapi import HTTPException

from Models.models import (
    GenericMessageResponse, DisconnectNetworkRequest
)
from Utils.getDocker import get_docker_client, get_container
from Utils.logger import logger


def disconnect_network_from_container_command(container_id: str, body: DisconnectNetworkRequest):
    try:
        client = get_docker_client()
        container = get_container(container_id)
        if not container:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")

        container.reload()
        current_networks = container.attrs.get("NetworkSettings", {}).get("Networks", {})
        if body.network_name not in current_networks:
            return GenericMessageResponse(
                success=False,
                code=400,
                message=f"Container '{container.name}' is not connected to network '{body.network_name}'."
            )

        network = client.networks.get(body.network_name)
        network.disconnect(container)

        return GenericMessageResponse(
            success=True,
            code=200,
            message=f"Network '{body.network_name}' disconnected from container '{container.name}' successfully."
        )

    except Exception as e:
        logger.exception("Error disconnecting network")
        raise HTTPException(status_code=500, detail=str(e))