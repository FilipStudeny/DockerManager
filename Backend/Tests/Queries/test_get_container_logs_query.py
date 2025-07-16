from unittest.mock import patch, MagicMock
import pytest
from fastapi import HTTPException

from Routes.Queries.GetContainerLogs.get_container_logs_query import get_container_logs_query


@patch("Routes.Queries.GetContainerLogs.get_container_logs_query.get_container")
def test_get_container_logs_query_success(mock_get_container):
    mock_container = MagicMock()
    mock_container.logs.return_value = b"INFO: started\nWARNING: low memory"
    mock_get_container.return_value = mock_container

    result = get_container_logs_query("container123", tail=50)

    assert isinstance(result, str)
    assert "INFO: started" in result
    assert "low memory" in result
    mock_container.logs.assert_called_once_with(tail=50)


@patch("Routes.Queries.GetContainerLogs.get_container_logs_query.get_container")
def test_get_container_logs_query_raises_http_exception(mock_get_container):
    mock_container = MagicMock()
    mock_container.logs.side_effect = Exception("Logs unavailable")
    mock_get_container.return_value = mock_container

    with pytest.raises(HTTPException) as excinfo:
        get_container_logs_query("container123", tail=10)

    assert excinfo.value.status_code == 500
    assert "Failed to fetch logs for container container123" in excinfo.value.detail
    assert "Logs unavailable" in excinfo.value.detail


@patch("Routes.Queries.GetContainerLogs.get_container_logs_query.get_container")
def test_get_container_logs_query_container_not_found(mock_get_container):
    mock_get_container.side_effect = Exception("No such container")

    with pytest.raises(HTTPException) as excinfo:
        get_container_logs_query("nonexistent")

    assert excinfo.value.status_code == 500
    assert "Failed to fetch logs for container nonexistent" in excinfo.value.detail
    assert "No such container" in excinfo.value.detail
