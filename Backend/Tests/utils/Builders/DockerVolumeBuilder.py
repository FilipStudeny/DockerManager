from unittest.mock import MagicMock
from faker import Faker
from typing import Dict

fake = Faker()


class DockerVolumeBuilder:
    def __init__(self):
        self._name = fake.slug()
        self._driver = "local"
        self._mountpoint = f"/var/lib/docker/volumes/{self._name}"
        self._labels = {
            "project": fake.word(),
            "env": fake.word()
        }

    def with_name(self, name: str):
        self._name = name
        self._mountpoint = f"/var/lib/docker/volumes/{name}"
        return self

    def with_driver(self, driver: str):
        self._driver = driver
        return self

    def with_mountpoint(self, path: str):
        self._mountpoint = path
        return self

    def with_labels(self, labels: Dict[str, str]):
        self._labels = labels
        return self

    def build(self):
        mock = MagicMock()
        mock.name = self._name
        mock.driver = self._driver
        mock.attrs = {
            "Mountpoint": self._mountpoint,
            "Labels": self._labels,
        }
        return mock
