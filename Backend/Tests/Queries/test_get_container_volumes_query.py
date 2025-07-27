import pytest
from unittest.mock import patch, MagicMock
from docker.errors import NotFound
from fastapi import HTTPException

from Models.models import DockerVolumeSummary
from Routes.Queries.GetContainerVolumes.get_container_volumes_query import get_container_volumes_query
from Tests.utils.Builders.DockerContainerBuilder import DockerContainerBuilder
from Tests.utils.Builders.DockerVolumeBuilder import DockerVolumeBuilder


@pytest.fixture
def mock_container_with_volume():
    volume = DockerVolumeBuilder().with_name("test_volume").with_driver("local").build()
    container = (
        DockerContainerBuilder()
        .with_status("running")
        .with_volume(volume, destination="/data")
        .build()
    )
    return container, volume


@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_docker_client")
@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_container")
def test_get_container_volumes_success(mock_get_container, mock_get_docker_client, mock_container_with_volume):
    container, volume = mock_container_with_volume
    container.attrs["Mounts"] = [
        {
            "Type": "volume",
            "Name": volume.name,
            "Source": volume.attrs["Mountpoint"],
            "Destination": "/data"
        }
    ]

    mock_get_container.return_value = container

    docker_client_mock = MagicMock()
    docker_client_mock.volumes.get.return_value = volume
    mock_get_docker_client.return_value = docker_client_mock

    result = get_container_volumes_query(container_id=container.short_id)

    assert isinstance(result, list)
    assert len(result) == 1

    summary: DockerVolumeSummary = result[0]
    assert summary.name == volume.name
    assert summary.type == "volume"
    assert summary.source == volume.attrs["Mountpoint"]
    assert summary.destination == "/data"
    assert summary.driver == volume.driver
    assert summary.labels == volume.attrs["Labels"]


@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_docker_client")
@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_container")
def test_get_container_volumes_handles_missing_volume(mock_get_container, mock_get_docker_client, mock_container_with_volume):
    container, volume = mock_container_with_volume

    mock_get_container.return_value = container

    docker_client_mock = MagicMock()
    docker_client_mock.volumes.get.side_effect = NotFound("volume not found")
    mock_get_docker_client.return_value = docker_client_mock

    result = get_container_volumes_query(container_id=container.short_id)
    assert result == []


@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_container")
def test_get_container_volumes_container_not_found(mock_get_container):
    mock_get_container.side_effect = NotFound("not found")

    with pytest.raises(HTTPException) as exc:
        get_container_volumes_query("nonexistent")

    assert exc.value.status_code == 404
    assert "not found" in str(exc.value.detail).lower()


@patch("Routes.Queries.GetContainerVolumes.get_container_volumes_query.get_container")
def test_get_container_volumes_internal_error(mock_get_container):
    mock_get_container.side_effect = Exception("Docker is down")

    with pytest.raises(HTTPException) as exc:
        get_container_volumes_query("abc123")

    assert exc.value.status_code == 500
    assert "failed to retrieve volumes" in str(exc.value.detail).lower()
