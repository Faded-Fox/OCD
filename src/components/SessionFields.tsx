import { useEffect, useRef, useState, type ReactNode } from 'react'
import { EXPOSURE_TYPES, EXPOSURE_TYPE_LABELS, type ExposureType, type Session, type SudsReading } from '../lib/types'
import { useSessions } from '../lib/useSessions'
import { SUGGESTED_TECHNIQUES } from '../lib/techniques'

function dedupeCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

export default function SessionFields({
  session,
  onChange,
}: {
  session: Session
  onChange: (patch: Partial<Session>) => void
}) {
  // Suggestions come from a small curated starter list (techniques only — compulsions
  // are too personal/varied for a baked-in list) plus whatever this person has already
  // typed across their own past sessions, so the list adapts to their own vocabulary.
  const { sessions } = useSessions()
  const techniqueSuggestions = dedupeCaseInsensitive([
    ...SUGGESTED_TECHNIQUES,
    ...sessions.flatMap((s) => s.techniques_used),
  ]).sort((a, b) => a.localeCompare(b))
  const compulsionSuggestions = dedupeCaseInsensitive(sessions.flatMap((s) => s.compulsions_targeted)).sort((a, b) =>
    a.localeCompare(b),
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Date">
          <input
            type="date"
            value={session.date}
            onChange={(e) => onChange({ date: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Hierarchy">
          <input
            type="text"
            value={session.hierarchy}
            onChange={(e) => onChange({ hierarchy: e.target.value })}
            placeholder="e.g. Harm/Contamination"
            className={inputClass}
          />
        </Field>
        <Field label="Rung">
          <input
            type="number"
            value={session.rung ?? ''}
            onChange={(e) => onChange({ rung: e.target.value === '' ? null : Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
        <Field label="Variation">
          <input
            type="text"
            value={session.variation ?? ''}
            onChange={(e) => onChange({ variation: e.target.value || null })}
            className={inputClass}
          />
        </Field>
        <Field label="Exposure type">
          <select
            value={session.exposure_type ?? ''}
            onChange={(e) =>
              onChange({ exposure_type: e.target.value === '' ? null : (e.target.value as ExposureType) })
            }
            className={inputClass}
          >
            <option value="">Not specified</option>
            {EXPOSURE_TYPES.map((t) => (
              <option key={t} value={t}>
                {EXPOSURE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <SectionLabel full>SUDs</SectionLabel>
        <Field label="Target range">
          <TargetRangeInput
            value={session.target_suds_range}
            onChange={(target_suds_range) => onChange({ target_suds_range })}
          />
        </Field>
        <Field label="Peak / End">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={session.peak_suds ?? ''}
              onChange={(e) => onChange({ peak_suds: e.target.value === '' ? null : Number(e.target.value) })}
              className={inputClass}
            />
            <span className="text-slate-400">/</span>
            <input
              type="number"
              value={session.end_suds ?? ''}
              onChange={(e) => onChange({ end_suds: e.target.value === '' ? null : Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        </Field>
        <div className="sm:col-span-2">
          <ReadingsEditor
            readings={session.readings}
            onChange={(readings) => onChange({ readings })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <SectionLabel full>What happened</SectionLabel>
        <Field label="Compulsions resisted">
          <select
            value={session.compulsions_resisted === null ? 'unknown' : session.compulsions_resisted ? 'yes' : 'partial'}
            onChange={(e) =>
              onChange({
                compulsions_resisted: e.target.value === 'unknown' ? null : e.target.value === 'yes',
              })
            }
            className={inputClass}
          >
            <option value="yes">Fully resisted</option>
            <option value="partial">Partial / completed</option>
            <option value="unknown">Unknown</option>
          </select>
        </Field>
        <Field label="Techniques used">
          <TagsInput
            value={session.techniques_used}
            onChange={(techniques_used) => onChange({ techniques_used })}
            suggestions={techniqueSuggestions}
          />
        </Field>
        <Field label="Compulsions targeted">
          <TagsInput
            value={session.compulsions_targeted}
            onChange={(compulsions_targeted) => onChange({ compulsions_targeted })}
            suggestions={compulsionSuggestions}
          />
        </Field>
        <Field label="Scenario">
          <input
            type="text"
            value={session.rung_description}
            onChange={(e) => onChange({ rung_description: e.target.value })}
            placeholder="What the exposure was"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={session.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          className={inputClass}
        />
      </Field>
    </div>
  )
}

function ReadingsEditor({
  readings,
  onChange,
}: {
  readings: SudsReading[]
  onChange: (readings: SudsReading[]) => void
}) {
  const [editing, setEditing] = useState(false)

  const updateReading = (index: number, patch: Partial<SudsReading>) => {
    onChange(readings.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const removeReading = (index: number) => {
    onChange(readings.filter((_, i) => i !== index))
  }

  const addReading = () => {
    onChange([...readings, { label: '', time_or_minute: '', suds: 0 }])
    setEditing(true)
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Readings
        </span>
        {readings.length === 0 ? (
          <span className="text-xs text-slate-400">none</span>
        ) : (
          readings.map((r, i) => (
            <span
              key={i}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {r.label || '—'}: {r.suds}
            </span>
          ))
        )}
        <button
          type="button"
          onClick={() => (readings.length ? setEditing(true) : addReading())}
          className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          {readings.length ? 'Edit' : '+ Add'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Readings
        </span>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Done
        </button>
      </div>
      <div className="flex flex-col gap-1.5">
        {readings.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="text"
              value={r.label}
              onChange={(e) => updateReading(i, { label: e.target.value })}
              placeholder="label (pre, 5min, end…)"
              className={`${inputBaseClass} flex-1`}
            />
            <input
              type="text"
              value={r.time_or_minute}
              onChange={(e) => updateReading(i, { time_or_minute: e.target.value })}
              placeholder="time / minute"
              className={`${inputBaseClass} w-28`}
            />
            <input
              type="number"
              value={r.suds}
              onChange={(e) => updateReading(i, { suds: Number(e.target.value) })}
              placeholder="SUDs"
              className={`${inputBaseClass} w-20`}
            />
            <button
              type="button"
              onClick={() => removeReading(i)}
              aria-label="Remove reading"
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addReading}
          className="mt-0.5 self-start text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          + Add reading
        </button>
      </div>
    </div>
  )
}

/**
 * A comma-separated tag list backed by its own local text state, rather than an
 * input whose value is re-derived from `array.join(', ')` on every keystroke —
 * that pattern trims each keystroke's array item immediately, so a trailing
 * space (or any text before the next comma) gets stripped right back out and
 * typing a space appears to do nothing.
 *
 * Autocomplete is a custom dropdown rather than a native <datalist> — Safari
 * (including iOS) doesn't reliably render datalist suggestions at all, and this
 * app's only real-device reports have all been from iOS Safari.
 */
function TagsInput({
  value,
  onChange,
  suggestions = [],
}: {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
}) {
  const [text, setText] = useState(value.join(', '))
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Resync from the array only when it changed for a reason other than our own
  // onChange below (e.g. a different session's data loaded into this field).
  useEffect(() => {
    const derived = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (JSON.stringify(derived) !== JSON.stringify(value)) {
      setText(value.join(', '))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Only the tag currently being typed (after the last comma) gets suggestions —
  // already-confirmed tags earlier in the text are left alone.
  const lastCommaIndex = text.lastIndexOf(',')
  const prefix = lastCommaIndex === -1 ? '' : `${text.slice(0, lastCommaIndex + 1)} `
  const activeFragment = text.slice(lastCommaIndex + 1).trim()
  const alreadyUsed = new Set(
    text
      .slice(0, lastCommaIndex + 1)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
  const matches =
    focused && !dismissed && activeFragment.length > 0
      ? suggestions
          .filter((s) => {
            const lower = s.toLowerCase()
            return lower.includes(activeFragment.toLowerCase()) && lower !== activeFragment.toLowerCase() && !alreadyUsed.has(lower)
          })
          .slice(0, 6)
      : []

  const commit = (nextText: string) => {
    setText(nextText)
    onChange(
      nextText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
  }

  const selectSuggestion = (s: string) => {
    commit(`${prefix}${s}, `)
    setDismissed(false)
    setHighlighted(0)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => {
          commit(e.target.value)
          setDismissed(false)
          setHighlighted(0)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (matches.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlighted((h) => (h + 1) % matches.length)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted((h) => (h - 1 + matches.length) % matches.length)
          } else if (e.key === 'Enter') {
            e.preventDefault()
            selectSuggestion(matches[highlighted])
          } else if (e.key === 'Escape') {
            setDismissed(true)
          }
        }}
        autoComplete="off"
        className={inputClass}
      />
      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-md dark:border-slate-700 dark:bg-slate-950">
          {matches.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  selectSuggestion(s)
                }}
                className={`block w-full px-3 py-1.5 text-left text-sm ${
                  i === highlighted
                    ? 'bg-amber-100 text-slate-900 dark:bg-amber-950 dark:text-amber-100'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * The two SUDs range bounds are stored as a single [number, number] tuple, so
 * a naive input bound directly to that tuple has to pick a placeholder (0) for
 * the side you haven't typed yet — and since `0 ?? ''` is still `0`, that box
 * can never render empty again once it's been set, making the "0" impossible
 * to actually delete. Local text state per box (same fix as TagsInput above)
 * keeps each box's display independent of the other, only defaulting to 0 in
 * the value handed up to the parent, never in what's shown while typing.
 */
export function TargetRangeInput({
  value,
  onChange,
}: {
  value: [number, number] | null
  onChange: (range: [number, number] | null) => void
}) {
  const [lowText, setLowText] = useState(value ? String(value[0]) : '')
  const [highText, setHighText] = useState(value ? String(value[1]) : '')

  // Resync from the tuple only when it changed for a reason other than our
  // own commit() below (e.g. a different session's data loaded into this field).
  useEffect(() => {
    const derivedLow = lowText === '' ? null : Number(lowText)
    const derivedHigh = highText === '' ? null : Number(highText)
    const derived: [number, number] | null =
      derivedLow === null && derivedHigh === null ? null : [derivedLow ?? 0, derivedHigh ?? 0]
    if (JSON.stringify(derived) !== JSON.stringify(value)) {
      setLowText(value ? String(value[0]) : '')
      setHighText(value ? String(value[1]) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commit = (low: string, high: string) => {
    if (low === '' && high === '') {
      onChange(null)
    } else {
      onChange([low === '' ? 0 : Number(low), high === '' ? 0 : Number(high)])
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={lowText}
        onChange={(e) => {
          setLowText(e.target.value)
          commit(e.target.value, highText)
        }}
        className={inputClass}
      />
      <span className="text-slate-400">–</span>
      <input
        type="number"
        value={highText}
        onChange={(e) => {
          setHighText(e.target.value)
          commit(lowText, e.target.value)
        }}
        className={inputClass}
      />
    </div>
  )
}

// No width baked in, so callers that need a non-full width (e.g. the fixed-width
// columns in the readings row below) can set one without fighting `w-full` for
// specificity — two width utilities on the same element is a Tailwind footgun.
export const inputBaseClass =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-amber-900'

export const inputClass = `w-full ${inputBaseClass}`

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function SectionLabel({ children, full }: { children: ReactNode; full?: boolean }) {
  return (
    <span className={`text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 ${full ? 'sm:col-span-2' : ''}`}>
      {children}
    </span>
  )
}
