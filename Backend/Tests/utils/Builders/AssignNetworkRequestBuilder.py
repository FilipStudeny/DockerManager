from unittest.mock import MagicMock
from faker import Faker

from Models.models import AssignNetworkRequest

fake = Faker()


class AssignNetworkRequestBuilder:
    def __init__(self):
        self._network_name = fake.slug()

    def with_network_name(self, name: str):
        self._network_name = name
        return self

    def build(self):
        return AssignNetworkRequest(network_name=self._network_name)
