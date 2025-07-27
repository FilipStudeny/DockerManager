import pytest
from unittest.mock import patch, MagicMock
from docker.errors import DockerException
from fastapi import HTTPException

from Models.models import DockerNetworkOverview, NetworkContainerInfo
from Routes.Queries.GetDockerNetworkOverview.get_docker_networks_overview_query import \
    get_docker_networks_overview_query


@pytest.fixture
def mock_network():
    mock = MagicMock()
    mock.name = "custom_net"
    mock.id = "abc123"
    mock.attrs = {
        "Driver": "bridge",
        "Scope": "local",
        "Labels": {"env": "test"},
        "Internal": False,
        "Attachable": True,
    }
    return mock


@pytest.fixture
def mock_container_attached_to_net():
    mock = MagicMock()
    mock.id = "c123"
    mock.name = "nginx"
    mock.status = "running"
    mock.attrs = {
        "NetworkSettings": {
            "Networks": {
                "custom_net": {
                    "IPAddress": "172.18.0.5",
                    "NetworkID": "abc123"
                }
            }
        }
    }
    return mock


@patch("Routes.Queries.GetDockerNetworkOverview.get_docker_networks_overview_query.get_docker_client")
def test_get_docker_networks_success(mock_get_docker_client, mock_network, mock_container_attached_to_net):
    mock_client = MagicMock()

    # includes a protected network (should be skipped) and one real
    protected_net = MagicMock()
    protected_net.name = "bridge"

    mock_client.networks.list.return_value = [mock_network, protected_net]
    mock_client.containers.list.return_value = [mock_container_attached_to_net]

    mock_get_docker_client.return_value = mock_client

    result = get_docker_networks_overview_query()

    assert isinstance(result, list)
    assert len(result) == 1

    overview: DockerNetworkOverview = result[0]
    assert overview.name == "custom_net"
    assert overview.driver == "bridge"
    assert overview.scope == "local"
    assert overview.attachable is True
    assert overview.internal is False
    assert overview.containers_count == 1
    assert overview.running_containers_count == 1

    container_info: NetworkContainerInfo = overview.containers[0]
    assert container_info.name == "nginx"
    assert container_info.ipv4_address == "172.18.0.5"


@patch("Routes.Queries.GetDockerNetworkOverview.get_docker_networks_overview_query.get_docker_client")
def test_get_docker_networks_no_matches(mock_get_docker_client):
    mock_client = MagicMock()

    # only protected networks
    bridge = MagicMock()
    bridge.name = "bridge"
    host = MagicMock()
    host.name = "host"
    none = MagicMock()
    none.name = "none"

    mock_client.networks.list.return_value = [bridge, host, none]
    mock_client.containers.list.return_value = []

    mock_get_docker_client.return_value = mock_client

    result = get_docker_networks_overview_query()
    assert result == []


@patch("Routes.Queries.GetDockerNetworkOverview.get_docker_networks_overview_query.get_docker_client")
def test_get_docker_networks_docker_error(mock_get_docker_client):
    mock_get_docker_client.side_effect = DockerException("Docker daemon unreachable")

    with pytest.raises(HTTPException) as exc:
        get_docker_networks_overview_query()

    assert exc.value.status_code == 503
    assert "docker is unreachable" in str(exc.value.detail).lower()
