import { AlertTriangle, Radio } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { GameState } from '../game/model'
import type { ExperienceMode } from '../utils/experienceLevels'
import { NOAA_SOLAR_PROTON_SOURCE, loadNoaaSolarProtonSnapshot, type NoaaSolarProtonSnapshot } from '../game/spaceWeather'
import { useGameStore } from '../store/gameStore'

type LoadState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; snapshot: NoaaSolarProtonSnapshot }

const scaleNames = {
  en: { 1: 'Minor', 2: 'Moderate', 3: 'Strong', 4: 'Severe', 5: 'Extreme' },
  ar: { 1: 'طفيف', 2: 'متوسط', 3: 'قوي', 4: 'شديد', 5: 'شديد جدًا' },
}

export function SpaceWeatherWatch({
  state,
  language,
  experienceMode,
}: {
  state: GameState
  language: 'ar' | 'en'
  experienceMode: ExperienceMode
}) {
  const respondToAlert = useGameStore((store) => store.respondToSpaceWeatherAlert)
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [decisionError, setDecisionError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let active = true
    setLoadState({ status: 'loading' })
    const refresh = () => {
      loadNoaaSolarProtonSnapshot()
        .then((snapshot) => {
          if (active) setLoadState({ status: 'ready', snapshot })
        })
        .catch((error: unknown) => {
          console.error('Could not load NOAA solar proton data.', error)
          if (active) {
            setLoadState((current) => current.status === 'ready' ? current : { status: 'unavailable' })
          }
        })
    }
    refresh()
    const refreshInterval = window.setInterval(refresh, 5 * 60 * 1000)
    return () => {
      active = false
      window.clearInterval(refreshInterval)
    }
  }, [state.runId])

  useEffect(() => {
    const freshnessInterval = window.setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => window.clearInterval(freshnessInterval)
  }, [])

  const copy = (english: string, arabic: string) => language === 'ar' ? arabic : english
  const isExplorer = experienceMode === 'explorer'
  if (loadState.status === 'loading') {
    return (
      <section className="mx-3 mt-3 rounded-xl border border-white/10 bg-slate-950/50 p-3 text-xs text-slate-400 sm:mx-5" role="status" aria-live="polite">
        <Radio size={14} className="me-2 inline" aria-hidden="true" />
        {copy('Checking the live NOAA GOES proton signal…', 'جارٍ التحقق من إشارة بروتونات NOAA GOES الحية…')}
      </section>
    )
  }

  if (loadState.status === 'unavailable') {
    return (
      <section className="mx-3 mt-3 rounded-xl border border-amber-200/20 bg-amber-950/30 p-3 text-xs text-amber-100 sm:mx-5" role="status">
        <AlertTriangle size={14} className="me-2 inline" aria-hidden="true" />
        {copy('Live NOAA data is unavailable; no live space-weather gameplay effect was applied.', 'بيانات NOAA الحية غير متاحة؛ لم يُطبّق أي تأثير لعب مباشر للطقس الفضائي.')}
      </section>
    )
  }

  const { snapshot } = loadState
  const age = now - Date.parse(snapshot.observedAt)
  const isFresh = snapshot.freshness === 'fresh' &&
    age >= 0 &&
    age <= NOAA_SOLAR_PROTON_SOURCE.maximumAgeMinutes * 60 * 1000
  const hasTrainingAlert = isFresh && snapshot.scale !== null && snapshot.scale >= 2
  const canDefer = state.missionPhase === 'surface' &&
    !state.activeEvent &&
    !state.todayActions.includes('explore') &&
    state.spaceWeatherDeferredDay !== state.day
  const scaleLabel = snapshot.scale === null
    ? copy('Below S1 threshold', 'دون عتبة S1')
    : `S${snapshot.scale} · ${scaleNames[language][snapshot.scale]}`
  const timestamp = new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(snapshot.observedAt))
  const flux = new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(snapshot.fluxPfu)
  const decisionAlreadyHandled = state.spaceWeatherAlertHandled
  const deferredToday = state.spaceWeatherDeferredDay === state.day

  return (
    <section
      className={`mx-3 mt-3 rounded-xl border p-3 sm:mx-5 sm:p-4 ${
        hasTrainingAlert ? 'border-amber-200/30 bg-amber-950/35' : 'border-cyan-200/15 bg-slate-950/50'
      }`}
      aria-labelledby="space-weather-watch-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="space-weather-watch-title" className="flex items-center gap-2 text-xs font-black text-slate-100">
            {hasTrainingAlert ? <AlertTriangle size={15} className="shrink-0 text-amber-200" aria-hidden="true" /> : <Radio size={15} className="shrink-0 text-cyan-200" aria-hidden="true" />}
            {copy('Live space-weather watch', 'متابعة الطقس الفضائي الحي')}
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-300">
            {isExplorer
              ? copy(`A NOAA satellite near Earth reports a space-weather level: ${scaleLabel}.`, `يرصد قمر NOAA قرب الأرض مستوى الطقس الفضائي: ${scaleLabel}.`)
              : `NOAA GOES · ${scaleLabel} · ${flux} pfu · ${timestamp} UTC · ${copy('satellite', 'القمر')} ${snapshot.satellite}`}
            {!isFresh
              ? ` · ${copy('stale — no gameplay effect', 'بيانات قديمة — بلا تأثير على اللعب')}`
              : ''}
          </p>
          <p className="mt-1 text-[10px] leading-5 text-slate-400">
            {isExplorer
              ? copy(
                'This is a clue measured near Earth, not a radiation dose at our base. It does not change the crew’s health in the game.',
                'هذه إشارة مقاسة قرب الأرض، وليست جرعة إشعاع عند قاعدتنا. ولا تغيّر صحة الطاقم في اللعبة.',
              )
              : copy(
                'NOAA proton flux is measured near Earth, not at the Moon/Mars base. The fresh S2+ threshold opens a training choice only; it never changes modeled mSv or health.',
                'يقيس NOAA تدفق البروتونات قرب الأرض، لا عند قاعدة القمر أو المريخ. يفتح تجاوز S2+ الحديث قرارًا تدريبيًا فقط، ولا يغيّر جرعة mSv النموذجية أو الصحة.',
              )}
          </p>
          {decisionError ? <p className="mt-2 text-[10px] text-rose-200" role="alert">{decisionError}</p> : null}
          {hasTrainingAlert && !decisionAlreadyHandled && state.missionPhase !== 'surface' ? (
            <p className="mt-2 text-[10px] text-amber-100">
              {copy('The signal is informational during transit; no surface exploration decision is available.', 'الإشارة للمعلومات أثناء العبور؛ لا يتاح قرار استكشاف سطحي الآن.')}
            </p>
          ) : null}
          {hasTrainingAlert && !decisionAlreadyHandled && state.activeEvent ? (
            <p className="mt-2 text-[10px] text-amber-100">
              {copy('Resolve the active mission event before responding to this watch.', 'حلّ حدث المهمة النشط قبل الاستجابة لهذا التنبيه.')}
            </p>
          ) : null}
          {hasTrainingAlert && !decisionAlreadyHandled && state.todayActions.includes('explore') ? (
            <p className="mt-2 text-[10px] text-amber-100">
              {copy('Exploration is already scheduled today, so it cannot be deferred by this alert.', 'الاستكشاف مجدول بالفعل اليوم، لذلك لا يمكن تأجيله بهذا التنبيه.')}
            </p>
          ) : null}
          {deferredToday ? (
            <p className="mt-2 text-[10px] font-bold text-amber-100">
              {copy('You deferred exploration: its science opportunity is unavailable for the rest of this mission day. No dose or health value was changed.', 'أجّلت الاستكشاف؛ لن تتاح فرصته العلمية لبقية يوم المهمة. لم تتغير الجرعة أو الصحة.')}
            </p>
          ) : decisionAlreadyHandled ? (
            <p className="mt-2 text-[10px] text-slate-400">
              {copy('You chose to continue: exploration remains available. This choice does not assert local safety and does not change modeled dose or health.', 'اخترت المتابعة؛ يظل الاستكشاف متاحًا. لا يعني ذلك تأكيد الأمان محليًا ولا يغيّر الجرعة النموذجية أو الصحة.')}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasTrainingAlert && !decisionAlreadyHandled && state.missionPhase === 'surface' && !state.activeEvent ? (
            <>
              <button
                type="button"
                className="secondary-button !px-3 !py-2 text-[10px] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!canDefer}
                onClick={() => {
                  setDecisionError('')
                  try {
                    if (!respondToAlert(true, snapshot.scale || 1, snapshot.observedAt)) {
                      setDecisionError(copy('The deferral could not be saved for this mission day.', 'تعذر حفظ تأجيل الاستكشاف لهذا اليوم من المهمة.'))
                    }
                  } catch (error) {
                    console.error('Could not save the space-weather response.', error)
                    setDecisionError(copy('The response could not be saved.', 'تعذر حفظ الاستجابة.'))
                  }
                }}
              >
                {copy('Defer exploration · lose today’s opportunity', 'أجّل الاستكشاف · تفقد فرصة اليوم')}
              </button>
              <button
                type="button"
                className="secondary-button !px-3 !py-2 text-[10px]"
                onClick={() => {
                  setDecisionError('')
                  try {
                    if (!respondToAlert(false, snapshot.scale || 1, snapshot.observedAt)) {
                      setDecisionError(copy('The response could not be saved.', 'تعذر حفظ الاستجابة.'))
                    }
                  } catch (error) {
                    console.error('Could not save the space-weather response.', error)
                    setDecisionError(copy('The response could not be saved.', 'تعذر حفظ الاستجابة.'))
                  }
                }}
              >
                {copy('Continue · keep exploration available', 'تابع · أبقِ الاستكشاف متاحًا')}
              </button>
            </>
          ) : null}
          <a className="text-[10px] text-sky-200 underline underline-offset-2" href={NOAA_SOLAR_PROTON_SOURCE.url} target="_blank" rel="noreferrer">
            {copy('NOAA live data', 'بيانات NOAA الحية')}
          </a>
          <a className="text-[10px] text-sky-200 underline underline-offset-2" href={NOAA_SOLAR_PROTON_SOURCE.scaleUrl} target="_blank" rel="noreferrer">
            {copy('Scale guide', 'شرح المقياس')}
          </a>
        </div>
      </div>
    </section>
  )
}
