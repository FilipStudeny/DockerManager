/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContainerStatusEnum } from './ContainerStatusEnum';
import type { MountInfo } from './MountInfo';
import type { PortBinding } from './PortBinding';
export type ContainerDetails = {
    /**
     * Short container ID
     */
    id: string;
    /**
     * Container name
     */
    name: string;
    /**
     * Current container status
     */
    status: ContainerStatusEnum;
    /**
     * List of container image tags
     */
    image: Array<string>;
    /**
     * Startup command
     */
    command: string;
    /**
     * Timestamp of container creation (ISO 8601)
     */
    created_at: string;
    /**
     * How long the container has been running (in seconds)
     */
    uptime_seconds?: (number | null);
    /**
     * Published ports
     */
    ports?: Array<PortBinding>;
    /**
     * Number of error events for the container
     */
    error_count?: number;
    /**
     * Most recent error message, if any
     */
    latest_error_message?: (string | null);
    /**
     * Container's internal IP address
     */
    ip_address: string;
    /**
     * Docker network mode (e.g. bridge, host)
     */
    network_mode: string;
    /**
     * Raw container creation timestamp
     */
    created: string;
    /**
     * Platform or architecture (e.g. linux/amd64)
     */
    platform?: (string | null);
    /**
     * Current CPU usage percentage
     */
    cpu_percent: number;
    /**
     * Current memory usage in bytes
     */
    memory_usage: number;
    /**
     * Memory limit in bytes
     */
    memory_limit: number;
    /**
     * CPU quota limit, if set (in cores)
     */
    cpu_limit?: (number | null);
    /**
     * List of mounted volumes/binds
     */
    mounts?: Array<MountInfo>;
    /**
     * User-defined metadata labels
     */
    labels?: Record<string, string>;
    /**
     * List of environment variables
     */
    env?: Array<string>;
    /**
     * Restart policy configuration
     */
    restart_policy?: (Record<string, any> | null);
    /**
     * If the container is running in privileged mode
     */
    privileged?: (boolean | null);
    /**
     * Path to the container log file on the host
     */
    log_path?: (string | null);
    /**
     * Entrypoint for the container
     */
    entrypoint?: (string | null);
    /**
     * Main process PID
     */
    pid?: (number | null);
    /**
     * Exit code of the container if it has stopped
     */
    exit_code?: (number | null);
    /**
     * Raw container state (e.g. running, exited)
     */
    state?: (string | null);
};

