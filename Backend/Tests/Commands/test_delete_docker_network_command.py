import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from docker.errors import NotFound, DockerException, APIError

from Models.models import GenericMessageResponse
from Routes.Commands.DeleteDockerNetwork.delete_docker_network_command import delete_docker_network_command


@patch("Routes.Commands.DeleteDockerNetwork.delete_docker_network_command.get_docker_client")
def test_delete_network_success(mock_get_client):
    mock_network = MagicMock()
    mock_network.id = "abc123"
    mock_network.name = "test_network"

    mock_client = MagicMock()
    mock_client.networks.get.return_value = mock_network
    mock_client.api.inspect_network.return_value = {"Containers": {}}
    mock_get_client.return_value = mock_client

    result = delete_docker_network_command("abc123", dry_run=False)

    assert isinstance(result, GenericMessageResponse)
    assert result.success is True
    assert result.code == 200
    assert "deleted successfully" in result.message.lower()
    mock_network.remove.assert_called_once()


@patch("Routes.Commands.DeleteDockerNetwork.delete_docker_network_command.get_docker_client")
def test_delete_network_dry_run(mock_get_client):
    mock_network = MagicMock()
    mock_network.id = "abc123"
    mock_network.name = "dry_net"

    mock_client = MagicMock()
    mock_client.networks.get.return_value = mock_network
    mock_client.api.inspect_network.return_value = {"Containers": {}}
    mock_get_client.return_value = mock_client

    result = delete_docker_network_command("abc123", dry_run=True)

    assert isinstance(result, GenericMessageResponse)
    assert result.success is True
    assert result.code == 200
    assert "can be safely deleted" in result.message.lower()
    mock_network.remove.assert_not_called()


@patch("Routes.Commands.DeleteDockerNetwork.delete_docker_network_command.get_docker_client")
def test_delete_network_not_found(mock_get_client):
    mock_client = MagicMock()
    mock_client.networks.get.side_effect = NotFound("Not found")
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_network_command("missing_network")
    assert exc.value.status_code == 404
    assert "not found" in exc.value.detail.lower()


@patch("Routes.Commands.DeleteDockerNetwork.delete_docker_network_command.get_docker_client")
def test_delete_network_connected_to_containers(mock_get_client):
    mock_network = MagicMock()
    mock_network.id = "abc123"
    mock_network.name = "busy_net"

    mock_client = MagicMock()
    mock_client.networks.get.return_value = mock_network
    mock_client.api.inspect_network.return_value = {
        "Containers": {
            "abc": {"Name": "web"},
            "def": {"Name": "db"}
        }
    }
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_network_command("abc123", dry_run=False)
    assert exc.value.status_code == 400
    assert "attached to container(s)" in exc.value.detail.lower()

@patch("Routes.Commands.DeleteDockerNetwork.delete_docker_network_command.get_docker_client")
def test_delete_network_api_error(mock_get_client):
    from docker.errors import APIError

    mock_network = MagicMock()
    mock_network.id = "abc123"
    mock_network.name = "fail_net"
    mock_network.remove.side_effect = APIError("api failed")

    mock_client = MagicMock()
    mock_client.networks.get.return_value = mock_network
    mock_client.api.inspect_network.return_value = {"Containers": {}}
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_network_command("abc123", dry_run=False)

    assert exc.value.status_code == 500
    assert "docker api error" in exc.value.detail.lower()



@patch("Routes.Commands.DeleteDockerNetwork.delete_docker_network_command.get_docker_client")
def test_delete_network_docker_exception(mock_get_client):
    mock_get_client.side_effect = DockerException("docker down")

    with pytest.raises(HTTPException) as exc:
        delete_docker_network_command("any_id")
    assert exc.value.status_code == 503
    assert "docker is unreachable" in exc.value.detail.lower()

@patch("Routes.Commands.DeleteDockerNetwork.delete_docker_network_command.get_docker_client")
def test_delete_network_unexpected_exception(mock_get_client):
    mock_network = MagicMock()
    mock_network.id = "abc123"
    mock_network.name = "crashy_net"
    mock_network.remove.side_effect = Exception("boom")

    mock_client = MagicMock()
    mock_client.networks.get.return_value = mock_network
    mock_client.api.inspect_network.return_value = {"Containers": {}}
    mock_get_client.return_value = mock_client

    with pytest.raises(HTTPException) as exc:
        delete_docker_network_command("abc123", dry_run=False)

    assert exc.value.status_code == 500
    assert "internal server error" in exc.value.detail.lower()

