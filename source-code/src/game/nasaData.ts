export interface NasaCmeObservation {
  activityId: string
  observedAt: string
  speedKmPerSecond: number | null
  sourceLocation: string | null
  eventUrl: string
  analysisUrl: string | null
}

export type NasaCmeDatasetSource = 'recent' | 'cached' | 'archive'

export interface NasaCmeDataset {
  observations: readonly NasaCmeObservation[]
  source: NasaCmeDatasetSource
  retrievedAt: string | null
  warning: string | null
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

const API_URL = 'https://ccmc.gsfc.nasa.gov/DONKI/WS/get/CME'
const CACHE_KEY = 'astra-one-nasa-donki-cme-v1'
const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000
const QUERY_DAYS = 7

export const NASA_CME_SOURCE = {
  name: 'NASA Community Coordinated Modeling Center DONKI',
  url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/',
  apiUrl: API_URL,
  archivedDatasetUrl: 'https://ccmc.gsfc.nasa.gov/DONKI/WS/get/CME?startDate=2025-01-01&endDate=2025-01-07',
  archiveLimitations: 'CME observations describe coronagraph analyses; they are not local lunar radiation measurements, forecasts, or crew dose estimates.',
  provenance: 'REAL_REFERENCE',
  modelUse: 'EDUCATIONAL_MODEL',
  validationStatus: 'INCOMPLETE',
} as const

export const ARCHIVED_NASA_CME_OBSERVATIONS: readonly NasaCmeObservation[] = [{
  activityId: '2025-01-01T02:24:00-CME-001',
  observedAt: '2025-01-01T02:24:00Z',
  speedKmPerSecond: 428,
  sourceLocation: 'S15W77',
  eventUrl: 'https://ccmc.gsfc.nasa.gov/DONKI/view/CME/36174/-1',
  analysisUrl: 'https://ccmc.gsfc.nasa.gov/DONKI/view/CMEAnalysis/36175/-1',
}]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isDonkiUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' &&
      url.hostname === 'ccmc.gsfc.nasa.gov' &&
      url.pathname.startsWith('/DONKI/view/')
  } catch {
    return false
  }
}

export function normalizeNasaCmeResponse(payload: unknown): NasaCmeObservation[] {
  if (!Array.isArray(payload)) throw new Error('NASA DONKI returned an invalid CME dataset.')

  const observations = payload.flatMap((item): NasaCmeObservation[] => {
    if (!isRecord(item) || typeof item.activityID !== 'string' || !isValidDate(item.startTime) || !isDonkiUrl(item.link)) {
      return []
    }

    const analyses = Array.isArray(item.cmeAnalyses) ? item.cmeAnalyses.filter(isRecord) : []
    const analysis = analyses.find((candidate) => candidate.isMostAccurate === true) ||
      analyses.find((candidate) => typeof candidate.speed === 'number' && Number.isFinite(candidate.speed))
    const speed = analysis?.speed
    const sourceLocation = typeof item.sourceLocation === 'string' && item.sourceLocation.trim()
      ? item.sourceLocation.trim()
      : null

    return [{
      activityId: item.activityID,
      observedAt: new Date(item.startTime).toISOString(),
      speedKmPerSecond: typeof speed === 'number' && Number.isFinite(speed) && speed >= 0 ? speed : null,
      sourceLocation,
      eventUrl: item.link,
      analysisUrl: isDonkiUrl(analysis?.link) ? analysis.link : null,
    }]
  })

  if (payload.length > 0 && !observations.length) {
    throw new Error('NASA DONKI returned no valid CME observations for the requested period.')
  }
  return observations
}

function isObservation(value: unknown): value is NasaCmeObservation {
  return isRecord(value) &&
    typeof value.activityId === 'string' &&
    isValidDate(value.observedAt) &&
    (value.speedKmPerSecond === null || (
      typeof value.speedKmPerSecond === 'number' &&
      Number.isFinite(value.speedKmPerSecond) &&
      value.speedKmPerSecond >= 0
    )) &&
    (value.sourceLocation === null || typeof value.sourceLocation === 'string') &&
    isDonkiUrl(value.eventUrl) &&
    (value.analysisUrl === null || isDonkiUrl(value.analysisUrl))
}

function readCache(raw: string | null): { observations: NasaCmeObservation[]; retrievedAt: string } | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(`The NASA data cache contains invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (
    !isRecord(parsed) ||
    !isValidDate(parsed.retrievedAt) ||
    !Array.isArray(parsed.observations) ||
    !parsed.observations.every(isObservation)
  ) throw new Error('The NASA data cache has an invalid structure.')
  return { observations: parsed.observations, retrievedAt: parsed.retrievedAt }
}

export function buildNasaCmeApiUrl(now: Date): string {
  const endDate = now.toISOString().slice(0, 10)
  const startDate = new Date(now.getTime() - (QUERY_DAYS - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const query = new URLSearchParams({ startDate, endDate })
  return `${API_URL}?${query.toString()}`
}

export async function loadNasaCmeDataset(options: {
  now?: Date
  fetcher?: FetchLike
  storage?: StorageLike
  forceRefresh?: boolean
} = {}): Promise<NasaCmeDataset> {
  const now = options.now || new Date()
  const fetcher = options.fetcher || fetch
  let storage = options.storage
  let warning: string | null = null

  if (!storage && typeof window !== 'undefined') {
    try {
      storage = window.localStorage
    } catch (error) {
      warning = `Browser cache is unavailable: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  let cached: ReturnType<typeof readCache> = null
  if (storage) {
    try {
      cached = readCache(storage.getItem(CACHE_KEY))
    } catch (error) {
      warning = `Could not read the NASA data cache: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  if (
    !options.forceRefresh &&
    cached &&
    now.getTime() - Date.parse(cached.retrievedAt) >= 0 &&
    now.getTime() - Date.parse(cached.retrievedAt) <= CACHE_MAX_AGE_MS
  ) {
    return { observations: cached.observations, source: 'cached', retrievedAt: cached.retrievedAt, warning }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    let response: Response
    try {
      response = await fetcher(buildNasaCmeApiUrl(now), { signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }
    if (!response.ok) throw new Error(`NASA DONKI request failed with HTTP ${response.status}.`)
    const observations = normalizeNasaCmeResponse(await response.json())
    const retrievedAt = now.toISOString()
    if (storage) {
      try {
        storage.setItem(CACHE_KEY, JSON.stringify({ observations, retrievedAt }))
      } catch (error) {
        warning = `NASA data loaded, but could not be cached: ${error instanceof Error ? error.message : String(error)}`
      }
    }
    return { observations, source: 'recent', retrievedAt, warning }
  } catch (error) {
    const requestWarning = `NASA DONKI could not be refreshed: ${error instanceof Error ? error.message : String(error)}`
    if (cached) {
      return {
        observations: cached.observations,
        source: 'cached',
        retrievedAt: cached.retrievedAt,
        warning: [warning, requestWarning].filter(Boolean).join(' '),
      }
    }
    return {
      observations: ARCHIVED_NASA_CME_OBSERVATIONS,
      source: 'archive',
      retrievedAt: null,
      warning: [warning, requestWarning].filter(Boolean).join(' '),
    }
  }
}
