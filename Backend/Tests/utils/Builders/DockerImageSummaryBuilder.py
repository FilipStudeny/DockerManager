from unittest.mock import MagicMock
from faker import Faker

from Models.models import DockerImageSummary

fake = Faker()
class DockerImageSummaryBuilder:
    def __init__(self):
        self._id = fake.sha256()
        self._tags = [f"{fake.word()}:{fake.word()}"]
        self._size = fake.random_int(10_000_000, 1_000_000_000)
        self._created = fake.iso8601()
        self._architecture = "amd64"
        self._os = "linux"
        self._containers = []

    def with_tags(self, tags: list):
        self._tags = tags
        return self

    def with_size(self, size: int):
        self._size = size
        return self

    def with_created(self, created: str):
        self._created = created
        return self

    def with_containers(self, containers: list):
        self._containers = containers
        return self

    def build(self):
        return DockerImageSummary(
            id=self._id,
            tags=self._tags,
            size=self._size,
            created=self._created,
            architecture=self._architecture,
            os=self._os,
            containers=self._containers
        )
