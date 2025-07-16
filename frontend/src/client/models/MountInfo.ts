/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MountInfo = {
    /**
     * Host path or volume name
     */
    source?: (string | null);
    /**
     * Mount point inside the container
     */
    destination: string;
    /**
     * Read/write mode (e.g. 'rw')
     */
    mode?: (string | null);
    /**
     * Mount type (e.g. 'bind', 'volume')
     */
    type?: (string | null);
};

