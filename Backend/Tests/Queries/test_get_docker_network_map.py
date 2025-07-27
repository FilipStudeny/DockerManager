from unittest.mock import patch, MagicMock

from Models.NetworkMapModel import DockerNetworkGraphResponse
from Routes.Queries.GetNetworkMap.get_docker_network_map import get_docker_network_map


def make_mock_container(container_id: str, name: str, status: str, network_id: str, network_name: str):
    container = MagicMock()
    container.id = container_id
    container.name = name
    container.status = status
    container.attrs = {
        "NetworkSettings": {
            "Networks": {
                network_name: {
                    "NetworkID": network_id
                }
            }
        }
    }
    return container


def make_mock_network(network_id: str, name: str):
    network = MagicMock()
    network.id = network_id
    network.name = name
    return network


@patch("Routes.Queries.GetNetworkMap.get_docker_network_map.get_docker_client")
def test_get_docker_network_map_success(mock_get_docker_client):
    net_id = "abc123456789"
    container_id = "def987654321"
    net_name = "custom_net"
    container_name = "web"
    status = "running"

    container = make_mock_container(container_id, container_name, status, net_id, net_name)
    network = make_mock_network(net_id, net_name)

    mock_client = MagicMock()
    mock_client.networks.list.return_value = [network]
    mock_client.containers.list.return_value = [container]

    mock_get_docker_client.return_value = mock_client

    result = get_docker_network_map()

    assert isinstance(result, DockerNetworkGraphResponse)
    assert len(result.nodes) == 2  # 1 container + 1 network
    assert len(result.links) == 1

    container_node = next(node for node in result.nodes if node.type == "container")
    network_node = next(node for node in result.nodes if node.type == "network")

    assert container_node.id == container_id[:12]
    assert container_node.label == container_name
    assert container_node.status == status
    assert container_node.clusterId == net_id[:12]

    assert network_node.id == net_id[:12]
    assert network_node.label == net_name

    link = result.links[0]
    assert link.source == net_id[:12]
    assert link.target == container_id[:12]


@patch("Routes.Queries.GetNetworkMap.get_docker_network_map.get_docker_client")
def test_get_docker_network_map_no_network_id(mock_get_docker_client):
    container = MagicMock()
    container.id = "abc111222333"
    container.name = "orphan"
    container.status = "exited"
    container.attrs = {
        "NetworkSettings": {
            "Networks": {
                "missing_net": {
                    "NetworkID": ""
                }
            }
        }
    }

    mock_client = MagicMock()
    mock_client.networks.list.return_value = []
    mock_client.containers.list.return_value = [container]
    mock_get_docker_client.return_value = mock_client

    result = get_docker_network_map()

    assert len(result.nodes) == 1  # only container
    assert result.nodes[0].id == container.id[:12]
    assert result.links == []


@patch("Routes.Queries.GetNetworkMap.get_docker_network_map.get_docker_client")
def test_get_docker_network_map_no_containers_or_networks(mock_get_docker_client):
    mock_client = MagicMock()
    mock_client.networks.list.return_value = []
    mock_client.containers.list.return_value = []
    mock_get_docker_client.return_value = mock_client

    result = get_docker_network_map()
    assert result.nodes == []
    assert result.links == []
