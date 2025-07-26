import traceback

from Models.models import GenericMessageResponse
from Utils.getDocker import get_docker_client
from Utils.logger import logger


def check_docker_status_query() -> GenericMessageResponse:
    try:
        client = get_docker_client()
        client.ping()
        return GenericMessageResponse(success=True, code=200, message="Docker is running")
    except Exception:
        logger.error("Docker status check failed:\n" + traceback.format_exc())
        return GenericMessageResponse(success=False, code=503,
                                      message="Docker is not running or unreachable. Please check your Docker service.")

