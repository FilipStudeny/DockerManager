import pytest
from unittest.mock import patch, MagicMock
from docker.errors import DockerException
from fastapi import HTTPException

from Models.models import DockerNetworkSelectItem
from Routes.Queries.GetNetworksSmallList.list_docker_networks_lite_query import list_docker_networks_lite_query


def make_mock_network(network_id: str, name: str):
    network = MagicMock()
    network.id = network_id
    network.name = name
    return network


@patch("Routes.Queries.GetNetworksSmallList.list_docker_networks_lite_query.get_docker_client")
def test_list_docker_networks_lite_success(mock_get_docker_client):
    network = make_mock_network("abc123", "frontend")

    client_mock = MagicMock()
    client_mock.networks.list.return_value = [network]
    client_mock.api.inspect_network.return_value = {
        "IPAM": {
            "Config": [{"Gateway": "172.18.0.1"}]
        }
    }
    mock_get_docker_client.return_value = client_mock

    result = list_docker_networks_lite_query()

    assert isinstance(result, list)
    assert len(result) == 1
    item: DockerNetworkSelectItem = result[0]
    assert item.id == "abc123"
    assert item.name == "frontend"
    assert item.gateway == "172.18.0.1"


@patch("Routes.Queries.GetNetworksSmallList.list_docker_networks_lite_query.get_docker_client")
def test_list_docker_networks_lite_no_gateway(mock_get_docker_client):
    network = make_mock_network("xyz789", "internal")

    client_mock = MagicMock()
    client_mock.networks.list.return_value = [network]
    client_mock.api.inspect_network.return_value = {
        "IPAM": {
            "Config": []  # No gateway
        }
    }
    mock_get_docker_client.return_value = client_mock

    result = list_docker_networks_lite_query()
    assert len(result) == 1
    assert result[0].gateway is None


@patch("Routes.Queries.GetNetworksSmallList.list_docker_networks_lite_query.get_docker_client")
def test_list_docker_networks_lite_docker_error(mock_get_docker_client):
    mock_get_docker_client.side_effect = DockerException("Docker unavailable")

    with pytest.raises(HTTPException) as exc:
        list_docker_networks_lite_query()

    assert exc.value.status_code == 503
    assert "unreachable" in str(exc.value.detail).lower()


@patch("Routes.Queries.GetNetworksSmallList.list_docker_networks_lite_query.get_docker_client")
def test_list_docker_networks_lite_unexpected_error(mock_get_docker_client):
    client_mock = MagicMock()
    client_mock.networks.list.side_effect = Exception("Unexpected failure")
    mock_get_docker_client.return_value = client_mock

    with pytest.raises(HTTPException) as exc:
        list_docker_networks_lite_query()

    assert exc.value.status_code == 500
    assert "internal server error" in str(exc.value.detail).lower()
