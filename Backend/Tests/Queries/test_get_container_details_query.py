import pytest
from unittest.mock import patch

from Models.models import ContainerDetails, ContainerStatusEnum
from Routes.Queries.GetContainerDetail.get_container_details_query import get_container_details_query
from Tests.utils.Builders.DockerContainerBuilder import DockerContainerBuilder
from Tests.utils.Builders.DockerImageBuilder import DockerImageBuilder


@pytest.fixture
def mock_container():
    image = DockerImageBuilder().with_tags(["nginx:latest"]).build()

    container = (
        DockerContainerBuilder()
        .with_image(image)
        .with_status("running")
        .with_command(["npm", "start"])
        .with_port_mapping(container_port="80/tcp", host_ip="0.0.0.0", host_port="8080")
        .with_created("2024-01-01T12:00:00Z")
        .with_cpu_limits(quota=200000, period=100000)
        .with_memory_usage(52428800, 1073741824)  # 50MB used / 1GB total
        .with_labels({"service": "web"})
        .build()
    )

    return container


@patch("Routes.Queries.GetContainerDetail.get_container_details_query.get_container")
@patch("Routes.Queries.GetContainerDetail.get_container_details_query.detect_container_errors")
@patch("Routes.Queries.GetContainerDetail.get_container_details_query.enrich_container_summary")
@patch("Routes.Queries.GetContainerDetail.get_container_details_query._extract_networks", return_value=[])
def test_get_container_details_success(mock_extract_networks, mock_enrich, mock_detect_errors, mock_get_container, mock_container):
    mock_get_container.return_value = mock_container
    mock_detect_errors.return_value = (1, "error occurred")

    mock_enrich.return_value.model_dump.return_value = {
        "id": mock_container.short_id,
        "name": mock_container.name,
        "status": ContainerStatusEnum.running,
        "image": mock_container.image.tags,
        "command": "npm start",
        "created_at": mock_container.attrs["Created"],
        "uptime_seconds": 123,
        "ports": [],
        "error_count": 1,
        "latest_error_message": "error occurred",
        "volumes": 0
    }

    container_id = mock_container.short_id
    result: ContainerDetails = get_container_details_query(container_id)

    assert isinstance(result, ContainerDetails)
    assert result.name == mock_container.name
    assert result.status == ContainerStatusEnum.running
    assert result.cpu_percent > 0.0
    assert result.memory_usage == 52428800
    assert result.memory_limit == 1073741824
    assert result.cpu_limit == 2.0
    assert result.mounts == []
    assert result.networks == []


@patch("Routes.Queries.GetContainerDetail.get_container_details_query.get_container")
def test_get_container_details_not_found(mock_get_container):
    mock_get_container.return_value = None
    with pytest.raises(Exception) as exc:
        get_container_details_query("nonexistent-id")
    assert exc.value.status_code == 404
    assert "not found" in str(exc.value.detail).lower()


@patch("Routes.Queries.GetContainerDetail.get_container_details_query.get_container")
def test_get_container_details_raises_internal_error(mock_get_container):
    mock_get_container.side_effect = RuntimeError("Docker exploded")
    with pytest.raises(Exception) as exc:
        get_container_details_query("abc123")
    assert exc.value.status_code == 500
    assert "failed to retrieve container details" in str(exc.value.detail).lower()
