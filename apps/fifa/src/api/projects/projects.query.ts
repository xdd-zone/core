import type { CreateProjectRequest, SaveProjectDraftRequest } from '@xdd-zone/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveProject,
  createProject,
  createProjectPreviewToken,
  getProject,
  listProjects,
  publishProject,
  saveProjectDraft,
} from './projects.api'

export const projectQueryKeys = {
  all: ['projects'] as const,
  project: (id: string) => [...projectQueryKeys.projects(), id] as const,
  projects: () => [...projectQueryKeys.all, 'list'] as const,
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: projectQueryKeys.projects(),
    queryFn: listProjects,
  })
}

export function useProjectQuery(id: string) {
  return useQuery({
    enabled: id.length > 0,
    queryKey: projectQueryKeys.project(id),
    queryFn: () => getProject(id),
  })
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProjectRequest) => createProject(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects() })
    },
  })
}

export function useSaveProjectDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; payload: SaveProjectDraftRequest }) => saveProjectDraft(input.id, input.payload),
    onSuccess: async (response, input) => {
      if (response.ok) {
        await queryClient.setQueryData(projectQueryKeys.project(input.id), response)
      }

      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects() })
    },
  })
}

export function usePublishProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => publishProject(id),
    onSuccess: async (response, id) => {
      if (response.ok) {
        await queryClient.setQueryData(projectQueryKeys.project(id), response)
      }

      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects() })
    },
  })
}

export function useCreateProjectPreviewTokenMutation() {
  return useMutation({
    mutationFn: (id: string) => createProjectPreviewToken(id),
  })
}

export function useArchiveProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: async (response, id) => {
      if (response.ok) {
        await queryClient.setQueryData(projectQueryKeys.project(id), response)
      }

      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.projects() })
    },
  })
}
