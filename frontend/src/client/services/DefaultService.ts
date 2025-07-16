/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContainerDetails } from '../models/ContainerDetails';
import type { ContainerSummary } from '../models/ContainerSummary';
import type { DockerImageSummary } from '../models/DockerImageSummary';
import type { DockerStatus } from '../models/DockerStatus';
import type { DockerVolumeSummary } from '../models/DockerVolumeSummary';
import type { GenericMessageResponse } from '../models/GenericMessageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Root
     * @returns DockerStatus Successful Response
     * @throws ApiError
     */
    public static rootGet(): CancelablePromise<DockerStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/',
        });
    }
    /**
     * Check Docker Status
     * @returns DockerStatus Successful Response
     * @throws ApiError
     */
    public static checkDockerStatusDockerStatusGet(): CancelablePromise<DockerStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/docker-status',
        });
    }
    /**
     * List Containers
     * @param all Show all containers, including stopped
     * @returns ContainerSummary Successful Response
     * @throws ApiError
     */
    public static listContainersContainersGet(
        all: boolean = true,
    ): CancelablePromise<Array<ContainerSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/containers',
            query: {
                'all': all,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Container Details
     * @param containerId
     * @returns ContainerDetails Successful Response
     * @throws ApiError
     */
    public static getContainerDetailsContainersContainerIdGet(
        containerId: string,
    ): CancelablePromise<ContainerDetails> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/containers/{container_id}',
            path: {
                'container_id': containerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Container Logs
     * @param containerId
     * @param tail
     * @returns string Successful Response
     * @throws ApiError
     */
    public static getContainerLogsContainersContainerIdLogsGet(
        containerId: string,
        tail: number = 100,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/containers/{container_id}/logs',
            path: {
                'container_id': containerId,
            },
            query: {
                'tail': tail,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Start Container
     * @param containerId
     * @returns GenericMessageResponse Successful Response
     * @throws ApiError
     */
    public static startContainerContainersContainerIdStartPost(
        containerId: string,
    ): CancelablePromise<GenericMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/containers/{container_id}/start',
            path: {
                'container_id': containerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Stop Container
     * @param containerId
     * @returns GenericMessageResponse Successful Response
     * @throws ApiError
     */
    public static stopContainerContainersContainerIdStopPost(
        containerId: string,
    ): CancelablePromise<GenericMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/containers/{container_id}/stop',
            path: {
                'container_id': containerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Restart Container
     * @param containerId
     * @returns GenericMessageResponse Successful Response
     * @throws ApiError
     */
    public static restartContainerContainersContainerIdRestartPost(
        containerId: string,
    ): CancelablePromise<GenericMessageResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/containers/{container_id}/restart',
            path: {
                'container_id': containerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Docker Images
     * @returns DockerImageSummary Successful Response
     * @throws ApiError
     */
    public static listDockerImagesImagesGet(): CancelablePromise<Array<DockerImageSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/images',
        });
    }
    /**
     * List Docker Volumes
     * @returns DockerVolumeSummary Successful Response
     * @throws ApiError
     */
    public static listDockerVolumesVolumesGet(): CancelablePromise<Array<DockerVolumeSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/volumes',
        });
    }
    /**
     * Get Container Volumes
     * @param containerId
     * @returns DockerVolumeSummary Successful Response
     * @throws ApiError
     */
    public static getContainerVolumesContainersContainerIdVolumesGet(
        containerId: string,
    ): CancelablePromise<Array<DockerVolumeSummary>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/containers/{container_id}/volumes',
            path: {
                'container_id': containerId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
