import { BatteryCharging, HeartPulse, Shield, Sprout, Users } from 'lucide-react'
import { GREENHOUSE_CYCLE } from '../game/constants'
import { getEnergyCapacity, getSupplyCapacity, type GameState } from '../game/model'
import { useSettingsStore } from '../store/settingsStore'
import { AstraGuide } from './AstraGuide'

export function JuniorDashboard({ state }: { state: GameState }) {
  const language = useSettingsStore((store) => store.language)
  const arabic = language === 'ar'
  const copy = (en: string, ar: string) => arabic ? ar : en
  const percent = (value: number, capacity: number) => Math.round(Math.max(0, Math.min(100, value / capacity * 100)))
  const allSupplies = [
    { label: copy('Oxygen', 'الأكسجين'), value: state.resources.oxygen, capacity: getSupplyCapacity('oxygen', state.crewSize) },
    { label: copy('Water', 'الماء'), value: state.resources.water, capacity: getSupplyCapacity('water', state.crewSize) },
    { label: copy('Food', 'الغذاء'), value: state.resources.food, capacity: getSupplyCapacity('food', state.crewSize) },
  ]
  const oxygen = allSupplies[0]
  const foodAndWater = allSupplies.slice(1)
  const weakestSupply = allSupplies.reduce((weakest, item) =>
    percent(item.value, item.capacity) < percent(weakest.value, weakest.capacity) ? item : weakest,
  )
  const energyCapacity = getEnergyCapacity(state)
  const energyPercent = percent(state.resources.energy, energyCapacity)
  const shelterOnline = state.buildings.includes('storm-shelter') && !state.offlineBuildings.includes('storm-shelter')
  const protectionText = state.activeEvent
    ? copy('An event needs your attention. Read the choices before acting.', 'هناك حدث يحتاج انتباهك. اقرأ الخيارات قبل اتخاذ القرار.')
    : shelterOnline
      ? copy('The shelter is available. Its protection is a simplified game model.', 'الملجأ متاح. الحماية هنا نموذج مبسط داخل اللعبة.')
      : copy('The shelter is unavailable. Check your outpost systems.', 'الملجأ غير متاح. تحقق من أنظمة القاعدة.')

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 pb-4 ps-24 text-white sm:px-6 sm:ps-24" aria-labelledby="junior-dashboard-title">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/70">{copy('Explorer mission check-in', 'موجز المستكشف')}</p>
          <h2 id="junior-dashboard-title" className="mt-1 text-lg font-black">{copy('How is the outpost doing?', 'كيف تسير أحوال القاعدة؟')}</h2>
        </div>
        <p className="text-[10px] text-slate-400">{copy('Day', 'اليوم')} {state.day} · {copy('Training indicators, not engineering limits', 'مؤشرات تدريبية وليست حدودًا هندسية')}</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-sky-200/15 bg-sky-200/[0.035] p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-sky-100"><HeartPulse size={16} aria-hidden="true" />{copy('Life support', 'دعم الحياة')}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            {weakestSupply.value / weakestSupply.capacity < 0.25
              ? copy(`${weakestSupply.label} needs attention.`, `${weakestSupply.label} يحتاج إلى الانتباه.`)
              : copy('Oxygen, water, and food are all part of keeping the crew going.', 'الأكسجين والماء والغذاء كلها ضرورية لاستمرار الطاقم.')}
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <div className="mb-1 flex justify-between gap-2 text-[10px] text-slate-300">
                <span>{oxygen.label}</span><span>{percent(oxygen.value, oxygen.capacity)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${oxygen.label} ${copy('reserve', 'المخزون')}`} aria-valuenow={percent(oxygen.value, oxygen.capacity)} aria-valuemin={0} aria-valuemax={100}>
                <span className="block h-full rounded-full bg-sky-300" style={{ width: `${percent(oxygen.value, oxygen.capacity)}%` }} />
              </div>
            </li>
          </ul>
          <p className="mt-2 text-[9px] text-slate-500">{copy('GAME MODEL · training reserve', 'نموذج اللعبة · مخزون تدريبي')}</p>
        </article>
        <article className="rounded-2xl border border-amber-200/15 bg-amber-200/[0.035] p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-amber-100"><BatteryCharging size={16} aria-hidden="true" />{copy('Power', 'الطاقة')}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            {energyPercent < 25
              ? copy('Power is running low. Fewer reserves can limit what the outpost can run.', 'الطاقة منخفضة. قد تحد المخزونات الأقل مما تستطيع القاعدة تشغيله.')
              : copy('Power supports outpost systems. Check the reserve before adding work.', 'تدعم الطاقة أنظمة القاعدة. راجع المخزون قبل إضافة أعمال جديدة.')}
          </p>
          <p className="mt-3 text-2xl font-black tabular-nums">{energyPercent}<span className="ms-1 text-xs text-slate-400">%</span></p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={copy('Power reserve', 'مخزون الطاقة')} aria-valuenow={energyPercent} aria-valuemin={0} aria-valuemax={100}>
            <span className="block h-full rounded-full bg-amber-300" style={{ width: `${energyPercent}%` }} />
          </div>
          <p className="mt-2 text-[9px] text-slate-500">{copy('GAME MODEL · training reserve', 'نموذج اللعبة · مخزون تدريبي')}</p>
        </article>
        <article className="rounded-2xl border border-lime-200/15 bg-lime-200/[0.035] p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-lime-100"><Sprout size={16} aria-hidden="true" />{copy('Food & Water', 'الغذاء والماء')}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-300">{copy('Food feeds the crew; water supports the crew and plants. Both supplies need planning.', 'الغذاء يطعم الطاقم، والماء يدعم الطاقم والنباتات. نحتاج إلى التخطيط لكليهما.')}</p>
          <ul className="mt-3 space-y-2">
            {foodAndWater.map((item) => {
              const valuePercent = percent(item.value, item.capacity)
              return (
                <li key={item.label}>
                  <div className="mb-1 flex justify-between gap-2 text-[10px] text-slate-300">
                    <span>{item.label}</span><span>{valuePercent}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${item.label} ${copy('reserve', 'المخزون')}`} aria-valuenow={valuePercent} aria-valuemin={0} aria-valuemax={100}>
                    <span className="block h-full rounded-full bg-lime-300" style={{ width: `${valuePercent}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 text-[9px] text-slate-500">{copy('GAME MODEL · training reserves', 'نموذج اللعبة · مخزونات تدريبية')}</p>
        </article>
      </div>
      <details className="mt-3 rounded-2xl border border-violet-200/15 bg-violet-200/[0.025] p-4">
        <summary className="cursor-pointer text-xs font-bold text-violet-100">{copy('Ready for more systems? Explore radiation, crew, and plants', 'هل أنت مستعد لأنظمة أخرى؟ اكتشف الإشعاع والطاقم والنباتات')}</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-violet-200/15 bg-violet-200/[0.035] p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-violet-100"><Shield size={16} aria-hidden="true" />{copy('Radiation safety', 'أمان الإشعاع')}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            {state.permanentRadiationDamageWarning
              ? copy('The game’s radiation warning is active. Check the shelter and mission choices.', 'تنبيه الإشعاع في اللعبة نشط. تحقق من الملجأ وخيارات المهمة.')
              : protectionText}
          </p>
          <p className="mt-2 text-[9px] leading-4 text-slate-500">
            {copy('Game-only guidance, not a real-world radiation or medical estimate.', 'إرشاد داخل اللعبة فقط، وليس تقديرًا للإشعاع أو حدًا طبيًا واقعيًا.')}
          </p>
        </article>
        <article className="rounded-2xl border border-emerald-200/15 bg-emerald-200/[0.035] p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-100"><Users size={16} aria-hidden="true" />{copy('Crew', 'الطاقم')}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-300">{copy('Crew health', 'صحة الطاقم')}</p>
          <p className="mt-1 text-2xl font-black tabular-nums">{Math.round(state.resources.health)}%</p>
          <p className="mt-2 text-xs text-slate-400">{copy('Energy and supplies help the crew complete daily work and rest.', 'تساعد الطاقة والمؤن الطاقم على إنجاز العمل اليومي والراحة.')}</p>
        </article>
        <article className="rounded-2xl border border-lime-200/15 bg-lime-200/[0.035] p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-lime-100"><Sprout size={16} aria-hidden="true" />{copy('Greenhouse', 'المزرعة')}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-300">
            {!state.buildings.includes('greenhouse')
              ? copy('Not built yet. Explore the base to learn what plants need.', 'لم تُبنَ بعد. استكشف القاعدة لتتعرف على احتياجات النباتات.')
              : state.offlineBuildings.includes('greenhouse')
                ? copy('Offline. Check power and the greenhouse controls.', 'متوقفة. تحقق من الطاقة وأدوات المزرعة.')
                : copy(
                  `Online. Plants need power and water. In this simplified game model, one growth cycle takes ${GREENHOUSE_CYCLE.growthDays} powered mission days—not a real-world growth estimate.`,
                  `تعمل. تحتاج النباتات إلى الطاقة والماء. في نموذج اللعبة المبسط، تكتمل دورة نمو بعد ${GREENHOUSE_CYCLE.growthDays} أيام تشغيل محاكاة، وليست مدة نمو واقعية.`,
                )}
          </p>
          <p className="mt-3 text-[10px] leading-5 text-slate-400">{copy('The shared mission model tracks resources and building status.', 'يتابع نموذج المهمة المشترك الموارد وحالة المباني.')}</p>
        </article>
      </div>
      <div className="mt-3"><AstraGuide state={state} mode="explorer" /></div>
      </details>
    </section>
  )
}
