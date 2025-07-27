from unittest.mock import MagicMock
from faker import Faker

from Models.models import NetworkInfo

fake = Faker()
class NetworkInfoBuilder:
    def __init__(self):
        self._name = fake.slug()
        self._id = fake.uuid4()
        self._ip_address = fake.ipv4()
        self._driver = "bridge"
        self._gateway = "172.18.0.1"
        self._subnet = "172.18.0.0/16"
        self._internal = False
        self._attachable = True

    def with_name(self, name: str):
        self._name = name
        return self

    def with_id(self, net_id: str):
        self._id = net_id
        return self

    def with_ip_address(self, ip: str):
        self._ip_address = ip
        return self

    def with_driver(self, driver: str):
        self._driver = driver
        return self

    def with_gateway(self, gateway: str):
        self._gateway = gateway
        return self

    def with_subnet(self, subnet: str):
        self._subnet = subnet
        return self

    def with_internal(self, internal: bool):
        self._internal = internal
        return self

    def with_attachable(self, attachable: bool):
        self._attachable = attachable
        return self

    def build(self):
        return NetworkInfo(
            name=self._name,
            id=self._id,
            ip_address=self._ip_address,
            driver=self._driver,
            gateway=self._gateway,
            subnet=self._subnet,
            internal=self._internal,
            attachable=self._attachable
        )
