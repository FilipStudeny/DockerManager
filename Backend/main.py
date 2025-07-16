import logging
from typing import List

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import PlainTextResponse

from Models.models import (
    DockerStatus,
    ContainerSummary,
    ContainerDetails,
    GenericMessageResponse, DockerImageSummary, DockerVolumeSummary
)
from Routes.Commands.RestartContainer.restart_container_command import restart_container_command
from Routes.Commands.StartContainer.start_container_command import start_container_command
from Routes.Commands.StopContainer.stop_container_command import stop_container_command
from Routes.Queries.GetConainersList.get_containers_list_query import get_containers_list_query
from Routes.Queries.GetContainerDetail.get_container_details_query import get_container_details_query
from Routes.Queries.GetContainerLogs.get_container_logs_query import get_container_logs_query
from Routes.Queries.GetContainerVolumes.get_container_volumes_query import get_container_volumes_query
from Routes.Queries.GetDockerImages.get_docker_images_query import get_docker_images_query
from Routes.Queries.GetDockerVolumes.get_docker_volumes_query import get_docker_volumes_query
from Utils.getDocker import get_docker_client
from Utils.logger import logger

app = FastAPI()
logging.basicConfig(level=logging.INFO)


# ---------------------
# Endpoints
# ---------------------

@app.get("/", response_model=DockerStatus)
def root() -> DockerStatus:
    return DockerStatus(status="Docker Manager API running")


@app.get("/docker-status", response_model=DockerStatus)
def check_docker_status() -> DockerStatus:
    try:
        get_docker_client().ping()
        return DockerStatus(status="Docker is running")
    except Exception as e:
        logger.error(f"Docker check failed: {e}")
        raise HTTPException(status_code=503, detail="Docker is not running or not reachable")


@app.get("/containers", response_model=List[ContainerSummary])
def list_containers(all: bool = Query(True, description="Show all containers, including stopped")) -> List[
    ContainerSummary]:
    return get_containers_list_query(all)


@app.get("/containers/{container_id}", response_model=ContainerDetails)
def get_container_details(container_id: str) -> ContainerDetails:
    return get_container_details_query(container_id)


@app.get("/containers/{container_id}/logs", response_class=PlainTextResponse)
def get_container_logs(container_id: str, tail: int = 100) -> str:
    return get_container_logs_query(container_id, tail)


@app.post("/containers/{container_id}/start", response_model=GenericMessageResponse)
def start_container(container_id: str) -> GenericMessageResponse:
    return start_container_command(container_id)


@app.post("/containers/{container_id}/stop", response_model=GenericMessageResponse)
def stop_container(container_id: str) -> GenericMessageResponse:
    return stop_container_command(container_id)


@app.post("/containers/{container_id}/restart", response_model=GenericMessageResponse)
def restart_container(container_id: str) -> GenericMessageResponse:
    return restart_container_command(container_id)


@app.get("/images", response_model=List[DockerImageSummary])
def list_docker_images():
    return get_docker_images_query()


@app.get("/volumes", response_model=List[DockerVolumeSummary])
def list_docker_volumes():
    return get_docker_volumes_query()


@app.get("/containers/{container_id}/volumes", response_model=List[DockerVolumeSummary])
def get_container_volumes(container_id: str):
    return get_container_volumes_query(container_id)
