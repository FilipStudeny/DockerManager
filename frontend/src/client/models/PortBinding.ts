/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PortBinding = {
    /**
     * Port exposed in container (e.g. '80/tcp')
     */
    container_port: string;
    /**
     * Host IP (if published)
     */
    host_ip?: (string | null);
    /**
     * Published host port (if any)
     */
    host_port?: (string | null);
};

