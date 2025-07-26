from docker.errors import DockerException, NotFound, APIError
from fastapi import HTTPException

from Models.models import (
    GenericMessageResponse, AssignNetworkRequest
)
from Utils.getDocker import get_docker_client, get_container
from Utils.logger import logger


def assign_network_to_container_command(container_id: str, body: AssignNetworkRequest):
    try:
        client = get_docker_client()

        # Check container
        container = get_container(container_id)
        if not container:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")

        container.reload()
        current_networks = container.attrs.get("NetworkSettings", {}).get("Networks", {})
        if body.network_name in current_networks:
            return GenericMessageResponse(
                success=False,
                code=400,
                message=f"Container '{container.name}' is already connected to network '{body.network_name}'."
            )

        # Check network
        try:
            network = client.networks.get(body.network_name)
        except NotFound:
            raise HTTPException(status_code=404, detail=f"Network '{body.network_name}' not found")

        # Connect
        network.connect(container)
        return GenericMessageResponse(
            success=True,
            code=200,
            message=f"Network '{body.network_name}' assigned to container '{container.name}' successfully."
        )

    except APIError as e:
        logger.error(f"Docker API error while assigning network: {e}")
        raise HTTPException(status_code=500, detail=f"Docker API error: {str(e)}")

    except DockerException as e:
        logger.error(f"Docker client error: {e}")
        raise HTTPException(status_code=503, detail="Docker is unreachable or misconfigured")

    except Exception as e:
        logger.exception("Unexpected error during network assignment")
        raise HTTPException(status_code=500, detail="Unexpected server error")
