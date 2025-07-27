from unittest.mock import patch, MagicMock

from Models.models import GenericMessageResponse
from Routes.Queries.GetDockerStatus.check_docker_status_query import check_docker_status_query

@patch("Routes.Queries.GetDockerStatus.check_docker_status_query.logger")
@patch("Routes.Queries.GetDockerStatus.check_docker_status_query.get_docker_client")
def test_check_docker_status_success(mock_get_docker_client, mock_logger):
    mock_client = MagicMock()
    mock_client.ping.return_value = True
    mock_get_docker_client.return_value = mock_client

    response = check_docker_status_query()

    assert isinstance(response, GenericMessageResponse)
    assert response.success is True
    assert response.code == 200
    assert "Docker is running" in response.message


@patch("Routes.Queries.GetDockerStatus.check_docker_status_query.logger")
@patch("Routes.Queries.GetDockerStatus.check_docker_status_query.get_docker_client")
def test_check_docker_status_failure(mock_get_docker_client, mock_logger):
    mock_client = MagicMock()
    mock_client.ping.side_effect = Exception("Docker unreachable")
    mock_get_docker_client.return_value = mock_client

    response = check_docker_status_query()

    assert isinstance(response, GenericMessageResponse)
    assert response.success is False
    assert response.code == 503
    assert "not running or unreachable" in response.message.lower()
