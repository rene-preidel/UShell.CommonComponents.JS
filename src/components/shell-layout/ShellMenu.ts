import { ReactElement } from 'react'

export type MenuItemType = 'Command' | 'Group' | 'Folder'

export class MenuItem {
  label = ''
  type: MenuItemType = 'Command'
  command?: (e: any) => void
  children?: MenuItem[]
  icon?: ReactElement
  id = ''
}

export interface TopBarItem {
  icon: ReactElement
  dropdown?: ReactElement
  command?: (e: any) => void
  id: string
}

export class ShellMenu {
  items: MenuItem[] = []
  subItems?: Map<string, MenuItem[]> = new Map()
  topBarItems?: TopBarItem[] = []
}

export function findMenuItem(items: MenuItem[], id: string): MenuItem | undefined {
  for (const item of items) {
    if (item.id.toLocaleLowerCase() === id.toLocaleLowerCase()) {
      return item
    }
    if (item.children) {
      const foundItem = findMenuItem(item.children, id)
      if (foundItem) {
        return foundItem
      }
    }
  }
  return undefined
}

export function getCommandItems(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = []
  for (const item of items) {
    if (item.type === 'Command') {
      result.push(item)
    }
    if (item.children) {
      result.push(...getCommandItems(item.children))
    }
  }
  return result
}

export function findParentItem(items: MenuItem[], id: string): MenuItem | undefined {
  for (const item of items) {
    if (
      item.children &&
      item.children.find((i) => i.id.toLocaleLowerCase() === id.toLocaleLowerCase())
    ) {
      return item
    }
    const foundItem = findParentItem(item.children || [], id)
    if (foundItem) {
      return foundItem
    }
  }
  return undefined
}
