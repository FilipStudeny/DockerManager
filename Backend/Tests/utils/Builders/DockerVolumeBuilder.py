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
        return FakeDockerVolume(
            name=self._name,
            driver=self._driver,
            mountpoint=self._mountpoint,
            labels=self._labels
        )

class FakeDockerVolume:
    def __init__(self, name: str, driver: str, mountpoint: str, labels: Dict[str, str]):
        self.name = name
        self.driver = driver
        self.attrs = {
            "Mountpoint": mountpoint,
            "Labels": labels,
            "Driver": driver
        }
