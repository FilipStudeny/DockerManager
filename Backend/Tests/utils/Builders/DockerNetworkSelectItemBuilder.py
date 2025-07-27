from unittest.mock import MagicMock
from faker import Faker

from Models.models import DockerNetworkSelectItem

fake = Faker()

class DockerNetworkSelectItemBuilder:
    def __init__(self):
        self._id = fake.uuid4()
        self._name = fake.slug()
        self._gateway = "172.20.0.1"

    def with_id(self, net_id: str):
        self._id = net_id
        return self

    def with_name(self, name: str):
        self._name = name
        return self

    def with_gateway(self, gateway: str):
        self._gateway = gateway
        return self

    def build(self):
        return DockerNetworkSelectItem(id=self._id, name=self._name, gateway=self._gateway)
