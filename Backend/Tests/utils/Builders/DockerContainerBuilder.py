from unittest.mock import MagicMock
from faker import Faker
from typing import List, Optional

fake = Faker()


class DockerContainerBuilder:
    def __init__(self):
        self._short_id = fake.sha1()[:6]
        self._name = fake.hostname()
        self._status = "running"
        self._image_tags = [f"{fake.word()}:{fake.word()}"]
        self._cmd = ["npm", "start"]
        self._created = fake.iso8601()
        self._logs = b"INFO started\nERROR crashed"
        self._host_ip = "0.0.0.0"
        self._host_port = str(fake.port_number())
        self._container_port = "80/tcp"
        self._cpu_quota = 200000
        self._cpu_period = 100000
        self._platform = "linux"
        self._volumes = []
        self._image = None
        self._ip = fake.ipv4()
        self._network_mode = "bridge"
        self._memory_usage = 0
        self._memory_limit = 0
        self._labels = {}

    def with_id(self, short_id: str):
        self._short_id = short_id
        return self

    def with_name(self, name: str):
        self._name = name
        return self

    def with_status(self, status: str):
        self._status = status
        return self

    def with_command(self, cmd: List[str]):
        self._cmd = cmd
        return self

    def with_created(self, iso_str: str):
        self._created = iso_str
        return self

    def with_logs(self, logs: bytes):
        self._logs = logs
        return self

    def with_port_mapping(self, container_port: str, host_ip: str, host_port: str):
        self._container_port = container_port
        self._host_ip = host_ip
        self._host_port = host_port
        return self

    def with_cpu_limits(self, quota: int, period: int):
        self._cpu_quota = quota
        self._cpu_period = period
        return self

    def with_platform(self, platform: str):
        self._platform = platform
        return self

    def with_image(self, image_mock):
        self._image = image_mock
        self._image_tags = image_mock.tags
        return self

    def with_volume(self, volume_mock, destination="/mnt/{name}"):
        self._volumes.append({
            "Source": volume_mock.attrs["Mountpoint"],
            "Destination": destination.format(name=volume_mock.name),
            "Mode": "",
            "Type": "volume"
        })
        return self

    def with_ip(self, ip: str):
        self._ip = ip
        return self

    def with_network_mode(self, mode: str):
        self._network_mode = mode
        return self

    def with_memory_usage(self, usage: int, limit: int):
        self._memory_usage = usage
        self._memory_limit = limit
        return self

    def with_labels(self, labels: dict):
        self._labels = labels
        return self

    def build(self):
        mock = MagicMock()
        mock.short_id = self._short_id
        mock.name = self._name
        mock.status = self._status
        mock.image.tags = self._image_tags
        if self._image:
            mock.image = self._image
        mock.logs.return_value = self._logs

        mock.attrs = {
            "Config": {
                "Cmd": self._cmd,
                "Labels": self._labels
            },
            "NetworkSettings": {
                "IPAddress": self._ip,
                "Ports": {
                    self._container_port: [{"HostIp": self._host_ip, "HostPort": self._host_port}]
                }
            },
            "Created": self._created,
            "Mounts": self._volumes,
            "HostConfig": {
                "NetworkMode": self._network_mode,
                "CpuQuota": self._cpu_quota,
                "CpuPeriod": self._cpu_period
            },
            "Platform": self._platform
        }

        mock.stats.return_value = {
            "memory_stats": {
                "usage": self._memory_usage,
                "limit": self._memory_limit
            },
            "cpu_stats": {
                "cpu_usage": {
                    "total_usage": 1000000000,
                    "percpu_usage": [500000000, 500000000]
                },
                "system_cpu_usage": 4000000000
            },
            "precpu_stats": {
                "cpu_usage": {
                    "total_usage": 500000000
                },
                "system_cpu_usage": 2000000000
            }
        }

        return mock
