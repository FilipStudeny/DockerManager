from docker.errors import DockerException, NotFound, APIError
from docker.models.networks import Network
from fastapi import HTTPException, Query

from Models.models import (
    GenericMessageResponse
)
from Utils.getDocker import get_docker_client
from Utils.logger import logger


def delete_docker_network_command(
    network_id: str,
    dry_run: bool = Query(False, description="If true, only preview whether the network can be deleted")
):
    try:
        client = get_docker_client()

        try:
            network: Network = client.networks.get(network_id)
        except NotFound:
            raise HTTPException(status_code=404, detail=f"Network '{network_id}' not found")

        raw_attrs = client.api.inspect_network(network.id)
        connected = raw_attrs.get("Containers", {}) or {}

        if connected:
            container_names = [v.get("Name", "<unknown>") for v in connected.values()]
            message = (
                f"Network '{network.name}' is currently attached to container(s): {', '.join(container_names)}. "
                f"Please disconnect all containers manually before deletion."
            )
            logger.warning(f"Deletion prevented: {message}")
            raise HTTPException(status_code=400, detail=message)

        if dry_run:
            return GenericMessageResponse(
                success=True,
                code=200,
                message=f"Network '{network.name}' can be safely deleted (no containers attached)."
            )

        network.remove()

        return GenericMessageResponse(
            success=True,
            code=200,
            message=f"Network '{network.name}' deleted successfully."
        )

    except HTTPException:
        raise

    except APIError as e:
        logger.error(f"Docker API error while deleting network '{network_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"Docker API error: {str(e)}")

    except DockerException as e:
        logger.error(f"Docker client error while deleting network '{network_id}': {str(e)}")
        raise HTTPException(status_code=503, detail="Docker is unreachable or misconfigured")

    except Exception as e:
        logger.exception(f"Unexpected error while deleting network '{network_id}'")
        raise HTTPException(status_code=500, detail="Internal server error")
