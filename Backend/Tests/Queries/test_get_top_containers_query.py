import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from Routes.Queries.GetTopContainers.get_top_containers_query import get_top_containers_query
from Models.models import ContainerStats


def make_mock_container(id_suffix: str, name: str):
    mock = MagicMock()
    mock.id = f"abcdef123456{id_suffix}"
    mock.name = name
    return mock


@patch("Routes.Queries.GetTopContainers.get_top_containers_query.get_docker_client")
def test_get_top_containers_success(mock_get_docker_client):
    containers = [
        make_mock_container("01", "web"),
        make_mock_container("02", "db"),
        make_mock_container("03", "worker"),
        make_mock_container("04", "cache"),
        make_mock_container("05", "logger"),
    ]

    mock_client = MagicMock()
    mock_client.containers.list.return_value = containers
    mock_get_docker_client.return_value = mock_client

    result = get_top_containers_query()

    assert isinstance(result, list)
    assert len(result) == 4
    for item in result:
        assert isinstance(item, ContainerStats)
        assert item.cpu == 42.3
        assert item.memory == 30.4
        assert len(item.id) == 12


@patch("Routes.Queries.GetTopContainers.get_top_containers_query.get_docker_client")
def test_get_top_containers_docker_error(mock_get_docker_client):
    mock_get_docker_client.side_effect = Exception("Docker not reachable")

    with pytest.raises(HTTPException) as exc:
        get_top_containers_query()

    assert exc.value.status_code == 503
    assert "unreachable" in str(exc.value.detail).lower()
