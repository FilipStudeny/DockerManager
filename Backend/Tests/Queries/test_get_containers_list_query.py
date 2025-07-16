from unittest.mock import patch, MagicMock
import pytest

from Models.models import ContainerStatusEnum
from Routes.Queries.GetConainersList.get_containers_list_query import get_containers_list_query
from Tests.utils.Builders.DockerContainerBuilder import DockerContainerBuilder
from Tests.utils.Builders.DockerImageBuilder import DockerImageBuilder


@patch("Routes.Queries.GetConainersList.get_containers_list_query.get_docker_client")
def test_get_containers_list_query_returns_multiple(mock_get_client):
    mock_docker = MagicMock()

    container1 = (
        DockerContainerBuilder()
        .with_id("abc123")
        .with_name("web")
        .with_status("running")
        .with_image(DockerImageBuilder().with_tags(["nginx:latest"]).build())
        .with_command(["npm", "start"])
        .with_created("2024-07-15T12:00:00+00:00")
        .with_logs(b"INFO: start\nERROR: crash")
        .with_port_mapping("80/tcp", "127.0.0.1", "8080")
        .build()
    )

    container2 = (
        DockerContainerBuilder()
        .with_id("def456")
        .with_name("db")
        .with_status("exited")
        .with_image(DockerImageBuilder().with_tags(["postgres:15"]).build())
        .with_command(["postgres"])
        .with_created("2024-07-15T14:00:00+00:00")
        .with_logs(b"boot complete")
        .with_port_mapping("5432/tcp", "127.0.0.1", "5432")
        .build()
    )

    mock_docker.containers.list.return_value = [container1, container2]
    mock_get_client.return_value = mock_docker

    result = get_containers_list_query()

    assert len(result) == 2
    assert result[0].id == "abc123"
    assert result[1].id == "def456"
    assert result[0].status == ContainerStatusEnum.running
    assert result[1].status == ContainerStatusEnum.stopped
    assert result[0].error_count == 1
    assert "error" in result[0].latest_error_message.lower()


@patch("Routes.Queries.GetConainersList.get_containers_list_query.get_docker_client")
def test_get_containers_list_query_returns_empty(mock_get_client):
    mock_docker = MagicMock()
    mock_docker.containers.list.return_value = []
    mock_get_client.return_value = mock_docker

    result = get_containers_list_query()

    assert isinstance(result, list)
    assert len(result) == 0


@patch("Routes.Queries.GetConainersList.get_containers_list_query.get_docker_client")
def test_get_containers_list_query_raises_exception(mock_get_client):
    mock_get_client.side_effect = Exception("Docker unavailable")

    with pytest.raises(Exception) as excinfo:
        get_containers_list_query()

    assert "Docker unavailable" in str(excinfo.value)
