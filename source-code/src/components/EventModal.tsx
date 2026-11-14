import { AlertTriangle } from 'lucide-react'
import { canChooseEventOption, canControlEventChoice, EVENTS, getEventChoiceRequiredSpecialization } from '../game/events'
import { getAccessDeniedMessage, getMissionSpecialization, localizeCrewRole } from '../game/crewRosters'
import ar from '../i18n/ar'
import en from '../i18n/en'
import { useGameStore } from '../store/gameStore'
import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useSound } from '../hooks/useSound'
import { getAvailableCrewRoles, recommendEventResponse } from '../game/teamwork'
import type { EventChoice } from '../game/events'
import { getEnergyCapacity, getMarsCommunicationDelayMinutes, isCrewMemberAvailable, RESOURCE_CAP, type GameState } from '../game/model'
import { formatResourceValue, RESOURCE_META } from '../game/resources'
import { getMissionCrewAssignments } from '../game/teamwork'

const EVENT_EFFECT_RESOURCES = ['energy', 'oxygen', 'water', 'food', 'health', 'credits'] as const

interface ResolvedEvent {
  id: string
  title: string
  choice: string
  changes: string[]
  radiationExposure: number
  communicationDelayMinutes: number | null
}

function describeChoiceEffects(
  choice: EventChoice,
  state: GameState,
  language: 'ar' | 'en',
  translations: typeof en,
): string[] {
  return EVENT_EFFECT_RESOURCES.flatMap((resource) => {
    const delta = choice.effects[resource]
    if (delta === undefined) return []
    const current = state.resources[resource]
    const cap = resource === 'energy'
      ? getEnergyCapacity(state)
      : resource === 'credits'
        ? Number.MAX_SAFE_INTEGER
        : RESOURCE_CAP
    const resultingBalance = Math.round(Math.max(0, Math.min(cap, current + delta)) * 100) / 100
    const appliedDelta = resultingBalance - current
    const amount = resource === 'credits'
      ? `${new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(Math.abs(appliedDelta))} ${translations.creditsUnit}`
      : formatResourceValue(resource, Math.abs(appliedDelta), language)
    const signedAmount = appliedDelta > 0 ? `+${amount}` : appliedDelta < 0 ? `-${amount}` : amount
    const label = resource === 'credits'
      ? translations.credits
      : `${RESOURCE_META[resource].icon} ${RESOURCE_META[resource].label[language]}`
    return [`${label}: ${signedAmount}`]
  })
}

export function EventModal() {
  const activeEvent = useGameStore((state) => state.activeEvent)
  const resolveEvent = useGameStore((state) => state.resolveEvent)
  const setControlledDuty = useGameStore((state) => state.setControlledDuty)
  const language = useSettingsStore((state) => state.language)
  const t = language === 'ar' ? ar : en
  const { playEvent, playSuccess, playError } = useSound()
  const [announcedEventId, setAnnouncedEventId] = useState<string | null>(null)
  const [resolvedEvent, setResolvedEvent] = useState<ResolvedEvent | null>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const event = EVENTS.find((item) => item.id === activeEvent?.id)
  const gameState = useGameStore((store) => store)
  useEffect(() => {
    if (activeEvent?.id && announcedEventId !== activeEvent.id) {
      playEvent()
      setAnnouncedEventId(activeEvent.id)
    }
  }, [activeEvent?.id, announcedEventId, playEvent])
  useEffect(() => {
    if (activeEvent?.id) setResolvedEvent(null)
  }, [activeEvent?.id])
  useEffect(() => {
    if (!activeEvent?.id) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const getFocusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ) ?? [])
    getFocusable()[0]?.focus()
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key !== 'Tab') return
      const focusable = getFocusable()
      if (!focusable.length) {
        keyboardEvent.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault()
        last.focus()
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [activeEvent?.id])
  if (!event) {
    if (!resolvedEvent) return null
    return (
      <div className="modal-backdrop event-incident-backdrop" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <section role="dialog" aria-modal="true" aria-labelledby="event-debrief-title" className="modal-card event-modal-card">
          <p className="eyebrow">{language === 'ar' ? 'ماذا تعلمنا من القرار؟' : 'DECISION DEBRIEF'}</p>
          <h2 id="event-debrief-title" className="mt-2 text-xl font-black text-white">{resolvedEvent.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {language === 'ar' ? 'اخترت:' : 'Your choice:'} {resolvedEvent.choice}
          </p>
          <div className="mt-3 rounded-xl border border-cyan-200/10 bg-cyan-100/[0.025] p-3">
            <h3 className="text-xs font-black text-cyan-100">{language === 'ar' ? 'النتيجة المسجلة في المحاكاة' : 'RECORDED GAME-MODEL OUTCOME'}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-300">
              {resolvedEvent.changes.length
                ? resolvedEvent.changes.join(' · ')
                : language === 'ar' ? 'لم يتغير مورد فورًا؛ راقب الأثر التشغيلي في سجل اليوم.' : 'No immediate resource changed; check the day log for the operational effect.'}
            </p>
            {resolvedEvent.id === 'solar-storm' ? (
              <p className="mt-2 text-[10px] leading-5 text-slate-400">
                {language === 'ar'
                  ? `مؤشر التعرض التراكمي في نموذج اللعبة: ${resolvedEvent.radiationExposure.toFixed(1)} mSv. هذا ليس قياسًا محليًا أو تقديرًا طبيًا.`
                  : `Cumulative game-model radiation indicator: ${resolvedEvent.radiationExposure.toFixed(1)} mSv. This is not a local measurement or medical estimate.`}
              </p>
            ) : null}
          </div>
          {resolvedEvent.id === 'solar-storm' ? (
            <section className="mt-3 rounded-xl border border-amber-200/10 bg-amber-100/[0.025] p-3">
              <h3 className="text-xs font-black text-amber-100">{language === 'ar' ? 'الحقيقة العلمية' : 'SCIENCE BEHIND THE EVENT'}</h3>
              <p className="mt-2 text-[11px] leading-5 text-slate-300">
                {language === 'ar'
                  ? 'تختلف أحداث الجسيمات الشمسية عن الإشعاع الكوني المستمر. يقيس NOAA البروتونات قرب الأرض؛ لا يحوّل هذا القياس إلى جرعة عند القمر أو المريخ، وهذا الحدث العشوائي ليس ناتجًا عنه. أثر العاصفة والملجأ هنا مبسط داخل اللعبة فقط.'
                  : 'Solar-particle events differ from the continuing galactic-cosmic-ray background. NOAA measures protons near Earth; that reading is not a dose at the Moon or Mars, and this random game event is not triggered by it. Storm and shelter effects here are simplified game rules only.'}
              </p>
              <a className="mt-2 inline-block text-[10px] text-sky-200 underline" href="https://www.nasa.gov/directorates/esdmd/hhp/space-radiation/" target="_blank" rel="noreferrer">
                {language === 'ar' ? 'مرجع NASA عن الإشعاع الفضائي' : 'NASA space-radiation reference'}
              </a>
            </section>
          ) : resolvedEvent.id === 'comms-blackout' ? (
            <section className="mt-3 rounded-xl border border-sky-200/10 bg-sky-100/[0.025] p-3">
              <h3 className="text-xs font-black text-sky-100">{language === 'ar' ? 'الحقيقة العلمية' : 'SCIENCE BEHIND THE EVENT'}</h3>
              <p className="mt-2 text-[11px] leading-5 text-slate-300">
                {language === 'ar'
                  ? resolvedEvent.communicationDelayMinutes === null
                    ? 'تستغرق الإشارة بين الأرض والقمر ثواني، بينما تتأخر اتصالات المريخ دقائق بحسب المسافة. أثناء الانقطاع لا يستطيع الطاقم انتظار رد فوري؛ يتبع إجراءات المركبة. زمن اللعبة للمريخ تقدير تدريبي باتجاه واحد، لا قياس حي.'
                    : `تستغرق الإشارة بين الأرض والمريخ دقائق بحسب المسافة. التأخير التدريبي الحالي ${resolvedEvent.communicationDelayMinutes} دقيقة باتجاه واحد؛ وقد يلزم وقت إضافي لعودة الرد. على الطاقم اتباع إجراءات المركبة، وهذا ليس قياسًا حيًا.`
                  : resolvedEvent.communicationDelayMinutes === null
                    ? 'Signals between Earth and the Moon take seconds, while Mars links take minutes depending on distance. During an outage, the crew cannot wait for an immediate Earth reply and must use onboard procedures. The game’s Mars delay is an illustrative one-way value, not a live measurement.'
                    : `Earth–Mars signals take minutes depending on distance. The current training estimate is ${resolvedEvent.communicationDelayMinutes} minutes one way; a reply takes additional time to return. Crews use onboard procedures. This is not a live measurement.`}
              </p>
            </section>
          ) : (
            <p className="mt-3 text-[11px] leading-5 text-slate-400">
              {language === 'ar'
                ? 'توضح آثار الخيارات موارد النموذج التي تغيرت. راجع تقرير اليوم لمقارنة القرار بما حدث لاحقًا؛ القيم محاكاة تعليمية.'
                : 'The listed effects show which modeled resources changed. Review the daily report to compare this choice with what happened next; values are educational simulation outputs.'}
            </p>
          )}
          <button type="button" className="primary-button mt-5 w-full" onClick={() => setResolvedEvent(null)}>
            {language === 'ar' ? 'متابعة المهمة' : 'Continue mission'}
          </button>
        </section>
      </div>
    )
  }
  const teamRecommendation = recommendEventResponse(gameState, event)
  const requiredSpecialization = getEventChoiceRequiredSpecialization(event.id)
  const canCurrentCrewHandle = !requiredSpecialization || canControlEventChoice(gameState, event.id)
  const qualifiedAvailableDuties = requiredSpecialization
    ? getMissionCrewAssignments(
        gameState.crewSize,
        gameState.destination,
        gameState.maxDays,
        gameState.crewSpecialtyOverrides,
      ).filter((duty) =>
        getMissionSpecialization(duty.specialty) === requiredSpecialization &&
        isCrewMemberAvailable(gameState, duty.id),
      )
    : []
  const commandFallbackAvailable = qualifiedAvailableDuties.length === 0
  const availableHandoffDuties = commandFallbackAvailable
    ? getMissionCrewAssignments(
        gameState.crewSize,
        gameState.destination,
        gameState.maxDays,
        gameState.crewSpecialtyOverrides,
      ).filter((duty) =>
        getMissionSpecialization(duty.specialty) === 'command' &&
        isCrewMemberAvailable(gameState, duty.id),
      )
    : qualifiedAvailableDuties
  const handleChoice = (choiceIndex: number) => {
    const before = useGameStore.getState()
    resolveEvent(choiceIndex)
    const next = useGameStore.getState()
    if (next.eventHistory.length > before.eventHistory.length) {
      const selectedChoice = event.choices[choiceIndex]
      const changes = EVENT_EFFECT_RESOURCES.flatMap((resource) => {
        const delta = next.resources[resource] - before.resources[resource]
        if (delta === 0) return []
        const value = resource === 'credits'
          ? `${new Intl.NumberFormat(language, { maximumFractionDigits: 0 }).format(Math.abs(delta))} ${t.creditsUnit}`
          : formatResourceValue(resource, Math.abs(delta), language)
        const label = resource === 'credits'
          ? t.credits
          : `${RESOURCE_META[resource].icon} ${RESOURCE_META[resource].label[language]}`
        return [`${label}: ${delta > 0 ? '+' : '-'}${value}`]
      })
      setResolvedEvent({
        id: event.id,
        title: event.title[language],
        choice: selectedChoice.label[language],
        changes,
        radiationExposure: next.radiationExposure,
        communicationDelayMinutes: next.destination === 'mars'
          ? getMarsCommunicationDelayMinutes(next.missionSeed, next.day, 'research')
          : null,
      })
    }
    if (next.isGameOver) playError()
    else playSuccess()
    setAnnouncedEventId(null)
  }
  return (
    <div className={`modal-backdrop event-incident-backdrop event-incident-${event.id}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="event-title" aria-describedby="event-description" className="modal-card event-modal-card">
        <div className="mb-5 flex items-start gap-4">
          <div className="event-modal-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-100/[0.06] text-2xl">{event.icon}</div>
          <div>
            <p className="eyebrow"><AlertTriangle size={12} className="text-amber-300" /> {t.event}</p>
            <h2 id="event-title" className="mt-2 text-2xl font-black text-white">{event.title[language]}</h2>
            <p id="event-description" className="mt-2 text-sm leading-7 text-slate-400">{event.description[language]}</p>
            {activeEvent?.id === 'solar-storm' &&
            useGameStore.getState().buildings.includes('storm-shelter') &&
            !(useGameStore.getState().offlineBuildings || []).includes('storm-shelter') ? (
              <p className="mt-2 text-xs font-bold text-emerald-200">🛡️ {t.shelterSafe}</p>
            ) : null}
          </div>
        </div>
        {teamRecommendation.recommendedIndex === null ? null : (
          <section className="mb-5 rounded-xl border border-cyan-200/10 bg-cyan-100/[0.025] p-3">
            <h3 className="text-xs font-black text-cyan-50">{t.teamEventHeader}</h3>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">{t.teamEventNote}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {getAvailableCrewRoles(gameState.crewSize, gameState.destination, gameState.maxDays).map((role) => (
                <article key={role.id} className="rounded-lg border border-white/[0.06] bg-slate-950/40 p-2">
                  <p className="text-[11px] font-bold text-slate-200">{role.icon} {t[role.title]}</p>
                  <p className="mt-1 text-[10px] leading-5 text-slate-500">{t[role.focus]}</p>
                  <p className="mt-1 text-[10px] leading-5 text-cyan-100/80">
                    {t.teamEventVote}: {event.choices[teamRecommendation.votes[role.id]]?.label[language]}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-bold text-emerald-100">
              {t.teamEventRecommendation}: {event.choices[teamRecommendation.recommendedIndex]?.label[language]}
            </p>
          </section>
        )}
        {requiredSpecialization && !canCurrentCrewHandle && availableHandoffDuties.length > 0 ? (
          <section className="mb-5 rounded-xl border border-amber-200/15 bg-amber-100/[0.03] p-3" role="group" aria-label={t.eventHandoffHeading}>
            <h3 className="text-xs font-black text-amber-50">{t.eventHandoffHeading}</h3>
            <p className="mt-1 text-[10px] leading-5 text-slate-400">
              {commandFallbackAvailable ? t.eventHandoffFallbackDescription : t.eventHandoffDescription}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableHandoffDuties.map((duty) => (
                <button
                  key={duty.id}
                  type="button"
                  className="rounded-lg border border-amber-200/20 bg-amber-100/[0.05] px-3 py-2 text-xs font-bold text-amber-50 transition hover:bg-amber-100/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-200"
                  onClick={() => setControlledDuty(duty.id)}
                >
                  {commandFallbackAvailable ? t.eventHandoffOverride : t.eventHandoffSelect} {localizeCrewRole(duty.title, language)}
                </button>
              ))}
            </div>
          </section>
        ) : null}
        <p className="mb-3 text-xs font-bold text-slate-400">{t.choose}</p>
        <div className="grid gap-2">
          {event.choices.map((choice, index) => {
            const requirementMissing = !canChooseEventOption(gameState, choice, event.id)
            const accessDenied = Boolean(requiredSpecialization && !canControlEventChoice(gameState, event.id))
            const effectDescriptions = describeChoiceEffects(choice, gameState, language, t)
            return (
            <button key={choice.label.en} type="button" onClick={() => handleChoice(index)} disabled={requirementMissing} title={requirementMissing ? accessDenied && requiredSpecialization ? getAccessDeniedMessage(requiredSpecialization, language) : t.stormShelterRequired : undefined} className={`rounded-xl border p-3 text-start text-sm font-semibold text-slate-200 transition hover:border-sky-200/25 hover:bg-sky-100/[0.06] disabled:cursor-not-allowed disabled:opacity-40 ${index === teamRecommendation.recommendedIndex ? 'border-emerald-200/35 bg-emerald-100/[0.035]' : 'border-white/[0.08] bg-white/[0.035]'}`}>
              <span className="me-2 text-sky-200">{index === 0 ? '01' : '02'}</span>{choice.label[language]}
              {index === teamRecommendation.recommendedIndex ? <span className="ms-2 text-[10px] text-emerald-100">· {t.teamEventRecommendation}</span> : null}
              {accessDenied && requiredSpecialization ? <span className="mt-2 block text-[10px] font-bold text-rose-200">{getAccessDeniedMessage(requiredSpecialization, language)}</span> : null}
              <span className="mt-2 block text-[10px] font-medium leading-5 text-slate-400">
                <span className="font-bold text-slate-300">{t.eventEffectsLabel}</span>{' '}
                {effectDescriptions.length ? effectDescriptions.join(' · ') : t.noImmediateResourceChange}
                {choice.rescues ? ` · +${choice.rescues} ${t.eventRescueEffect}` : ''}
                {choice.ongoingLeak ? ` · ${t.eventLeakContinues}` : ''}
              </span>
            </button>
          )})}
        </div>
      </section>
    </div>
  )
}
