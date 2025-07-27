import pytest
from unittest.mock import patch, MagicMock, ANY
from fastapi import HTTPException, Query
from docker.errors import APIError, DockerException

from Models.models import GenericMessageResponse
from Routes.Commands.DeleteContainer.delete_container_command import delete_container_command


@patch("Routes.Commands.DeleteContainer.delete_container_command.get_container")
def test_delete_container_success(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "web"
    mock_container.status = "exited"

    mock_get_container.return_value = mock_container

    result = delete_container_command("web", force=Query(False))

    assert isinstance(result, GenericMessageResponse)
    assert result.success is True
    assert result.code == 200
    assert "deleted successfully" in result.message.lower()
    mock_container.remove.assert_called_once_with(force=ANY)


@patch("Routes.Commands.DeleteContainer.delete_container_command.get_container")
def test_delete_container_force(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "web"
    mock_container.status = "running"

    mock_get_container.return_value = mock_container

    result = delete_container_command("web", force=Query(True))

    assert isinstance(result, GenericMessageResponse)
    assert result.success is True
    assert result.code == 200
    assert "deleted successfully" in result.message.lower()
    mock_container.remove.assert_called_once_with(force=ANY)


@patch("Routes.Commands.DeleteContainer.delete_container_command.get_container")
def test_delete_container_api_error(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "cache"
    mock_container.status = "exited"
    mock_container.remove.side_effect = APIError("API failed")

    mock_get_container.return_value = mock_container

    with pytest.raises(HTTPException) as exc:
        delete_container_command("cache", force=Query(False))
    assert exc.value.status_code == 500
    assert "docker api error" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteContainer.delete_container_command.get_container")
def test_delete_container_docker_exception(mock_get_container):
    mock_get_container.side_effect = DockerException("Docker down")

    with pytest.raises(HTTPException) as exc:
        delete_container_command("redis", force=Query(False))
    assert exc.value.status_code == 503
    assert "docker is unreachable" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteContainer.delete_container_command.get_container")
def test_delete_container_unexpected_exception(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "crash"
    mock_container.status = "exited"
    mock_container.remove.side_effect = Exception("boom")

    mock_get_container.return_value = mock_container

    with pytest.raises(HTTPException) as exc:
        delete_container_command("crash", force=Query(False))
    assert exc.value.status_code == 500
    assert "internal server error" in exc.value.detail.lower()
