from typing import Optional, Dict, Any, List

from fastapi import HTTPException

from Models.models import ContainerDetails, MountInfo
from Models.models import map_status_to_enum
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

        return ContainerDetails(
            **base_summary.model_dump(),
            ip_address=container.attrs["NetworkSettings"]["IPAddress"],
            network_mode=container.attrs["HostConfig"]["NetworkMode"],
            created=container.attrs["Created"],
            platform=container.attrs.get("Platform", "unknown"),
            cpu_percent=_calculate_cpu_percent(stats) if stats else 0.0,
            memory_usage=stats["memory_stats"]["usage"] if stats else 0,
            memory_limit=stats["memory_stats"]["limit"] if stats else 0,
            cpu_limit=_get_cpu_limit(container),
            mounts=_parse_mounts(container),
            labels=container.attrs.get("Config", {}).get("Labels", {}),
        )
    except HTTPException:
        raise  # Re-raise 404
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve container details: {str(e)}")


def _calculate_cpu_percent(stats: Dict[str, Any]) -> float:
    try:
        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
        system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
        if system_delta > 0.0:
            cpu_count = len(stats["cpu_stats"]["cpu_usage"].get("percpu_usage", [])) or 1
            return round((cpu_delta / system_delta) * cpu_count * 100.0, 2)
    except (KeyError, ZeroDivisionError):
        return 0.0
    return 0.0


def _get_cpu_limit(container: Any) -> Optional[float]:
    cpu_quota = container.attrs.get("HostConfig", {}).get("CpuQuota")
    cpu_period = container.attrs.get("HostConfig", {}).get("CpuPeriod")
    if cpu_quota and cpu_period and cpu_period > 0:
        return round(cpu_quota / cpu_period, 2)
    return None


def _parse_mounts(container: Any) -> List[MountInfo]:
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
