import { Activity, BatteryCharging, HeartPulse, Radio, Shield, Sprout, Wrench, Waves } from 'lucide-react'
import type { GameState, ResourceName } from '../game/model'
import { getCurrentMissionDay, getEnergyCapacity, getMarsCommunicationDelayMinutes, getSupplyCapacity } from '../game/model'
import { formatResourceValue } from '../game/resources'
import { useSettingsStore } from '../store/settingsStore'
import { AstraGuide } from './AstraGuide'

export function CommanderDashboard({ state }: { state: GameState }) {
  const language = useSettingsStore((store) => store.language)
  const arabic = language === 'ar'
  const copy = (en: string, ar: string) => arabic ? ar : en
  const iconByResource = {
    oxygen: Waves,
    water: Waves,
    energy: BatteryCharging,
    food: Sprout,
    health: HeartPulse,
  }
  const resourceNames: Record<ResourceName, { en: string; ar: string }> = {
    oxygen: { en: 'Oxygen', ar: 'الأكسجين' },
    water: { en: 'Water', ar: 'الماء' },
    energy: { en: 'Power', ar: 'الطاقة' },
    food: { en: 'Food', ar: 'الغذاء' },
    health: { en: 'Crew health', ar: 'صحة الطاقم' },
  }
  const reports = state.dailyReports
  const latestReport = reports.length > 0 ? reports[reports.length - 1] : null
  const resources: ResourceName[] = ['oxygen', 'water', 'energy', 'food', 'health']

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 pb-4 ps-24 text-white sm:px-6 sm:ps-24" aria-labelledby="commander-dashboard-title">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/70">{copy('Commander check-in', 'موجز القائد')}</p>
          <h2 id="commander-dashboard-title" className="mt-1 text-lg font-black">{copy('Outpost resources and crew', 'موارد القاعدة والطاقم')}</h2>
        </div>
        <p className="text-[10px] text-slate-400">{copy('Mission day', 'يوم المهمة')} {getCurrentMissionDay(state)} / {state.maxDays} · {copy('Training model values', 'قيم من النموذج التدريبي')}</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {resources.map((resource) => {
          const Icon = iconByResource[resource]
          const capacity = resource === 'energy'
            ? getEnergyCapacity(state)
            : resource === 'health'
              ? 100
              : getSupplyCapacity(resource, state.crewSize)
          const percent = Math.round(Math.max(0, Math.min(100, state.resources[resource] / capacity * 100)))
          const netChange = latestReport
            ? latestReport.resourcesAtEnd[resource] - latestReport.resourcesAtStart[resource]
            : null
          const daysAtLastPace = netChange !== null && netChange < -0.01
            ? Math.max(0, state.resources[resource] / -netChange)
            : null
          return (
            <article key={resource} className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <h3 className="flex items-center gap-2 text-xs font-bold text-slate-200"><Icon size={15} aria-hidden="true" />{resourceNames[resource][language]}</h3>
              <p className="mt-3 text-lg font-black tabular-nums" dir="ltr">{formatResourceValue(resource, state.resources[resource], language)}</p>
              <p className="text-[10px] text-slate-400">{copy('Capacity', 'السعة')}: {formatResourceValue(resource, capacity, language)} · {percent}%</p>
              <p className="mt-2 border-t border-white/5 pt-2 text-[10px] text-slate-400">
                {netChange === null
                  ? copy('No completed-day trend yet', 'لا يوجد اتجاه ليوم مكتمل بعد')
                  : `${copy('Last day net', 'صافي آخر يوم')}: ${netChange > 0 ? '+' : ''}${formatResourceValue(resource, netChange, language)}`}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {daysAtLastPace === null
                  ? copy('Time remaining: not estimated', 'الوقت المتبقي: غير مقدر')
                  : `${copy('At last day’s net pace', 'وفق صافي آخر يوم')}: ${daysAtLastPace.toFixed(1)} ${copy('days', 'يوم')}`}
              </p>
            </article>
          )
        })}
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-violet-200/15 bg-violet-200/[0.035] p-3">
          <h3 className="flex items-center gap-2 text-xs font-bold text-violet-100"><Shield size={15} aria-hidden="true" />{copy('Radiation', 'الإشعاع')}</h3>
          <p className="mt-2 text-lg font-black tabular-nums">{state.radiationExposure.toFixed(1)} mSv</p>
          <p className="text-[10px] text-slate-400">{state.permanentRadiationDamageWarning ? copy('Cumulative game warning active', 'تنبيه تراكمي داخل اللعبة نشط') : copy('No cumulative game warning', 'لا يوجد تنبيه تراكمي داخل اللعبة')}</p>
          <p className="mt-1 text-[9px] text-slate-500">{copy('Not a medical limit or dose forecast.', 'ليس حدًا طبيًا أو توقعًا للجرعة.')}</p>
        </article>
        <article className="rounded-xl border border-sky-200/15 bg-sky-200/[0.035] p-3">
          <h3 className="flex items-center gap-2 text-xs font-bold text-sky-100"><Radio size={15} aria-hidden="true" />{copy('Communications', 'الاتصالات')}</h3>
          <p className="mt-2 text-sm font-bold">{latestReport
            ? latestReport.earthTransmission.status === 'queued' ? copy('Report queued', 'التقرير في قائمة الإرسال') : copy('Report stored locally', 'التقرير محفوظ محليًا')
            : copy('No daily report yet', 'لا يوجد تقرير يومي بعد')}</p>
          {state.destination === 'mars' ? (
            <p className="mt-1 text-[10px] text-cyan-100">
              {copy('Modeled one-way delay', 'تأخير محاكى باتجاه واحد')}: {latestReport?.earthTransmission.delayMinutes ??
                getMarsCommunicationDelayMinutes(state.missionSeed, state.day, 'research')} {copy('min', 'دقيقة')}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] text-slate-500">{copy('Simulated status · no live network connection', 'حالة محاكية · لا يوجد اتصال شبكي فعلي')}</p>
          <p className="mt-1 text-[9px] leading-4 text-slate-500">{copy('Urgent crews use onboard procedures; they cannot wait for an immediate Earth reply.', 'يستخدم الطاقم إجراءات المركبة في الطوارئ؛ فلا يمكنه انتظار رد فوري من الأرض.')}</p>
        </article>
        <article className="rounded-xl border border-amber-200/15 bg-amber-200/[0.035] p-3">
          <h3 className="flex items-center gap-2 text-xs font-bold text-amber-100"><Wrench size={15} aria-hidden="true" />{copy('Maintenance', 'الصيانة')}</h3>
          <p className="mt-2 text-lg font-black tabular-nums">{state.offlineBuildings.length}</p>
          <p className="text-[10px] text-slate-400">{copy('building systems offline', 'نظام مبنى متوقف')}</p>
        </article>
      </div>
      <p className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
        <Activity size={13} aria-hidden="true" />
        {copy('Estimates use the last completed in-game day only; they are not forecasts or engineering limits.', 'التقديرات تستخدم آخر يوم مكتمل داخل اللعبة فقط؛ وليست تنبؤات أو حدودًا هندسية.')}
      </p>
      <AstraGuide state={state} mode="commander" />
    </section>
  )
}
