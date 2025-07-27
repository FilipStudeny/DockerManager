from unittest.mock import MagicMock
from faker import Faker

from Models.models import LogInfo

fake = Faker()

class LogInfoBuilder:
    def __init__(self):
        self._count = fake.random_int(1, 100)
        self._latest = f"[{fake.date_time().isoformat()}] {fake.sentence()}"

    def with_count(self, count: int):
        self._count = count
        return self

    def with_latest(self, msg: str):
        self._latest = msg
        return self

    def build(self):
        return LogInfo(count=self._count, latest=self._latest)
