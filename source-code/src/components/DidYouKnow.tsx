import { useState } from 'react'
import { CircleDot, Moon, RefreshCw, Rocket, Sparkles } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const factTopics = [
  {
    id: 'moon',
    title: { en: 'The Moon', ar: 'القمر' },
    Icon: Moon,
    facts: [
      {
        text: {
          en: 'The Moon is an average of 384,400 km from Earth.',
          ar: 'يبعد القمر عن الأرض في المتوسط نحو 384,400 كيلومتر.',
        },
        source: { en: 'NASA Moon Facts', ar: 'حقائق القمر من NASA' },
        url: 'https://science.nasa.gov/moon/facts/',
      },
      {
        text: {
          en: 'The Moon rotates in sync with its orbit, so the same hemisphere generally faces Earth.',
          ar: 'يدور القمر بالتزامن مع دورانه حول الأرض، لذلك نرى الوجه نفسه غالبًا.',
        },
        source: { en: 'NASA Moon Facts', ar: 'حقائق القمر من NASA' },
        url: 'https://science.nasa.gov/moon/facts/',
      },
      {
        text: {
          en: 'Apollo astronauts brought 382 kg of lunar rocks and soil back to Earth.',
          ar: 'أعاد رواد أبولو 382 كجم من صخور القمر وتربته إلى الأرض.',
        },
        source: { en: 'NASA Moon Facts', ar: 'حقائق القمر من NASA' },
        url: 'https://science.nasa.gov/moon/facts/',
      },
    ],
  },
  {
    id: 'mars',
    title: { en: 'Mars', ar: 'المريخ' },
    Icon: CircleDot,
    facts: [
      {
        text: {
          en: 'A Martian day, called a sol, lasts about 24.6 hours.',
          ar: 'يستمر اليوم الشمسي على المريخ، ويُسمى سول، نحو 24.6 ساعة.',
        },
        source: { en: 'NASA Mars Facts', ar: 'حقائق المريخ من NASA' },
        url: 'https://science.nasa.gov/mars/facts/',
      },
      {
        text: {
          en: 'Mars has two small moons: Phobos and Deimos.',
          ar: 'للمريخ قمران صغيران هما فوبوس وديموس.',
        },
        source: { en: 'NASA Mars Facts', ar: 'حقائق المريخ من NASA' },
        url: 'https://science.nasa.gov/mars/facts/',
      },
      {
        text: {
          en: 'One Martian year is about 687 Earth days.',
          ar: 'تعادل السنة على المريخ نحو 687 يومًا أرضيًا.',
        },
        source: { en: 'NASA Mars Facts', ar: 'حقائق المريخ من NASA' },
        url: 'https://science.nasa.gov/mars/facts/',
      },
    ],
  },
  {
    id: 'missions',
    title: { en: 'Space missions', ar: 'الرحلات الفضائية' },
    Icon: Rocket,
    facts: [
      {
        text: {
          en: 'The International Space Station orbits Earth about every 90 minutes.',
          ar: 'تدور محطة الفضاء الدولية حول الأرض مرة كل 90 دقيقة تقريبًا.',
        },
        source: { en: 'NASA Station Facts', ar: 'حقائق المحطة من NASA' },
        url: 'https://www.nasa.gov/international-space-station/space-station-facts-and-figures/',
      },
      {
        text: {
          en: 'People have lived aboard the International Space Station continuously since November 2000.',
          ar: 'يعيش رواد الفضاء على متن المحطة الدولية باستمرار منذ نوفمبر 2000.',
        },
        source: { en: 'NASA Station Facts', ar: 'حقائق المحطة من NASA' },
        url: 'https://www.nasa.gov/international-space-station/space-station-facts-and-figures/',
      },
      {
        text: {
          en: 'A spacecraft can reach the International Space Station in as little as four hours.',
          ar: 'يمكن لمركبة فضائية الوصول إلى المحطة الدولية في غضون أربع ساعات فقط.',
        },
        source: { en: 'NASA Station Facts', ar: 'حقائق المحطة من NASA' },
        url: 'https://www.nasa.gov/international-space-station/space-station-facts-and-figures/',
      },
    ],
  },
] as const

export function DidYouKnow({ className = '' }: { className?: string }) {
  const language = useSettingsStore((state) => state.language)
  const isArabic = language === 'ar'
  const [factIndexes, setFactIndexes] = useState([0, 0, 0])

  return (
    <section
      className={`relative z-10 w-full rounded-2xl border border-cyan-200/15 bg-slate-950/65 p-4 shadow-xl backdrop-blur-md sm:p-5 ${className}`}
      dir={isArabic ? 'rtl' : 'ltr'}
      aria-labelledby="did-you-know-title"
    >
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <Sparkles size={18} className="text-cyan-200" aria-hidden="true" />
        <h2 id="did-you-know-title" className="text-base font-black text-cyan-50">
          {isArabic ? 'هل تعلم؟' : 'Did You Know?'}
        </h2>
        <p className="text-xs text-slate-400">
          {isArabic ? 'حقائق قصيرة عن القمر والمريخ والرحلات الفضائية' : 'Quick facts about the Moon, Mars, and space missions'}
        </p>
      </header>
      <div className="grid items-stretch gap-3 md:grid-cols-3">
        {factTopics.map((topic, topicIndex) => {
          const Icon = topic.Icon
          const factIndex = factIndexes[topicIndex] ?? 0
          const fact = topic.facts[factIndex]
          return (
            <article key={topic.id} className="flex min-w-0 flex-col rounded-xl border border-white/10 bg-white/[0.025] p-3.5">
              <h3 className="flex items-center gap-2 text-xs font-black text-slate-100">
                <Icon size={15} className="shrink-0 text-cyan-200" aria-hidden="true" />
                {topic.title[language]}
              </h3>
              <p className="mt-2 min-h-12 flex-1 text-xs leading-5 text-slate-300" aria-live="polite">
                {fact.text[language]}
              </p>
              <a
                className="mt-2 w-fit text-[10px] font-semibold text-sky-200 underline underline-offset-2"
                href={fact.url}
                target="_blank"
                rel="noreferrer"
              >
                {fact.source[language]}
              </a>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[.07] pt-2">
                <span className="text-[10px] tabular-nums text-slate-500">
                  {factIndex + 1} / {topic.facts.length}
                </span>
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-cyan-200/15 px-2.5 text-[10px] font-bold text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-100/[.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"
                  onClick={() => setFactIndexes((current) => current.map((index, currentTopicIndex) => (
                    currentTopicIndex === topicIndex ? (index + 1) % topic.facts.length : index
                  )))}
                  aria-label={isArabic ? `معلومة أخرى عن ${topic.title.ar}` : `Another ${topic.title.en} fact`}
                >
                  <RefreshCw size={12} aria-hidden="true" />
                  {isArabic ? 'معلومة أخرى' : 'Another fact'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
