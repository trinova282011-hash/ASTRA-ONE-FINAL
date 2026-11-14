import { useState } from 'react'
import { BookOpen, ChevronDown, Lightbulb } from 'lucide-react'
import type { GameState } from '../game/model'
import { useSettingsStore } from '../store/settingsStore'
import type { ExperienceMode } from '../utils/experienceLevels'
import { getMissionGuideName, getMissionGuidance } from '../utils/missionGuidance'

export function AstraGuide({ state, mode }: { state: GameState; mode: ExperienceMode }) {
  const [open, setOpen] = useState(mode === 'explorer')
  const arabic = useSettingsStore((store) => store.language === 'ar')
  const copy = (en: string, ar: string) => arabic ? ar : en
  const guidance = getMissionGuidance(state, mode, arabic)
  const guideName = getMissionGuideName(mode, arabic)
  const severityClass = guidance.severity === 'urgent'
    ? 'text-rose-200'
    : guidance.severity === 'warning'
      ? 'text-amber-100'
      : 'text-slate-300'

  return (
    <section className="mx-auto my-3 w-full max-w-[1500px] px-4 sm:px-6" aria-label={`${copy('Astra Guide', 'مساعد أسترا')} · ${guideName}`}>
      <div className="overflow-hidden rounded-xl border border-cyan-200/15 bg-slate-950/50">
        <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3 text-start" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span className="flex items-center gap-2 text-sm font-bold text-cyan-100"><Lightbulb size={17} aria-hidden="true" /> {guideName} <span className="text-xs font-normal text-slate-400">{mode === 'explorer' ? copy('Your space buddy', 'رفيقك الفضائي') : mode === 'commander' ? copy('Optional briefing', 'موجز اختياري') : copy('On request', 'عند الطلب')}</span></span>
          <ChevronDown size={16} aria-hidden="true" className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
        {open ? <div className={`flex items-start gap-2 border-t border-white/5 px-4 py-3 text-xs leading-5 ${severityClass}`} role={guidance.severity === 'urgent' ? 'alert' : 'status'}><BookOpen size={15} className="mt-0.5 shrink-0 text-cyan-200" aria-hidden="true" /><p><strong className="me-1">{guidance.title}:</strong>{guidance.message}</p></div> : null}
      </div>
    </section>
  )
}
