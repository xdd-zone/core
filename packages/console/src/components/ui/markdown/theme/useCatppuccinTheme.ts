import type { CatppuccinThemeId } from '@/stores/modules/setting'

import { useSettingStore } from '@/stores/modules/setting'

export function useCatppuccinTheme (): CatppuccinThemeId {
  return useSettingStore((state) => state.catppuccinTheme)
}
