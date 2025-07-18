from Models.NetworkMapModel import DockerNetworkGraphResponse
from Utils.getDocker import get_docker_client


def get_docker_network_map() -> DockerNetworkGraphResponse:
    client = get_docker_client()

    networks = {n.id[:12]: n for n in client.networks.list()}
    containers = client.containers.list(all=True)

    graph = {
        "nodes": [],
        "links": []
    }

    added_networks = set()
    added_containers = set()

    for container in containers:
        container_id = container.id[:12]
        container_name = container.name
        status = container.status

        if container_id not in added_containers:
            graph["nodes"].append({
                "id": container_id,
                "label": container_name,
                "type": "container",
                "status": status,
                "clusterId": None
            })
            added_containers.add(container_id)

        net_info = container.attrs.get("NetworkSettings", {}).get("Networks", {})
        for net_name, net_data in net_info.items():
            net_id = net_data.get("NetworkID", "")[:12]
            if not net_id:
                continue

            if net_id not in added_networks:
                graph["nodes"].append({
                    "id": net_id,
                    "label": net_name,
                    "type": "network"
                })
                added_networks.add(net_id)

            graph["links"].append({
                "source": net_id,
                "target": container_id
            })

            for node in graph["nodes"]:
                if node["id"] == container_id:
                    node["clusterId"] = net_id

    return DockerNetworkGraphResponse(**graph)