import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from docker.errors import DockerException, ImageNotFound, APIError

from Models.models import GenericMessageResponse
from Routes.Commands.DeleteImage.delete_docker_image_command import delete_docker_image_command


@patch("Routes.Commands.DeleteImage.delete_docker_image_command.get_docker_client")
def test_delete_image_success(mock_get_client):
    mock_image = MagicMock()
    mock_image.id = "sha256:123"

    mock_client = MagicMock()
    mock_client.images.get.return_value = mock_image
    mock_client.containers.list.return_value = []
    mock_get_client.return_value = mock_client

    result = delete_docker_image_command("sha256:123")

    assert isinstance(result, GenericMessageResponse)
    assert result.success is True
    assert result.code == 200
    assert "deleted successfully" in result.message.lower()
    mock_client.images.remove.assert_called_once_with(image="sha256:123", force=True)


@patch("Routes.Commands.DeleteImage.delete_docker_image_command.get_docker_client")
def test_delete_image_not_found(mock_get_client):
    mock_client = MagicMock()
    mock_client.images.get.side_effect = ImageNotFound("Image not found")
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_image_command("nonexistent")
    assert exc.value.status_code == 404
    assert "not found" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteImage.delete_docker_image_command.get_docker_client")
def test_delete_image_used_by_containers(mock_get_client):
    mock_image = MagicMock()
    mock_image.id = "sha256:abc"

    mock_container = MagicMock()
    mock_container.name = "my_container"
    mock_container.image.id = "sha256:abc"

    mock_client = MagicMock()
    mock_client.images.get.return_value = mock_image
    mock_client.containers.list.return_value = [mock_container]
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_image_command("sha256:abc")
    assert exc.value.status_code == 400
    assert "used by container" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteImage.delete_docker_image_command.get_docker_client")
def test_delete_image_list_containers_docker_error(mock_get_client):
    mock_image = MagicMock()
    mock_image.id = "sha256:abc"

    mock_client = MagicMock()
    mock_client.images.get.return_value = mock_image
    mock_client.containers.list.side_effect = DockerException("List error")
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_image_command("sha256:abc")
    assert exc.value.status_code == 503
    assert "failed to verify" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteImage.delete_docker_image_command.get_docker_client")
def test_delete_image_api_error(mock_get_client):
    mock_image = MagicMock()
    mock_image.id = "sha256:abc"

    mock_client = MagicMock()
    mock_client.images.get.return_value = mock_image
    mock_client.containers.list.return_value = []
    mock_client.images.remove.side_effect = APIError("API error")
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_image_command("sha256:abc")
    assert exc.value.status_code == 500
    assert "docker api error" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteImage.delete_docker_image_command.get_docker_client")
def test_delete_image_unexpected_exception(mock_get_client):
    mock_image = MagicMock()
    mock_image.id = "sha256:abc"

    mock_client = MagicMock()
    mock_client.images.get.return_value = mock_image
    mock_client.containers.list.return_value = []
    mock_client.images.remove.side_effect = Exception("Something exploded")
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_image_command("sha256:abc")
    assert exc.value.status_code == 500
    assert "internal server error" in exc.value.detail.lower()
