from faker import Faker

from Models.models import LogEntry

fake = Faker()
class LogEntryBuilder:
    def __init__(self):
        self._timestamp = fake.iso8601()
        self._message = f"[INFO] {fake.sentence()}"

    def with_timestamp(self, timestamp: str):
        self._timestamp = timestamp
        return self

    def with_message(self, message: str):
        self._message = message
        return self

    def build(self):
        return LogEntry(timestamp=self._timestamp, message=self._message)
