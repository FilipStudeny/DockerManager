/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type DockerVolumeSummary = {
    /**
     * Volume name (if named Docker volume)
     */
    name?: (string | null);
    /**
     * Type of mount: volume or bind
     */
    type: string;
    /**
     * Host source path or volume name
     */
    source: string;
    /**
     * Mount point inside the container
     */
    destination: string;
    /**
     * Volume driver (Docker-managed only)
     */
    driver?: (string | null);
    /**
     * Where the volume is mounted on host
     */
    mountpoint?: (string | null);
    /**
     * Creation timestamp (Docker volumes)
     */
    created_at?: (string | null);
    /**
     * Human-readable volume size (if available)
     */
    size?: (string | null);
    /**
     * Metadata labels (Docker volumes)
     */
    labels?: Record<string, string>;
};

