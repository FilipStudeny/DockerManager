import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from Routes.Queries.GetDockerOverview.get_docker_overview_query import get_docker_overview_query
from Models.models import DockerOverview


@patch("Routes.Queries.GetDockerOverview.get_docker_overview_query.get_docker_client")
def test_get_docker_overview_success(mock_get_docker_client):
    mock_container_1 = MagicMock()
    mock_container_2 = MagicMock()
    mock_container_1.logs.return_value = b"line1\nline2\n"
    mock_container_2.logs.return_value = b"line1\n"

    all_containers = [mock_container_1, mock_container_2]
    running = [mock_container_1]
    exited = [mock_container_2]

    mock_client = MagicMock()
    mock_client.containers.list.side_effect = [all_containers, running, exited]
    mock_client.images.list.return_value = [MagicMock(), MagicMock()]
    mock_client.volumes.list.return_value = [MagicMock()]
    mock_client.version.return_value = {"Version": "24.0.7"}
    mock_client.info.return_value = {"Swarm": {"LocalNodeState": "active"}}
    mock_get_docker_client.return_value = mock_client

    overview: DockerOverview = get_docker_overview_query()

    assert isinstance(overview, DockerOverview)
    assert overview.version == "24.0.7"
    assert overview.total_containers == 2
    assert overview.running_containers == 1
    assert overview.failed_containers == 1
    assert overview.images == 2
    assert overview.volumes == 1
    assert overview.logs_count == 3
    assert overview.is_swarm_active is True


@patch("Routes.Queries.GetDockerOverview.get_docker_overview_query.get_docker_client")
def test_get_docker_overview_handles_log_errors(mock_get_docker_client):
    # One container has working logs, another raises an error
    good_container = MagicMock()
    bad_container = MagicMock()
    good_container.logs.return_value = b"log1\nlog2\nlog3\n"
    bad_container.logs.side_effect = Exception("Log access denied")

    mock_client = MagicMock()
    mock_client.containers.list.side_effect = [[good_container, bad_container], [good_container], [bad_container]]
    mock_client.images.list.return_value = []
    mock_client.volumes.list.return_value = []
    mock_client.version.return_value = {"Version": "25.0.0"}
    mock_client.info.return_value = {"Swarm": {"LocalNodeState": "inactive"}}
    mock_get_docker_client.return_value = mock_client

    overview = get_docker_overview_query()
    assert overview.logs_count == 3
    assert overview.is_swarm_active is False


@patch("Routes.Queries.GetDockerOverview.get_docker_overview_query.get_docker_client")
def test_get_docker_overview_info_fails_gracefully(mock_get_docker_client):
    mock_client = MagicMock()
    mock_client.containers.list.return_value = []
    mock_client.images.list.return_value = []
    mock_client.volumes.list.return_value = []
    mock_client.version.return_value = {"Version": "26.0.1"}
    mock_client.info.side_effect = Exception("Swarm unavailable")

    mock_get_docker_client.return_value = mock_client

    overview = get_docker_overview_query()
    assert overview.is_swarm_active is False
    assert overview.version == "26.0.1"


@patch("Routes.Queries.GetDockerOverview.get_docker_overview_query.get_docker_client")
def test_get_docker_overview_raises_http_exception(mock_get_docker_client):
    mock_get_docker_client.side_effect = Exception("Docker unreachable")

    with pytest.raises(HTTPException) as exc:
        get_docker_overview_query()

    assert exc.value.status_code == 503
    assert "unreachable" in str(exc.value.detail).lower()
