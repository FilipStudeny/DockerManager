/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContainerStatusEnum } from './ContainerStatusEnum';
import type { PortBinding } from './PortBinding';
export type ContainerSummary = {
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
};

