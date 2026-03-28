export type FileDisplayMode = 'tabs' | 'stacked' | 'single'

export interface CommitFile {
  filename: string
  previousFilename?: string
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged'
  additions: number
  deletions: number
  original: string
  modified: string
}

export interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  author: string
  date: string
  files: CommitFile[]
  repoUrl: string
  platform: 'github' | 'gitlab'
}

function parsePatch(patch: string | undefined): { original: string; modified: string } {
  if (!patch) return { original: '', modified: '' }

  const originalLines: string[] = []
  const modifiedLines: string[] = []

  for (const line of patch.split('\n')) {
    if (line.startsWith('@@') || line.startsWith('\\ ')) continue
    if (line.startsWith('-')) {
      originalLines.push(line.slice(1))
    } else if (line.startsWith('+')) {
      modifiedLines.push(line.slice(1))
    } else {
      const content = line.startsWith(' ') ? line.slice(1) : line
      originalLines.push(content)
      modifiedLines.push(content)
    }
  }

  return {
    original: originalLines.join('\n'),
    modified: modifiedLines.join('\n'),
  }
}

function countPatchChanges(patch: string): { additions: number; deletions: number } {
  let additions = 0
  let deletions = 0
  for (const line of patch.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions++
    else if (line.startsWith('-') && !line.startsWith('---')) deletions++
  }
  return { additions, deletions }
}

// ─── GitHub ────────────────────────────────────────────────────────────────

function parseGitHubCommitUrl(url: string): { owner: string; repo: string; sha: string } | null {
  const match = url.match(/github\.com\/([^/?#]+)\/([^/?#]+)\/commit\/([a-f0-9]+)/i)
  if (!match) return null
  return { owner: match[1], repo: match[2], sha: match[3] }
}

async function fetchGitHubCommit(url: string): Promise<CommitInfo> {
  const parsed = parseGitHubCommitUrl(url)
  if (!parsed) {
    throw new Error('Invalid GitHub commit URL. Expected: https://github.com/owner/repo/commit/sha')
  }

  const { owner, repo, sha } = parsed
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
    { headers: { Accept: 'application/vnd.github.v3+json' } }
  )

  if (!response.ok) {
    if (response.status === 404) throw new Error('Commit not found or repository is private')
    if (response.status === 403) throw new Error('GitHub API rate limit exceeded — try again in a moment')
    throw new Error(`GitHub API error (${response.status})`)
  }

  const data = await response.json()

  const files: CommitFile[] = (data.files ?? []).map((f: {
    filename: string
    previous_filename?: string
    status: string
    additions: number
    deletions: number
    patch?: string
  }) => {
    const { original, modified } = parsePatch(f.patch)
    return {
      filename: f.filename,
      previousFilename: f.previous_filename,
      status: f.status as CommitFile['status'],
      additions: f.additions,
      deletions: f.deletions,
      original,
      modified,
    }
  })

  return {
    sha: data.sha,
    shortSha: (data.sha as string).slice(0, 7),
    message: data.commit.message as string,
    author: data.commit.author.name as string,
    date: data.commit.author.date as string,
    files,
    repoUrl: `https://github.com/${owner}/${repo}`,
    platform: 'github',
  }
}

// ─── GitLab ────────────────────────────────────────────────────────────────

function parseGitLabCommitUrl(url: string): { baseUrl: string; projectPath: string; sha: string } | null {
  // Supports: https://gitlab.com/owner/repo/-/commit/sha  (any depth of groups)
  const match = url.match(/^(https?:\/\/[^/]+)\/(.+?)\/-\/commit\/([a-f0-9]+)/i)
  if (!match) return null
  return { baseUrl: match[1], projectPath: match[2], sha: match[3] }
}

async function fetchGitLabCommit(url: string): Promise<CommitInfo> {
  const parsed = parseGitLabCommitUrl(url)
  if (!parsed) {
    throw new Error('Invalid GitLab commit URL. Expected: https://gitlab.com/owner/repo/-/commit/sha')
  }

  const { baseUrl, projectPath, sha } = parsed
  const encodedPath = encodeURIComponent(projectPath)
  const apiBase = `${baseUrl}/api/v4/projects/${encodedPath}/repository`

  const [commitRes, diffsRes] = await Promise.all([
    fetch(`${apiBase}/commits/${sha}`),
    fetch(`${apiBase}/commits/${sha}/diff`),
  ])

  if (!commitRes.ok) {
    if (commitRes.status === 404) throw new Error('Commit not found or repository is private')
    if (commitRes.status === 401 || commitRes.status === 403) throw new Error('Repository requires authentication')
    throw new Error(`GitLab API error (${commitRes.status})`)
  }

  const commitData = await commitRes.json()
  const diffsData: {
    old_path: string
    new_path: string
    new_file: boolean
    renamed_file: boolean
    deleted_file: boolean
    diff: string
  }[] = diffsRes.ok ? await diffsRes.json() : []

  const files: CommitFile[] = diffsData.map((d) => {
    const { original, modified } = parsePatch(d.diff)
    const { additions, deletions } = countPatchChanges(d.diff)
    const status: CommitFile['status'] = d.new_file
      ? 'added'
      : d.deleted_file
      ? 'removed'
      : d.renamed_file
      ? 'renamed'
      : 'modified'
    return {
      filename: d.new_path,
      previousFilename: d.renamed_file ? d.old_path : undefined,
      status,
      additions,
      deletions,
      original,
      modified,
    }
  })

  return {
    sha: commitData.id,
    shortSha: commitData.short_id,
    message: commitData.title,
    author: commitData.author_name,
    date: commitData.authored_date,
    files,
    repoUrl: `${baseUrl}/${projectPath}`,
    platform: 'gitlab',
  }
}

// ─── Unified entry point ────────────────────────────────────────────────────

export function detectPlatform(url: string): 'github' | 'gitlab' | null {
  if (url.includes('github.com')) return 'github'
  if (url.match(/gitlab\./i)) return 'gitlab'
  return null
}

export async function fetchCommit(url: string): Promise<CommitInfo> {
  const trimmed = url.trim()
  const platform = detectPlatform(trimmed)
  if (platform === 'github') return fetchGitHubCommit(trimmed)
  if (platform === 'gitlab') return fetchGitLabCommit(trimmed)
  throw new Error('Unsupported URL. Paste a GitHub or GitLab commit URL.')
}
