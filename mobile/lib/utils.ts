export function generateInitialsStable(names: string[]) {
  const initialsMap: { [name: string]: string } = {}
  const used: Set<string> = new Set()

  for (const name of names) {
    const first = name.slice(0, 1).toUpperCase()
    const fallback = name.slice(0, 2).toUpperCase()

    if (!used.has(first)) {
      initialsMap[name] = first
      used.add(first)
    } else {
      // fallback to 2-letter if first is taken
      initialsMap[name] = fallback
      used.add(fallback)
    }
  }

  return initialsMap
}
