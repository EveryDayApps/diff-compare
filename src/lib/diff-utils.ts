import * as Diff from 'diff'

export type DiffType = 'equal' | 'added' | 'removed'

export interface DiffWord {
  text: string
  type: DiffType
}

export interface DiffLine {
  lineNumberLeft: number | null
  lineNumberRight: number | null
  type: DiffType
  content: string
  words?: DiffWord[] // only for changed lines
}

export interface DiffStats {
  added: number
  removed: number
  equal: number
  total: number
}

function computeWordDiff(oldLine: string, newLine: string): { oldWords: DiffWord[], newWords: DiffWord[] } {
  const changes = Diff.diffWords(oldLine, newLine)
  const oldWords: DiffWord[] = []
  const newWords: DiffWord[] = []

  for (const change of changes) {
    if (change.removed) {
      oldWords.push({ text: change.value, type: 'removed' })
    } else if (change.added) {
      newWords.push({ text: change.value, type: 'added' })
    } else {
      oldWords.push({ text: change.value, type: 'equal' })
      newWords.push({ text: change.value, type: 'equal' })
    }
  }

  return { oldWords, newWords }
}

export interface DiffOptions {
  ignoreWhitespace?: boolean
  ignoreCase?: boolean
  ignoreEmptyLines?: boolean
  ignoreLineEndings?: boolean
}

function preprocessText(text: string, options: DiffOptions): string {
  let result = text

  // Normalize line endings first
  if (options.ignoreLineEndings) {
    result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  }

  let lines = result.split('\n')

  if (options.ignoreEmptyLines) {
    lines = lines.filter(l => l.trim() !== '')
  }

  if (options.ignoreWhitespace) {
    lines = lines.map(l => l.trim())
  }

  if (options.ignoreCase) {
    lines = lines.map(l => l.toLowerCase())
  }

  return lines.join('\n')
}

export function computeLineDiff(
  original: string,
  modified: string,
  ignoreWhitespace = false,
  options: DiffOptions = {}
): { lines: DiffLine[]; stats: DiffStats } {
  const mergedOptions: DiffOptions = { ignoreWhitespace, ...options }
  const orig = preprocessText(original, mergedOptions)
  const mod = preprocessText(modified, mergedOptions)

  const changes = Diff.diffLines(orig, mod)

  const lines: DiffLine[] = []
  const stats: DiffStats = { added: 0, removed: 0, equal: 0, total: 0 }

  let leftLine = 1
  let rightLine = 1

  // Group removed+added pairs to compute word-level diffs
  let i = 0
  while (i < changes.length) {
    const change = changes[i]
    const rawLines = change.value.split('\n')
    // Remove trailing empty string from split
    if (rawLines[rawLines.length - 1] === '') rawLines.pop()

    if (!change.added && !change.removed) {
      // Equal lines
      for (const line of rawLines) {
        lines.push({
          lineNumberLeft: leftLine,
          lineNumberRight: rightLine,
          type: 'equal',
          content: line,
        })
        leftLine++
        rightLine++
        stats.equal++
      }
      i++
    } else if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
      // Paired remove+add — compute word diff
      const nextChange = changes[i + 1]
      const removedRaw = change.value.split('\n')
      if (removedRaw[removedRaw.length - 1] === '') removedRaw.pop()
      const addedRaw = nextChange.value.split('\n')
      if (addedRaw[addedRaw.length - 1] === '') addedRaw.pop()

      const maxLen = Math.max(removedRaw.length, addedRaw.length)
      for (let j = 0; j < maxLen; j++) {
        const removedLine = removedRaw[j]
        const addedLine = addedRaw[j]

        if (removedLine !== undefined && addedLine !== undefined) {
          // Both exist — do word diff
          const { oldWords, newWords } = computeWordDiff(removedLine, addedLine)
          lines.push({
            lineNumberLeft: leftLine,
            lineNumberRight: null,
            type: 'removed',
            content: removedLine,
            words: oldWords,
          })
          lines.push({
            lineNumberLeft: null,
            lineNumberRight: rightLine,
            type: 'added',
            content: addedLine,
            words: newWords,
          })
          leftLine++
          rightLine++
        } else if (removedLine !== undefined) {
          lines.push({
            lineNumberLeft: leftLine,
            lineNumberRight: null,
            type: 'removed',
            content: removedLine,
          })
          leftLine++
        } else {
          lines.push({
            lineNumberLeft: null,
            lineNumberRight: rightLine,
            type: 'added',
            content: addedLine,
          })
          rightLine++
        }
        if (removedLine !== undefined) stats.removed++
        if (addedLine !== undefined) stats.added++
      }
      i += 2
    } else if (change.removed) {
      for (const line of rawLines) {
        lines.push({
          lineNumberLeft: leftLine,
          lineNumberRight: null,
          type: 'removed',
          content: line,
        })
        leftLine++
        stats.removed++
      }
      i++
    } else {
      // added
      for (const line of rawLines) {
        lines.push({
          lineNumberLeft: null,
          lineNumberRight: rightLine,
          type: 'added',
          content: line,
        })
        rightLine++
        stats.added++
      }
      i++
    }
  }

  stats.total = stats.added + stats.removed + stats.equal

  return { lines, stats }
}

export function computeSideBySide(lines: DiffLine[]): {
  left: DiffLine[]
  right: DiffLine[]
} {
  // We build left and right arrays keeping them aligned.
  // For equal lines, both sides show the same.
  // For removed/added pairs, we already have them interleaved from computeLineDiff.
  // Since they come in pairs, we can just split them into left/right.
  const left: DiffLine[] = []
  const right: DiffLine[] = []

  let k = 0
  while (k < lines.length) {
    const line = lines[k]
    if (line.type === 'equal') {
      left.push(line)
      right.push(line)
      k++
    } else if (line.type === 'removed') {
      // Check if next is added (paired)
      if (k + 1 < lines.length && lines[k + 1].type === 'added') {
        left.push(line)
        right.push(lines[k + 1])
        k += 2
      } else {
        left.push(line)
        right.push({ ...line, lineNumberLeft: null, lineNumberRight: null, type: 'equal', content: '' })
        k++
      }
    } else if (line.type === 'added') {
      left.push({ ...line, lineNumberLeft: null, lineNumberRight: null, type: 'equal', content: '' })
      right.push(line)
      k++
    } else {
      k++
    }
  }

  return { left, right }
}
