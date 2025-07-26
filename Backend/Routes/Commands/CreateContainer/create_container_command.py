from datetime import datetime

import docker
from docker.errors import DockerException
from docker.types import Mount, RestartPolicy
from starlette.responses import StreamingResponse

from Models.models import (
    CreateContainerRequest
)
from Utils.getDocker import get_docker_client


def create_container_stream_logs_command(body: CreateContainerRequest):
    def log_generator():
        yield f"🚀 Starting {'dry-run' if body.dry_run else 'creation'} of container '{body.name}' at {datetime.utcnow().isoformat()}Z\n"

        try:
            # Step 1: Init Docker
            yield "\n🔧 [1/10] Initializing Docker client...\n"
            try:
                client = get_docker_client()
                version_info = client.version()
                yield f"✅ Docker client ready (v{version_info.get('Version')}, API {version_info.get('ApiVersion')})\n"
            except Exception as e:
                yield f"❌ Docker client init failed: {e}\n"
                return

            # Step 2: Prepare config
            yield "\n⚙️ [2/10] Preparing and validating configuration...\n"
            command = body.command
            if not command:
                command = ["sh", "-c", "while true; do sleep 30; done"]
                yield "⚠️ No command provided. Using default infinite loop to keep container alive.\n"

            ports = {f"{p}/tcp": h for p, h in (body.ports or {}).items()}
            mounts = []
            networks = body.networks or []
            env = body.environment or {}
            labels = body.labels or {}
            working_dir = body.working_dir or None
            entrypoint = body.entrypoint or None
            user = body.user or None
            tty = body.tty if body.tty is not False else True
            detach = body.detach if body.detach is not False else True
            restart_policy = body.restart_policy or RestartPolicy(name="unless-stopped", maximum_retry_count=0)
            start_after_create = body.start_after_create if body.start_after_create is not False else True

            # Summary
            yield "\n🧾 Configuration:\n"
            yield f"  • Image:         {body.image}\n"
            yield f"  • Name:          {body.name}\n"
            yield f"  • Command:       {command}\n"
            yield f"  • TTY/Detached:  {tty} / {detach}\n"
            yield f"  • RestartPolicy: {restart_policy.name} ({restart_policy.maximum_retry_count})\n"
            yield f"  • Networks:      {networks or 'None'}\n"
            yield f"  • Working Dir:   {working_dir or 'None'}\n"
            yield f"  • Entrypoint:    {entrypoint or 'None'}\n"
            yield f"  • User:          {user or 'Default'}\n"
            yield f"  • Env:           {env or 'None'}\n"
            yield f"  • Labels:        {labels or 'None'}\n"

            # Step 3: Validate image
            yield "\n📥 [3/10] Checking image...\n"
            try:
                image = client.images.get(body.image)
                tags = image.tags or ['<none>']
                digest = image.attrs.get("RepoDigests", ["<unknown>"])[0]
                created = image.attrs.get("Created", "Unknown")
                yield f"✅ Image '{body.image}' found (tags: {tags}, digest: {digest}, created: {created})\n"
            except docker.errors.ImageNotFound:
                if body.dry_run:
                    yield f"⚠️ [Dry Run] Image '{body.image}' would be pulled from registry.\n"
                else:
                    yield f"⬇️ Pulling image '{body.image}'...\n"
                    for line in client.api.pull(repository=body.image, stream=True, decode=True):
                        status = line.get("status")
                        progress = line.get("progress")
                        layer = line.get("id")
                        msg = f"    [{layer}] {status} {progress or ''}" if layer else f"    {status}"
                        yield msg + "\n"
                    yield f"✅ Image '{body.image}' pulled.\n"

            # Step 4: Volumes
            yield "\n📁 [4/10] Validating volumes...\n"
            for v in body.volume_mounts or []:
                try:
                    volume = client.volumes.get(v.volume_name)
                    yield f"📦 Volume '{v.volume_name}' exists. Driver: {volume.attrs.get('Driver')}\n"
                except docker.errors.NotFound:
                    if body.dry_run:
                        yield f"⚠️ [Dry Run] Would create volume '{v.volume_name}'\n"
                    else:
                        client.volumes.create(name=v.volume_name)
                        yield f"🛠️ Created volume '{v.volume_name}'\n"
                mounts.append(
                    Mount(source=v.volume_name, target=v.mount_path, type="volume", read_only=v.read_only or False))
            if not body.volume_mounts:
                yield "📁 No volumes specified.\n"

            # Step 5: Networks
            yield "\n🌐 [5/10] Validating networks...\n"
            valid_networks = []
            for net_name in networks:
                try:
                    net = client.networks.get(net_name)
                    valid_networks.append(net)
                    yield f"🌐 Network '{net.name}' is ready (ID: {net.id[:12]}, Driver: {net.attrs['Driver']})\n"
                except docker.errors.NotFound:
                    yield f"⚠️ Network '{net_name}' not found. Skipping connection.\n"

            # Step 6: Check existing container
            yield "\n🧹 [6/10] Checking for existing container...\n"
            if not body.dry_run:
                try:
                    existing = client.containers.get(body.name)
                    yield f"⚠️ A container named '{body.name}' already exists (ID: {existing.id[:12]})\n"
                    if body.force_recreate:
                        yield "🗑️ Removing existing container...\n"
                        existing.remove(force=True)
                        yield "✅ Existing container removed.\n"
                    else:
                        yield "❌ Aborting. Use `force_recreate=true` to overwrite.\n"
                        return
                except docker.errors.NotFound:
                    yield "✅ No existing container found.\n"

            if body.dry_run:
                yield "\n✅ Dry-run complete. No changes made.\n"
                return

            # Step 7: Create container
            yield "\n🛠️ [7/10] Creating container...\n"
            try:
                container = client.containers.create(
                    image=body.image,
                    name=body.name,
                    command=command,
                    environment=env,
                    labels=labels,
                    ports=ports or None,
                    working_dir=working_dir,
                    entrypoint=entrypoint,
                    user=user,
                    tty=tty,
                    detach=detach,
                    restart_policy={
                        "Name": restart_policy.name,
                        "MaximumRetryCount": restart_policy.maximum_retry_count
                    },
                    mounts=mounts or None
                )
                yield f"✅ Container created (ID: {container.id[:12]})\n"
            except Exception as e:
                yield f"❌ Failed to create container: {e}\n"
                return

            # Step 8: Connect to networks
            if valid_networks:
                yield "\n🔗 [8/10] Connecting container to networks...\n"
                for net in valid_networks:
                    try:
                        net.connect(container)
                        yield f"🔌 Connected to network '{net.name}'\n"
                    except Exception as e:
                        yield f"⚠️ Failed to connect to '{net.name}': {e}\n"

            # Step 9: Start container
            if start_after_create:
                yield "\n🎬 [9/10] Starting container...\n"
                try:
                    container.start()
                    yield f"🚀 Container '{body.name}' started successfully.\n"

                    container.reload()
                    state = container.attrs["State"]
                    if state["Status"] == "exited":
                        yield f"⚠️ Container exited immediately (ExitCode={state['ExitCode']})\n"
                        logs = container.logs(stdout=True, stderr=True, tail=10)
                        if logs:
                            yield f"\n📄 Last logs:\n{logs.decode(errors='ignore')}\n"
                        else:
                            yield "📄 No logs captured.\n"
                    else:
                        ip = container.attrs.get("NetworkSettings", {}).get("IPAddress", "")
                        yield f"🏃 Status: {state['Status']} | IP: {ip or 'unknown'}\n"
                except Exception as e:
                    yield f"❌ Failed to start container: {e}\n"
            else:
                yield "\n⏭️ Skipping start due to `start_after_create=False`\n"

            # Step 10: Done
            yield f"\n✅ [10/10] Done. Container '{body.name}' is ready.\n"

        except docker.errors.APIError as e:
            yield f"❌ Docker API error: {e.explanation}\n"
        except Exception as e:
            yield f"❌ Unexpected error: {str(e)}\n"

    return StreamingResponse(log_generator(), media_type="text/plain")

