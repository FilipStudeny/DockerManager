from typing import List, Optional, Literal, Union
from pydantic import BaseModel


class BaseNode(BaseModel):
    id: str
    label: str
    type: Literal["container", "network"]


class ContainerNode(BaseNode):
    type: Literal["container"]
    status: str
    clusterId: Optional[str]


class NetworkNode(BaseNode):
    type: Literal["network"]


Node = Union[ContainerNode, NetworkNode]


class Link(BaseModel):
    source: str
    target: str


class DockerNetworkGraphResponse(BaseModel):
    nodes: List[Node]
    links: List[Link]
