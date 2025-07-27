import json
from typing import Dict
from datetime import datetime
from docker.errors import DockerException, ImageNotFound
from fastapi import Body
from starlette.responses import StreamingResponse

from Models.models import (
    DockerImageSummary, PullImageRequest
)
from Utils.getDocker import get_docker_client


def stream_pull_with_progress_and_summary_query(body: PullImageRequest = Body(...)):
    def pull_generator():
        try:
            client = get_docker_client()
            pull_stream = client.api.pull(
                repository=body.repository,
                tag=body.tag,
                stream=True,
                decode=True
            )

            layer_start_times: Dict[str, datetime] = {}
            for line in pull_stream:
                if 'id' in line and 'progressDetail' in line:
                    layer_id = line['id']
                    detail = line['progressDetail']
                    current = detail.get("current", 0)
                    total = detail.get("total", 0)

                    # Progress %
                    if current and total:
                        percent = round((current / total) * 100, 2)
                        line["progress_percent"] = percent

                    # Download speed
                    now = datetime.now()
                    if layer_id not in layer_start_times:
                        layer_start_times[layer_id] = now
                        line["download_speed"] = 0
                    else:
                        elapsed = (now - layer_start_times[layer_id]).total_seconds()
                        speed = int(current / elapsed) if elapsed > 0 else 0
                        line["download_speed"] = speed  # bytes/sec

                yield json.dumps(line) + "\n"

            # Pull complete — return summary
            image = client.images.get(f"{body.repository}:{body.tag}")
            attrs = image.attrs
            summary = DockerImageSummary(
                id=image.id,
                tags=image.tags,
                size=attrs.get("Size", 0),
                created=attrs.get("Created"),
                architecture=attrs.get("Architecture"),
                os=attrs.get("Os")
            )
            yield json.dumps({"summary": summary.dict()}) + "\n"

        except ImageNotFound:
            yield json.dumps({"error": f"Image {body.repository}:{body.tag} not found"}) + "\n"
        except DockerException as e:
            yield json.dumps({"error": str(e)}) + "\n"

    return StreamingResponse(pull_generator(), media_type="text/event-stream")
