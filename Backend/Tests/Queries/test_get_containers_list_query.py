import pytest
from unittest.mock import patch, MagicMock

from Models.models import ContainerSummary, ContainerStatusEnum
from Routes.Queries.GetConainersList.get_containers_list_query import get_containers_list_query
from Tests.utils.Builders.DockerContainerBuilder import DockerContainerBuilder
from Tests.utils.Builders.DockerImageBuilder import DockerImageBuilder


@pytest.fixture
def mock_container_running():
    image = DockerImageBuilder().with_tags(["nginx:latest"]).build()

    return (
        DockerContainerBuilder()
        .with_image(image)
        .with_status("running")
        .with_command(["npm", "start"])
        .with_created("2024-01-01T12:00:00Z")
        .with_cpu_limits(200000, 100000)
        .with_port_mapping("80/tcp", "0.0.0.0", "8080")
        .with_memory_usage(1024 * 1024 * 50, 1024 * 1024 * 1024)
        .build()
    )


@pytest.fixture
def mock_container_exited():
    image = DockerImageBuilder().with_tags(["redis:alpine"]).build()

    return (
        DockerContainerBuilder()
        .with_image(image)
        .with_status("exited")
        .with_command(["redis-server"])
        .with_created("2024-01-01T12:00:00Z")
        .build()
    )


@patch("Routes.Queries.GetConainersList.get_containers_list_query.get_docker_client")
@patch("Routes.Queries.GetConainersList.get_containers_list_query.detect_container_errors")
def test_get_containers_list_success(mock_detect_errors, mock_get_docker_client, mock_container_running, mock_container_exited):
    mock_detect_errors.side_effect = [(0, None), (2, "crashed")]

    docker_client_mock = MagicMock()
    docker_client_mock.containers.list.return_value = [mock_container_running, mock_container_exited]
    mock_get_docker_client.return_value = docker_client_mock

    result = get_containers_list_query(all=True)

    assert isinstance(result, list)
    assert len(result) == 2

    c1: ContainerSummary = result[0]
    c2: ContainerSummary = result[1]

    assert c1.name == mock_container_running.name
    assert c1.status == ContainerStatusEnum.running
    assert c1.ports[0].container_port == "80/tcp"
    assert c1.ports[0].host_port == "8080"
    assert c1.uptime_seconds is not None
    assert c1.error_count == 0

    assert c2.name == mock_container_exited.name
    assert c2.status == ContainerStatusEnum.stopped
    assert c2.uptime_seconds is None
    assert c2.error_count == 2
    assert c2.latest_error_message == "crashed"


@patch("Routes.Queries.GetConainersList.get_containers_list_query.get_docker_client")
def test_get_containers_list_empty(mock_get_docker_client):
    docker_client_mock = MagicMock()
    docker_client_mock.containers.list.return_value = []
    mock_get_docker_client.return_value = docker_client_mock

    result = get_containers_list_query(all=True)
    assert isinstance(result, list)
    assert result == []


@patch("Routes.Queries.GetConainersList.get_containers_list_query.get_docker_client")
def test_get_containers_list_raises(mock_get_docker_client):
    mock_get_docker_client.side_effect = Exception("Docker connection error")
    with pytest.raises(Exception) as exc:
        get_containers_list_query()
    assert "Docker connection error" in str(exc.value)
