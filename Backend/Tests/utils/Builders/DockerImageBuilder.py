from unittest.mock import MagicMock
from faker import Faker
import random

fake = Faker()

class DockerImageBuilder:
    def __init__(self):
        self._id = fake.sha256()
        self._short_id = self._id[:12]
        self._tags = [f"{fake.word()}:latest"]
        self._size = random.randint(1_000_000, 500_000_000)
        self._created = fake.iso8601()
        self._architecture = "amd64"
        self._os = "linux"

    def with_id(self, id_: str):
        self._id = id_
        self._short_id = id_[:12]
        return self

    def with_tags(self, tags):
        self._tags = tags
        return self

    def with_size(self, size: int):
        self._size = size
        return self

    def with_created(self, created: str):
        self._created = created
        return self

    def build(self):
        mock = MagicMock()
        mock.id = self._id
        mock.short_id = self._short_id
        mock.tags = self._tags
        mock.attrs = {
            "Size": self._size,
            "Created": self._created,
            "Architecture": self._architecture,
            "Os": self._os
        }
        return mock
