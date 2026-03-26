export const env = {
  ...(globalThis.process?.env || {}),
  ...(globalThis.Bun?.env || {}),
}
