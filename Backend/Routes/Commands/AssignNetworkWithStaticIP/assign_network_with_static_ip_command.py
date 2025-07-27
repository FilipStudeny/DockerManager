from fastapi import HTTPException

from Models.models import (
    GenericMessageResponse, AssignNetworkWithIPRequest
)
from Utils.getDocker import get_docker_client, get_container
from Utils.logger import logger


def assign_network_with_static_ip_command(container_id: str, body: AssignNetworkWithIPRequest):
    try:
        client = get_docker_client()
        container = get_container(container_id)
        if not container:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")

        container.reload()
        current_networks = container.attrs.get("NetworkSettings", {}).get("Networks", {})
        if body.network_name in current_networks:
            return GenericMessageResponse(
                success=False,
                code=400,
                message=f"Already connected to network '{body.network_name}'"
            )

        network = client.networks.get(body.network_name)

        connect_kwargs = {"container": container}
        if body.ipv4_address:
            connect_kwargs["ipv4_address"] = body.ipv4_address

        network.connect(**connect_kwargs)

        return GenericMessageResponse(
            success=True,
            code=200,
            message=f"Network '{body.network_name}' assigned to container '{container.name}'"
                    f"{f' with IP {body.ipv4_address}' if body.ipv4_address else ''}."
        )

    except Exception as e:
        logger.exception("Failed to assign network with static IP")
        raise HTTPException(status_code=500, detail=str(e))