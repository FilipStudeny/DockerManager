from fastapi import HTTPException
from typing import Dict, Any

from Models.models import (
    ContainerDetails,
    MountInfo,
    map_status_to_enum,
)

from Routes.Queries.GetConainersList.get_containers_list_query import enrich_container_summary
from Utils.getDocker import get_container, detect_container_errors


def get_container_details_query(container_id: str) -> ContainerDetails:
    try:
        container = get_container(container_id)
        if container is None:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")

        is_running = container.status.lower() == "running"
        stats = container.stats(stream=False) if is_running else None

        status_enum = map_status_to_enum(container.status)
        error_count, latest_error = detect_container_errors(container)
        base_summary = enrich_container_summary(container, status_enum, error_count, latest_error)

        attrs = container.attrs

        config = attrs.get("Config", {})
        host_config = attrs.get("HostConfig", {})
        state = attrs.get("State", {})
        network_settings = attrs.get("NetworkSettings", {})

        return ContainerDetails(
            **base_summary.model_dump(),
            ip_address=_extract_ip_address(network_settings),
            network_mode=host_config.get("NetworkMode", "unknown"),
            created=attrs.get("Created", "N/A"),
            platform=attrs.get("Platform", "unknown"),
            cpu_percent=_calculate_cpu_percent(stats) if stats else 0.0,
            memory_usage=stats["memory_stats"].get("usage", 0) if stats else 0,
            memory_limit=stats["memory_stats"].get("limit", 0) if stats else 0,
            cpu_limit=_get_cpu_limit(container),
            mounts=_parse_mounts(container),
            labels=config.get("Labels", {}),
            env=config.get("Env", []),
            restart_policy=host_config.get("RestartPolicy", {}),
            privileged=host_config.get("Privileged", False),
            log_path=attrs.get("LogPath", None),
            entrypoint=_format_entrypoint(config),
            pid=state.get("Pid"),
            exit_code=state.get("ExitCode"),
            state=state.get("Status"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve container details: {str(e)}")


def _calculate_cpu_percent(stats: Dict[str, Any]) -> float:
    try:
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
        if system_delta > 0:
            cpu_count = len(stats["cpu_stats"]["cpu_usage"].get("percpu_usage", [])) or 1
            return round((cpu_delta / system_delta) * cpu_count * 100.0, 2)
    except (KeyError, ZeroDivisionError, TypeError):
        pass
    return 0.0


def _get_cpu_limit(container: Any) -> float | None:
    host_config = container.attrs.get("HostConfig", {})
    cpu_quota = host_config.get("CpuQuota")
    cpu_period = host_config.get("CpuPeriod")
    if cpu_quota and cpu_period and cpu_period > 0:
        return round(cpu_quota / cpu_period, 2)
    return None


def _parse_mounts(container: Any) -> list[MountInfo]:
    mounts_raw = container.attrs.get("Mounts", [])
    return [
        MountInfo(
            source=m.get("Source"),
            destination=m.get("Destination"),
            mode=m.get("Mode"),
            type=m.get("Type"),
        )
        for m in mounts_raw
    ]


def _format_entrypoint(config: Dict[str, Any]) -> str | None:
    entry = config.get("Entrypoint")
    if isinstance(entry, list):
        return " ".join(entry)
    return entry

def _extract_ip_address(network_settings: Dict[str, Any]) -> str:
    networks = network_settings.get("Networks")
    if isinstance(networks, dict):
        for net in networks.values():
            ip = net.get("IPAddress")
            if ip:
                return ip
    # fallback
    return network_settings.get("IPAddress", "N/A")
