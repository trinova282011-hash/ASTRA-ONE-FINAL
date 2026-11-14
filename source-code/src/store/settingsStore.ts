import { create } from 'zustand'
import {
  canUnlockNextExperience as canUnlockNextExperienceForScore,
  getExperienceRank,
  normalizeExperienceMode,
  type ExperienceMode,
} from '../utils/experienceLevels'

export type Language = 'ar' | 'en'
const KEY = 'little-orbit-language'
const SOUND_KEY = 'little-orbit-sound-enabled'
const EXPERIENCE_MODE_KEY = 'astra-one-experience-mode'
const UNLOCKED_EXPERIENCE_KEY = 'astra-one-unlocked-experience-mode'

interface SettingsState {
  language: Language
  soundEnabled: boolean
  experienceMode: ExperienceMode
  unlockedExperienceMode: ExperienceMode
  setLanguage: (language: Language) => void
  setSoundEnabled: (enabled: boolean) => void
  setExperienceMode: (mode: ExperienceMode) => boolean
  unlockNextExperience: (score: number | null) => ExperienceMode | null
}

function readLanguage(): Language {
  try {
    return localStorage.getItem(KEY) === 'ar' ? 'ar' : 'en'
  } catch (error) {
    console.error('Could not read language preference.', error)
    return 'en'
  }
}

function readSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'false'
  } catch (error) {
    console.error('Could not read sound preference.', error)
    return true
  }
}

function readExperienceMode(): ExperienceMode {
  try {
    return normalizeExperienceMode(localStorage.getItem(EXPERIENCE_MODE_KEY))
  } catch (error) {
    console.error('Could not read experience mode preference.', error)
    return 'explorer'
  }
}

function readUnlockedExperienceMode(experienceMode: ExperienceMode): ExperienceMode {
  try {
    const stored = localStorage.getItem(UNLOCKED_EXPERIENCE_KEY)
    if (stored) {
      const unlocked = normalizeExperienceMode(stored)
      return getExperienceRank(unlocked) >= getExperienceRank(experienceMode) ? unlocked : experienceMode
    }
    return experienceMode
  } catch (error) {
    console.error('Could not read unlocked experience level.', error)
    return experienceMode
  }
}

function saveUnlockedExperienceMode(mode: ExperienceMode): void {
  try {
    localStorage.setItem(UNLOCKED_EXPERIENCE_KEY, mode)
  } catch (error) {
    console.error('Could not save unlocked experience level.', error)
  }
}

const initialExperienceMode = readExperienceMode()

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: readLanguage(),
  soundEnabled: readSoundEnabled(),
  experienceMode: initialExperienceMode,
  unlockedExperienceMode: readUnlockedExperienceMode(initialExperienceMode),
  setLanguage: (language) => {
    try {
      localStorage.setItem(KEY, language)
    } catch (error) {
      console.error('Could not save language preference.', error)
    }
    set({ language })
  },
  setSoundEnabled: (soundEnabled) => {
    try {
      localStorage.setItem(SOUND_KEY, String(soundEnabled))
    } catch (error) {
      console.error('Could not save sound preference.', error)
    }
    set({ soundEnabled })
  },
  setExperienceMode: (experienceMode) => {
    const unlockedExperienceMode = getExperienceRank(experienceMode) > getExperienceRank(get().unlockedExperienceMode)
      ? experienceMode
      : get().unlockedExperienceMode
    try {
      localStorage.setItem(EXPERIENCE_MODE_KEY, experienceMode)
    } catch (error) {
      console.error('Could not save experience mode preference.', error)
    }
    saveUnlockedExperienceMode(unlockedExperienceMode)
    set({ experienceMode, unlockedExperienceMode })
    return true
  },
  unlockNextExperience: (score) => {
    const { experienceMode, unlockedExperienceMode } = get()
    if (!canUnlockNextExperienceForScore(score, experienceMode, unlockedExperienceMode)) return null
    const currentRank = getExperienceRank(unlockedExperienceMode)
    const nextExperienceMode = (['explorer', 'commander', 'specialist'] as const)[currentRank + 1] ?? null
    if (!nextExperienceMode) return null
    saveUnlockedExperienceMode(nextExperienceMode)
    set({ unlockedExperienceMode: nextExperienceMode })
    return nextExperienceMode
  },
}))
