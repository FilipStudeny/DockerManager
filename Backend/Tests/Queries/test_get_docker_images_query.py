from unittest.mock import patch, MagicMock
import pytest

from Routes.Queries.GetDockerImages.get_docker_images_query import get_docker_images_query


@patch("Routes.Queries.GetDockerImages.get_docker_images_query.get_docker_client")
def test_get_docker_images_query_returns_multiple_images(mock_get_client):
    mock_image1 = MagicMock()
    mock_image1.short_id = "sha256:abc123"
    mock_image1.tags = ["nginx:latest"]
    mock_image1.attrs = {
        "Size": 12345678,
        "Created": "2024-07-15T10:00:00Z",
        "Architecture": "amd64",
        "Os": "linux",
    }

    mock_image2 = MagicMock()
    mock_image2.short_id = "sha256:def456"
    mock_image2.tags = ["redis:7"]
    mock_image2.attrs = {
        "Size": 98765432,
        "Created": "2024-07-10T15:30:00Z",
        "Architecture": "arm64",
        "Os": "linux",
    }

    mock_client = MagicMock()
    mock_client.images.list.return_value = [mock_image1, mock_image2]
    mock_get_client.return_value = mock_client

    result = get_docker_images_query()

    assert len(result) == 2
    assert result[0].id == "sha256:abc123"
    assert result[0].tags == ["nginx:latest"]
    assert result[0].size == 12345678
    assert result[1].architecture == "arm64"
    assert result[1].os == "linux"


@patch("Routes.Queries.GetDockerImages.get_docker_images_query.get_docker_client")
def test_get_docker_images_query_returns_empty_list(mock_get_client):
    mock_client = MagicMock()
    mock_client.images.list.return_value = []
    mock_get_client.return_value = mock_client

    result = get_docker_images_query()

    assert isinstance(result, list)
    assert len(result) == 0
