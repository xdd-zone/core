import type { SiteConfigResponse, UpdateSiteConfigRequest } from '@xdd-zone/contracts'

import { momoClient } from '../client'
import { readMomoJson } from '../rpc'

export function getSiteConfig() {
  return readMomoJson<SiteConfigResponse>(momoClient.rpc.site.config.$get())
}

export function updateSiteConfig(payload: UpdateSiteConfigRequest) {
  return readMomoJson<SiteConfigResponse>(
    momoClient.rpc.site.config.$patch({
      json: payload,
    }),
  )
}
