import { Download, RotateCcw, Telescope } from 'lucide-react'
import { Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BUILDINGS } from '../game/buildings'
import { ENVIRONMENT } from '../game/constants'
import { formatResourceValue, RESOURCE_META } from '../game/resources'
import { analyzeMissionBehavior, calculateMissionScore, getObjectiveProgress, getObjectiveTarget, getSurfaceOperationDayLimit, isObjectiveComplete } from '../game/model'
import { MISSION_PROFILES } from '../game/missionProfiles'
import type { GameState, ResourceName } from '../game/model'
import ar from '../i18n/ar'
import en from '../i18n/en'
import { EVENTS } from '../game/events'
import { downloadMissionReport } from '../utils/exportReport'
import { useGameStore } from '../store/gameStore'
import { useSettingsStore } from '../store/settingsStore'
import { useSound } from '../hooks/useSound'
import { getAstronautDutyProgress } from '../game/teamwork'
import { Leaderboard } from './Leaderboard'
import { AchievementsPanel } from './AchievementsPanel'
import { canUnlockNextExperience, getNextExperienceMode, EXPERIENCE_PROFILES } from '../utils/experienceLevels'
import { ExperienceLevelCard } from './ExperienceLevelCard'
import { DidYouKnow } from './DidYouKnow'
import { getModeledMissionCommunicationDelay, recordMissionComparison, type MissionComparisonSnapshot } from '../utils/missionComparison'

export function EndScreen({ state }: { state: GameState }) {
  const language = useSettingsStore((store) => store.language)
  const t = language === 'ar' ? ar : en
  const newMission = useGameStore((store) => store.newMission)
  const setMissionMode = useGameStore((store) => store.setMissionMode)
  const setObjective = useGameStore((store) => store.setObjective)
  const setMissionLength = useGameStore((store) => store.setMissionLength)
  const replayMission = useGameStore((store) => store.replayMission)
  const experienceMode = useSettingsStore((store) => store.experienceMode)
  const unlockedExperienceMode = useSettingsStore((store) => store.unlockedExperienceMode)
  const setExperienceMode = useSettingsStore((store) => store.setExperienceMode)
  const unlockNextExperience = useSettingsStore((store) => store.unlockNextExperience)
  const nextExperienceMode = getNextExperienceMode(experienceMode)
  const missionScore = calculateMissionScore(state)
  const success = state.missionResult === 'success'
  const endedEarly = state.missionResult === 'ended'
  const objectiveTitle = state.objective === 'survival'
    ? t.objective_survival
    : state.objective === 'science'
      ? t.objective_science
      : state.objective === 'exploration'
        ? t.objective_exploration
        : t.objective_tutorial
  const missionTypeTitle = MISSION_PROFILES[state.missionType].goal[language]
  const objectiveProgress = getObjectiveProgress(state)
  const objectiveTarget = getObjectiveTarget(state)
  const objectiveComplete = isObjectiveComplete(state)
  const actionCounts = analyzeMissionBehavior(state.actionHistory || [])
  const actionHistory = state.actionHistory || []
  const explorationActivities = actionHistory.filter((action) => action === 'explore').length +
    (state.crewSupportActionHistory || []).filter((action) => action === 'explore').length
  const leadingAction = (['research', 'explore', 'maintenance', 'exercise', 'rest'] as const)
    .reduce((leading, action) => actionCounts[action] > actionCounts[leading] ? action : leading, 'research')
  const eventChoiceCounts = (state.eventHistory || []).reduce(([first, alternate], response) => (
    response.choiceIndex === 0 ? [first + 1, alternate] : [first, alternate + 1]
  ), [0, 0])
  const failureResource = state.failureCause?.resource || (['energy', 'oxygen', 'water', 'food', 'health'] as const)
    .find((resource) => state.resources[resource] <= 0)
  const failureText = (resource: ResourceName) => ({
    energy: t.failureEnergy,
    oxygen: t.failureOxygen,
    water: t.failureWater,
    food: t.failureFood,
    health: t.failureHealth,
  })[resource]
  const failureAdvice = (resource: ResourceName) => ({
    energy: t.failureAdviceEnergy,
    oxygen: t.failureAdviceOxygen,
    water: t.failureAdviceWater,
    food: t.failureAdviceFood,
    health: t.failureAdviceHealth,
  })[resource]
  const failedEvent = state.failureCause?.eventId
    ? EVENTS.find((event) => event.id === state.failureCause?.eventId)
    : undefined
  const failedEventChoice = failedEvent && state.failureCause?.choiceIndex !== undefined
    ? failedEvent.choices[state.failureCause.choiceIndex]
    : undefined
  const [reportError, setReportError] = useState('')
  const [exportingReport, setExportingReport] = useState(false)
  const [showAppreciation, setShowAppreciation] = useState(false)
  const [previousRun, setPreviousRun] = useState<MissionComparisonSnapshot | null>(null)
  const [comparisonError, setComparisonError] = useState('')
  const { soundEnabled, toggleSound, playClick, playWin, playLose } = useSound()
  const isArabic = language === 'ar'
  const astronautDuty = getAstronautDutyProgress(state, language, true)
  useEffect(() => {
    try {
      setPreviousRun(recordMissionComparison(state))
      setComparisonError('')
    } catch (error) {
      setComparisonError(error instanceof Error ? error.message : 'Mission comparison could not be saved.')
    }
  }, [state.runId])
  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => setShowAppreciation(true), 4_000)
    return () => window.clearTimeout(timer)
  }, [state.runId, success])
  useEffect(() => {
    if (success) playWin()
    else if (endedEarly) playClick()
    else playLose()
  }, [endedEarly, playClick, playLose, playWin, success])
  const handleDownloadReport = async () => {
    setReportError('')
    setExportingReport(true)
    try {
      await downloadMissionReport(state, language)
    } catch (error) {
      setReportError(error instanceof Error ? error.message : t.reportError)
    } finally {
      setExportingReport(false)
    }
  }
  return (
    <main className="mission-debrief flex min-h-screen items-center justify-center px-4 py-10 text-white" dir={isArabic ? 'rtl' : 'ltr'} lang={language}>
      <section className="mission-debrief-card w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/75 shadow-2xl">
        <div className={`relative overflow-hidden border-b border-white/10 p-8 sm:p-12 ${success ? 'bg-[#172019]' : endedEarly ? 'bg-[#201d14]' : 'bg-[#211717]'}`}>
          <p className="eyebrow"><Telescope size={13} /> {t.missionDebriefLabel}</p>
          <button
            type="button"
            onClick={toggleSound}
            className="absolute end-6 top-6 rounded-lg border border-white/10 bg-black/20 p-2 text-slate-200"
            aria-label={soundEnabled ? t.muteSound : t.unmuteSound}
            title={soundEnabled ? t.muteSound : t.unmuteSound}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <div className={`mission-result-emblem mt-7 text-6xl ${success ? 'mission-result-success' : 'mission-result-failure'}`} aria-hidden="true">{success ? '🌍' : endedEarly ? '🏁' : '🛟'}</div>
          <h1 className="mt-4 text-3xl font-black sm:text-5xl">{success ? t.resultWin : endedEarly ? t.resultEnded : t.resultLose}</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{state.lastMessage || (endedEarly ? t.endedMissionNote : '')}</p>
          <p className="mt-3 text-xs text-slate-500">{state.baseName} · {state.missionMode === 'education' ? t.educationSection : t.simulationSection} · {state.destination === 'moon' ? t.moon : t.mars} · {state.crewSize} {t.crewSize} · SEED {state.missionSeed.toString(16).padStart(8, '0')}</p>
          <div className="mt-4"><AchievementsPanel /></div>
        </div>
        <div className="p-6 sm:p-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label={t.daysSurvived} value={`${state.daysSurvived}/${getSurfaceOperationDayLimit(state.maxDays, state.destination)}`} icon="◷" />
            <Stat label={t.totalMissionDays} value={`${state.missionDaysElapsed}/${state.maxDays}`} icon="✈" />
            <Stat label={t.score} value={`${missionScore}/100`} icon="🏅" />
            <Stat label={t.science} value={new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(state.science)} icon="🔬" />
            <Stat label={t.successfulExpeditions} value={state.successfulExpeditions} icon="🛰️" />
          </div>
          <DidYouKnow className="mt-5" />
          <details className="mission-detail-disclosure mt-4">
            <summary>{t.missionDetailsLabel}<span>{t.lessonsProgress}: {state.lessonsCompleted.length}/6 · {t.rescues}: {state.totalRescues}</span></summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label={t.fatigue} value={`${Math.round(state.fatigue)}%`} icon="🪫" />
              <Stat label={t.morale} value={`${Math.round(state.morale)}%`} icon="🧑‍🚀" />
              <Stat label={t.radiationExposure} value={`${state.radiationExposure.toFixed(1)} mSv / ${ENVIRONMENT.gameRadiationWarningThresholdMsv} ${isArabic ? 'عتبة اللعبة' : 'game alert threshold'}`} icon="☢️" />
              <Stat label={isArabic ? 'تنبيه الإشعاع التدريبي' : 'Game radiation training alert'} value={state.permanentRadiationDamageWarning ? (isArabic ? 'مفعّل' : 'Triggered') : (isArabic ? 'لا' : 'No')} icon="⚠️" />
              <p className="col-span-2 text-[10px] leading-5 text-slate-500 sm:col-span-3">{isArabic ? 'عتبة اللعبة ليست حدًا طبيًا أو تشغيليًا للتعرض. راجع مصادر الإشعاع في NASA؛ لا تحدد هذه المحاكاة المخاطر الصحية.' : 'The game threshold is not a medical or operational exposure limit. See NASA radiation references; this simulator does not determine health risk.'}</p>
              <Stat label={t.rescues} value={state.totalRescues} icon="🛡️" />
              <Stat label={t.lessonsProgress} value={`${state.lessonsCompleted.length}/6`} icon="📚" />
            </div>
          </details>
          <div className="mt-4 rounded-2xl border border-violet-200/10 bg-violet-100/[0.035] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200/70">{t.missionTypeLabel}: {missionTypeTitle}</p>
                <h2 className="mt-1 text-sm font-bold">{t.missionObjective}: {objectiveTitle}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${objectiveComplete ? 'bg-emerald-300/10 text-emerald-200' : 'bg-amber-300/10 text-amber-200'}`}>
                {objectiveComplete ? t.objectiveComplete : t.objectiveIncomplete}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{Math.min(objectiveProgress, objectiveTarget)} / {objectiveTarget} · {t.scoreNote}</p>
          </div>
          <section className="mt-4 rounded-2xl border border-cyan-200/10 bg-cyan-100/[0.025] p-4" aria-labelledby="mission-tasks-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="mission-tasks-title" className="text-sm font-black text-cyan-50">
                {isArabic ? 'المهام المنجزة' : 'Mission task completion'}
              </h2>
              <span className="text-xs font-bold text-cyan-100">
                {isArabic ? 'إنجاز واجبات الرائد' : 'Astronaut duty'} · {astronautDuty.percent}%
              </span>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {astronautDuty.tasks.map((task) => (
                <li key={task.action} className="flex items-start gap-2 rounded-lg bg-slate-950/40 p-2.5 text-xs">
                  <span className={task.complete ? 'text-emerald-200' : 'text-slate-500'} aria-hidden="true">
                    {task.complete ? '✓' : '○'}
                  </span>
                  <span className="min-w-0 flex-1 text-slate-300">{task.label[language]}</span>
                  <strong className={task.complete ? 'text-emerald-200' : 'text-slate-500'}>
                    {task.complete ? (isArabic ? 'مكتمل' : 'Complete') : (isArabic ? 'غير مكتمل' : 'Incomplete')}
                  </strong>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-slate-400">
              {isArabic ? 'الرحلات الاستكشافية الناجحة' : 'Successful expeditions'}: {state.successfulExpeditions}
              {' · '}{isArabic ? 'أنشطة الاستكشاف المسجلة' : 'Exploration activities'}: {explorationActivities}
            </p>
          </section>
          <section className="mt-4 rounded-2xl border border-violet-200/15 bg-violet-100/[0.035] p-4" aria-labelledby="mission-replay-compare-title" aria-live="polite">
            <h2 id="mission-replay-compare-title" className="text-sm font-black text-violet-100">
              {isArabic ? 'أعد المهمة وقارن النتيجة' : 'Replay & compare'}
            </h2>
            {previousRun ? (
              <>
                <p className="mt-1 text-[10px] leading-5 text-slate-400">
                  {isArabic ? 'مقارنة بمحاولة سابقة بالإعداد والبذرة نفسيهما، محفوظة على هذا الجهاز.' : 'Compared with the previous run using the same setup and seed; stored on this device.'}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <CompareValue label={isArabic ? 'النتيجة' : 'Score'} previous={previousRun.score} current={missionScore} suffix="%" />
                  <CompareValue label={isArabic ? 'أيام المهمة' : 'Mission days'} previous={previousRun.daysSurvived} current={state.daysSurvived} />
                  <CompareValue label={isArabic ? 'مؤشر الإشعاع النموذجي' : 'Modeled radiation indicator'} previous={previousRun.radiationMsv} current={state.radiationExposure} suffix=" mSv" />
                  <CompareValue label={isArabic ? 'الطاقة المتبقية' : 'Energy remaining'} previous={previousRun.energy} current={state.resources.energy} />
                  {state.destination === 'mars' ? (
                    <CompareValue label={isArabic ? 'تأخير المهام المريخي المحاكى' : 'Modeled Mars task delay'} previous={previousRun.communicationDelayMinutes} current={getModeledMissionCommunicationDelay(state)} suffix=" min" />
                  ) : null}
                </div>
                <p className="mt-2 text-[10px] leading-5 text-slate-500">
                  {isArabic
                    ? `قرارات الأحداث (الأول/الثاني): ${previousRun.firstChoices}/${previousRun.alternateChoices} ← ${eventChoiceCounts[0]}/${eventChoiceCounts[1]}. تنبيهات NOAA (تأجيل/متابعة): ${previousRun.radiationAlertsDeferred}/${previousRun.radiationAlertsContinued} ← ${state.spaceWeatherResponses?.filter((response) => response.choice === 'defer').length || 0}/${state.spaceWeatherResponses?.filter((response) => response.choice === 'continue').length || 0}. قيم الإشعاع تقديرية وليست قياسًا طبيًا.`
                    : `Event choices (first/second): ${previousRun.firstChoices}/${previousRun.alternateChoices} → ${eventChoiceCounts[0]}/${eventChoiceCounts[1]}. NOAA alerts (defer/continue): ${previousRun.radiationAlertsDeferred}/${previousRun.radiationAlertsContinued} → ${state.spaceWeatherResponses?.filter((response) => response.choice === 'defer').length || 0}/${state.spaceWeatherResponses?.filter((response) => response.choice === 'continue').length || 0}. Radiation values are game estimates, not medical measurements.`}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[11px] leading-5 text-slate-400">
                {isArabic
                  ? `هذه أول نتيجة محفوظة لهذا الإعداد. أعد المهمة نفسها وغيّر قراراتك؛ ستقارن اللعبة النتيجة والأيام ومؤشر الإشعاع والموارد${state.destination === 'mars' ? ' وتأخير الاتصال المريخي المحاكى' : ''} في المحاولة التالية.`
                  : `This is the first saved result for this setup. Replay the same mission with different choices to compare score, days, the radiation indicator, resources${state.destination === 'mars' ? ', and modeled Mars communication delay' : ''} next time.`}
              </p>
            )}
            {comparisonError ? <p className="mt-2 text-[10px] text-rose-200" role="alert">{comparisonError}</p> : null}
          </section>
          {state.missionResult === 'evacuation' ? (
            <section className="mt-4 rounded-2xl border border-rose-200/15 bg-rose-100/[0.035] p-4">
              <h2 className="text-sm font-black text-rose-100">{t.failureCauseTitle}</h2>
              <p className="mt-2 text-xs leading-6 text-slate-300">{failureResource ? failureText(failureResource) : t.failureUnknown}</p>
              {failedEvent && failedEventChoice ? (
                <p className="mt-2 text-xs leading-6 text-slate-400">{t.failureEventSource}{failedEvent.title[language]} — {failedEventChoice.label[language]}</p>
              ) : state.failureCause?.source === 'transit' && state.failureCause.transitLeg && state.failureCause.transitChoice ? (
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  {t.failureTransitSource}{t[state.failureCause.transitLeg]} — {state.failureCause.transitChoice === 'conservative' ? t.transitConservative : t.transitEfficient}
                </p>
              ) : state.failureCause?.action ? (
                <p className="mt-2 text-xs leading-6 text-slate-400">{t.failureActionSource}{t[`action_${state.failureCause.action}`]}</p>
              ) : null}
              <h3 className="mt-3 text-xs font-bold text-emerald-100">{t.failurePreventionTitle}</h3>
              <p className="mt-1 text-xs leading-6 text-slate-400">{failureResource ? failureAdvice(failureResource) : t.failureGuide}</p>
            </section>
          ) : null}
          <section className="mt-4 rounded-2xl border border-cyan-200/10 bg-cyan-100/[0.025] p-4">
            <h2 className="text-sm font-black text-cyan-50">{t.behaviorTitle}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">{t.behaviorDescription}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['research', 'explore', 'maintenance', 'exercise', 'rest'] as const).map((action) => (
                <p key={action} className="rounded-lg bg-slate-950/40 p-2 text-xs text-slate-400">
                  {t[`action_${action}`]} <b className="float-end text-white">{actionCounts[action]}</b>
                </p>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              {actionHistory.length
                ? `${t.behaviorLeadingAction}: ${t[`action_${leadingAction}`]} · ${actionCounts[leadingAction]}/${actionHistory.length}`
                : t.behaviorNoActions}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
              <span>{t.behaviorEvents}: {state.eventHistory?.length || 0}</span>
              <span>{t.eventChoiceFirst}: {eventChoiceCounts[0]}</span>
              <span>{t.eventChoiceSecond}: {eventChoiceCounts[1]}</span>
              {state.crewSupportActionHistory?.length ? <span>{t.behaviorCrewSupportActions}: {state.crewSupportActionHistory.length}</span> : null}
            </div>
          </section>
          <Leaderboard state={state} language={language} />
          <details className="mission-detail-disclosure mt-6">
            <summary>{t.resourcesAndBaseDetailsLabel}<span>{t.leftover} · {state.buildings.length} {t.floor}</span></summary>
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <h2 className="text-sm font-bold">{t.leftover}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(['energy', 'oxygen', 'water', 'food', 'health'] as const).map((key) => (
                  <p key={key} className="rounded-lg bg-slate-950/40 p-2 text-xs text-slate-400">{RESOURCE_META[key].label[language]} <b className="float-end text-white">{formatResourceValue(key, state.resources[key], language)}</b></p>
                ))}
                <p className="rounded-lg bg-slate-950/40 p-2 text-xs text-slate-400">{t.credits} <b className="float-end text-white">{state.resources.credits}</b></p>
              </div>
              <h2 className="mt-4 text-sm font-bold">{t.buildings} · {state.buildings.length}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {state.buildings.map((id, index) => <span key={`${id}-${index}`} className="rounded-lg bg-slate-950/50 px-2.5 py-1.5 text-xs text-slate-300">{BUILDINGS[id]?.icon} {BUILDINGS[id]?.name[language] || id}</span>)}
              </div>
            </div>
          </details>
          {state.missionMode === 'simulation' && success && canUnlockNextExperience(missionScore, experienceMode, unlockedExperienceMode) && nextExperienceMode ? (
            <section className="mt-5 rounded-2xl border border-cyan-200/20 bg-cyan-100/[.035] p-4">
              <p className="mb-3 text-sm font-bold text-cyan-100">
                {isArabic ? `نتيجة ممتازة: ${missionScore}٪ · المستوى التالي في المحاكاة` : `Excellent result: ${missionScore}% · next simulation level`}
              </p>
              <ExperienceLevelCard mode={nextExperienceMode} language={language} />
              <button
                type="button"
                onClick={() => {
                  const unlockedMode = unlockNextExperience(missionScore)
                  if (unlockedMode !== nextExperienceMode || !setExperienceMode(nextExperienceMode)) return
                  newMission()
                  setMissionMode('simulation')
                  setObjective('survival')
                  setMissionLength(30)
                }}
                className="primary-button mt-4 w-full"
              >
                {isArabic
                  ? `ابدأ محاكاة جديدة · ${EXPERIENCE_PROFILES[nextExperienceMode].title.ar}`
                  : `Start a new simulation · ${EXPERIENCE_PROFILES[nextExperienceMode].title.en}`}
              </button>
            </section>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => { void handleDownloadReport() }} disabled={exportingReport} className="primary-button flex-1 disabled:cursor-wait disabled:opacity-60"><Download size={17} /> {t.report}</button>
            <button type="button" onClick={() => { playClick(); replayMission() }} className="secondary-button flex-1"><RotateCcw size={16} /> {t.replayScenario}</button>
            <button type="button" onClick={() => { playClick(); newMission() }} className="secondary-button flex-1"><RotateCcw size={16} /> {t.startOver}</button>
          </div>
          {success ? (
            <section className="mt-5 rounded-2xl border border-emerald-200/20 bg-emerald-200/[0.06] p-4">
              <p className="text-sm font-black text-emerald-100">
                {isArabic ? 'شكرًا لك على خدمتك في المهمة' : 'Thank you for your service'}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300">
                {isArabic
                  ? `ساهم ${state.astronautName.trim() || 'رائد الفضاء'} بصفته ${astronautDuty.duty.title}، وأتم ${astronautDuty.percent}% من واجباته اليومية.`
                  : `${state.astronautName.trim() || 'Astronaut'} served as ${astronautDuty.duty.title} and completed ${astronautDuty.percent}% of assigned daily duties.`}
              </p>
              <button type="button" onClick={() => setShowAppreciation(true)} className="secondary-button mt-3 !px-4 !py-2 text-xs">
                {isArabic ? 'عرض رسالة التقدير' : 'View appreciation'}
              </button>
            </section>
          ) : null}
          {reportError ? <p role="alert" className="mt-3 text-sm text-rose-300">{reportError}</p> : null}
        </div>
      </section>
      {showAppreciation ? (
        <div className="modal-backdrop mission-appreciation-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowAppreciation(false)
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mission-appreciation-title"
            className="modal-card mission-appreciation-card max-w-lg border border-emerald-200/20 text-center"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className="text-5xl" aria-hidden="true">🌍</div>
            <h2 id="mission-appreciation-title" className="mt-4 text-2xl font-black text-emerald-100">
              {isArabic ? 'شكرًا لك، رائد الفضاء' : 'Thank you, astronaut'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {isArabic
                ? `يا ${state.astronautName.trim() || 'رائد الفضاء'}، أسهم تفانيك بصفتك ${astronautDuty.duty.title} في إنجاز هذه المهمة بنجاح.`
                : `${state.astronautName.trim() || 'Astronaut'}, your dedication as ${astronautDuty.duty.title} helped bring this mission to a successful conclusion.`}
            </p>
            <div className="mt-5 rounded-xl border border-emerald-200/10 bg-emerald-100/[0.04] p-4">
              <p className="text-xs font-bold text-slate-300">
                {isArabic ? 'إنجاز الواجبات اليومية' : 'Daily duty completion'}
              </p>
              <p className="mt-1 text-3xl font-black text-emerald-200">{astronautDuty.percent}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={isArabic ? 'إنجاز الواجبات اليومية' : 'Daily duty completion'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={astronautDuty.percent}>
                <span className="block h-full w-full origin-left rounded-full bg-emerald-300 transition-transform duration-500" style={{ transform: `scaleX(${astronautDuty.percent / 100})`, transformOrigin: isArabic ? 'right' : 'left' }} />
              </div>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[.2em] text-cyan-200/80">Astra One · Mission Control</p>
            <button type="button" autoFocus onClick={() => setShowAppreciation(false)} className="primary-button mt-6 w-full">
              {isArabic ? 'متابعة' : 'Continue'}
            </button>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return <div className="mission-stat rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"><span className="text-xl">{icon}</span><p className="mt-2 text-lg font-black tabular-nums">{value}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{label}</p></div>
}

function CompareValue({ label, previous, current, suffix = '' }: { label: string; previous: number; current: number; suffix?: string }) {
  const format = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value)
  return (
    <article className="rounded-lg bg-slate-950/45 p-2">
      <p className="text-[9px] text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-bold text-slate-200" dir="ltr">
        {format(previous)}{suffix} <span className="text-violet-200">→</span> {format(current)}{suffix}
      </p>
    </article>
  )
}
