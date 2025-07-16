from unittest.mock import patch, MagicMock
import pytest

from Routes.Queries.GetDockerVolumes.get_docker_volumes_query import get_docker_volumes_query


@patch("Routes.Queries.GetDockerVolumes.get_docker_volumes_query.get_docker_client")
def test_get_docker_volumes_query_returns_multiple(mock_get_client):
    # Mock volume 1
    vol1 = MagicMock()
    vol1.name = "vol-data"
    vol1.attrs = {
        "Driver": "local",
        "Mountpoint": "/var/lib/docker/volumes/vol-data/_data",
        "CreatedAt": "2024-07-01T10:00:00Z",
        "Labels": {"project": "demo"},
    }

    # Mock volume 2
    vol2 = MagicMock()
    vol2.name = "vol-cache"
    vol2.attrs = {
        "Driver": "nfs",
        "Mountpoint": "/mnt/nfs/cache",
        "CreatedAt": "2024-07-05T18:30:00Z",
        "Labels": {},
    }

    mock_client = MagicMock()
    mock_client.volumes.list.return_value = [vol1, vol2]
    mock_get_client.return_value = mock_client

    result = get_docker_volumes_query()

    assert len(result) == 2

    assert result[0].name == "vol-data"
    assert result[0].type == "volume"
    assert result[0].source == "vol-data"
    assert result[0].destination == "/var/lib/docker/volumes/vol-data/_data"
    assert result[0].driver == "local"
    assert result[0].mountpoint == "/var/lib/docker/volumes/vol-data/_data"
    assert result[0].created_at == "2024-07-01T10:00:00Z"
    assert result[0].labels == {"project": "demo"}

    assert result[1].name == "vol-cache"
    assert result[1].destination == "/var/lib/docker/volumes/vol-cache/_data"


@patch("Routes.Queries.GetDockerVolumes.get_docker_volumes_query.get_docker_client")
def test_get_docker_volumes_query_returns_empty_list(mock_get_client):
    mock_client = MagicMock()
    mock_client.volumes.list.return_value = []
    mock_get_client.return_value = mock_client

    result = get_docker_volumes_query()

    assert isinstance(result, list)
    assert len(result) == 0
