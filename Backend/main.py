import asyncio
import logging
import threading
from typing import List, Optional

import docker
from docker.errors import DockerException
from docker.models.containers import Container
from fastapi import FastAPI, Query, WebSocket, Body
from fastapi import Path
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
from starlette.websockets import WebSocketDisconnect

from Models.NetworkMapModel import DockerNetworkGraphResponse
from Models.models import (
    ContainerSummary,
    ContainerDetails,
    GenericMessageResponse, DockerImageSummary, DockerVolumeSummary, DockerOverview, ContainerStats, LogInfo,
    PerformanceWarning, DockerNetworkOverview, ContainerLogsResponse, PullImageRequest,
    CreateVolumeRequest, CreatedVolumeResponse, VolumeSelectList, AttachVolumeRequest,
    CreateContainerRequest, CreateDockerNetworkRequest, AssignNetworkRequest, DisconnectNetworkRequest,
    AssignMultipleNetworksRequest, AssignNetworkWithIPRequest, DockerNetworkSelectItem
)
from Routes.Commands.AssignNetworkToContainer.assign_multiple_networks_to_container_command import \
    assign_multiple_networks_to_container_command
from Routes.Commands.AssignNetworkToContainer.assign_network_to_container_command import \
    assign_network_to_container_command
from Routes.Commands.AssignNetworkWithStaticIP.assign_network_with_static_ip_command import \
    assign_network_with_static_ip_command
from Routes.Commands.AttachVolume.attach_volume_to_container_query import attach_volume_to_container_query
from Routes.Commands.CreateContainer.create_container_command import create_container_stream_logs_command
from Routes.Commands.CreateDockerNetwork.create_docker_network_command import create_docker_network_command
from Routes.Commands.CreateVolume.create_volume_command import create_volume_command
from Routes.Commands.DeleteContainer.delete_container_command import delete_container_command
from Routes.Commands.DeleteDockerNetwork.delete_docker_network_command import delete_docker_network_command
from Routes.Commands.DeleteDockerVolume.delete_docker_volume_query import delete_docker_volume_query
from Routes.Commands.DeleteImage.delete_docker_image_command import delete_docker_image_command
from Routes.Commands.DisconnectNetworkFromContainer.disconnect_network_from_container_command import \
    disconnect_network_from_container_command
from Routes.Commands.PullDockerImage.stream_pull_with_progress_and_summary_query import \
    stream_pull_with_progress_and_summary_query
from Routes.Commands.RestartContainer.restart_container_command import restart_container_command
from Routes.Commands.StartContainer.start_container_command import start_container_command
from Routes.Commands.StopContainer.stop_container_command import stop_container_command
from Routes.Queries.GetConainersList.get_containers_list_query import get_containers_list_query
from Routes.Queries.GetContainerDetail.get_container_details_query import get_container_details_query
from Routes.Queries.GetContainerLogs.get_container_logs_query import get_container_logs_query
from Routes.Queries.GetContainerVolumes.get_container_volumes_query import get_container_volumes_query
from Routes.Queries.GetDockerImages.get_docker_images_query import get_docker_images_query
from Routes.Queries.GetDockerNetworkOverview.get_docker_networks_overview_query import \
    get_docker_networks_overview_query
from Routes.Queries.GetDockerOverview.get_docker_overview_query import get_docker_overview_query
from Routes.Queries.GetDockerStatus.check_docker_status_query import check_docker_status_query
from Routes.Queries.GetDockerVolumes.get_docker_volumes_query import get_docker_volumes_query
from Routes.Queries.GetNetworkMap.get_docker_network_map import get_docker_network_map
from Routes.Queries.GetNetworksSmallList.list_docker_networks_lite_query import list_docker_networks_lite_query
from Routes.Queries.GetTopContainers.get_top_containers_query import get_top_containers_query
from Routes.Queries.ListDockerVolumesSelectList.list_docker_volumes_lite_query import list_docker_volumes_lite_query
from Utils.getDocker import get_container
from Utils.logger import logger
from Utils.stats import _extract_network_io, _extract_blk_io, _calculate_cpu_percent

app = FastAPI()
logging.basicConfig(level=logging.INFO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/docker-status", response_model=GenericMessageResponse, operation_id="checkDockerStatus")
def check_docker_status() -> GenericMessageResponse:
    return check_docker_status_query()

@app.get("/docker/overview", response_model=DockerOverview, operation_id="getDockerOverview")
def get_docker_overview() -> DockerOverview:
    return get_docker_overview_query()


@app.get("/docker/top-containers", response_model=List[ContainerStats], operation_id="getTopContainers")
def get_top_containers() -> List[ContainerStats]:
    return get_top_containers_query()


@app.get("/docker/performance-warning", response_model=PerformanceWarning, operation_id="getPerformanceWarning")
def get_performance_warning():
    return PerformanceWarning(message="High CPU usage detected in container 'db'")


@app.get("/docker/logs/latest", response_model=LogInfo, operation_id="getLatestLog")
def get_latest_log():
    return LogInfo(count=157, latest="Container 'web-app' restarted due to exit code 137.")


@app.get("/containers", response_model=List[ContainerSummary], operation_id="listContainers")
def list_containers(all: bool = Query(True, description="Show all containers, including stopped")):
    return get_containers_list_query(all)


@app.get("/containers/{container_id}", response_model=ContainerDetails, operation_id="getContainerDetails")
def get_container_details(container_id: str):
    return get_container_details_query(container_id)


@app.websocket("/ws/containers/{container_id}/stats")
async def stream_container_stats(websocket: WebSocket, container_id: str):
    await websocket.accept()
    try:
        container: Container = get_container(container_id)
        if not container:
            await websocket.send_json({"error": "Container not found"})
            await websocket.close()
            return

        stats_stream = container.stats(stream=True, decode=True)
        from datetime import datetime, timezone
        started_at = container.attrs["State"]["StartedAt"]
        started_dt = datetime.fromisoformat(started_at.replace("Z", "+00:00"))

        while True:
            try:
                stats = next(stats_stream)
                cpu_percent = _calculate_cpu_percent(stats)
                per_cpu_usage = stats["cpu_stats"]["cpu_usage"].get("percpu_usage", [])
                cpu_cores = len(per_cpu_usage)
                mem_usage = stats["memory_stats"].get("usage", 0)
                mem_limit = stats["memory_stats"].get("limit", 1)
                mem_percent = round((mem_usage / mem_limit) * 100, 2)
                net_io = _extract_network_io(stats)
                blk_io = _extract_blk_io(stats)
                uptime_seconds = int((datetime.now(timezone.utc) - started_dt).total_seconds())
                await websocket.send_json({
                    "cpu_percent": round(cpu_percent, 2),
                    "cpu_cores": cpu_cores,
                    "per_cpu_usage": per_cpu_usage,
                    "memory_usage": mem_usage,
                    "memory_limit": mem_limit,
                    "memory_percent": mem_percent,
                    "network_rx": net_io["rx"],
                    "network_tx": net_io["tx"],
                    "blk_read": blk_io["read"],
                    "blk_write": blk_io["write"],
                    "uptime_seconds": uptime_seconds,
                })
                await asyncio.sleep(1)

            except (StopIteration, asyncio.CancelledError, WebSocketDisconnect):
                logger.info(f"Stats stream stopped for container {container_id}")
                break
            except Exception as e:
                logger.warning(f"Stats error: {e}")
                break

    except Exception as e:
        logger.error(f"Stats setup error: {e}")
        try:
            await websocket.send_json({"error": str(e)})
        except RuntimeError:
            pass
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass


@app.get(
    "/containers/{container_id}/logs",
    response_model=ContainerLogsResponse,
    operation_id="getContainerLogs"
)
def get_container_logs(
        container_id: str,
        tail: int = 500,
        since: Optional[int] = Query(None, description="Unix timestamp to start from"),
        until: Optional[int] = Query(None, description="Unix timestamp to end at"),
) -> ContainerLogsResponse:
    return get_container_logs_query(container_id, tail=tail, since=since, until=until)


@app.post("/containers/{container_id}/start", response_model=GenericMessageResponse, operation_id="startContainer")
def start_container(container_id: str):
    return start_container_command(container_id)


@app.post("/containers/{container_id}/stop", response_model=GenericMessageResponse, operation_id="stopContainer")
def stop_container(container_id: str):
    return stop_container_command(container_id)


@app.post("/containers/{container_id}/restart", response_model=GenericMessageResponse, operation_id="restartContainer")
def restart_container(container_id: str):
    return restart_container_command(container_id)


@app.delete(
    "/containers/{container_id}",
    response_model=GenericMessageResponse,
    operation_id="deleteContainer",
    summary="Delete a Docker container by ID or name"
)
def delete_container(
        container_id: str = Path(..., description="Container ID or name"),
        force: bool = Query(False, description="Force remove running container")
):
    return delete_container_command(container_id, force)


@app.get("/images", response_model=List[DockerImageSummary], operation_id="listDockerImages")
def list_docker_images():
    return get_docker_images_query()


@app.get("/volumes", response_model=List[DockerVolumeSummary], operation_id="listDockerVolumes")
def list_docker_volumes() -> List[DockerVolumeSummary]:
    return get_docker_volumes_query()


@app.delete(
    "/volumes/{volume_name}",
    response_model=GenericMessageResponse,
    operation_id="deleteDockerVolume",
    summary="Delete a Docker volume if not in use"
)
def delete_docker_volume(volume_name: str) -> GenericMessageResponse:
    return delete_docker_volume_query(volume_name)


@app.get("/containers/{container_id}/volumes", response_model=List[DockerVolumeSummary],
         operation_id="getContainerVolumes")
def get_container_volumes(container_id: str):
    return get_container_volumes_query(container_id)


@app.get(
    "/docker/networks/overview",
    response_model=List[DockerNetworkOverview],
    operation_id="getDockerNetworksOverview"
)
def get_docker_networks_overview() -> list:
    return get_docker_networks_overview_query()


@app.get("/docker/networks/map", response_model=DockerNetworkGraphResponse, operation_id="getDockerNetworkMap")
def get_docker_network_node_map():
    return get_docker_network_map()


@app.post(
    "/images/pull/full",
    response_class=StreamingResponse,
    operation_id="streamPullWithSummary",
    summary="Stream Docker image pull with progress and summary"
)
def stream_pull_with_progress_and_summary(body: PullImageRequest = Body(...)):
    return stream_pull_with_progress_and_summary_query(body)


@app.post(
    "/volumes",
    response_model=CreatedVolumeResponse,
    operation_id="createDockerVolume",
    summary="Create a Docker volume and return metadata"
)
def create_docker_volume(body: CreateVolumeRequest):
    return create_volume_command(body)


@app.get(
    "/volumes/list",
    response_model=VolumeSelectList,
    operation_id="listDockerVolumesLite",
    summary="List all Docker volumes with ID and name"
)
def list_docker_volumes_lite():
    return list_docker_volumes_lite_query()


@app.post(
    "/containers/{container_id}/attach-volume",
    response_model=GenericMessageResponse,
    operation_id="attachVolumeToContainer",
    summary="Attach a volume to a stopped container and recreate it"
)
def attach_volume_to_container(container_id: str, body: AttachVolumeRequest):
    return attach_volume_to_container_query(container_id, body)


@app.post(
    "/containers/create",
    response_class=StreamingResponse,
    operation_id="createContainerWithLogs",
    summary="Create a Docker container and stream progress logs"
)
def create_container_stream_logs(body: CreateContainerRequest):
    return create_container_stream_logs_command(body)


@app.delete(
    "/images/{image_id}",
    response_model=GenericMessageResponse,
    operation_id="deleteDockerImage",
    summary="Delete a Docker image by ID or tag"
)
def delete_docker_image(image_id: str):
    return delete_docker_image_command(image_id)


@app.delete(
    "/docker/networks/{network_id}",
    response_model=GenericMessageResponse,
    operation_id="deleteDockerNetwork",
    summary="Delete a Docker network by ID or name, only if no containers are attached"
)
def delete_docker_network(
        network_id: str,
        dry_run: bool = Query(False, description="If true, only preview whether the network can be deleted")
):
    return delete_docker_network_command(network_id, dry_run)


@app.post(
    "/docker/networks",
    response_model=GenericMessageResponse,
    operation_id="createDockerNetwork",
    summary="Create a Docker network"
)
def create_docker_network(body: CreateDockerNetworkRequest = Body(...)):
    return create_docker_network_command(body)


@app.post(
    "/containers/{container_id}/assign-network",
    response_model=GenericMessageResponse,
    operation_id="assignNetworkToContainer",
    summary="Assign a Docker network to a container"
)
def assign_network_to_container(container_id: str, body: AssignNetworkRequest):
    return assign_network_to_container_command(container_id, body)


@app.post(
    "/containers/{container_id}/disconnect-network",
    response_model=GenericMessageResponse,
    operation_id="disconnectNetworkFromContainer",
    summary="Disconnect a Docker network from a container"
)
def disconnect_network_from_container(container_id: str, body: DisconnectNetworkRequest):
    return disconnect_network_from_container_command(container_id, body)


@app.post(
    "/containers/{container_id}/assign-networks",
    response_model=GenericMessageResponse,
    operation_id="assignMultipleNetworksToContainer",
    summary="Assign multiple Docker networks to a container"
)
def assign_multiple_networks_to_container(container_id: str, body: AssignMultipleNetworksRequest):
    return assign_multiple_networks_to_container_command(container_id, body)

@app.post(
    "/containers/{container_id}/assign-network-ip",
    response_model=GenericMessageResponse,
    operation_id="assignNetworkWithStaticIP",
    summary="Assign a Docker network to a container with optional static IP"
)
def assign_network_with_static_ip(container_id: str, body: AssignNetworkWithIPRequest):
    return assign_network_with_static_ip_command(container_id, body)


@app.get(
    "/docker/networks/list",
    response_model=List[DockerNetworkSelectItem],
    operation_id="listDockerNetworksLite",
    summary="List Docker networks for dropdown selection"
)
def list_docker_networks_lite():
    return list_docker_networks_lite_query()


@app.websocket("/ws/containers/{container_id}/terminal")
async def websocket_container_terminal(websocket: WebSocket, container_id: str):
    await websocket.accept()
    client = docker.from_env()
    loop = asyncio.get_event_loop()
    output_queue = asyncio.Queue()
    websocket_closed = False

    try:
        container = client.containers.get(container_id)

        exec_id = client.api.exec_create(
            container.id,
            cmd="/bin/bash",
            stdin=True,
            tty=True,
            stdout=True,
            stderr=True,
        )

        sock = client.api.exec_start(exec_id["Id"], detach=False, tty=True, socket=True)

        def read_from_docker_socket():
            try:
                while True:
                    data = sock.recv(1024)
                    if data:
                        asyncio.run_coroutine_threadsafe(output_queue.put(data), loop)
            except Exception:
                pass

        # Start background thread
        threading.Thread(target=read_from_docker_socket, daemon=True).start()

        async def receive_from_websocket():
            while True:
                try:
                    text = await websocket.receive_text()
                    sock.send(text.encode())
                except WebSocketDisconnect:
                    return "disconnected"

        async def send_to_websocket():
            while True:
                data = await output_queue.get()
                await websocket.send_bytes(data)

        recv_task = asyncio.create_task(receive_from_websocket())
        send_task = asyncio.create_task(send_to_websocket())

        done, pending = await asyncio.wait(
            {recv_task, send_task},
            return_when=asyncio.FIRST_COMPLETED,
        )

        # Cancel whichever task is still running
        for task in pending:
            task.cancel()

    except docker.errors.NotFound:
        await websocket.send_json({"error": f"Container '{container_id}' not found"})
    except Exception as e:
        if not websocket_closed:
            try:
                await websocket.send_json({"error": str(e)})
            except Exception:
                pass
    finally:
        try:
            sock.close()
        except Exception:
            pass
        try:
            await websocket.close()
        except RuntimeError:
            pass
