from Utils.logger import logger


def _calculate_cpu_percent(stats):
    try:
        cpu_stats = stats.get("cpu_stats", {})
        precpu_stats = stats.get("precpu_stats", {})

        cpu_delta = cpu_stats.get("cpu_usage", {}).get("total_usage", 0) - \
                    precpu_stats.get("cpu_usage", {}).get("total_usage", 0)

        system_delta = cpu_stats.get("system_cpu_usage", 0) - \
                       precpu_stats.get("system_cpu_usage", 0)

        percpu = cpu_stats.get("cpu_usage", {}).get("percpu_usage", [])
        cpu_count = len(percpu) or 1

        if cpu_delta > 0 and system_delta > 0:
            return (cpu_delta / system_delta) * cpu_count * 100.0
        return 0.0
    except Exception as e:
        logger.warning(f"CPU calc failed: {e}")
        return 0.0



def _extract_network_io(stats):
    try:
        networks = stats.get("networks", {})
        rx = sum(interface.get("rx_bytes", 0) for interface in networks.values())
        tx = sum(interface.get("tx_bytes", 0) for interface in networks.values())
        return {"rx": rx, "tx": tx}
    except Exception as e:
        logger.warning(f"Network IO parse failed: {e}")
        return {"rx": 0, "tx": 0}

def _extract_blk_io(stats):
    try:
        blk_stats = stats.get("blkio_stats", {}).get("io_service_bytes_recursive", [])
        read = sum(entry.get("value", 0) for entry in blk_stats if entry.get("op") == "Read")
        write = sum(entry.get("value", 0) for entry in blk_stats if entry.get("op") == "Write")
        return {"read": read, "write": write}
    except Exception as e:
        logger.warning(f"Block IO parse failed: {e}")
        return {"read": 0, "write": 0}