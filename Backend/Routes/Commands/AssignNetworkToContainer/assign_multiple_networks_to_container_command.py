from docker.errors import NotFound
from fastapi import HTTPException

from Models.models import (
    GenericMessageResponse, AssignMultipleNetworksRequest
)
from Utils.getDocker import get_docker_client, get_container
from Utils.logger import logger


def assign_multiple_networks_to_container_command(container_id: str, body: AssignMultipleNetworksRequest):
    try:
        client = get_docker_client()
        container = get_container(container_id)
        if not container:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")

        container.reload()
        already_connected = container.attrs.get("NetworkSettings", {}).get("Networks", {}).keys()

        messages = []
        for net_name in body.network_names:
            if net_name in already_connected:
                messages.append(f"⚠️ Already connected to '{net_name}'")
                continue

            try:
                net = client.networks.get(net_name)
                net.connect(container)
                messages.append(f"✅ Connected to '{net_name}'")
            except NotFound:
                messages.append(f"❌ Network '{net_name}' not found")
            except Exception as e:
                messages.append(f"❌ Failed to connect to '{net_name}': {e}")

        return GenericMessageResponse(
            success=True,
            code=200,
            message="\n".join(messages)
        )

    except Exception as e:
        logger.exception("Error assigning multiple networks")
        raise HTTPException(status_code=500, detail=str(e))
