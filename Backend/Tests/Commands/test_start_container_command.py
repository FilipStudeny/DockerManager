from unittest.mock import patch, MagicMock
import pytest
from fastapi import HTTPException

from Routes.Commands.StartContainer.start_container_command import start_container_command


@patch("Routes.Commands.StartContainer.start_container_command.get_container")
def test_start_container_command_success(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "my-service"
    mock_get_container.return_value = mock_container

    result = start_container_command("abc123")

    mock_container.start.assert_called_once()
    assert result.success is True
    assert result.code == 200
    assert "started" in result.message.lower()
    assert "my-service" in result.message


@patch("Routes.Commands.StartContainer.start_container_command.get_container")
def test_start_container_command_container_not_found(mock_get_container):
    from docker.errors import NotFound
    mock_get_container.side_effect = NotFound("Container not found")

    with pytest.raises(HTTPException) as excinfo:
        start_container_command("missing-id")

    assert excinfo.value.status_code == 404
    assert "Container 'missing-id' not found" in excinfo.value.detail


@patch("Routes.Commands.StartContainer.start_container_command.get_container")
def test_start_container_command_raises_generic_exception(mock_get_container):
    mock_container = MagicMock()
    mock_container.name = "broken-container"
    mock_container.start.side_effect = Exception("Startup failure")
    mock_get_container.return_value = mock_container

    with pytest.raises(HTTPException) as excinfo:
        start_container_command("bad-id")

    assert excinfo.value.status_code == 500
    assert "Failed to start container" in excinfo.value.detail
    assert "Startup failure" in excinfo.value.detail
