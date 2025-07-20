import asyncio
import json
import logging
import traceback
from datetime import time
from typing import List, Optional, Dict

import docker
from docker.errors import DockerException, ImageNotFound
from docker.models.containers import Container
from docker.types import Mount, RestartPolicy
from fastapi import FastAPI, HTTPException, Query, WebSocket, Body
from fastapi.responses import PlainTextResponse
from starlette import status
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
from starlette.websockets import WebSocketDisconnect

from Models.NetworkMapModel import DockerNetworkGraphResponse
from Models.models import (
    ContainerSummary,
    ContainerDetails,
    GenericMessageResponse, DockerImageSummary, DockerVolumeSummary, DockerOverview, ContainerStats, LogInfo,
    PerformanceWarning, DockerNetworkOverview, NetworkContainerInfo, ContainerLogsResponse, PullImageRequest,
    CreateVolumeRequest, CreatedVolumeResponse, VolumeSelectListItem, VolumeSelectList, AttachVolumeRequest
)
from Routes.Commands.CreateVolume.create_volume_command import create_volume_command
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
from Utils.logger import logger, rollback_logger
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
        return GenericMessageResponse(success=False, code=503,
                                      message="Docker is not running or unreachable. Please check your Docker service.")


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


@app.get("/images", response_model=List[DockerImageSummary], operation_id="listDockerImages")
def list_docker_images():
    return get_docker_images_query()


@app.get("/volumes", response_model=List[DockerVolumeSummary], operation_id="listDockerVolumes")
def list_docker_volumes():
    return get_docker_volumes_query()


@app.get("/containers/{container_id}/volumes", response_model=List[DockerVolumeSummary],
         operation_id="getContainerVolumes")
def get_container_volumes(container_id: str):
    return get_container_volumes_query(container_id)


@app.get(
    "/docker/networks/overview",
    response_model=List[DockerNetworkOverview],
    operation_id="getDockerNetworksOverview"
)
def get_docker_networks_overview():
    try:
        client = get_docker_client()
        networks = client.networks.list()
        containers = client.containers.list(all=True)

        network_map = {net.id: net for net in networks}
        network_overview = {
            net.id: {
                "id": net.id,
                "name": net.name,
                "driver": net.attrs.get("Driver", "unknown"),
                "scope": net.attrs.get("Scope", "unknown"),
                "labels": net.attrs.get("Labels"),
                "internal": net.attrs.get("Internal", False),
                "attachable": net.attrs.get("Attachable", False),
                "containers": [],
            }
            for net in networks
        }

        for container in containers:
            container_info = container.attrs
            networks_info = container_info.get("NetworkSettings", {}).get("Networks", {})

            for net_name, net_data in networks_info.items():
                # match by name, not id, because Networks in container attrs are keyed by name
                for net in networks:
                    if net.name == net_name:
                        network_overview[net.id]["containers"].append(NetworkContainerInfo(
                            id=container.id,
                            name=container.name,
                            status=container.status,
                            ipv4_address=net_data.get("IPAddress"),
                        ))

        # Finalize counts
        results = []
        for net_id, net_data in network_overview.items():
            containers = net_data["containers"]
            net_data["containers_count"] = len(containers)
            net_data["running_containers_count"] = sum(1 for c in containers if c.status == "running")
            results.append(DockerNetworkOverview(**net_data))

        return results

    except DockerException as e:
        logger.error(f"Failed to fetch Docker networks: {str(e)}")
        raise HTTPException(status_code=503, detail="Docker is unreachable")


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
    def pull_generator():
        try:
            client = get_docker_client()
            pull_stream = client.api.pull(
                repository=body.repository,
                tag=body.tag,
                stream=True,
                decode=True
            )

            layer_start_times: Dict[str, float] = {}

            for line in pull_stream:
                if 'id' in line and 'progressDetail' in line:
                    layer_id = line['id']
                    detail = line['progressDetail']
                    current = detail.get("current", 0)
                    total = detail.get("total", 0)

                    # Progress %
                    if current and total:
                        percent = round((current / total) * 100, 2)
                        line["progress_percent"] = percent

                    # Download speed
                    now = time()
                    if layer_id not in layer_start_times:
                        layer_start_times[layer_id] = now
                        line["download_speed"] = 0
                    else:
                        elapsed = now - layer_start_times[layer_id]
                        speed = int(current / elapsed) if elapsed > 0 else 0
                        line["download_speed"] = speed  # bytes/sec

                yield json.dumps(line) + "\n"

            # Pull complete — return summary
            image = client.images.get(f"{body.repository}:{body.tag}")
            attrs = image.attrs
            summary = DockerImageSummary(
                id=image.id,
                tags=image.tags,
                size=attrs.get("Size", 0),
                created=attrs.get("Created"),
                architecture=attrs.get("Architecture"),
                os=attrs.get("Os")
            )
            yield json.dumps({"summary": summary.dict()}) + "\n"

        except ImageNotFound:
            yield json.dumps({"error": f"Image {body.repository}:{body.tag} not found"}) + "\n"
        except DockerException as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(pull_generator(), media_type="text/event-stream")


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
    try:
        client = get_docker_client()
        volumes = client.volumes.list()

        volume_items = [
            VolumeSelectListItem(
                id=volume.attrs["Name"],
                name=volume.attrs["Name"]
            )
            for volume in volumes
        ]

        return VolumeSelectList(volumes=volume_items)

    except DockerException as e:
        logger.error(f"Error retrieving volumes: {e}")
        raise HTTPException(status_code=503, detail="Docker is unreachable.")


@app.post(
    "/containers/{container_id}/attach-volume",
    response_model=GenericMessageResponse,
    operation_id="attachVolumeToContainer",
    summary="Attach a volume to a stopped container and recreate it"
)
def attach_volume_to_container(container_id: str, body: AttachVolumeRequest):
    try:
        client = get_docker_client()
        container = get_container(container_id)

        if not container:
            raise HTTPException(status_code=404, detail="Container not found")

        container.reload()
        if container.status == "running":
            return GenericMessageResponse(
                success=False,
                code=400,
                message="Container must be stopped before attaching a volume. Please stop it first."
            )

        try:
            client.volumes.get(body.volume_name)
        except docker.errors.NotFound:
            raise HTTPException(status_code=404, detail=f"Volume '{body.volume_name}' not found")

        attrs = container.attrs
        name = container.name
        config = attrs.get("Config", {})
        host_config = attrs.get("HostConfig", {})
        network_settings = attrs.get("NetworkSettings", {})

        image = config.get("Image")
        cmd = config.get("Cmd")
        env = config.get("Env", [])
        labels = config.get("Labels", {})
        working_dir = config.get("WorkingDir")
        entrypoint = config.get("Entrypoint")
        user = config.get("User")
        tty = config.get("Tty", False)
        ports = network_settings.get("Ports", {})

        restart_policy_dict = host_config.get("RestartPolicy", {})

        existing_mounts: List[Mount] = []
        for m in attrs["Mounts"]:
            existing_mounts.append(Mount(
                source=m["Name"] if m["Type"] == "volume" else m["Source"],
                target=m["Destination"],
                type=m["Type"],
                read_only=not m.get("RW", True),
            ))

        new_mount = Mount(
            source=body.volume_name,
            target=body.mount_path,
            type="volume",
            read_only=body.read_only,
        )
        all_mounts = existing_mounts + [new_mount]

        port_bindings = {}
        for port, bindings in ports.items():
            if bindings:
                host_port = bindings[0].get("HostPort")
                if host_port:
                    port_bindings[port] = int(host_port)

        connected_networks = list(network_settings.get("Networks", {}).keys())

        # Save original config for rollback
        original_config = {
            "name": name,
            "image": image,
            "command": cmd,
            "environment": env,
            "labels": labels,
            "working_dir": working_dir,
            "entrypoint": entrypoint,
            "user": user,
            "tty": tty,
            "ports": port_bindings,
            "restart_policy": restart_policy_dict,
            "mounts": existing_mounts,
            "networks": connected_networks,
        }

        container.remove()

        try:
            new_container = client.containers.create(
                image=image,
                name=name,
                command=cmd,
                environment=env,
                labels=labels,
                ports=port_bindings,
                working_dir=working_dir,
                entrypoint=entrypoint,
                user=user,
                tty=tty,
                restart_policy=restart_policy_dict,
                mounts=all_mounts,
                detach=True
            )

            for net in connected_networks:
                try:
                    network = client.networks.get(net)
                    network.connect(new_container)
                except Exception as e:
                    rollback_logger.warning(f"Failed to reconnect to network '{net}': {e}")

            logging.info(
                f"Container '{name}' successfully recreated with volume '{body.volume_name}' mounted at '{body.mount_path}'")

            return GenericMessageResponse(
                success=True,
                code=status.HTTP_200_OK,
                message=f"Volume '{body.volume_name}' attached and container '{name}' was recreated successfully."
            )

        except Exception as creation_error:
            rollback_logger.error(
                f"Failed to attach volume '{body.volume_name}' to container '{name}'. "
                f"Attempting rollback. Reason: {creation_error}"
            )

            try:
                rollback_container = client.containers.create(
                    image=original_config["image"],
                    name=original_config["name"],
                    command=original_config["command"],
                    environment=original_config["environment"],
                    labels=original_config["labels"],
                    ports=original_config["ports"],
                    working_dir=original_config["working_dir"],
                    entrypoint=original_config["entrypoint"],
                    user=original_config["user"],
                    tty=original_config["tty"],
                    restart_policy=original_config["restart_policy"],
                    mounts=original_config["mounts"],
                    detach=True
                )

                for net in original_config["networks"]:
                    try:
                        net_obj = client.networks.get(net)
                        net_obj.connect(rollback_container)
                    except Exception as e:
                        rollback_logger.warning(f"Rollback network connection failed for '{net}': {e}")

                rollback_logger.info(
                    f"Rollback successful. Restored container '{name}' without new volume."
                )

                raise HTTPException(
                    status_code=500,
                    detail="Failed to attach volume. Original container restored."
                )

            except Exception as rollback_error:
                rollback_logger.critical(
                    f"Rollback failed for container '{name}'. Error: {rollback_error}"
                )
                raise HTTPException(
                    status_code=500,
                    detail="Failed to attach volume and rollback failed. Manual intervention required."
                )

    except DockerException as e:
        logging.error(f"Docker error: {e}")
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")
    except Exception as e:
        logging.exception("Unexpected error during volume attachment")
        raise HTTPException(status_code=500, detail="Unexpected server error")
