from unittest.mock import patch, MagicMock
import pytest
from fastapi import HTTPException
from docker.errors import NotFound

from Routes.Queries.GetContainerVolumes.get_container_volumes_query import get_container_volumes_query


@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_docker_client")
@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_container")
def test_get_container_volumes_query_success(mock_get_container, mock_get_client):
    mock_container = MagicMock()
    mock_container.attrs = {
        "Mounts": [
            {"Type": "volume", "Name": "data-vol"},
            {"Type": "bind", "Source": "/host/path", "Destination": "/container/path"},
        ]
    }

    mock_volume = MagicMock()
    mock_volume.name = "data-vol"
    mock_volume.attrs = {
        "Driver": "local",
        "Mountpoint": "/var/lib/docker/volumes/data-vol/_data",
        "CreatedAt": "2024-07-01T10:00:00Z",
        "Labels": {"env": "prod"},
    }

    mock_volumes = MagicMock()
    mock_volumes.get.return_value = mock_volume
    mock_get_client.return_value.volumes = mock_volumes
    mock_get_container.return_value = mock_container

    result = get_container_volumes_query("my-container")

    assert len(result) == 1
    assert result[0].name == "data-vol"
    assert result[0].driver == "local"
    assert result[0].mountpoint == "/var/lib/docker/volumes/data-vol/_data"
    assert result[0].created_at == "2024-07-01T10:00:00Z"
    assert result[0].labels == {"env": "prod"}


@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_docker_client")
@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_container")
def test_get_container_volumes_query_skips_missing_volume(mock_get_container, mock_get_client):
    mock_container = MagicMock()
    mock_container.attrs = {
        "Mounts": [{"Type": "volume", "Name": "missing-vol"}]
    }

    mock_volumes = MagicMock()
    mock_volumes.get.side_effect = NotFound("Volume not found")
    mock_get_client.return_value.volumes = mock_volumes
    mock_get_container.return_value = mock_container

    result = get_container_volumes_query("my-container")

    assert isinstance(result, list)
    assert len(result) == 0  # Volume is skipped gracefully


@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_container")
def test_get_container_volumes_query_container_not_found(mock_get_container):
    mock_get_container.side_effect = NotFound("Container not found")

    with pytest.raises(HTTPException) as excinfo:
        get_container_volumes_query("nonexistent-container")

    assert excinfo.value.status_code == 404
    assert "Container 'nonexistent-container' not found" in excinfo.value.detail


@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_container")
def test_get_container_volumes_query_raises_generic_exception(mock_get_container):
    mock_get_container.side_effect = Exception("Unexpected error")

    with pytest.raises(HTTPException) as excinfo:
        get_container_volumes_query("my-container")

    assert excinfo.value.status_code == 500
    assert "Failed to retrieve volumes" in excinfo.value.detail
    assert "Unexpected error" in excinfo.value.detail
