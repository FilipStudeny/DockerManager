from unittest.mock import MagicMock
from faker import Faker

fake = Faker()

class DockerNetworkBuilder:
    def __init__(self):
        self._id = fake.uuid4()
        self._name = fake.slug()
        self._driver = "bridge"
        self._scope = "local"
        self._containers = []
        self._labels = {"project": fake.word()}
        self._internal = False
        self._attachable = True

    def with_id(self, network_id: str):
        self._id = network_id
        return self

    def with_name(self, name: str):
        self._name = name
        return self

    def with_driver(self, driver: str):
        self._driver = driver
        return self

    def with_scope(self, scope: str):
        self._scope = scope
        return self

    def with_containers(self, containers: list):
        self._containers = containers
        return self

    def with_labels(self, labels: dict):
        self._labels = labels
        return self

    def with_internal(self, internal: bool):
        self._internal = internal
        return self

    def with_attachable(self, attachable: bool):
        self._attachable = attachable
        return self

    def build(self):
        mock = MagicMock()
        mock.id = self._id
        mock.name = self._name
        mock.driver = self._driver
        mock.scope = self._scope
        mock.attrs = {
            "Containers": self._containers,
            "Labels": self._labels,
            "Internal": self._internal,
            "Attachable": self._attachable
        }
        return mock
