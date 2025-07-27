from unittest.mock import MagicMock
from faker import Faker

fake = Faker()

class DockerOverviewBuilder:
    def __init__(self):
        self._version = "24.0.1"
        self._total = fake.random_int(5, 20)
        self._running = fake.random_int(1, 10)
        self._failed = fake.random_int(0, 5)
        self._images = fake.random_int(5, 30)
        self._volumes = fake.random_int(1, 10)
        self._logs_count = fake.random_int(10, 100)
        self._is_swarm = fake.boolean()

    def build(self):
        mock = MagicMock()
        mock.version = self._version
        mock.total_containers = self._total
        mock.running_containers = self._running
        mock.failed_containers = self._failed
        mock.images = self._images
        mock.volumes = self._volumes
        mock.logs_count = self._logs_count
        mock.is_swarm_active = self._is_swarm
        return mock
