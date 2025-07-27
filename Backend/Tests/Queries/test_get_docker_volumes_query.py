import pytest
from unittest.mock import patch, MagicMock
from docker.errors import DockerException
from fastapi import HTTPException

from Routes.Queries.GetDockerVolumes.get_docker_volumes_query import get_docker_volumes_query
from Models.models import DockerVolumeSummary, ContainerStatusEnum
from Tests.utils.Builders.DockerVolumeBuilder import DockerVolumeBuilder
from Tests.utils.Builders.DockerContainerBuilder import DockerContainerBuilder


@pytest.fixture
def mock_volume_and_attached_container():
    volume = DockerVolumeBuilder().with_name("app_data").build()

    container = (
        DockerContainerBuilder()
        .with_status("running")
        .with_name("backend")
        .with_volume(volume, destination="/app/data")
        .build()
    )

    return volume, container


@patch("Routes.Queries.GetDockerVolumes.get_docker_volumes_query.get_docker_client")
def test_get_docker_volumes_with_attached_container(mock_get_docker_client, mock_volume_and_attached_container):
    volume, container = mock_volume_and_attached_container

    client_mock = MagicMock()
    client_mock.volumes.list.return_value = [volume]
    client_mock.containers.list.return_value = [container]
    mock_get_docker_client.return_value = client_mock

    result = get_docker_volumes_query()

    assert isinstance(result, list)
    assert len(result) == 1

    summary: DockerVolumeSummary = result[0]
    assert summary.name == "app_data"
    assert summary.type == "volume"
    assert summary.source == "app_data"
    assert summary.destination == "/var/lib/docker/volumes/app_data/_data"
    assert summary.driver == volume.driver
    assert summary.labels == volume.attrs["Labels"]

    assert len(summary.containers) == 1
    assert summary.containers[0].name == container.name
    assert summary.containers[0].status == ContainerStatusEnum.running
    assert summary.containers[0].mountpoint == "/app/data"


@patch("Routes.Queries.GetDockerVolumes.get_docker_volumes_query.get_docker_client")
def test_get_docker_volumes_without_attached_containers(mock_get_docker_client):
    volume = DockerVolumeBuilder().with_name("orphan_vol").build()
    unrelated_container = DockerContainerBuilder().with_status("running").build()

    unrelated_container.attrs["Mounts"] = []

    client_mock = MagicMock()
    client_mock.volumes.list.return_value = [volume]
    client_mock.containers.list.return_value = [unrelated_container]
    mock_get_docker_client.return_value = client_mock

    result = get_docker_volumes_query()

    assert len(result) == 1
    summary = result[0]
    assert summary.name == "orphan_vol"
    assert summary.containers == []


@patch("Routes.Queries.GetDockerVolumes.get_docker_volumes_query.get_docker_client")
def test_get_docker_volumes_docker_error(mock_get_docker_client):
    mock_get_docker_client.side_effect = DockerException("Docker connection failed")

    with pytest.raises(HTTPException) as exc:
        get_docker_volumes_query()

    assert exc.value.status_code == 503
    assert "unreachable" in str(exc.value.detail).lower()
