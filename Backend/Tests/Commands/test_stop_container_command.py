from unittest.mock import patch, MagicMock
import pytest
from fastapi import HTTPException

from Routes.Commands.StopContainer.stop_container_command import stop_container_command


@patch("Routes.Commands.StopContainer.stop_container_command.get_container")
def test_stop_container_command_success(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "app-db"
    mock_get_container.return_value = mock_container

    result = stop_container_command("abc123")

    mock_container.stop.assert_called_once()
    assert result.success is True
    assert result.code == 200
    assert "stopped" in result.message.lower()
    assert "app-db" in result.message


@patch("Routes.Commands.StopContainer.stop_container_command.get_container")
def test_stop_container_command_container_not_found(mock_get_container):
    from docker.errors import NotFound
    mock_get_container.side_effect = NotFound("Container not found")

    with pytest.raises(HTTPException) as excinfo:
        stop_container_command("ghost-id")

    assert excinfo.value.status_code == 404
    assert "Container 'ghost-id' not found" in excinfo.value.detail


@patch("Routes.Commands.StopContainer.stop_container_command.get_container")
def test_stop_container_command_raises_generic_exception(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "fail-container"
    mock_container.stop.side_effect = Exception("Something failed")
    mock_get_container.return_value = mock_container

    with pytest.raises(HTTPException) as excinfo:
        stop_container_command("bad-id")

    assert excinfo.value.status_code == 500
    assert "Failed to stop container" in excinfo.value.detail
    assert "Something failed" in excinfo.value.detail
