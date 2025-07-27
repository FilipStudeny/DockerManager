import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from docker.errors import NotFound

from Routes.Commands.StartContainer.start_container_command import start_container_command
from Models.models import GenericMessageResponse


@patch("Routes.Commands.StartContainer.start_container_command.get_container")
def test_start_container_success(mock_get_container):
    mock_container = MagicMock()
    mock_container.id = "abc123"
    mock_container.name = "my_container"
    mock_get_container.return_value = mock_container

    response = start_container_command("abc123")

    mock_container.start.assert_called_once()
    assert isinstance(response, GenericMessageResponse)
    assert response.success is True
    assert response.code == 200
    assert "started" in response.message.lower()


@patch("Routes.Commands.StartContainer.start_container_command.get_container")
def test_start_container_not_found(mock_get_container):
    mock_get_container.side_effect = NotFound("Container not found")

    with pytest.raises(HTTPException) as exc:
        start_container_command("missing_id")

    assert exc.value.status_code == 404
    assert "not found" in str(exc.value.detail).lower()


@patch("Routes.Commands.StartContainer.start_container_command.get_container")
def test_start_container_unexpected_error(mock_get_container):
    mock_get_container.side_effect = Exception("Something went wrong")

    with pytest.raises(HTTPException) as exc:
        start_container_command("crash_id")

    assert exc.value.status_code == 500
    assert "failed to start" in str(exc.value.detail).lower()
