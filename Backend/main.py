import asyncio
import logging
import traceback
from typing import List

from docker.errors import DockerException
from docker.models.containers import Container
from fastapi import FastAPI, HTTPException, Query, WebSocket
from fastapi.responses import PlainTextResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect

from Models.NetworkMapModel import DockerNetworkGraphResponse
from Models.models import (
    ContainerSummary,
    ContainerDetails,
    GenericMessageResponse, DockerImageSummary, DockerVolumeSummary, DockerOverview, ContainerStats, LogInfo,
    PerformanceWarning, DockerNetworkOverview
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
from Routes.Queries.GetNetworkMap.get_docker_network_map import get_docker_network_map
from Utils.getDocker import get_docker_client, get_container
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
    try:
        client = get_docker_client()
        client.ping()
        return GenericMessageResponse(success=True, code=200, message="Docker is running")
    except Exception:
        logger.error("Docker status check failed:\n" + traceback.format_exc())
        return GenericMessageResponse(success=False, code=503, message="Docker is not running or unreachable. Please check your Docker service.")

@app.get("/docker/overview", response_model=DockerOverview, operation_id="getDockerOverview")
def get_docker_overview():
    try:
        client = get_docker_client()
        all_containers = client.containers.list(all=True)
        running = client.containers.list(filters={"status": "running"})
        exited = client.containers.list(filters={"status": "exited"})
        images = client.images.list()
        volumes = client.volumes.list()

        total_log_lines = 0
        for container in all_containers:
            try:
                logs = container.logs(tail=1000)
                total_log_lines += len(logs.splitlines())
            except Exception:
                continue

        return DockerOverview(
            version=client.version()["Version"],
            total_containers=len(all_containers),
            running_containers=len(running),
            failed_containers=len(exited),
            images=len(images),
            volumes=len(volumes),
            logs_count=total_log_lines,
        )
    except Exception as e:
        logger.error("Docker connection error: %s", str(e))
        raise HTTPException(status_code=503, detail="Docker is not running or unreachable.")

@app.get("/docker/top-containers", response_model=List[ContainerStats], operation_id="getTopContainers")
def get_top_containers():
    try:
        client = get_docker_client()
        containers = client.containers.list()
        dummy_data = [{"id": c.id[:12], "name": c.name, "cpu": 42.3, "memory": 30.4} for c in containers[:4]]
        return [ContainerStats(**d) for d in dummy_data]
    except Exception as e:
        logger.error("Docker connection error: %s", str(e))
        raise HTTPException(status_code=503, detail="Docker is not running or unreachable.")

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

@app.get("/containers/{container_id}/logs", response_class=PlainTextResponse, operation_id="getContainerLogs")
def get_container_logs(container_id: str, tail: int = 100) -> str:
    return get_container_logs_query(container_id, tail)

@app.post("/containers/{container_id}/start", response_model=GenericMessageResponse, operation_id="startContainer")
def start_container(container_id: str):
    return start_container_command(container_id)

@app.post("/containers/{container_id}/stop", response_model=GenericMessageResponse, operation_id="stopContainer")
def stop_container(container_id: str):
    return stop_container_command(container_id)

@app.post("/containers/{container_id}/restart", response_model=GenericMessageResponse, operation_id="restartContainer")
def restart_container(container_id: str):
    return restart_container_command(container_id)

@app.get("/images", response_model=List[DockerImageSummary], operation_id="listDockerImages")
def list_docker_images():
    return get_docker_images_query()

@app.get("/volumes", response_model=List[DockerVolumeSummary], operation_id="listDockerVolumes")
def list_docker_volumes():
    return get_docker_volumes_query()

@app.get("/containers/{container_id}/volumes", response_model=List[DockerVolumeSummary], operation_id="getContainerVolumes")
def get_container_volumes(container_id: str):
    return get_container_volumes_query(container_id)

@app.get("/docker/networks/overview", response_model=List[DockerNetworkOverview], operation_id="getDockerNetworksOverview")
def get_docker_networks_overview():
    try:
        client = get_docker_client()
        networks = client.networks.list()
        containers_by_id = {c.id: c for c in client.containers.list(all=True)}
        overview = []
        for net in networks:
            net_info = net.attrs
            connected_containers = net_info.get("Containers", {}) or {}
            container_ids = list(connected_containers.keys())
            total = len(container_ids)
            running = sum(1 for cid in container_ids if cid in containers_by_id and containers_by_id[cid].status == "running")
            overview.append(DockerNetworkOverview(
                id=net.id,
                name=net.name,
                driver=net_info.get("Driver", "unknown"),
                scope=net_info.get("Scope", "unknown"),
                containers_count=total,
                running_containers_count=running,
                labels=net_info.get("Labels"),
                internal=net_info.get("Internal", False),
                attachable=net_info.get("Attachable", False),
            ))
        return overview
    except DockerException as e:
        logger.error(f"Failed to fetch networks: {str(e)}")
        raise HTTPException(status_code=503, detail="Docker is unreachable")
@app.get("/docker/networks/map", response_model=DockerNetworkGraphResponse, operation_id="getDockerNetworkMap")
def get_docker_network_node_map():
    return get_docker_network_map()