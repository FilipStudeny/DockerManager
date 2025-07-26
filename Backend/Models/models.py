from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
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


class NetworkInfo(BaseModel):
    name: str
    id: str
    ip_address: str | None = None
    driver: str | None = None
    gateway: str | None = None
    subnet: str | None = None
    internal: bool | None = None
    attachable: bool | None = None

class ContainerDetails(ContainerSummary):
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
    networks: List[NetworkInfo] = Field(default_factory=list, description="All Docker networks connected to this container")

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
    containers: List['ImageContainerInfo'] = Field(default_factory=list, description="Containers using this image")

class VolumeContainerInfo(BaseModel):
    id: str
    name: str
    status: ContainerStatusEnum
    mountpoint: Optional[str] = None

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
    containers: List[VolumeContainerInfo] = Field(default_factory=list, description="Containers using this volume")

# ------------------ Docker Overview ------------------ #

class DockerOverview(BaseModel):
    version: str
    total_containers: int
    running_containers: int
    failed_containers: int
    images: int
    volumes: int
    logs_count: int
    is_swarm_active: bool


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


class NetworkContainerInfo(BaseModel):
    id: str
    name: Optional[str]
    status: Optional[str]
    ipv4_address: Optional[str]


class DockerNetworkOverview(BaseModel):
    id: str
    name: str
    driver: str
    scope: str
    containers_count: int
    running_containers_count: int
    labels: Optional[dict]
    internal: bool
    attachable: bool
    containers: List[NetworkContainerInfo]


class LogEntry(BaseModel):
    timestamp: str  # ISO 8601 string, e.g., "2023-07-19T12:34:56.123456Z"
    message: str


class ContainerLogsResponse(BaseModel):
    logs: List[LogEntry]
    next_since: Optional[int]  # Unix timestamp to use as `since` in next call
    count: int


class PullImageRequest(BaseModel):
    repository: str  # e.g. "nginx" or "redis"
    tag: str = "latest"  # optional, defaults to "latest"


class CreateVolumeRequest(BaseModel):
    name: str = Field(..., description="The name of the Docker volume to create.")
    driver: Optional[str] = Field(default="local", description="The volume driver to use.")
    labels: Optional[Dict[str, str]] = Field(default=None, description="Labels to apply to the volume.")
    driver_opts: Optional[Dict[str, str]] = Field(default=None, description="Driver-specific options.")


class CreatedVolumeResponse(BaseModel):
    name: str
    driver: str
    mountpoint: str
    created_at: Optional[str] = None
    labels: Optional[Dict[str, str]] = None
    options: Optional[Dict[str, str]] = None


class VolumeSelectListItem(BaseModel):
    id: str
    name: str


class VolumeSelectList(BaseModel):
    volumes: List[VolumeSelectListItem]


class AttachVolumeRequest(BaseModel):
    volume_name: str
    mount_path: str
    read_only: bool = False

class VolumeMount(BaseModel):
    volume_name: str
    mount_path: str
    read_only: Optional[bool] = False


class RestartPolicyModel(BaseModel):
    name: Literal["no", "always", "unless-stopped", "on-failure"]
    maximum_retry_count: Optional[int] = 0


class CreateContainerRequest(BaseModel):
    name: str
    image: str
    command: Optional[List[str]] = None
    environment: Optional[Dict[str, str]] = None
    ports: Optional[Dict[str, int]] = None
    volume_mounts: Optional[List[VolumeMount]] = None
    labels: Optional[Dict[str, str]] = None
    working_dir: Optional[str] = None
    entrypoint: Optional[List[str]] = None
    user: Optional[str] = None
    tty: Optional[bool] = False
    detach: bool = True
    networks: Optional[List[str]] = None
    restart_policy: Optional[RestartPolicyModel] = None
    start_after_create: Optional[bool] = True
    dry_run: Optional[bool] = False

class ImageContainerInfo(BaseModel):
    id: str
    name: str
    status: ContainerStatusEnum

class CreateDockerNetworkRequest(BaseModel):
    name: str
    driver: str = "bridge"
    labels: Optional[Dict[str, str]] = None
    check_duplicate: bool = True

class AssignNetworkRequest(BaseModel):
    network_name: str

class DisconnectNetworkRequest(BaseModel):
    network_name: str

class AssignMultipleNetworksRequest(BaseModel):
    network_names: List[str]

class AssignNetworkWithIPRequest(BaseModel):
    network_name: str
    ipv4_address: Optional[str] = None

class DockerNetworkSelectItem(BaseModel):
    id: str
    name: str
    gateway: Optional[str] = None  # from IPAM config

