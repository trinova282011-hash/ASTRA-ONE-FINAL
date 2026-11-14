import type { GameState, ResourceName } from '../game/model'
import { getEnergyCapacity, getSupplyCapacity } from '../game/model'
import type { ExperienceMode } from './experienceLevels'

export type GuidanceSeverity = 'urgent' | 'warning' | 'info'

export interface MissionGuidance {
  severity: GuidanceSeverity
  title: string
  message: string
}

export function getMissionGuideName(mode: ExperienceMode, arabic: boolean): string {
  const names: Record<ExperienceMode, { en: string; ar: string }> = {
    explorer: { en: 'Explorer Buddy', ar: 'رفيق المستكشف' },
    commander: { en: 'Command Briefing', ar: 'موجز القيادة' },
    specialist: { en: 'Technical Analysis', ar: 'التحليل الفني' },
  }
  return arabic ? names[mode].ar : names[mode].en
}

const RESOURCE_ORDER: ResourceName[] = ['oxygen', 'water', 'energy', 'food', 'health']

function getResourceCapacity(resource: ResourceName, state: GameState): number {
  if (resource === 'energy') return getEnergyCapacity(state)
  if (resource === 'health') return 100
  return getSupplyCapacity(resource, state.crewSize)
}

function getRecentDailyChange(resource: ResourceName, state: GameState): number | null {
  const reports = state.dailyReports.slice(-3)
  if (reports.length === 0) return null
  return reports.reduce((total, report) => (
    total + report.resourcesAtEnd[resource] - report.resourcesAtStart[resource]
  ), 0) / reports.length
}

function getResourceRisk(state: GameState, resource: ResourceName) {
  const capacity = getResourceCapacity(resource, state)
  const value = state.resources[resource]
  const percent = capacity > 0 ? Math.max(0, Math.min(100, value / capacity * 100)) : 0
  const dailyChange = getRecentDailyChange(resource, state)
  const threshold = capacity * 0.2
  const daysUntilThreshold = dailyChange !== null && dailyChange < 0
    ? Math.max(0, (value - threshold) / -dailyChange)
    : null
  const riskDays = percent > 20 ? daysUntilThreshold : null
  return { resource, capacity, value, percent, dailyChange, riskDays }
}

function resourceName(resource: ResourceName, arabic: boolean): string {
  const names: Record<ResourceName, { en: string; ar: string }> = {
    oxygen: { en: 'oxygen', ar: 'الأكسجين' },
    water: { en: 'water', ar: 'الماء' },
    energy: { en: 'power', ar: 'الطاقة' },
    food: { en: 'food', ar: 'الغذاء' },
    health: { en: 'crew health', ar: 'صحة الطاقم' },
  }
  return arabic ? names[resource].ar : names[resource].en
}

export function getMissionGuidance(
  state: GameState,
  mode: ExperienceMode,
  arabic: boolean,
): MissionGuidance {
  const copy = (en: string, ar: string) => arabic ? ar : en

  if (state.activeEvent) {
    return {
      severity: 'urgent',
      title: copy('Active event', 'حدث نشط'),
      message: mode === 'explorer'
        ? copy('Adventure alert! Something needs your help. Read the choices, pick one, and see how your crew responds.', 'تنبيه المغامرة! هناك أمر يحتاج مساعدتك. اقرأ الخيارات واختر واحدًا، ثم شاهد كيف يستجيب طاقمك.')
        : mode === 'commander'
          ? copy('Command decision: compare each option’s listed resource and crew effects, then choose the response that best fits your priorities.', 'قرار قيادي: قارن أثر كل خيار المعروض على الموارد والطاقم، ثم اختر الاستجابة الأنسب لأولوياتك.')
          : copy('Event analysis: inspect the modeled consequences and operational trade-offs for each response. Selection remains yours.', 'تحليل الحدث: افحص النتائج المحاكية والمفاضلات التشغيلية لكل استجابة. القرار لك.'),
    }
  }

  if (state.emergencyLevel >= 1 || state.survivalMode) {
    return {
      severity: 'urgent',
      title: mode === 'explorer'
        ? copy('Crew needs you', 'الطاقم يحتاجك')
        : mode === 'commander'
          ? copy('Command alert', 'تنبيه القيادة')
          : copy('Emergency telemetry', 'قياسات الطوارئ'),
      message: mode === 'explorer'
        ? copy('We have a space-base challenge! Open the highlighted alert and try the suggested steps to help your crew.', 'لدينا تحدٍ في القاعدة الفضائية! افتح التنبيه المميز وجرّب الخطوات المقترحة لمساعدة طاقمك.')
        : mode === 'commander'
          ? copy(`Level ${state.emergencyLevel} response: check life support, crew condition, and power demand. Coordinate priorities before resuming routine operations.`, `استجابة المستوى ${state.emergencyLevel}: افحص دعم الحياة وحالة الطاقم وطلب الطاقة. نسّق الأولويات قبل استئناف العمليات المعتادة.`)
          : copy(`Status: emergency ${state.emergencyLevel}; survival power ${state.survivalMode ? 'engaged' : 'not engaged'}. Identify affected systems and verify equipment state before intervention.`, `الحالة: الطوارئ ${state.emergencyLevel}؛ طاقة البقاء ${state.survivalMode ? 'مفعلة' : 'غير مفعلة'}. حدّد الأنظمة المتأثرة وتحقق من حالة المعدات قبل التدخل.`),
    }
  }

  const risks = RESOURCE_ORDER
    .map((resource) => getResourceRisk(state, resource))
    .filter((risk) => risk.percent <= 25 || (risk.riskDays !== null && risk.riskDays <= 3))
    .sort((a, b) => {
      const aDays = a.riskDays ?? Number.POSITIVE_INFINITY
      const bDays = b.riskDays ?? Number.POSITIVE_INFINITY
      return aDays - bDays || a.percent - b.percent
    })
  const risk = risks[0]
  if (risk) {
    const name = resourceName(risk.resource, arabic)
    const change = risk.dailyChange
    const trend = change === null
      ? copy('No completed-day trend is available yet.', 'لا يتوفر اتجاه من يوم مكتمل بعد.')
      : copy(
        `Recent average: ${change >= 0 ? '+' : ''}${change.toFixed(1)} per day.`,
        `المتوسط الأخير: ${change >= 0 ? '+' : ''}${change.toFixed(1)} يوميًا.`,
      )
    const remaining = risk.riskDays === null
      ? ''
      : copy(` At the recent rate, it may reach the 20% alert level in about ${risk.riskDays.toFixed(1)} days.`, ` وبالمعدل الأخير قد يصل إلى حد التنبيه ٢٠٪ خلال نحو ${risk.riskDays.toFixed(1)} يوم.`)
    const detail = mode === 'explorer'
      ? copy(`Resource quest: ${name} is at ${risk.percent.toFixed(0)}%. Open its panel and choose one of the ways to help the base.`, `مهمة الموارد: ${name} عند ${risk.percent.toFixed(0)}٪. افتح لوحته واختر طريقة من الخيارات لمساعدة القاعدة.`)
      : mode === 'commander'
        ? copy(`Priority review: ${name} reserve is ${risk.percent.toFixed(0)}%. ${trend}${remaining} Check dependent systems and compare options before reallocating resources.`, `مراجعة الأولويات: مخزون ${name} عند ${risk.percent.toFixed(0)}٪. ${trend}${remaining} افحص الأنظمة المرتبطة وقارن الخيارات قبل إعادة توزيع الموارد.`)
        : copy(`Resource telemetry — ${name}: ${risk.value.toFixed(1)} / ${risk.capacity.toFixed(1)} (${risk.percent.toFixed(1)}%). ${trend}${remaining} Estimate is derived from recent simulated reports; validate system status before acting.`, `قياسات الموارد — ${name}: ${risk.value.toFixed(1)} / ${risk.capacity.toFixed(1)} (${risk.percent.toFixed(1)}٪). ${trend}${remaining} التقدير مشتق من تقارير المحاكاة الأخيرة؛ تحقّق من حالة النظام قبل التدخل.`)
    return {
      severity: risk.percent <= 20 || (risk.riskDays !== null && risk.riskDays <= 1) ? 'urgent' : 'warning',
      title: mode === 'explorer'
        ? copy('A resource needs care', 'مورد يحتاج إلى عناية')
        : mode === 'commander'
          ? copy('Resource priority', 'أولوية الموارد')
          : copy('Resource telemetry', 'قياسات الموارد'),
      message: detail,
    }
  }

  if (state.offlineBuildings.length > 0) {
    return {
      severity: 'warning',
      title: mode === 'explorer'
        ? copy('Base-building check', 'فحص مباني القاعدة')
        : mode === 'commander'
          ? copy('Maintenance briefing', 'موجز الصيانة')
          : copy('Equipment diagnostics', 'تشخيص المعدات'),
      message: mode === 'explorer'
        ? copy(`${state.offlineBuildings.length} base system(s) need a check. Pick a building to discover what it does and how to help.`, `${state.offlineBuildings.length} من أنظمة القاعدة تحتاج إلى فحص. اختر مبنى لتعرف وظيفته وكيف تساعده.`)
        : mode === 'commander'
          ? copy(`${state.offlineBuildings.length} system(s) are offline. Review maintenance status and power allocation, then set the repair priority.`, `${state.offlineBuildings.length} من الأنظمة متوقف. راجع حالة الصيانة وتوزيع الطاقة، ثم حدّد أولوية الإصلاح.`)
          : copy(`${state.offlineBuildings.length} system(s) report offline status. Inspect equipment state, maintenance requirements, and power availability.`, `${state.offlineBuildings.length} من الأنظمة تسجل حالة توقف. افحص حالة المعدات ومتطلبات الصيانة وتوفر الطاقة.`),
    }
  }

  if (state.dustStormDaysRemaining > 0) {
    return {
      severity: 'info',
      title: mode === 'explorer'
        ? copy('Dusty-day mission', 'مهمة اليوم المغبر')
        : mode === 'commander'
          ? copy('Weather operations', 'عمليات الطقس')
          : copy('Environmental telemetry', 'قياسات البيئة'),
      message: mode === 'explorer'
        ? copy(`A dusty adventure is underway for ${state.dustStormDaysRemaining} more day(s). Check the power meter and keep exploring safely.`, `تستمر مغامرة الغبار ${state.dustStormDaysRemaining} يومًا إضافيًا. راقب مؤشر الطاقة وواصل الاستكشاف بأمان.`)
        : mode === 'commander'
          ? copy(`The modeled dust event has ${state.dustStormDaysRemaining} day(s) remaining. Review power availability and schedule high-priority systems.`, `يتبقى ${state.dustStormDaysRemaining} يومًا على حدث الغبار المحاكى. راجع الطاقة المتاحة وجدول الأنظمة ذات الأولوية.`)
          : copy(`Modeled dust-event duration remaining: ${state.dustStormDaysRemaining} day(s). Track power-system state and mission impacts in the telemetry panels.`, `المدة المتبقية لحدث الغبار المحاكى: ${state.dustStormDaysRemaining} يومًا. تتبّع حالة الطاقة وأثر المهمة في لوحات القياس.`),
    }
  }

  const latest = state.dailyReports[state.dailyReports.length - 1]
  return {
    severity: 'info',
    title: mode === 'explorer'
      ? copy('Ready for discovery!', 'جاهز للاكتشاف!')
      : mode === 'commander'
        ? copy('Daily command review', 'مراجعة القيادة اليومية')
        : copy('Systems status', 'حالة الأنظمة'),
    message: latest
      ? mode === 'explorer'
        ? copy(`Nice work, Explorer! Day ${latest.day} is complete. Pick a building to discover how it helps your crew.`, `أحسنت يا مستكشف! اكتمل اليوم ${latest.day}. اختر مبنى واكتشف كيف يساعد طاقمك.`)
        : mode === 'commander'
          ? copy(`Day ${latest.day} review: no resource is below the 25% training alert threshold. Check the report and set priorities for the next day.`, `مراجعة اليوم ${latest.day}: لا يوجد مورد دون حد التنبيه التدريبي ٢٥٪. راجع التقرير وحدّد أولويات اليوم التالي.`)
          : copy(`System check complete. No resource is below the 25% training alert threshold. Review day ${latest.day} telemetry and assess the next operational cycle.`, `اكتمل فحص الأنظمة. لا يوجد مورد دون حد التنبيه التدريبي ٢٥٪. راجع قياسات اليوم ${latest.day} وقيّم دورة التشغيل التالية.`)
      : mode === 'explorer'
        ? copy('Your mission is ready! Explore the base and see what helps your crew live and work in space.', 'مهمتك جاهزة! استكشف القاعدة واكتشف ما يساعد طاقمك على العيش والعمل في الفضاء.')
        : mode === 'commander'
          ? copy('No critical alert is active. Review the current reserves and choose the next operational priority.', 'لا يوجد تنبيه حرج الآن. راجع المخزون الحالي واختر أولوية التشغيل التالية.')
          : copy('No critical alert is active. Inspect current system state and modeled telemetry before selecting the next action.', 'لا يوجد تنبيه حرج الآن. افحص حالة الأنظمة وقياساتها المحاكية قبل اختيار الإجراء التالي.'),
  }
}
