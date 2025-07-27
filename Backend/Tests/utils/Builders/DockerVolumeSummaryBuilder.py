from unittest.mock import MagicMock
from faker import Faker

from Models.models import DockerVolumeSummary

fake = Faker()


class DockerVolumeSummaryBuilder:
    def __init__(self):
        self._name = fake.slug()
        self._type = "volume"
        self._source = f"/var/lib/docker/volumes/{self._name}/_data"
        self._destination = "/data"
        self._driver = "local"
        self._mountpoint = self._source
        self._created_at = fake.iso8601()
        self._size = f"{fake.random_int(1, 500)}MB"
        self._labels = {"env": "test"}
        self._containers = []

    def with_name(self, name: str):
        self._name = name
        return self

    def with_type(self, mount_type: str):
        self._type = mount_type
        return self

    def with_source(self, source: str):
        self._source = source
        return self

    def with_destination(self, destination: str):
        self._destination = destination
        return self

    def with_labels(self, labels: dict):
        self._labels = labels
        return self

    def with_containers(self, containers: list):
        self._containers = containers
        return self

    def build(self):
        return DockerVolumeSummary(
            name=self._name,
            type=self._type,
            source=self._source,
            destination=self._destination,
            driver=self._driver,
            mountpoint=self._mountpoint,
            created_at=self._created_at,
            size=self._size,
            labels=self._labels,
            containers=self._containers
        )
