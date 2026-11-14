export type NoaaRadiationStormScale = 1 | 2 | 3 | 4 | 5

export interface NoaaSolarProtonSnapshot {
  fluxPfu: number
  observedAt: string
  satellite: number
  scale: NoaaRadiationStormScale | null
  freshness: 'fresh' | 'stale'
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

const API_URL = 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json'
const MAX_AGE_MS = 30 * 60 * 1000

export const NOAA_SOLAR_PROTON_SOURCE = {
  name: 'NOAA Space Weather Prediction Center GOES proton flux',
  url: API_URL,
  scaleUrl: 'https://www.swpc.noaa.gov/noaa-scales-explanation',
  energyChannel: '>=10 MeV',
  maximumAgeMinutes: MAX_AGE_MS / 60_000,
  provenance: 'REAL_REFERENCE',
  gameUse: 'TRAINING_ALERT_ONLY',
} as const

interface ProtonReading {
  time: number
  flux: number
  satellite: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function getNoaaRadiationStormScale(fluxPfu: number): NoaaRadiationStormScale | null {
  if (!Number.isFinite(fluxPfu) || fluxPfu < 10) return null
  if (fluxPfu >= 100_000) return 5
  if (fluxPfu >= 10_000) return 4
  if (fluxPfu >= 1_000) return 3
  if (fluxPfu >= 100) return 2
  return 1
}

export function normalizeNoaaSolarProtonResponse(payload: unknown, now = new Date()): NoaaSolarProtonSnapshot {
  if (!Array.isArray(payload)) throw new Error('NOAA SWPC returned an invalid proton-flux dataset.')

  const readings = payload.flatMap((item): ProtonReading[] => {
    if (
      !isRecord(item) ||
      item.energy !== NOAA_SOLAR_PROTON_SOURCE.energyChannel ||
      typeof item.time_tag !== 'string' ||
      !Number.isFinite(Date.parse(item.time_tag)) ||
      typeof item.flux !== 'number' ||
      !Number.isFinite(item.flux) ||
      item.flux < 0 ||
      typeof item.satellite !== 'number' ||
      !Number.isFinite(item.satellite)
    ) return []
    return [{ time: Date.parse(item.time_tag), flux: item.flux, satellite: item.satellite }]
  })

  const latest = readings.reduce<ProtonReading | null>(
    (current, reading) => !current || reading.time > current.time ? reading : current,
    null,
  )
  if (!latest) throw new Error('NOAA SWPC returned no valid >=10 MeV proton-flux readings.')

  const age = now.getTime() - latest.time
  return {
    fluxPfu: latest.flux,
    observedAt: new Date(latest.time).toISOString(),
    satellite: latest.satellite,
    scale: getNoaaRadiationStormScale(latest.flux),
    freshness: age >= 0 && age <= MAX_AGE_MS ? 'fresh' : 'stale',
  }
}

export async function loadNoaaSolarProtonSnapshot(options: {
  now?: Date
  fetcher?: FetchLike
} = {}): Promise<NoaaSolarProtonSnapshot> {
  const now = options.now || new Date()
  const fetcher = options.fetcher || fetch
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  let response: Response
  try {
    response = await fetcher(API_URL, { signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
  if (!response.ok) throw new Error(`NOAA SWPC request failed with HTTP ${response.status}.`)
  return normalizeNoaaSolarProtonResponse(await response.json(), now)
}
