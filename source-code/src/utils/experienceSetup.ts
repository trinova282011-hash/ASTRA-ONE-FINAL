import type { ControlMode, Destination, MissionDifficulty, MissionType } from '../game/model'
import {
  MAX_SIMULATED_MISSION_DAYS,
  MISSION_DURATIONS,
  MISSION_TYPE_MAX_DAYS,
  isValidMissionDuration,
  type MissionDuration,
} from '../game/model'
import type { ScenarioId } from '../game/scenarios'
import type { ExperienceMode } from './experienceLevels'
import type { MissionPanelId } from '../game/teamwork'

interface ExperienceSetupProfile {
  defaultMissionType: MissionType
  defaultDuration: MissionDuration
  defaultDifficulty: MissionDifficulty
  maximumMissionDays: MissionDuration
  maximumCrew: number
  missionTypes: readonly MissionType[]
  difficulties: readonly MissionDifficulty[]
  controlModes: readonly ControlMode[]
  scenarios: readonly ScenarioId[]
}

const ALL_MISSION_TYPES: readonly MissionType[] = [
  'moon-exploration',
  'moon-settlement',
  'mars-opposition',
  'mars-conjunction',
]
const ALL_DIFFICULTIES: readonly MissionDifficulty[] = ['easy', 'normal', 'hard']
const EXPLORER_DIFFICULTIES: readonly MissionDifficulty[] = ['easy']
const COMMANDER_DIFFICULTIES: readonly MissionDifficulty[] = ['easy', 'normal']
const ALL_SCENARIOS: readonly ScenarioId[] = [
  'baseline',
  'dust-front',
  'water-rationing',
  'oxygen-shortage',
  'solar-flare',
  'habitat-leak',
  'greenhouse-fault',
]
const EXPERIENCE_MISSION_PANELS: Readonly<Record<ExperienceMode, readonly MissionPanelId[]>> = {
  explorer: ['crew', 'operations'],
  commander: ['resources', 'crew', 'systems', 'operations', 'communications'],
  specialist: ['resources', 'crew', 'systems', 'operations', 'infrastructure', 'forecast', 'communications'],
}

export const EXPERIENCE_SETUP_PROFILES: Readonly<Record<ExperienceMode, ExperienceSetupProfile>> = {
  explorer: {
    defaultMissionType: 'moon-exploration',
    defaultDuration: 10,
    defaultDifficulty: 'easy',
    maximumMissionDays: 30,
    maximumCrew: 4,
    missionTypes: ['moon-exploration', 'mars-opposition'],
    difficulties: EXPLORER_DIFFICULTIES,
    controlModes: ['full'],
    scenarios: ['baseline', 'water-rationing', 'oxygen-shortage'],
  },
  commander: {
    defaultMissionType: 'moon-exploration',
    defaultDuration: 30,
    defaultDifficulty: 'normal',
    maximumMissionDays: 60,
    maximumCrew: 8,
    missionTypes: ALL_MISSION_TYPES,
    difficulties: COMMANDER_DIFFICULTIES,
    controlModes: ['full'],
    scenarios: ALL_SCENARIOS,
  },
  specialist: {
    defaultMissionType: 'moon-exploration',
    defaultDuration: 30,
    defaultDifficulty: 'normal',
    maximumMissionDays: MAX_SIMULATED_MISSION_DAYS,
    maximumCrew: 12,
    missionTypes: ALL_MISSION_TYPES,
    difficulties: ALL_DIFFICULTIES,
    controlModes: ['full', 'specialist'],
    scenarios: ALL_SCENARIOS,
  },
}

export function getExperienceMissionTypes(mode: ExperienceMode, destination: Destination): MissionType[] {
  return EXPERIENCE_SETUP_PROFILES[mode].missionTypes.filter((type) => type.startsWith(destination))
}

export function getExperienceMissionTypeForDestination(
  mode: ExperienceMode,
  destination: Destination,
  currentMissionType: MissionType,
): MissionType {
  const choices = getExperienceMissionTypes(mode, destination)
  const currentIsLong = MISSION_TYPE_MAX_DAYS[currentMissionType] > 30
  const matchingDurationProfile = choices.find((type) => (MISSION_TYPE_MAX_DAYS[type] > 30) === currentIsLong)
  const missionType = matchingDurationProfile ?? choices[0]
  if (!missionType) throw new Error(`No mission profiles are configured for ${mode} at ${destination}.`)
  return missionType
}

export function getExperienceMissionDurations(mode: ExperienceMode, missionType: MissionType): MissionDuration[] {
  const maximumDays = Math.min(
    MISSION_TYPE_MAX_DAYS[missionType],
    EXPERIENCE_SETUP_PROFILES[mode].maximumMissionDays,
  )
  const destination = missionType.startsWith('moon') ? 'moon' : 'mars'
  return MISSION_DURATIONS.filter((duration) =>
    duration <= maximumDays && isValidMissionDuration(destination, missionType, duration),
  )
}

export function getExperienceCrewSizes(
  mode: ExperienceMode,
  allowedCrewSizes: readonly number[],
  minimumCrew: number,
): number[] {
  const maximumCrew = EXPERIENCE_SETUP_PROFILES[mode].maximumCrew
  return allowedCrewSizes.filter((size) => size >= minimumCrew && size <= maximumCrew)
}

export function getRecommendedExperienceCrewSize(
  mode: ExperienceMode,
  allowedCrewSizes: readonly number[],
  minimumCrew: number,
): number {
  const crewSize = getExperienceCrewSizes(mode, allowedCrewSizes, minimumCrew)[0]
  if (crewSize === undefined) {
    throw new Error(`No crew size is configured for ${mode} with a minimum crew of ${minimumCrew}.`)
  }
  return crewSize
}

export function getRecommendedMissionDuration(mode: ExperienceMode, missionType: MissionType): MissionDuration {
  const choices = getExperienceMissionDurations(mode, missionType)
  const preferred = missionType.startsWith('moon') || missionType === 'mars-opposition'
    ? EXPERIENCE_SETUP_PROFILES[mode].defaultDuration
    : EXPERIENCE_SETUP_PROFILES[mode].maximumMissionDays
  const duration = choices.find((choice) => choice === preferred) ?? choices[choices.length - 1]
  if (duration === undefined) throw new Error(`No mission duration is configured for ${mode} and ${missionType}.`)
  return duration
}

export function getExperienceDifficulties(mode: ExperienceMode): readonly MissionDifficulty[] {
  return EXPERIENCE_SETUP_PROFILES[mode].difficulties
}

export function getExperienceControlModes(mode: ExperienceMode): readonly ControlMode[] {
  return EXPERIENCE_SETUP_PROFILES[mode].controlModes
}

export function getExperienceScenarios(mode: ExperienceMode): readonly ScenarioId[] {
  return EXPERIENCE_SETUP_PROFILES[mode].scenarios
}

export function getExperienceVisibleMissionPanels(
  mode: ExperienceMode,
  roleAccessiblePanels: readonly MissionPanelId[],
): MissionPanelId[] {
  return roleAccessiblePanels.filter((panel) => EXPERIENCE_MISSION_PANELS[mode].includes(panel))
}
