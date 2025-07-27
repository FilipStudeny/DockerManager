import pytest
from unittest.mock import patch, MagicMock
from docker.errors import DockerException
from fastapi import HTTPException

from Routes.Queries.GetDockerImages.get_docker_images_query import get_docker_images_query
from Models.models import DockerImageSummary, ContainerStatusEnum
from Tests.utils.Builders.DockerImageBuilder import DockerImageBuilder
from Tests.utils.Builders.DockerContainerBuilder import DockerContainerBuilder


@pytest.fixture
def mock_images_and_containers():
    image1 = DockerImageBuilder().with_tags(["nginx:latest"]).with_id("img1").build()
    image2 = DockerImageBuilder().with_tags(["redis:alpine"]).with_id("img2").build()

    container1 = (
        DockerContainerBuilder()
        .with_image(image1)
        .with_status("running")
        .with_name("nginx_container")
        .build()
    )

    container2 = (
        DockerContainerBuilder()
        .with_image(image2)
        .with_status("exited")
        .with_name("redis_container")
        .build()
    )

    return [image1, image2], [container1, container2]


@patch("Routes.Queries.GetDockerImages.get_docker_images_query.get_docker_client")
def test_get_docker_images_success(mock_get_docker_client, mock_images_and_containers):
    images, containers = mock_images_and_containers

    client_mock = MagicMock()
    client_mock.images.list.return_value = images
    client_mock.containers.list.return_value = containers
    mock_get_docker_client.return_value = client_mock

    result = get_docker_images_query()

    assert isinstance(result, list)
    assert len(result) == 2

    summary1: DockerImageSummary = result[0]
    summary2: DockerImageSummary = result[1]

    assert summary1.tags == images[0].tags
    assert summary2.tags == images[1].tags

    assert len(summary1.containers) == 1
    assert summary1.containers[0].name == containers[0].name
    assert summary1.containers[0].status == ContainerStatusEnum.running

    assert len(summary2.containers) == 1
    assert summary2.containers[0].name == containers[1].name
    assert summary2.containers[0].status == ContainerStatusEnum.stopped


@patch("Routes.Queries.GetDockerImages.get_docker_images_query.get_docker_client")
def test_get_docker_images_no_containers(mock_get_docker_client):
    image = DockerImageBuilder().with_tags(["alpine:latest"]).build()

    client_mock = MagicMock()
    client_mock.images.list.return_value = [image]
    client_mock.containers.list.return_value = []
    mock_get_docker_client.return_value = client_mock

    result = get_docker_images_query()

    assert len(result) == 1
    assert result[0].tags == image.tags
    assert result[0].containers == []


@patch("Routes.Queries.GetDockerImages.get_docker_images_query.get_docker_client")
def test_get_docker_images_docker_unavailable(mock_get_docker_client):
    mock_get_docker_client.side_effect = DockerException("Cannot connect to Docker")

    with pytest.raises(HTTPException) as exc:
        get_docker_images_query()

    assert exc.value.status_code == 503
    assert "docker is unreachable" in str(exc.value.detail).lower()
