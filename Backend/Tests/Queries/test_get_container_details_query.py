from unittest.mock import patch, MagicMock
import pytest

from fastapi import HTTPException
from Routes.Queries.GetContainerDetail.get_container_details_query import get_container_details_query
from Models.models import ContainerStatusEnum
from Tests.utils.Builders.DockerContainerBuilder import DockerContainerBuilder
from Tests.utils.Builders.DockerImageBuilder import DockerImageBuilder
from Tests.utils.Builders.DockerVolumeBuilder import DockerVolumeBuilder


@patch("Routes.Queries.GetContainerDetail.get_container_details_query.get_container")
@patch("Routes.Queries.GetContainerDetail.get_container_details_query.detect_container_errors")
def test_get_container_details_query_success(mock_detect_errors, mock_get_container):
    container = (
        DockerContainerBuilder()
        .with_id("abc123")
        .with_name("web")
        .with_status("running")
        .with_image(DockerImageBuilder().with_tags(["nginx:latest"]).build())
        .with_command(["npm", "start"])
        .with_created("2024-07-15T12:00:00+00:00")
        .with_logs(b"INFO\nERROR: something went wrong")
        .with_port_mapping("80/tcp", "127.0.0.1", "8080")
        .with_ip("172.17.0.2")
        .with_network_mode("bridge")
        .with_volume(
            DockerVolumeBuilder()
            .with_name("my-volume")
            .with_mountpoint("/host")
            .build(),
            destination="/data"
        )
        .with_platform("linux/amd64")
        .with_cpu_limits(200000, 100000)
        .with_memory_usage(123456, 789012)
        .build()
    )

    mock_get_container.return_value = container
    mock_detect_errors.return_value = (1, "something went wrong")

    result = get_container_details_query("abc123")

    assert result.id == "abc123"
    assert result.name == "web"
    assert result.status == ContainerStatusEnum.running
    assert result.ip_address == "172.17.0.2"
    assert result.cpu_limit == 2.0
    assert result.memory_usage == 123456
    assert result.mounts[0].destination == "/data"
    assert result.image == ["nginx:latest"]
    assert result.error_count == 1


@patch("Routes.Queries.GetContainerDetail.get_container_details_query.get_container")
def test_get_container_details_query_not_found(mock_get_container):
    mock_get_container.return_value = None

    with pytest.raises(HTTPException) as excinfo:
        get_container_details_query("nonexistent")

    assert excinfo.value.status_code == 404
    assert "not found" in str(excinfo.value.detail).lower()


@patch("Routes.Queries.GetContainerDetail.get_container_details_query.get_container")
@patch("Routes.Queries.GetContainerDetail.get_container_details_query.detect_container_errors")
def test_get_container_details_query_exception(mock_detect_errors, mock_get_container):
    mock_container = MagicMock()
    mock_container.status = "running"
    mock_container.stats.side_effect = Exception("Boom")
    mock_container.attrs = {
        "NetworkSettings": {"IPAddress": "1.2.3.4"},
        "HostConfig": {"NetworkMode": "bridge", "CpuQuota": 100000, "CpuPeriod": 100000},
        "Config": {"Cmd": ["echo"], "Labels": {}},
        "Created": "2024-07-15T12:00:00Z",
        "Platform": "linux/amd64",
        "Mounts": [],
    }
    mock_container.short_id = "err123"
    mock_container.name = "broken"
    mock_container.image.tags = ["test"]
    mock_get_container.return_value = mock_container
    mock_detect_errors.return_value = (0, None)

    with pytest.raises(HTTPException) as excinfo:
        get_container_details_query("err123")

    assert excinfo.value.status_code == 500
    assert "failed to retrieve container details" in str(excinfo.value.detail).lower()
