from docker.errors import DockerException, APIError
from fastapi import HTTPException, Body

from Models.models import (
    GenericMessageResponse, CreateDockerNetworkRequest
)
from Utils.getDocker import get_docker_client
from Utils.logger import logger


def create_docker_network_command(body: CreateDockerNetworkRequest = Body(...)):
    try:
        client = get_docker_client()

        # Check if network already exists
        existing = [n for n in client.networks.list(names=[body.name])]
        if existing and body.check_duplicate:
            raise HTTPException(
                status_code=400,
                detail=f"A network with the name '{body.name}' already exists."
            )

        client.networks.create(
            name=body.name,
            driver=body.driver,
            labels=body.labels
        )

        return GenericMessageResponse(
            success=True,
            code=200,
            message=f"Network '{body.name}' created successfully."
        )

    except APIError as e:
        logger.error(f"Docker API error while creating network '{body.name}': {e}")
        raise HTTPException(status_code=500, detail=f"Docker API error: {e}")

    except DockerException as e:
        logger.error(f"Docker client error while creating network '{body.name}': {e}")
        raise HTTPException(status_code=503, detail="Docker is unreachable or misconfigured")

    except Exception as e:
        logger.exception(f"Unexpected error while creating network '{body.name}'")
        raise HTTPException(status_code=500, detail="Internal server error")
