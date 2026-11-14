import type { ExperienceMode } from '../utils/experienceLevels'
import { EXPERIENCE_PROFILES } from '../utils/experienceLevels'

export function ExperienceLevelCard({
  mode,
  language,
}: {
  mode: ExperienceMode
  language: 'ar' | 'en'
}) {
  const profile = EXPERIENCE_PROFILES[mode]
  return (
    <article className="rounded-2xl border border-cyan-200/20 bg-slate-950/60 p-5 text-start">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/70">{profile.age[language]}</p>
      <h2 className="mt-2 text-xl font-black text-white">{profile.title[language]}</h2>
      <p className="mt-1 text-sm font-bold text-cyan-100">{profile.role[language]}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{profile.description[language]}</p>
      <p className="mt-3 text-xs leading-6 text-slate-400">{profile.approach[language]}</p>
      <p className="mt-3 text-xs leading-5 text-slate-300"><strong className="text-cyan-100">{language === 'ar' ? 'الأنظمة:' : 'Systems:'}</strong> {profile.systems[language]}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400"><strong className="text-cyan-100">Astra Guide:</strong> {profile.guidance[language]}</p>
    </article>
  )
}
