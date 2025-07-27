from typing import List

from faker import Faker

from Models.models import ContainerLogsResponse
from Models.models import LogEntry
from Tests.utils.Builders.LogEntryBuilder import LogEntryBuilder

fake = Faker()

class ContainerLogsResponseBuilder:
    def __init__(self):
        self._logs = [LogEntryBuilder().build() for _ in range(3)]
        self._next_since = int(fake.unix_time())
        self._count = len(self._logs)

    def with_logs(self, logs: List[LogEntry]):
        self._logs = logs
        self._count = len(logs)
        return self

    def with_next_since(self, next_since: int):
        self._next_since = next_since
        return self

    def with_count(self, count: int):
        self._count = count
        return self

    def build(self):
        return ContainerLogsResponse(
            logs=self._logs,
            next_since=self._next_since,
            count=self._count
        )
