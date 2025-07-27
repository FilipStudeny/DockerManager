import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from docker.errors import NotFound, APIError, DockerException

from Models.models import GenericMessageResponse
from Routes.Commands.DeleteDockerVolume.delete_docker_volume_query import delete_docker_volume_query


@patch("Routes.Commands.DeleteDockerVolume.delete_docker_volume_query.get_docker_client")
def test_delete_volume_success(mock_get_client):
    mock_volume = MagicMock()
    mock_volume.name = "my_volume"

    mock_client = MagicMock()
    mock_client.volumes.get.return_value = mock_volume
    mock_client.containers.list.return_value = []  # no container using volume
    mock_get_client.return_value = mock_client

    result = delete_docker_volume_query("my_volume")

    assert isinstance(result, GenericMessageResponse)
    assert result.success is True
    assert result.code == 200
    assert "deleted successfully" in result.message.lower()
    mock_volume.remove.assert_called_once()


@patch("Routes.Commands.DeleteDockerVolume.delete_docker_volume_query.get_docker_client")
def test_delete_volume_not_found(mock_get_client):
    mock_client = MagicMock()
    mock_client.volumes.get.side_effect = NotFound("Not found")
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_volume_query("missing_volume")
    assert exc.value.status_code == 404
    assert "not found" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteDockerVolume.delete_docker_volume_query.get_docker_client")
def test_delete_volume_in_use_by_container(mock_get_client):
    mock_volume = MagicMock()
    mock_volume.name = "shared_volume"

    mock_container = MagicMock()
    mock_container.name = "container_using_volume"
    mock_container.attrs = {
        "Mounts": [{"Name": "shared_volume"}]
    }

    mock_client = MagicMock()
    mock_client.volumes.get.return_value = mock_volume
    mock_client.containers.list.return_value = [mock_container]
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_volume_query("shared_volume")
    assert exc.value.status_code == 400
    assert "in use by container" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteDockerVolume.delete_docker_volume_query.get_docker_client")
def test_delete_volume_api_error(mock_get_client):
    mock_client = MagicMock()
    mock_client.volumes.get.side_effect = APIError("API failure")
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_volume_query("any_volume")
    assert exc.value.status_code == 500
    assert "docker api error" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteDockerVolume.delete_docker_volume_query.get_docker_client")
def test_delete_volume_docker_exception(mock_get_client):
    mock_get_client.side_effect = DockerException("Docker unavailable")

    with pytest.raises(HTTPException) as exc:
        delete_docker_volume_query("my_volume")
    assert exc.value.status_code == 503
    assert "docker is unreachable" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteDockerVolume.delete_docker_volume_query.get_docker_client")
def test_delete_volume_unexpected_exception(mock_get_client):
    mock_volume = MagicMock()
    mock_volume.name = "boom"

    mock_client = MagicMock()
    mock_client.volumes.get.return_value = mock_volume
    mock_client.containers.list.return_value = []
    mock_volume.remove.side_effect = Exception("Something exploded")
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_volume_query("boom")
    assert exc.value.status_code == 500
    assert "internal server error" in exc.value.detail.lower()
