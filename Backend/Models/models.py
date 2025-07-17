from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class GenericMessageResponse(BaseModel):
    success: Optional[bool] = Field(None, description="Indicates if the operation was successful")
    code: Optional[int] = Field(None, description="HTTP-like status code representing the outcome")
    message: Optional[str] = Field(None, description="Human-readable message explaining the result")

class ContainerStatusEnum(str, Enum):
    running = "RUNNING"
    stopped = "STOPPED"
    restarted = "RESTARTED"
    failed = "FAILED"

def map_status_to_enum(status: str) -> ContainerStatusEnum:
        if status == "running":
            return ContainerStatusEnum.running
        elif status == "exited":
            return ContainerStatusEnum.stopped
        elif status == "restarting":
            return ContainerStatusEnum.restarted
        else:
            return ContainerStatusEnum.failed


class PortBinding(BaseModel):
    container_port: str = Field(..., description="Port exposed in container (e.g. '80/tcp')")
    host_ip: Optional[str] = Field(None, description="Host IP (if published)")
    host_port: Optional[str] = Field(None, description="Published host port (if any)")


class MountInfo(BaseModel):
    source: Optional[str] = Field(None, description="Host path or volume name")
    destination: str = Field(..., description="Mount point inside the container")
    mode: Optional[str] = Field(None, description="Read/write mode (e.g. 'rw')")
    type: Optional[str] = Field(None, description="Mount type (e.g. 'bind', 'volume')")


class ContainerSummary(BaseModel):
    id: str = Field(..., description="Short container ID")
    name: str = Field(..., description="Container name")
    status: ContainerStatusEnum = Field(..., description="Current container status")
    image: List[str] = Field(..., description="List of container image tags")
    command: str = Field(..., description="Startup command")
    created_at: str = Field(..., description="Timestamp of container creation (ISO 8601)")
    uptime_seconds: Optional[int] = Field(None, description="How long the container has been running (in seconds)")
    ports: List[PortBinding] = Field(default_factory=list, description="Published ports")
    error_count: int = Field(0, description="Number of error events for the container")
    latest_error_message: Optional[str] = Field(None, description="Most recent error message, if any")
    volumes: int

class ContainerDetails(ContainerSummary):
    ip_address: str = Field(..., description="Container's internal IP address")
    network_mode: str = Field(..., description="Docker network mode (e.g. bridge, host)")
    created: str = Field(..., description="Raw container creation timestamp")
    platform: Optional[str] = Field("unknown", description="Platform or architecture (e.g. linux/amd64)")
    cpu_percent: float = Field(..., description="Current CPU usage percentage")
    memory_usage: int = Field(..., description="Current memory usage in bytes")
    memory_limit: int = Field(..., description="Memory limit in bytes")
    cpu_limit: Optional[float] = Field(None, description="CPU quota limit, if set (in cores)")
    mounts: List[MountInfo] = Field(default_factory=list, description="List of mounted volumes/binds")
    labels: Dict[str, str] = Field(default_factory=dict, description="User-defined metadata labels")

    env: List[str] = Field(default_factory=list, description="List of environment variables")
    restart_policy: Optional[Dict[str, Any]] = Field(None, description="Restart policy configuration")
    privileged: Optional[bool] = Field(None, description="If the container is running in privileged mode")
    log_path: Optional[str] = Field(None, description="Path to the container log file on the host")
    entrypoint: Optional[str] = Field(None, description="Entrypoint for the container")
    pid: Optional[int] = Field(None, description="Main process PID")
    exit_code: Optional[int] = Field(None, description="Exit code of the container if it has stopped")
    state: Optional[str] = Field(None, description="Raw container state (e.g. running, exited)")

class DockerStatus(BaseModel):
    status: str = Field(..., description="Docker daemon status message")


class ContainerActionResponse(BaseModel):
    message: str = Field(..., description="Action response message (e.g. started, stopped)")

class DockerImageSummary(BaseModel):
    id: str
    tags: List[str]
    size: int
    created: Optional[str]
    architecture: Optional[str]
    os: Optional[str]

class DockerVolumeSummary(BaseModel):
    name: Optional[str] = Field(None, description="Volume name (if named Docker volume)")
    type: str = Field(..., description="Type of mount: volume or bind")
    source: str = Field(..., description="Host source path or volume name")
    destination: str = Field(..., description="Mount point inside the container")
    driver: Optional[str] = Field(None, description="Volume driver (Docker-managed only)")
    mountpoint: Optional[str] = Field(None, description="Where the volume is mounted on host")
    created_at: Optional[str] = Field(None, description="Creation timestamp (Docker volumes)")
    size: Optional[str] = Field(None, description="Human-readable volume size (if available)")
    labels: Dict[str, str] = Field(default_factory=dict, description="Metadata labels (Docker volumes)")

# ------------------ Docker Overview ------------------ #

class DockerOverview(BaseModel):
    version: str
    total_containers: int
    running_containers: int
    failed_containers: int
    images: int
    volumes: int
    logs_count: int

# ------------------ Container Stats ------------------ #

class ContainerStats(BaseModel):
    id: str
    name: str
    cpu: float = Field(..., ge=0.0, le=100.0, description="CPU usage in percent")
    memory: float = Field(..., ge=0.0, le=100.0, description="Memory usage in percent")


# ------------------ Logging & Alerts ------------------ #

class LogInfo(BaseModel):
    count: int = Field(..., description="Total number of log entries")
    latest: str = Field(..., description="Most recent log message")


class PerformanceWarning(BaseModel):
    message: str