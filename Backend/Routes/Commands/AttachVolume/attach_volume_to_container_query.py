import logging
from typing import List

import docker
from docker.errors import DockerException
from docker.errors import DockerException
from docker.types import Mount
from fastapi import HTTPException
from starlette import status

from Models.models import (
    GenericMessageResponse, AttachVolumeRequest
)
from Utils.getDocker import get_docker_client, get_container
from Utils.logger import rollback_logger


def attach_volume_to_container_query(container_id: str, body: AttachVolumeRequest):
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
