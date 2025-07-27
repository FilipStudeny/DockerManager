from faker import Faker

from Models.models import PerformanceWarning

fake = Faker()


class PerformanceWarningBuilder:
    def __init__(self):
        self._message = f"High memory usage detected on container {fake.hostname()}"

    def with_message(self, msg: str):
        self._message = msg
        return self

    def build(self):
        return PerformanceWarning(message=self._message)
