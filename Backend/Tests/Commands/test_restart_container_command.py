from unittest.mock import patch, MagicMock
import pytest
from fastapi import HTTPException

from Routes.Commands.RestartContainer.restart_container_command import restart_container_command


@patch("Routes.Commands.RestartContainer.restart_container_command.get_container")
def test_restart_container_command_success(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "webapp"
    mock_get_container.return_value = mock_container

    result = restart_container_command("abc123")

    mock_container.restart.assert_called_once()
    assert result.success is True
    assert result.code == 200
    assert "restarted" in result.message.lower()
    assert "webapp" in result.message


@patch("Routes.Commands.RestartContainer.restart_container_command.get_container")
def test_restart_container_command_container_not_found(mock_get_container):
    from docker.errors import NotFound

    mock_get_container.side_effect = NotFound("No such container")

    with pytest.raises(HTTPException) as excinfo:
        restart_container_command("does-not-exist")

    assert excinfo.value.status_code == 404
    assert "Container 'does-not-exist' not found" in excinfo.value.detail


@patch("Routes.Commands.RestartContainer.restart_container_command.get_container")
def test_restart_container_command_raises_generic_exception(mock_get_container):
    mock_container = MagicMock()
    mock_container.restart.side_effect = Exception("Docker failure")
    mock_container.name = "webapp"
    mock_get_container.return_value = mock_container

    with pytest.raises(HTTPException) as excinfo:
        restart_container_command("abc123")

    assert excinfo.value.status_code == 500
    assert "Failed to restart container" in excinfo.value.detail
    assert "Docker failure" in excinfo.value.detail
