import { useEffect, useState, type ReactNode } from 'react'
import type { Session, SudsReading } from '../lib/types'

export default function SessionFields({
  session,
  onChange,
}: {
  session: Session
  onChange: (patch: Partial<Session>) => void
}) {
  const updateReading = (index: number, patch: Partial<SudsReading>) => {
    const readings = session.readings.map((r, i) => (i === index ? { ...r, ...patch } : r))
    onChange({ readings })
  }

  const removeReading = (index: number) => {
    onChange({ readings: session.readings.filter((_, i) => i !== index) })
  }

  const addReading = () => {
    onChange({ readings: [...session.readings, { label: '', time_or_minute: '', suds: 0 }] })
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <Field label="Target SUDs range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={session.target_suds_range?.[0] ?? ''}
            onChange={(e) =>
              onChange({
                target_suds_range: [
                  e.target.value === '' ? 0 : Number(e.target.value),
                  session.target_suds_range?.[1] ?? 0,
                ],
              })
            }
            className={inputClass}
          />
          <span className="text-slate-400">–</span>
          <input
            type="number"
            value={session.target_suds_range?.[1] ?? ''}
            onChange={(e) =>
              onChange({
                target_suds_range: [
                  session.target_suds_range?.[0] ?? 0,
                  e.target.value === '' ? 0 : Number(e.target.value),
                ],
              })
            }
            className={inputClass}
          />
        </div>
      </Field>
      <Field label="Peak / End SUDs">
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
      <Field label="Techniques used (comma separated)">
        <TagsInput value={session.techniques_used} onChange={(techniques_used) => onChange({ techniques_used })} />
      </Field>
      <Field label="Compulsions targeted (comma separated)">
        <TagsInput
          value={session.compulsions_targeted}
          onChange={(compulsions_targeted) => onChange({ compulsions_targeted })}
        />
      </Field>
      <Field label="Scenario / what the exposure was">
        <input
          type="text"
          value={session.rung_description}
          onChange={(e) => onChange({ rung_description: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Notes" full>
        <textarea
          value={session.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={2}
          className={inputClass}
        />
      </Field>

      <div className="sm:col-span-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          SUDs readings
        </span>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {session.readings.map((r, i) => (
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
          {session.readings.length === 0 && (
            <p className="text-xs text-slate-400">No readings added yet.</p>
          )}
          <button
            type="button"
            onClick={addReading}
            className="mt-1 self-start text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            + Add reading
          </button>
        </div>
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
 */
function TagsInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [text, setText] = useState(value.join(', '))

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

  return (
    <input
      type="text"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        onChange(
          e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }}
      className={inputClass}
    />
  )
}

// No width baked in, so callers that need a non-full width (e.g. the fixed-width
// columns in the readings row below) can set one without fighting `w-full` for
// specificity — two width utilities on the same element is a Tailwind footgun.
export const inputBaseClass =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-violet-900'

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
