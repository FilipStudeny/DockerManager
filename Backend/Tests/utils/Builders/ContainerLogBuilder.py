from unittest.mock import MagicMock
from faker import Faker

fake = Faker()

class ContainerLogBuilder:
    def __init__(self):
        self._logs = [
            {"timestamp": fake.iso8601(), "message": f"[INFO] {fake.sentence()}"},
            {"timestamp": fake.iso8601(), "message": f"[ERROR] {fake.sentence()}"}
        ]

    def with_logs(self, logs: list):
        self._logs = logs
        return self

    def build(self):
        return [MagicMock(timestamp=log["timestamp"], message=log["message"]) for log in self._logs]
