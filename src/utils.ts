export function genId() {
  return Date.now().toString(16) + Math.random().toString(16).substr(2)
}
