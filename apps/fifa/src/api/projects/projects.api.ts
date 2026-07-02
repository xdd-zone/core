import type {
  CreateProjectRequest,
  PreviewTokenResponse,
  ProjectListResponse,
  ProjectResponse,
  SaveProjectDraftRequest,
} from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { resolveMomoHttpUrl } from '../momo-url'
import { readMomoFetchJson, readMomoJson } from '../rpc'

export function listProjects() {
  return readMomoJson<ProjectListResponse>(momoClient.rpc.projects.$get())
}

export function createProject(payload: CreateProjectRequest) {
  return readMomoJson<ProjectResponse>(
    momoClient.rpc.projects.$post({
      json: payload,
    }),
  )
}

export function getProject(id: string) {
  return readMomoJson<ProjectResponse>(
    momoClient.rpc.projects[':id'].$get({
      param: {
        id,
      },
    }),
  )
}

export function saveProjectDraft(id: string, payload: SaveProjectDraftRequest) {
  return readMomoJson<ProjectResponse>(
    momoClient.rpc.projects[':id'].draft.$patch({
      json: payload,
      param: {
        id,
      },
    }),
  )
}

export function publishProject(id: string) {
  return readMomoJson<ProjectResponse>(
    momoClient.rpc.projects[':id'].publish.$post({
      param: {
        id,
      },
    }),
  )
}

export function createProjectPreviewToken(id: string) {
  return readMomoFetchJson<PreviewTokenResponse>(
    fetch(resolveMomoHttpUrl(`/rpc/projects/${encodeURIComponent(id)}/preview-token`), {
      credentials: 'include',
      method: 'POST',
    }),
  )
}

export function archiveProject(id: string) {
  return readMomoFetchJson<ProjectResponse>(
    fetch(resolveMomoHttpUrl(`/rpc/projects/${encodeURIComponent(id)}/archive`), {
      credentials: 'include',
      method: 'POST',
    }),
  )
}
