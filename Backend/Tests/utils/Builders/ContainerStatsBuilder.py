from unittest.mock import MagicMock
from faker import Faker

fake = Faker()


class ContainerStatsBuilder:
    def __init__(self):
        self._cpu = fake.pyfloat(min_value=0.0, max_value=100.0)
        self._memory = fake.pyfloat(min_value=0.0, max_value=100.0)

    def with_cpu(self, cpu: float):
        self._cpu = cpu
        return self

    def with_memory(self, memory: float):
        self._memory = memory
        return self

    def build(self):
        return MagicMock(cpu=self._cpu, memory=self._memory)
