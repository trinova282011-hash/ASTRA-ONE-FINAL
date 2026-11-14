import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Database, ExternalLink, Search, X } from 'lucide-react'
import { CO2_PER_CREW_DAY, ENVIRONMENT, FOOD_PER_CREW_DAY, GREENHOUSE_CYCLE, ISRU_DAILY_OUTPUT, OXYGEN_PER_CREW_DAY, POWER_SYSTEM, WATER_PER_CREW_DAY, WATER_RECYCLE_RATE } from '../game/constants'
import { MAX_SIMULATED_MISSION_DAYS } from '../game/model'
import { SIMULATED_TRANSIT_DAYS } from '../game/flightPhysics'
import { ARCHIVED_NASA_CME_OBSERVATIONS, loadNasaCmeDataset, NASA_CME_SOURCE, type NasaCmeDataset } from '../game/nasaData'
import { NOAA_SOLAR_PROTON_SOURCE } from '../game/spaceWeather'
import { useSettingsStore } from '../store/settingsStore'

const factSources = {
  moon: 'https://science.nasa.gov/moon/facts/',
  mars: 'https://science.nasa.gov/mars/facts/',
  moonFactSheet: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html',
  marsFactSheet: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
  earthFactSheet: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html',
  water: 'https://science.nasa.gov/moon/moon-water-and-ices/',
  radiation: 'https://www.nasa.gov/directorates/esdmd/hhp/space-radiation/',
  marsCruiseRadiation: 'https://doi.org/10.1126/science.1235989',
  marsSurfaceRadiation: 'https://doi.org/10.1126/science.1244797',
  marsSurfaceRadiationNtrs: 'https://ntrs.nasa.gov/citations/20180007641',
}

const researchResources = [
  {
    title: { en: 'NASA Open APIs', ar: 'واجهات NASA البرمجية المفتوحة' },
    url: 'https://api.nasa.gov/',
    summary: {
      en: 'Directory of NASA APIs for data-connected projects. Check each API’s current key and rate-limit requirements; this game now reads CME observations from the current CCMC DONKI endpoint.',
      ar: 'دليل واجهات NASA لمشروعات البيانات. راجع متطلبات المفتاح وحدود الاستخدام لكل واجهة؛ تقرأ اللعبة الآن أرصاد CME من واجهة CCMC DONKI الحالية.',
    },
  },
  {
    title: { en: 'DONKI API reference and usage notes', ar: 'مرجع واجهة DONKI وملاحظات الاستخدام' },
    url: 'https://ccmc.gsfc.nasa.gov/DONKI/api/',
    summary: {
      en: 'Current CCMC API documentation. DONKI records are preliminary research information, not operational forecasts or crew-dose estimates; NOAA is the official U.S. source for space-weather forecasts.',
      ar: 'التوثيق الحالي لواجهة CCMC. سجلات DONKI معلومات بحثية أولية وليست تنبؤات تشغيلية أو تقديرات لجرعة الطاقم؛ وNOAA هي المصدر الرسمي الأمريكي لتنبؤات الطقس الفضائي.',
    },
  },
  {
    title: { en: 'NOAA Space Weather Prediction Center', ar: 'مركز NOAA لتنبؤات الطقس الفضائي' },
    url: 'https://www.spaceweather.gov/',
    summary: {
      en: 'Official U.S. space-weather forecast source, distinguished from DONKI’s preliminary research products.',
      ar: 'المصدر الرسمي الأمريكي لتنبؤات الطقس الفضائي، وهو متميز عن المنتجات البحثية الأولية في DONKI.',
    },
  },
  {
    title: { en: 'NASA Open Science Data Repository (OSDR)', ar: 'مستودع NASA للبيانات العلمية المفتوحة (OSDR)' },
    url: 'https://osdr.nasa.gov/osdr/data/search?term=spaceflight%20bone%20density',
    summary: {
      en: 'Search space-biology and astronaut-health studies, including varied organisms and experiment types. Results are study data, not automatically human clinical guidance.',
      ar: 'ابحث عن دراسات بيولوجيا الفضاء وصحة رواد الفضاء، بما فيها كائنات وتجارب متنوعة. بيانات الدراسات ليست تلقائيًا إرشادات سريرية للبشر.',
    },
  },
  {
    title: { en: 'RadLab radiation dosimetry data', ar: 'بيانات قياس الجرعات الإشعاعية RadLab' },
    url: 'https://visualization.osdr.nasa.gov/radlab/gui/data-api/',
    summary: {
      en: 'Explore measured instrument data, including ISS measurements. These are platform- and instrument-specific observations, not Moon/Mars surface measurements or interchangeable dose forecasts.',
      ar: 'استكشف قياسات الأجهزة، ومنها قياسات محطة الفضاء الدولية. هذه أرصاد مرتبطة بالمنصة والجهاز، وليست قياسات لسطح القمر/المريخ ولا توقعات جرعة قابلة للاستبدال.',
    },
  },
  {
    title: { en: 'NASA Mars Trek', ar: 'NASA Mars Trek' },
    url: 'https://trek.nasa.gov/mars/',
    summary: {
      en: 'Interactive Mars portal for viewing and exploring NASA mission imagery and terrain layers. Useful for geographic context, not a certified landing-site recommendation.',
      ar: 'بوابة تفاعلية لاستكشاف صور المريخ وطبقات تضاريسه من مهمات NASA. مفيدة للسياق الجغرافي، وليست توصية معتمدة لموقع هبوط.',
    },
  },
  {
    title: { en: 'CSA: Food production on the Moon', ar: 'وكالة الفضاء الكندية: إنتاج الغذاء على القمر' },
    url: 'https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/',
    summary: {
      en: 'Educator and youth toolkit about food production in space and remote areas; it provides learning activities, not validation of the game greenhouse yield.',
      ar: 'حقيبة تعليمية للمعلمين والشباب عن إنتاج الغذاء في الفضاء والمناطق النائية؛ تقدم أنشطة تعلم ولا تصادق على إنتاجية دفيئة اللعبة.',
    },
  },
  {
    title: { en: 'CSA: STEM resources for youth organizations', ar: 'وكالة الفضاء الكندية: موارد STEM للمنظمات الشبابية' },
    url: 'https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp',
    summary: {
      en: 'Bilingual space and STEM learning resources for educators and community organizations.',
      ar: 'موارد تعليمية ثنائية اللغة عن الفضاء وSTEM للمعلمين والمنظمات المجتمعية.',
    },
  },
] as const

export function DataOriginsModal({ onClose }: { onClose: () => void }) {
  const language = useSettingsStore((state) => state.language)
  const ar = language === 'ar'
  const copy = (en: string, arabic: string) => ar ? arabic : en
  const number = (value: number, digits = 2) => new Intl.NumberFormat(language, { maximumFractionDigits: digits }).format(value)
  type DataClassification = 'REAL DATA' | 'DERIVED' | 'GAME MODEL'
  const classificationLabel: Record<DataClassification, string> = {
    'REAL DATA': copy('REAL DATA', 'بيانات حقيقية'),
    DERIVED: copy('DERIVED', 'قيمة مشتقة'),
    'GAME MODEL': copy('GAME MODEL', 'نموذج اللعبة'),
  }
  const classificationStyle: Record<DataClassification, string> = {
    'REAL DATA': 'border-emerald-200/20 bg-emerald-200/[0.06] text-emerald-100',
    DERIVED: 'border-sky-200/20 bg-sky-200/[0.06] text-sky-100',
    'GAME MODEL': 'border-amber-200/20 bg-amber-200/[0.06] text-amber-100',
  }
  const maximumGameMissionDays = MAX_SIMULATED_MISSION_DAYS
  const dialogRef = useRef<HTMLElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dataset, setDataset] = useState<NasaCmeDataset>({
    observations: ARCHIVED_NASA_CME_OBSERVATIONS,
    source: 'archive',
    retrievedAt: null,
    warning: null,
  })
  const [datasetLoading, setDatasetLoading] = useState(true)
  const [refreshCount, setRefreshCount] = useState(0)
  useEffect(() => {
    let active = true
    setDatasetLoading(true)
    void loadNasaCmeDataset({ forceRefresh: refreshCount > 0 })
      .then((result) => {
        if (active) setDataset(result)
      })
      .catch((error: unknown) => {
        console.error('Could not load the NASA DONKI dataset.', error)
        if (active) {
          setDataset({
            observations: ARCHIVED_NASA_CME_OBSERVATIONS,
            source: 'archive',
            retrievedAt: null,
            warning: `NASA dataset unavailable: ${error instanceof Error ? error.message : String(error)}`,
          })
        }
      })
      .finally(() => {
        if (active) setDatasetLoading(false)
      })
    return () => { active = false }
  }, [refreshCount])
  const datasetStatus = dataset.source === 'recent'
    ? copy('Recent CCMC DONKI response', 'استجابة حديثة من DONKI التابعة لـCCMC')
    : dataset.source === 'cached'
      ? copy('Cached CCMC DONKI response', 'استجابة DONKI من CCMC مخزنة مؤقتًا')
      : copy('Curated archived DONKI record', 'سجل DONKI أرشيفي موثق')
  const formatObservationDate = (value: string) => new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value))
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    searchInputRef.current?.focus()
    return () => {
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [])
  const handleDialogKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const focusableElements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((element) => element.getClientRects().length > 0)
    if (!focusableElements.length) {
      event.preventDefault()
      dialogRef.current?.focus()
      return
    }
    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
  const metrics = [
    {
      title: copy('Environmental references', 'مراجع البيئة'),
      type: copy('NASA references and a derived average · local conditions vary; the communication-delay range is not directly sourced here.', 'مراجع NASA ومتوسط مشتق · تختلف الظروف المحلية، ولم يوثق مصدر مباشر هنا لنطاق تأخير الاتصال.'),
      source: [
        [copy('Moon facts', 'حقائق القمر'), factSources.moon],
        [copy('Moon fact sheet', 'ورقة حقائق القمر'), factSources.moonFactSheet],
        [copy('Mars facts', 'حقائق المريخ'), factSources.mars],
        [copy('Mars fact sheet', 'ورقة حقائق المريخ'), factSources.marsFactSheet],
        [copy('Earth fact sheet', 'ورقة حقائق الأرض'), factSources.earthFactSheet],
      ] as const,
      items: [
        [copy('Lunar gravity', 'جاذبية القمر'), `${number(ENVIRONMENT.moonGravityEarthG, 3)} g`],
        [copy('Mars gravity', 'جاذبية المريخ'), `${number(ENVIRONMENT.marsGravityEarthG, 2)} g`],
        [copy('Mars average pressure ratio · derived', 'نسبة متوسط ضغط المريخ · مشتقة'), `${number(ENVIRONMENT.marsAtmosphericPressureEarthFraction * 100, 1)}% ${copy('of Earth · 6.36 / 1,014 mbar', 'من الأرض · 6.36 / 1,014 مليبار')}`],
        [copy('Mars one-way delay · range not sourced here', 'تأخير المريخ باتجاه واحد · النطاق غير موثق هنا'), `${ENVIRONMENT.marsCommunicationDelayMinutes.min}–${ENVIRONMENT.marsCommunicationDelayMinutes.max} ${copy('minutes', 'دقيقة')}`],
        [copy('Lunar night · game approximation, site-dependent', 'الليل القمري · تقريب للعبة يختلف حسب الموقع'), `~${ENVIRONMENT.lunarNightDays} ${copy('Earth days', 'يومًا أرضيًا')}`],
        [copy('Lunar night temperature · varies by location', 'حرارة الليل القمري · تختلف حسب الموقع'), `${ENVIRONMENT.lunarNightTemperatureCelsius}°C`],
      ],
      classifications: ['REAL DATA', 'REAL DATA', 'DERIVED', 'GAME MODEL', 'GAME MODEL', 'GAME MODEL'] as const,
    },
    {
      title: copy('NOAA GOES proton watch', 'تنبيه بروتونات NOAA GOES'),
      type: copy('Real Earth-referenced observation · training trigger only, not a local lunar/Mars dose.', 'رصد حقيقي مرجعه الأرض · مشغّل تدريبي فقط، وليس جرعة محلية للقمر أو المريخ.'),
      source: [
        [copy('NOAA GOES integral proton flux', 'تدفق بروتونات GOES التكاملي من NOAA'), NOAA_SOLAR_PROTON_SOURCE.url],
        [copy('NOAA radiation storm scale', 'مقياس عواصف الإشعاع NOAA'), NOAA_SOLAR_PROTON_SOURCE.scaleUrl],
      ] as const,
      items: [
        [copy('Classified energy channel', 'قناة الطاقة المستخدمة للتصنيف'), NOAA_SOLAR_PROTON_SOURCE.energyChannel],
        [copy('S1–S5 thresholds', 'عتبات S1–S5'), '10 / 100 / 1,000 / 10,000 / 100,000 pfu'],
        [copy('Freshness limit · game rule', 'حد حداثة البيانات · قاعدة لعبة'), `${NOAA_SOLAR_PROTON_SOURCE.maximumAgeMinutes} ${copy('minutes', 'دقيقة')}`],
        [copy('S2+ gameplay response · training rule', 'استجابة اللعب لمستوى S2+ · قاعدة تدريبية'), copy('Player may defer optional exploration for that simulated day; no dose or health value changes.', 'يمكن للاعب تأجيل الاستكشاف الاختياري لذلك اليوم المحاكى؛ لا تتغير قيمة الجرعة أو الصحة.')],
      ],
      classifications: ['REAL DATA', 'REAL DATA', 'GAME MODEL', 'GAME MODEL'] as const,
    },
    {
      title: copy('Crew supply rates', 'معدلات إمداد الطاقم'),
      type: copy('Fictional training inputs, not NASA requirements; the linked lunar-water page does not source these rates.', 'مدخلات تدريبية خيالية وليست متطلبات NASA؛ صفحة ماء القمر المرتبطة لا توثق هذه المعدلات.'),
      source: [[copy('Moon water context only · not a rate source', 'سياق لماء القمر فقط · ليس مصدرًا للمعدلات'), factSources.water]] as const,
      items: [
        [copy('Oxygen per crew member / day', 'الأكسجين لكل فرد / يوم'), `${number(OXYGEN_PER_CREW_DAY)} kg`],
        [copy('Water per crew member / day', 'الماء لكل فرد / يوم'), `${number(WATER_PER_CREW_DAY)} L`],
        [copy('Packaged food per crew member / day', 'الغذاء المعبأ لكل فرد / يوم'), `${number(FOOD_PER_CREW_DAY)} kg`],
        [copy('CO₂ produced per crew member / day', 'ثاني أكسيد الكربون لكل فرد / يوم'), `${number(CO2_PER_CREW_DAY)} kg`],
      ],
      classifications: ['GAME MODEL', 'GAME MODEL', 'GAME MODEL', 'GAME MODEL'] as const,
    },
    {
      title: copy('ECLSS & power rules', 'قواعد دعم الحياة والطاقة'),
      type: copy('Game balance · simplified flows and short-cycle scaling', 'موازنة اللعبة · تدفقات مبسطة وتحجيم لدورة قصيرة'),
      source: [],
      items: [
        [copy('Water recovery · Easy / Medium / Hard', 'استرداد الماء · سهل / متوسط / صعب'), `${number(WATER_RECYCLE_RATE.easy * 100, 0)}% / ${number(WATER_RECYCLE_RATE.normal * 100, 0)}% / ${number(WATER_RECYCLE_RATE.hard * 100, 0)}%`],
        [copy('Solar nameplate · Moon / Mars', 'قدرة الشمس الاسمية · القمر / المريخ'), `${POWER_SYSTEM.solarOutputKw.moon} / ${POWER_SYSTEM.solarOutputKw.mars} kW`],
        [copy('Fission reactor nameplate', 'قدرة المفاعل الاسمية'), `${POWER_SYSTEM.reactorOutputKw} kW`],
        [copy('Battery storage', 'سعة البطارية'), `${POWER_SYSTEM.batteryCapacityKwh} kWh`],
        [copy('Greenhouse output · food / oxygen per growth cycle', 'إنتاج الدفيئة · الغذاء / الأكسجين لكل دورة نمو'), `${GREENHOUSE_CYCLE.foodKg} kg / ${GREENHOUSE_CYCLE.oxygenKg} kg · ${GREENHOUSE_CYCLE.growthDays} ${copy('days', 'أيام')}`],
        [copy('Greenhouse water use per growth cycle', 'استهلاك مياه الدفيئة لكل دورة نمو'), `${GREENHOUSE_CYCLE.waterLitersPerCycle} L / ${GREENHOUSE_CYCLE.growthDays} ${copy('days', 'أيام')}`],
        [copy('ISRU output · water / oxygen per day', 'إنتاج وحدة الموارد · الماء / الأكسجين يومياً'), `${ISRU_DAILY_OUTPUT.waterLiters} L / ${ISRU_DAILY_OUTPUT.oxygenKg} kg`],
        [copy('Survival-mode base load', 'حمل وضع النجاة'), `${POWER_SYSTEM.survivalLoadKw} kW`],
        [copy('Habitat operating load', 'حمل تشغيل وحدة السكن'), `${POWER_SYSTEM.operatingLoadsKw.habitat} kW`],
        [copy('ISRU / greenhouse operating load', 'حمل تشغيل وحدة الموارد / الدفيئة'), `${POWER_SYSTEM.operatingLoadsKw.isru} / ${POWER_SYSTEM.operatingLoadsKw.greenhouse} kW`],
        [copy('Energy budget per simulated day', 'ميزانية الطاقة لكل يوم محاكى'), `${number(POWER_SYSTEM.energyBudgetHoursPerCycle * 60, 1)} ${copy('rated minutes', 'دقيقة قدرة اسمية')}`],
      ],
      classifications: Array(11).fill('GAME MODEL') as readonly DataClassification[],
    },
    {
      title: copy('Radiation & mission context', 'الإشعاع وسياق المهمة'),
      type: copy('Historical RAD study context plus game assumptions. Numeric values and uncertainties still need full-paper verification; these are not a validated dose forecast.', 'سياق تاريخي لدراسات RAD مع افتراضات للعبة. ما زالت القيم الرقمية وهوامش الخطأ تحتاج مراجعة الدراسة كاملة؛ هذه ليست توقعات معتمدة للجرعة.'),
      source: [
        [copy('MSL Mars cruise RAD study · DOI', 'دراسة RAD لعبور MSL إلى المريخ · DOI'), factSources.marsCruiseRadiation],
        [copy('Curiosity Mars surface RAD study · DOI', 'دراسة RAD على سطح المريخ بمركبة كيوريوسيتي · DOI'), factSources.marsSurfaceRadiation],
        [copy('NASA NTRS record · Curiosity surface RAD study metadata', 'سجل NASA NTRS · بيانات دراسة RAD السطحية لكيوريوسيتي'), factSources.marsSurfaceRadiationNtrs],
        [copy('NASA space-radiation context', 'سياق NASA للإشعاع الفضائي'), factSources.radiation],
      ] as const,
      items: [
        [copy('Simulated transit window · Moon / Mars', 'زمن العبور المحاكى · القمر / المريخ'), `${SIMULATED_TRANSIT_DAYS.moon} / ${SIMULATED_TRANSIT_DAYS.mars} ${copy('days per leg', 'أيام لكل اتجاه')}`],
        [copy('Maximum gameplay mission duration', 'الحد الأقصى لمدة المهمة داخل اللعبة'), copy(`${number(maximumGameMissionDays, 0)} simulated game days · fictional challenge limit`, `${number(maximumGameMissionDays, 0)} يوم محاكى · حد خيالي لتحدي اللعبة`)],
        [copy('Mars-transit game input · MSL cruise context, value unverified', 'مدخل لعبة لعبور المريخ · سياق عبور MSL، والقيمة غير متحققة'), `${number(ENVIRONMENT.marsTransitRadiationMsvPerDay)} mSv / day · ${copy('model input', 'مدخل نموذجي')}`],
        [copy('Lunar transit baseline · game-only educational approximation', 'معدل عبور القمر · تقريب تعليمي للعبة فقط'), `${number(ENVIRONMENT.lunarTransitRadiationMsvPerDay)} mSv / day`],
        [copy('Mars-surface game baseline · historical context, value unverified', 'معدل نموذجي لسطح المريخ · سياق تاريخي، والقيمة غير متحققة'), `${number(ENVIRONMENT.marsSurfaceRadiationMsvPerDay)} mSv / day · ${copy('model input', 'مدخل نموذجي')}`],
        [copy('Lunar-surface baseline · game-only, no direct source', 'معدل سطح القمر · للعبة فقط، بلا مصدر مباشر'), `${number(ENVIRONMENT.lunarSurfaceRadiationMsvPerDay)} mSv / day`],
        [copy('Game modifiers · shielding / dust storm', 'معاملات اللعبة · التدريع / عاصفة الغبار'), `${number(0.25)}× / ${number(1.5)}×`],
        [copy('Fictional cumulative game-alert threshold', 'عتبة تنبيه تراكمية خيالية للعبة'), `${ENVIRONMENT.gameRadiationWarningThresholdMsv} mSv`],
      ],
      classifications: Array(8).fill('GAME MODEL') as readonly DataClassification[],
    },
  ]
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase(language)
  const matchesSearch = (value: string) => value.toLocaleLowerCase(language).includes(normalizedSearchQuery)
  const visibleMetrics = normalizedSearchQuery
    ? metrics.filter((section) => [
        section.title,
        section.type,
        ...section.items.flat(),
        ...section.classifications.map((classification) => classificationLabel[classification]),
        ...section.source.flat(),
      ].some(matchesSearch))
    : metrics
  const showNasaDataset = !normalizedSearchQuery || [
    'NASA DONKI',
    'Coronal Mass Ejection observations',
    'NASA/CCMC',
    classificationLabel['REAL DATA'],
    NASA_CME_SOURCE.name,
    NASA_CME_SOURCE.url,
    ...dataset.observations.flatMap((observation) => [
      observation.activityId,
      observation.sourceLocation ?? '',
    ]),
  ].some(matchesSearch)
  const visibleResearchResources = normalizedSearchQuery
    ? researchResources.filter((resource) =>
        [resource.title.en, resource.title.ar, resource.url, resource.summary.en, resource.summary.ar].some(matchesSearch),
      )
    : researchResources
  const matchingParameterCount = visibleMetrics.reduce((count, section) => count + section.items.length, 0)
  const matchingRecordCount = matchingParameterCount +
    (showNasaDataset ? dataset.observations.slice(0, 5).length : 0) +
    visibleResearchResources.length

  return (
    <div className="modal-backdrop fixed inset-0 z-[110] overflow-y-auto p-3 sm:p-6" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="data-origins-title" tabIndex={-1} onKeyDown={handleDialogKeyDown} className="modal-card my-auto max-h-[calc(100dvh-2rem)] !max-w-5xl" dir={ar ? 'rtl' : 'ltr'}>
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div>
            <p className="eyebrow"><Database size={13} /> {copy('SIMULATION REFERENCE', 'مرجع المحاكاة')}</p>
            <h2 id="data-origins-title" className="mt-2 text-2xl font-black">{copy('Data & NASA Origins', 'البيانات ومصادر NASA')}</h2>
            <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-400">
              {copy(`Scientific references are separated from game settings. The ${number(maximumGameMissionDays, 0)}-day ceiling and compressed transit windows are fictional challenge rules. Resource rates, radiation-model use and modifiers, power-cycle scaling, and construction times are training adaptations, not NASA requirements. This prototype is not NASA-endorsed or an engineering model.`, `نفصل المراجع العلمية عن إعدادات اللعبة. الحد البالغ ${number(maximumGameMissionDays, 0)} يوم ونوافذ العبور المختصرة قواعد خيالية للتحدي. معدلات الموارد واستخدام الإشعاع ومعاملاته وتحجيم الطاقة ومدد البناء تكييفات تدريبية وليست متطلبات من NASA. هذا النموذج غير معتمد من NASA وليس نموذجًا هندسيًا.`)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label={copy('Data classifications', 'تصنيفات البيانات')}>
              {(['REAL DATA', 'DERIVED', 'GAME MODEL'] as const).map((classification) => (
                <span key={classification} className={`inline-flex rounded-full border px-2 py-1 text-[8px] font-black tracking-wide ${classificationStyle[classification]}`}>
                  {classificationLabel[classification]}
                </span>
              ))}
            </div>
          </div>
          <button type="button" onClick={onClose} className="icon-button shrink-0" aria-label={copy('Close data reference', 'إغلاق مرجع البيانات')}><X size={17} /></button>
        </header>
        <div className="mt-4">
          <label htmlFor="data-origins-search" className="mb-2 block text-xs font-bold text-slate-200">
            {copy('Search scientific topics, parameters, and data portals', 'ابحث في الموضوعات والمعاملات وبوابات البيانات')}
          </label>
          <div className="relative">
            <Search size={15} aria-hidden="true" className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-500 ${ar ? 'right-3' : 'left-3'}`} />
            <input
              ref={searchInputRef}
              id="data-origins-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              placeholder={copy('Try “radiation”, “water”, “Moon”, or “DONKI”', 'جرّب «الإشعاع» أو «الماء» أو «القمر» أو «DONKI»')}
              className={`w-full rounded-xl border border-white/10 bg-slate-950/60 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-200/20 ${ar ? 'pr-10 pl-3' : 'pl-10 pr-3'}`}
            />
          </div>
          <p className="mt-2 text-[10px] text-slate-400" role="status" aria-live="polite">
            {normalizedSearchQuery
              ? copy(`${matchingRecordCount} matches across ${visibleMetrics.length + Number(showNasaDataset) + Number(visibleResearchResources.length > 0)} categories, including data portals.`, `${matchingRecordCount} نتيجة ضمن ${visibleMetrics.length + Number(showNasaDataset) + Number(visibleResearchResources.length > 0)} فئات، تشمل بوابات البيانات.`)
              : copy(`${matchingParameterCount} parameter and signal entries across ${visibleMetrics.length} categories, NASA DONKI observations, and ${researchResources.length} research and learning portals.`, `${matchingParameterCount} بندًا من المعاملات والإشارات ضمن ${visibleMetrics.length} فئات، بالإضافة إلى سجلات NASA DONKI و${researchResources.length} بوابة بحث وتعلم.`)}
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {showNasaDataset ? <article className="rounded-2xl border border-cyan-200/10 bg-cyan-200/[0.025] p-4 sm:col-span-2 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-cyan-100">{copy('NASA DONKI · Coronal Mass Ejection observations', 'NASA DONKI · رصد الانبعاثات الكتلية الإكليلية')}</h3>
                <p className="mt-1 text-[10px] leading-5 text-slate-400">
                  {copy('A normalized sample of NASA/CCMC catalog records. The query covers the current UTC date and the previous six UTC calendar dates; records are observations, not forecasts.', 'عينة موحّدة من سجلات فهرس NASA/CCMC. يغطي الاستعلام التاريخ الحالي بالتوقيت العالمي والتواريخ التقويمية الستة السابقة؛ هذه سجلات رصد وليست تنبؤات.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefreshCount((count) => count + 1)}
                disabled={datasetLoading}
                className="secondary-button !px-3 !py-2 text-[10px] disabled:opacity-50"
              >
                {datasetLoading ? copy('Loading NASA data…', 'جارٍ تحميل بيانات NASA…') : copy('Refresh data', 'تحديث البيانات')}
              </button>
            </div>
            <p className="mt-3 text-[10px] text-slate-300" role="status" aria-live="polite">
              {datasetStatus}
              {dataset.retrievedAt ? ` · ${copy('retrieved (UTC)', 'وقت الاسترجاع (UTC)')} ${formatObservationDate(dataset.retrievedAt)}` : ''}
              {datasetLoading ? ` · ${copy('Checking for updates', 'جارٍ التحقق من التحديثات')}` : ''}
            </p>
            <p className="mt-1 text-[9px] text-slate-500">
              {NASA_CME_SOURCE.provenance} · {NASA_CME_SOURCE.modelUse} · {NASA_CME_SOURCE.validationStatus}
            </p>
            {dataset.warning ? (
              <p className="mt-2 rounded-lg border border-amber-200/15 bg-amber-200/[0.04] p-2 text-[10px] leading-5 text-amber-100/90" role="status">
                {dataset.warning}
              </p>
            ) : null}
            <p className="mt-2 text-[9px] leading-5 text-amber-100/80">
              {copy('DONKI is preliminary research information, not an operational forecast or a crew-dose estimate. NOAA is the official U.S. source for space-weather forecasts.', 'بيانات DONKI معلومات بحثية أولية وليست تنبؤًا تشغيليًا أو تقديرًا لجرعة الطاقم. وNOAA هي المصدر الرسمي الأمريكي لتنبؤات الطقس الفضائي.')}
              {' '}
              <a className="text-sky-200 underline underline-offset-2" href="https://ccmc.gsfc.nasa.gov/DONKI/api/" target="_blank" rel="noreferrer">
                {copy('Current DONKI API reference', 'مرجع واجهة DONKI الحالي')}
              </a>
            </p>
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {dataset.observations.length === 0 ? (
                <li className="py-3 text-[10px] leading-5 text-slate-400">
                  {copy('No CME observations were returned for this query window.', 'لم تُرجع نافذة الاستعلام سجلات CME.')}
                </li>
              ) : dataset.observations.slice(0, 5).map((observation) => (
                <li key={observation.activityId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2 text-[10px]">
                  <span className="min-w-0">
                    <b className="break-all text-slate-100">{observation.activityId}</b>
                    <span className="ms-2 text-slate-400">{formatObservationDate(observation.observedAt)} UTC</span>
                    <span className="ms-2 inline-flex rounded-full border border-emerald-200/20 bg-emerald-200/[0.06] px-2 py-0.5 text-[8px] font-bold text-emerald-100">{classificationLabel['REAL DATA']}</span>
                  </span>
                  <span className="text-slate-300">
                    {observation.speedKmPerSecond === null
                      ? copy('Speed not reported', 'السرعة غير مذكورة')
                      : `${number(observation.speedKmPerSecond, 0)} km/s`}
                    {observation.sourceLocation ? ` · ${observation.sourceLocation}` : ''}
                  </span>
                  <span className="flex gap-3">
                    <a className="text-sky-200 underline underline-offset-2" href={observation.eventUrl} target="_blank" rel="noreferrer">
                      {copy('NASA event', 'حدث NASA')}
                    </a>
                    {observation.analysisUrl ? (
                      <a className="text-sky-200 underline underline-offset-2" href={observation.analysisUrl} target="_blank" rel="noreferrer">
                        {copy('Analysis', 'التحليل')}
                      </a>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-5 text-slate-500">
              {copy(NASA_CME_SOURCE.archiveLimitations, 'تصف سجلات CME تحليلات أجهزة رصد الإكليل؛ ولا تمثل قياسات إشعاع محلية على القمر أو تنبؤات أو تقديرات جرعة للطاقم.')}
              {' '}
              {copy('DONKI records are preliminary research information provided as-is; their use does not imply NASA endorsement.', 'سجلات DONKI معلومات بحثية أولية مقدمة كما هي؛ ولا يعني استخدامها تأييد NASA لأي نتيجة.')}
              {' '}
              {copy('Mars-transit and lunar-transit radiation are modeled separately. The lunar transit value is a gameplay placeholder and not a verified lunar-radiation measurement.', 'يُنمذَج إشعاع عبور المريخ وعبور القمر بشكل منفصل. قيمة عبور القمر تمثل Placeholder للعبة ولا تمثل قياسًا موثوقًا لإشعاع القمر.')}
              {' '}
              <a className="text-sky-200 underline underline-offset-2" href={NASA_CME_SOURCE.url} target="_blank" rel="noreferrer">
                {copy('NASA DONKI source and limitations', 'مصدر NASA DONKI والقيود')}
              </a>
              {' · '}
              <a className="text-sky-200 underline underline-offset-2" href={NASA_CME_SOURCE.archivedDatasetUrl} target="_blank" rel="noreferrer">
                {copy('Archived dataset query', 'استعلام مجموعة البيانات الأرشيفية')}
              </a>
            </p>
          </article> : null}
          {visibleMetrics.map((section) => (
            <article key={section.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">
              <h3 className="text-sm font-black text-cyan-100">{section.title}</h3>
              <p className="mt-1 text-[9px] leading-4 text-slate-500">{section.type}</p>
              <dl className="mt-4 space-y-2">
                {section.items.map(([label, value], index) => (
                  <div key={label} className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-0">
                    <dt className="text-[10px] text-slate-400">{label}</dt>
                    <dd className="flex flex-wrap items-center justify-end gap-1.5 text-end text-[10px] font-bold tabular-nums text-slate-100">
                      <span>{value}</span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-black not-italic tracking-wide ${classificationStyle[section.classifications[index]]}`}>
                        {classificationLabel[section.classifications[index]]}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              {section.source.length ? (
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                  {section.source.map(([label, href]) => (
                    <li key={href}><a className="inline-flex items-center gap-1 text-[10px] text-sky-200 underline decoration-sky-200/30 underline-offset-2 hover:text-white" href={href} target="_blank" rel="noreferrer">{label}<ExternalLink size={10} /></a></li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-lg border border-amber-200/10 bg-amber-200/[0.025] p-2 text-[9px] leading-4 text-amber-100/80">
                  {copy('Source not verified — educational/game assumption. These values are used for gameplay, not real mission planning.', 'المصدر غير متحقق — افتراض تعليمي/خاص باللعبة. تُستخدم هذه القيم للعب، وليس لتخطيط مهام حقيقية.')}
                </p>
              )}
            </article>
          ))}
          {visibleResearchResources.length ? (
            <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 sm:col-span-2 sm:p-5">
              <h3 className="text-sm font-black text-cyan-100">{copy('Research & learning portals', 'بوابات البيانات والتعلم')}</h3>
              <p className="mt-1 text-[10px] leading-5 text-slate-400">
                {copy('These resources provide real observations, research datasets, maps, or educational activities. Their scope does not validate the game’s simplified rates or make them suitable for mission planning.', 'توفر هذه الموارد أرصادًا أو مجموعات أبحاث أو خرائط أو أنشطة تعليمية حقيقية. لكن نطاقها لا يصادق على معدلات اللعبة المبسطة ولا يجعلها صالحة لتخطيط المهمات.')}
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {visibleResearchResources.map((resource) => (
                  <li key={resource.url} className="rounded-xl border border-white/[0.06] bg-slate-950/30 p-3">
                    <a className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-200 underline decoration-sky-200/30 underline-offset-2 hover:text-white" href={resource.url} target="_blank" rel="noreferrer">
                      {copy(resource.title.en, resource.title.ar)}<ExternalLink size={10} />
                    </a>
                    <p className="mt-1 text-[10px] leading-5 text-slate-400">{copy(resource.summary.en, resource.summary.ar)}</p>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
          {matchingRecordCount === 0 ? (
            <p className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm text-slate-300 sm:col-span-2" role="status">
              {copy('No matching topics, records, or source portals. Try a broader search.', 'لا توجد موضوعات أو سجلات أو بوابات مصادر مطابقة. جرّب عبارة بحث أوسع.')}
            </p>
          ) : null}
        </div>
        <p className="mt-4 rounded-xl border border-amber-200/10 bg-amber-200/[0.025] p-3 text-[10px] leading-5 text-amber-100/80">
          {copy('Source note: the cited RAD studies provide historical measurement context, but the exact rates used in this game model have not been verified against the full numerical results and are not universal mission predictions. Mars transit and lunar transit are modeled separately; the lunar transit value is a gameplay placeholder, not a verified lunar radiation measurement. The lunar-surface baseline and shielding/storm modifiers are game assumptions. No rate or the 600 mSv alert is a medical or operational limit. NASA notes that evidence is insufficient to recommend exposure limits for long-duration missions.', 'ملاحظة المصدر: توفر دراسات RAD المذكورة سياقًا تاريخيًا للقياسات، لكن لم تُتحقق القيم الدقيقة المستخدمة في نموذج اللعبة من النتائج الرقمية الكاملة، ولا تمثل توقعات عامة للمهام. يتم نمذجة عبور المريخ وعبور القمر بشكل منفصل؛ قيمة عبور القمر عنصر لعب مؤقت وليست قياسًا موثوقًا للإشعاع القمري. أما معدل سطح القمر ومعاملات التدريع والعواصف فافتراضات للعبة. لا يمثل أي معدل أو تنبيه 600 mSv حدًا طبيًا أو تشغيليًا. وتشير NASA إلى عدم كفاية الأدلة للتوصية بحدود تعرض للمهام طويلة الأمد.')}
        </p>
      </section>
    </div>
  )
}
