import pytest
from unittest.mock import patch, MagicMock
from docker.errors import DockerException
from fastapi import HTTPException

from Models.models import VolumeSelectList, VolumeSelectListItem
from Routes.Queries.ListDockerVolumesSelectList.list_docker_volumes_lite_query import list_docker_volumes_lite_query


def make_mock_volume(name: str):
    mock = MagicMock()
    mock.attrs = {"Name": name}
    return mock


@patch("Routes.Queries.ListDockerVolumesSelectList.list_docker_volumes_lite_query.get_docker_client")
def test_list_docker_volumes_lite_success(mock_get_docker_client):
    volume1 = make_mock_volume("data_volume")
    volume2 = make_mock_volume("logs_volume")

    client_mock = MagicMock()
    client_mock.volumes.list.return_value = [volume1, volume2]
    mock_get_docker_client.return_value = client_mock

    result = list_docker_volumes_lite_query()

    assert isinstance(result, VolumeSelectList)
    assert len(result.volumes) == 2

    item1: VolumeSelectListItem = result.volumes[0]
    item2: VolumeSelectListItem = result.volumes[1]

    assert item1.id == "data_volume"
    assert item1.name == "data_volume"
    assert item2.id == "logs_volume"
    assert item2.name == "logs_volume"


@patch("Routes.Queries.ListDockerVolumesSelectList.list_docker_volumes_lite_query.get_docker_client")
def test_list_docker_volumes_lite_docker_error(mock_get_docker_client):
    mock_get_docker_client.side_effect = DockerException("Docker down")

    with pytest.raises(HTTPException) as exc:
        list_docker_volumes_lite_query()

    assert exc.value.status_code == 503
    assert "unreachable" in str(exc.value.detail).lower()
