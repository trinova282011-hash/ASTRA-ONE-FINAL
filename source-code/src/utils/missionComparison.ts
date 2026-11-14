import { calculateMissionScore, getMarsCommunicationDelayMinutes, type GameState } from '../game/model'

const COMPARISON_KEY = 'astra-one-last-mission-comparison-v2'

export interface MissionComparisonSnapshot {
  runId: string
  missionKey: string
  score: number
  daysSurvived: number
  radiationMsv: number
  communicationDelayMinutes: number
  energy: number
  oxygen: number
  firstChoices: number
  alternateChoices: number
  radiationAlertsDeferred: number
  radiationAlertsContinued: number
}

interface StoredMissionComparison {
  current: MissionComparisonSnapshot
  previous: MissionComparisonSnapshot | null
}

function isSnapshot(value: unknown): value is MissionComparisonSnapshot {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<MissionComparisonSnapshot>
  return typeof item.runId === 'string' &&
    typeof item.missionKey === 'string' &&
    typeof item.score === 'number' &&
    typeof item.daysSurvived === 'number' &&
    typeof item.radiationMsv === 'number' &&
    typeof item.communicationDelayMinutes === 'number' &&
    typeof item.energy === 'number' &&
    typeof item.oxygen === 'number' &&
    typeof item.firstChoices === 'number' &&
    typeof item.alternateChoices === 'number' &&
    typeof item.radiationAlertsDeferred === 'number' &&
    typeof item.radiationAlertsContinued === 'number'
}

function readStoredComparison(): StoredMissionComparison | null {
  const raw = localStorage.getItem(COMPARISON_KEY)
  if (!raw) return null
  const parsed: unknown = JSON.parse(raw)
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !isSnapshot((parsed as Partial<StoredMissionComparison>).current) ||
    !(
      (parsed as Partial<StoredMissionComparison>).previous === null ||
      isSnapshot((parsed as Partial<StoredMissionComparison>).previous)
    )
  ) throw new Error('Saved mission comparison data has an invalid structure.')
  return parsed as StoredMissionComparison
}

function getMissionKey(state: GameState): string {
  return [
    state.destination,
    state.missionType,
    state.difficulty,
    state.objective,
    state.scenario,
    state.missionSeed,
    state.crewSize,
    state.maxDays,
  ].join(':')
}

export function getModeledMissionCommunicationDelay(state: Pick<GameState, 'destination' | 'missionSeed' | 'dailyReports'>): number {
  if (state.destination !== 'mars') return 0
  return state.dailyReports.reduce((total, report) => total + report.actions.reduce(
    (dayTotal, action) => action === 'research' || action === 'explore' || action === 'maintenance'
      ? dayTotal + getMarsCommunicationDelayMinutes(state.missionSeed, report.day, action)
      : dayTotal,
    0,
  ), 0)
}

export function recordMissionComparison(state: GameState): MissionComparisonSnapshot | null {
  if (!state.isGameOver || !state.missionResult) {
    throw new Error('A completed mission is required for comparison.')
  }
  try {
    const stored = readStoredComparison()
    const eventChoices = (state.eventHistory || []).reduce(
      ([first, alternate], response) => response.choiceIndex === 0
        ? [first + 1, alternate]
        : [first, alternate + 1],
      [0, 0],
    )
    const current: MissionComparisonSnapshot = {
      runId: state.runId,
      missionKey: getMissionKey(state),
      score: calculateMissionScore(state),
      daysSurvived: state.daysSurvived,
      radiationMsv: state.radiationExposure,
      communicationDelayMinutes: getModeledMissionCommunicationDelay(state),
      energy: state.resources.energy,
      oxygen: state.resources.oxygen,
      firstChoices: eventChoices[0],
      alternateChoices: eventChoices[1],
      radiationAlertsDeferred: (state.spaceWeatherResponses || []).filter((response) => response.choice === 'defer').length,
      radiationAlertsContinued: (state.spaceWeatherResponses || []).filter((response) => response.choice === 'continue').length,
    }

    if (stored?.current.runId === current.runId) return stored.previous
    const previous = stored?.current.missionKey === current.missionKey ? stored.current : null
    localStorage.setItem(COMPARISON_KEY, JSON.stringify({ current, previous }))
    return previous
  } catch (error) {
    console.error('Could not save or read mission comparison data.', error)
    throw new Error(`Could not save mission comparison on this device: ${error instanceof Error ? error.message : String(error)}`)
  }
}
