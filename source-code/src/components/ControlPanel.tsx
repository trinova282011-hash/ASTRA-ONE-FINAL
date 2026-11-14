import { Dumbbell, FlaskConical, Hammer, MoveUpRight, ShieldCheck } from 'lucide-react'
import { canScheduleActivity, getActivityDurationHours, getCompletedWorkShifts, getExplorationRiskBreakdown, getMarsCommunicationDelayMinutes, getRoleIneligibleMessage, isCrewMemberAvailable, type Action, type GameState } from '../game/model'
import { getAllowedSpecialistActions } from '../game/teamwork'
import ar from '../i18n/ar'
import en from '../i18n/en'
import { useSettingsStore } from '../store/settingsStore'

type ActionCopyKey = 'research' | 'researchDesc' | 'explore' | 'exploreDesc' | 'maintenance' | 'maintenanceDesc' | 'exercise' | 'exerciseDesc' | 'rest' | 'restDesc'

const actions: { id: Action; icon: typeof FlaskConical; title: ActionCopyKey; description: ActionCopyKey; tone: string }[] = [
  { id: 'research', icon: FlaskConical, title: 'research', description: 'researchDesc', tone: 'action-sky' },
  { id: 'explore', icon: MoveUpRight, title: 'explore', description: 'exploreDesc', tone: 'action-amber' },
  { id: 'maintenance', icon: Hammer, title: 'maintenance', description: 'maintenanceDesc', tone: 'action-violet' },
  { id: 'exercise', icon: Dumbbell, title: 'exercise', description: 'exerciseDesc', tone: 'action-sky' },
  { id: 'rest', icon: ShieldCheck, title: 'rest', description: 'restDesc', tone: 'action-emerald' },
]

export function ControlPanel({ state, disabled, onAction }: { state: GameState; disabled: boolean; onAction: (action: Action) => void }) {
  const language = useSettingsStore((state) => state.language)
  const t = language === 'ar' ? ar : en
  const isArabic = language === 'ar'
  const remainingHours = Math.max(0, 22 - state.hour)
  const allowedActions = getAllowedSpecialistActions(state)
  const explorationRisk = getExplorationRiskBreakdown(state)
  const explorationRiskPercent = Math.round(explorationRisk.total * 100)
  const explorationSuccessPercent = 100 - explorationRiskPercent
  const explorationDeferred = state.spaceWeatherDeferredDay === state.day
  const delayedActions: readonly Action[] = ['research', 'explore', 'maintenance']
  const explorationRiskFactors = [
    { key: 'environmental', value: explorationRisk.environmental },
    { key: 'fatigue', value: explorationRisk.fatigue },
    { key: 'health', value: explorationRisk.health },
    { key: 'morale', value: explorationRisk.morale },
    { key: 'cognitive', value: explorationRisk.cognitive },
    { key: 'difficulty', value: explorationRisk.difficulty },
    { key: 'dustStorm', value: explorationRisk.dustStorm },
  ] as const
  const visibleExplorationRiskFactors = explorationRiskFactors
    .filter(({ key }) => key !== 'dustStorm' || explorationRisk.dustStorm > 0)
  const riskFactorLabels = isArabic
    ? { environmental: 'البيئة والوجهة', fatigue: 'الإرهاق', health: 'الصحة', morale: 'المعنويات', cognitive: 'التركيز والظروف الداخلية', difficulty: 'الصعوبة', dustStorm: 'عاصفة الغبار' }
    : { environmental: 'Environment & destination', fatigue: 'Fatigue', health: 'Health', morale: 'Morale', cognitive: 'Focus & cabin conditions', difficulty: 'Difficulty', dustStorm: 'Dust storm' }
  return (
    <section className="glass-panel p-4 sm:p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> {t.chooseStrategyLabel}</p>
          <h2 className="mt-2 text-lg font-black text-white">{t.control}</h2>
        </div>
        <span className="rounded-lg border border-white/[0.08] px-2 py-1 text-[10px] tabular-nums text-slate-400">
          {remainingHours} {t.hoursLeftInShift}
        </span>
      </div>
      <p className="mb-3 text-[10px] font-semibold text-cyan-100/75" aria-live="polite">
        {isArabic ? 'خطة اليوم' : "TODAY'S PLAN"}: {getCompletedWorkShifts(state.todayActions)}/2 {t.dailyWorkRequirement}
        {' · '}
        {state.todayActions.includes('exercise')
          ? isArabic ? '✓ التمرين مكتمل' : '✓ Exercise complete'
          : isArabic ? 'التمرين اليومي مطلوب' : 'Daily exercise still needed'}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map(({ id, icon: Icon, title, description, tone }) => {
          const roleMessage = !allowedActions.includes(id)
            ? getRoleIneligibleMessage(state, id, language)
            : ''
          const unavailableMessage = !roleMessage && state.controlledDutyId && !isCrewMemberAvailable(state, state.controlledDutyId)
            ? isArabic ? 'فرد الطاقم غير متاح؛ أدرج الراحة والتعافي أولاً.' : 'Crew member unavailable: schedule rest and recovery first.'
            : ''
          const restrictionMessage = id === 'explore' && explorationDeferred
            ? isArabic ? 'أُجّل الاستكشاف لهذا اليوم بقرار الطقس الفضائي.' : 'Exploration is deferred for this mission day by the space-weather decision.'
            : roleMessage || unavailableMessage
          const restrictionId = `crew-action-${id}-restriction`
          return (
            <div key={id} className="min-w-0">
              <button
                type="button"
                onClick={() => onAction(id)}
                disabled={disabled || !allowedActions.includes(id) || !canScheduleActivity(state, id)}
                aria-describedby={restrictionMessage ? restrictionId : undefined}
                className={`decision-card ${tone} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07]"><Icon size={17} /></span>
                <span className="min-w-0 text-start">
                  <span className="block text-sm font-bold text-slate-100">{t[title]}</span>
                  <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{t[description]}</span>
                  {id === 'explore' ? (
                    <span className={`mt-1 block text-[10px] font-semibold ${explorationRiskPercent >= 55 ? 'text-amber-200' : 'text-cyan-100/75'}`}>
                      {isArabic
                        ? `فرصة النجاح المقدّرة في اللعبة: ${explorationSuccessPercent}٪ · احتمال التعثر: ${explorationRiskPercent}٪`
                        : `Game-model success chance: ${explorationSuccessPercent}% · setback chance: ${explorationRiskPercent}%`}
                    </span>
                  ) : null}
                  <span className="mt-1 block text-[10px] text-cyan-100/60">
                    {isArabic ? 'المدة الإجمالية المقدرة' : 'Estimated total duration'}: {getActivityDurationHours(state, id).toFixed(2)} {t.hoursShort}
                    {state.destination === 'mars' && delayedActions.includes(id) ? (
                      <span className="block text-amber-100/80">
                        {isArabic
                          ? `تشمل تأخير إشارة محاكى باتجاه واحد: ${getMarsCommunicationDelayMinutes(state.missionSeed, state.day, id)} دقيقة`
                          : `Includes modeled one-way signal delay: ${getMarsCommunicationDelayMinutes(state.missionSeed, state.day, id)} min`}
                      </span>
                    ) : null}
                  </span>
                  {restrictionMessage ? <span id={restrictionId} className="mt-1 block text-[9px] leading-relaxed text-rose-200">{restrictionMessage}</span> : null}
                </span>
              </button>
              {id === 'explore' ? (
                <details className="mt-1 ps-3 text-[9px] text-slate-400">
                  <summary className="w-fit cursor-pointer text-cyan-100/70 hover:text-cyan-50">
                    {isArabic ? 'كيف حُسب التقدير؟' : 'How is this estimated?'}
                  </summary>
                  <ul className="mt-1 grid gap-1">
                    {visibleExplorationRiskFactors.map(({ key, value }) => (
                      <li key={key} className="flex justify-between gap-3">
                        <span>{riskFactorLabels[key]}</span>
                        <b className="tabular-nums text-slate-300">{value >= 0 ? '+' : ''}{(value * 100).toFixed(1)} {isArabic ? 'نقطة' : 'pts'}</b>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 leading-relaxed text-slate-500">
                    {isArabic
                      ? 'معاملات تدريبية داخل اللعبة وليست تنبؤًا ميدانيًا أو تقديرًا طبيًا.'
                      : 'Training-only game modifiers; not a field forecast or medical estimate.'}
                  </p>
                </details>
              ) : null}
            </div>
          )
        })}
      </div>
      {state.destination === 'mars' ? (
        <p className="mt-3 rounded-lg border border-sky-200/10 bg-sky-100/[0.025] px-3 py-2 text-[10px] leading-5 text-slate-400">
          {isArabic
            ? 'على المريخ لا يصل الرد الأرضي فورًا. يضيف نموذج اللعبة تأخير إشارة واحدًا للبحث والاستكشاف والصيانة؛ هذه مدة تدريبية وليست محاكاة اتصال فعلية أو توقعًا للمهمة.'
            : 'Mars crews cannot get an immediate Earth reply. The game adds one modeled signal delay to research, exploration, and maintenance; this is a training duration, not a live communications simulation or mission forecast.'}
        </p>
      ) : null}
    </section>
  )
}
