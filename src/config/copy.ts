import { brand } from '@config'

/** Replace `{key}` placeholders in a brand copy string. */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '')
}

export function toastNotInDemo(what: string): string {
  return fill(brand.copy.notInDemo, { what })
}
