export type ExperienceMode = 'explorer' | 'commander' | 'specialist'

export const EXPERIENCE_MODES: readonly ExperienceMode[] = ['explorer', 'commander', 'specialist']

export function parseExperienceAge(value: string): number | null {
  const normalized = value.trim().replace(/[٠-٩۰-۹]/g, (digit) => {
    const codePoint = digit.codePointAt(0)
    if (codePoint === undefined) return digit
    const zeroCodePoint = codePoint >= 0x06f0 ? 0x06f0 : 0x0660
    return String(codePoint - zeroCodePoint)
  })
  if (!/^\d+$/.test(normalized)) return null
  const age = Number(normalized)
  return Number.isSafeInteger(age) ? age : null
}

export function getExperienceRank(mode: ExperienceMode): number {
  return EXPERIENCE_MODES.indexOf(mode)
}

export function getLockedNextExperienceMode(unlockedThrough: ExperienceMode): ExperienceMode | null {
  return EXPERIENCE_MODES[getExperienceRank(unlockedThrough) + 1] ?? null
}

export const EXPERIENCE_PROFILES: Record<ExperienceMode, {
  title: { en: string; ar: string }
  age: { en: string; ar: string }
  role: { en: string; ar: string }
  description: { en: string; ar: string }
  approach: { en: string; ar: string }
  systems: { en: string; ar: string }
  guidance: { en: string; ar: string }
}> = {
  explorer: {
    title: { en: 'Explorer Mode', ar: 'وضع المستكشف' },
    age: { en: 'Typical ages 7–10', ar: 'الفئة العمرية الإرشادية ٧–١٠' },
    role: { en: 'Young space explorer', ar: 'مستكشف فضاء صغير' },
    description: {
      en: 'Discover how a Moon or Mars outpost supports its crew.',
      ar: 'اكتشف كيف تدعم قاعدة على القمر أو المريخ حياة طاقمها.',
    },
    approach: {
      en: 'Start with three connected needs: oxygen, power, and food & water. When ready, reveal radiation, crew, and greenhouse systems in stages.',
      ar: 'ابدأ بثلاثة احتياجات مترابطة: الأكسجين والطاقة والغذاء والماء. وعندما تصبح مستعدًا، افتح أنظمة الإشعاع والطاقم والمزرعة تدريجيًا.',
    },
    systems: {
      en: 'Start: Oxygen · Power · Food & Water. Next: Radiation · Crew · Greenhouse',
      ar: 'ابدأ: الأكسجين · الطاقة · الغذاء والماء. ثم: الإشعاع · الطاقم · المزرعة',
    },
    guidance: {
      en: 'Explorer Buddy connects the three essentials first, then helps you explore more systems when you are ready.',
      ar: 'يربط مستكشف أسترا بين الاحتياجات الثلاثة أولًا، ثم يساعدك على اكتشاف أنظمة أخرى عندما تكون مستعدًا.',
    },
  },
  commander: {
    title: { en: 'Commander Mode', ar: 'وضع القائد' },
    age: { en: 'Typical ages 10–12', ar: 'الفئة العمرية الإرشادية ١٠–١٢' },
    role: { en: 'Outpost commander', ar: 'قائد قاعدة فضائية' },
    description: {
      en: 'Lead the outpost by balancing resources and crew needs.',
      ar: 'قد القاعدة بموازنة الموارد واحتياجات الطاقم.',
    },
    approach: {
      en: 'A numerical dashboard compares reserves, capacity, and the latest completed day’s net change. Set priorities, inspect system panels, and weigh event choices before planning ahead.',
      ar: 'لوحة أرقام تقارن المخزون بالسعة وبصافي التغير في آخر يوم مكتمل. حدّد الأولويات وافحص الأنظمة ووازن خيارات الأحداث قبل التخطيط للأيام القادمة.',
    },
    systems: {
      en: 'Life support · Power · Radiation · Food · Crew · Communications · Maintenance',
      ar: 'دعم الحياة · الطاقة · الإشعاع · الغذاء · الطاقم · الاتصالات · الصيانة',
    },
    guidance: {
      en: 'Command Briefing gives concise, data-based alerts and prompts you to compare options and set priorities.',
      ar: 'يقدم موجز القيادة تنبيهات مختصرة مستندة إلى بيانات اللعبة، ويدعوك لمقارنة الخيارات وتحديد الأولويات.',
    },
  },
  specialist: {
    title: { en: 'Specialist Mode', ar: 'وضع الاختصاصي' },
    age: { en: 'Typical ages 13+', ar: 'الفئة العمرية الإرشادية ١٣ فأكثر' },
    role: { en: 'Mission specialist', ar: 'اختصاصي مهمة' },
    description: {
      en: 'Work with detailed mission-control panels and analyze trade-offs.',
      ar: 'استخدم لوحات التحكم التفصيلية وحلل المفاضلات بين القرارات.',
    },
    approach: {
      en: 'The full existing simulation interface remains available. Astra Guide is optional and reports modeled telemetry without choosing for you.',
      ar: 'تبقى واجهة المحاكاة التفصيلية الحالية متاحة. المساعد اختياري ويعرض بيانات النموذج دون اتخاذ القرار نيابةً عنك.',
    },
    systems: {
      en: 'Detailed life support · Power · Radiation · Food · Crew · Communications · Maintenance',
      ar: 'دعم الحياة التفصيلي · الطاقة · الإشعاع · الغذاء · الطاقم · الاتصالات · الصيانة',
    },
    guidance: {
      en: 'Technical Analysis reports modeled telemetry and trade-offs on request; analysis and decisions remain yours.',
      ar: 'يعرض التحليل الفني القياسات المحاكية والمفاضلات عند الطلب؛ ويظل التحليل والقرار لك.',
    },
  },
}

export function getExperienceModeForAge(age: number): ExperienceMode | null {
  if (!Number.isInteger(age) || age < 7 || age > 120) return null
  if (age < 10) return 'explorer'
  if (age <= 12) return 'commander'
  return 'specialist'
}

export function getRecommendedExperienceModesForAge(age: number): ExperienceMode[] {
  if (!Number.isInteger(age) || age < 7 || age > 120) return []
  const recommendations: ExperienceMode[] = []
  if (age >= 7 && age <= 10) recommendations.push('explorer')
  if (age >= 10 && age <= 12) recommendations.push('commander')
  if (age >= 13) recommendations.push('specialist')
  return recommendations
}

export function getNextExperienceMode(mode: ExperienceMode): ExperienceMode | null {
  const index = EXPERIENCE_MODES.indexOf(mode)
  return EXPERIENCE_MODES[index + 1] ?? null
}

export function canAdvanceExperience(score: number | null, mode: ExperienceMode): boolean {
  return score !== null && Number.isFinite(score) && score >= 80 && getNextExperienceMode(mode) !== null
}

export function canUnlockNextExperience(
  score: number | null,
  activeMode: ExperienceMode,
  unlockedThrough: ExperienceMode,
): boolean {
  return score !== null &&
    Number.isFinite(score) &&
    score >= 80 &&
    activeMode === unlockedThrough &&
    getLockedNextExperienceMode(unlockedThrough) !== null
}

export function isExperienceMode(value: unknown): value is ExperienceMode {
  return typeof value === 'string' && EXPERIENCE_MODES.includes(value as ExperienceMode)
}

export function normalizeExperienceMode(value: string | null): ExperienceMode {
  if (value === 'junior') return 'explorer'
  if (value === 'advanced') return 'specialist'
  return isExperienceMode(value) ? value : 'explorer'
}
