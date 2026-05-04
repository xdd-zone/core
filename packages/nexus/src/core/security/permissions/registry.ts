import type { PermissionDefinition, PermissionString } from './permissions.types'

export class PermissionRegistry {
  private readonly definitionMap = new Map<PermissionString, PermissionDefinition>()
  private readonly orderMap = new Map<PermissionString, number>()

  register(definitions: readonly PermissionDefinition[]): void {
    for (const definition of definitions) {
      if (!this.orderMap.has(definition.key)) {
        this.orderMap.set(definition.key, this.orderMap.size)
      }

      this.definitionMap.set(definition.key, definition)
    }
  }

  getAllDefinitions(): PermissionDefinition[] {
    return [...this.definitionMap.values()].sort((left, right) => this.compare(left.key, right.key))
  }

  getAllKeys(): PermissionString[] {
    return this.getAllDefinitions().map((definition) => definition.key)
  }

  getDefinition(permission: PermissionString): PermissionDefinition | undefined {
    return this.definitionMap.get(permission)
  }

  compare(left: PermissionString, right: PermissionString): number {
    const leftOrder = this.orderMap.get(left) ?? Number.MAX_SAFE_INTEGER
    const rightOrder = this.orderMap.get(right) ?? Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return left.localeCompare(right)
  }
}

export const permissionRegistry = new PermissionRegistry()

export function registerPermissionDefinitions(definitions: readonly PermissionDefinition[]): void {
  permissionRegistry.register(definitions)
}
