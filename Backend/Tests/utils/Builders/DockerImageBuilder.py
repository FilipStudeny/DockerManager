from unittest.mock import MagicMock
from faker import Faker
from typing import List

fake = Faker()


class DockerImageBuilder:
    def __init__(self):
        self._id = fake.sha256()
        self._tags = [f"{fake.word()}:{fake.word()}"]
        self._created = int(fake.unix_time())
        self._size = fake.random_int(min=10_000_000, max=1_000_000_000)

    def with_id(self, image_id: str):
        self._id = image_id
        return self

    def with_tags(self, tags: List[str]):
        self._tags = tags
        return self

    def with_created(self, created: int):
        self._created = created
        return self

    def with_size(self, size: int):
        self._size = size
        return self

    def build(self):
        mock = MagicMock()
        mock.id = self._id
        mock.tags = self._tags
        mock.attrs = {
            "Created": self._created,
            "Size": self._size,
        }
        return mock
