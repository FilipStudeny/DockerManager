from unittest.mock import MagicMock
from faker import Faker

from Models.models import CreateContainerRequest

fake = Faker()


class CreateContainerRequestBuilder:
    def __init__(self):
        self._name = fake.domain_word()
        self._image = f"{fake.word()}:{fake.word()}"
        self._command = ["bash"]
        self._environment = {"ENV": "production"}
        self._ports = {"80/tcp": 8080}
        self._volume_mounts = []
        self._labels = {"app": fake.word()}
        self._working_dir = "/app"
        self._entrypoint = ["/entrypoint.sh"]
        self._user = "root"
        self._tty = True
        self._detach = True
        self._networks = ["bridge"]
        self._restart_policy = {"name": "always", "maximum_retry_count": 0}
        self._start_after_create = True
        self._dry_run = False

    def with_name(self, name: str):
        self._name = name
        return self

    def with_image(self, image: str):
        self._image = image
        return self

    def with_command(self, command: list):
        self._command = command
        return self

    def with_environment(self, env: dict):
        self._environment = env
        return self

    def with_ports(self, ports: dict):
        self._ports = ports
        return self

    def with_volume_mounts(self, mounts: list):
        self._volume_mounts = mounts
        return self

    def with_networks(self, networks: list):
        self._networks = networks
        return self

    def build(self):
        return CreateContainerRequest(
            name=self._name,
            image=self._image,
            command=self._command,
            environment=self._environment,
            ports=self._ports,
            volume_mounts=self._volume_mounts,
            labels=self._labels,
            working_dir=self._working_dir,
            entrypoint=self._entrypoint,
            user=self._user,
            tty=self._tty,
            detach=self._detach,
            networks=self._networks,
            restart_policy=self._restart_policy,
            start_after_create=self._start_after_create,
            dry_run=self._dry_run
        )
