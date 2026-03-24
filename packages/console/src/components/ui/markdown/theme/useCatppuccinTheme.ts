import type { CatppuccinThemeId } from '@console/stores/modules/setting'

import { useSettingStore } from '@console/stores/modules/setting'

export function useCatppuccinTheme (): CatppuccinThemeId {
  return useSettingStore((state) => state.catppuccinTheme)
}
