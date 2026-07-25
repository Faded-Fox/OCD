import { useState } from 'react'
import { saveValuesGuide } from '../lib/db'
import { newId } from '../lib/session'
import { createEmptyValuesGuide, isValuesGuideEmpty, type ValueItem, type ValuesGuide } from '../lib/values'
import { useValuesGuide } from '../lib/useValuesGuide'
import { Card, PrimaryButton, SecondaryButton, EmptyState } from '../components/ui'
import { inputBaseClass, inputClass } from '../components/SessionFields'

export default function ValuesPage() {
  const { guide, loading, refresh } = useValuesGuide()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ValuesGuide | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  const startEdit = () => {
    setDraft(guide ?? createEmptyValuesGuide())
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(null)
    setEditing(false)
  }

  const save = async () => {
    if (!draft) return
    setSaving(true)
    await saveValuesGuide({
      ...draft,
      values: draft.values.filter((v) => v.label.trim()),
      updatedAt: new Date().toISOString(),
    })
    setSaving(false)
    setEditing(false)
    setDraft(null)
    refresh()
  }

  if (editing && draft) {
    return <ValuesForm draft={draft} onChange={setDraft} onCancel={cancelEdit} onSave={save} saving={saving} />
  }

  if (!guide || isValuesGuideEmpty(guide)) {
    return (
      <EmptyState
        title="No values set yet"
        body="The reasons this hard work is worth doing — people, hobbies, whatever actually matters to you. Written by you, stored only on this device."
        action={<PrimaryButton onClick={startEdit}>Get started</PrimaryButton>}
      />
    )
  }

  return <ValuesView guide={guide} onEdit={startEdit} />
}

function ValuesView({ guide, onEdit }: { guide: ValuesGuide; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Values</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            ERP isn't about feeling less anxious — it's about living life. Why you're doing this, worth rereading
            before something hard.
          </p>
        </div>
        <SecondaryButton onClick={onEdit}>Edit</SecondaryButton>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {guide.values.map((v) => (
          <Card key={v.id} className="flex items-start gap-3">
            <span className="text-2xl leading-none">{v.icon || '⭐'}</span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{v.label}</h2>
              {v.note.trim() && (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{v.note}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ValuesForm({
  draft,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  draft: ValuesGuide
  onChange: (draft: ValuesGuide) => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
}) {
  const patchItem = (id: string, patch: Partial<ValueItem>) =>
    onChange({ ...draft, values: draft.values.map((v) => (v.id === id ? { ...v, ...patch } : v)) })

  const addItem = () =>
    onChange({ ...draft, values: [...draft.values, { id: newId(), icon: '', label: '', note: '' }] })

  const removeItem = (id: string) => onChange({ ...draft, values: draft.values.filter((v) => v.id !== id) })

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← Cancel
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Values</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Everything here stays on this device. A few words each is plenty — an icon or emoji, a short label,
          and an optional note on why it matters.
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        {draft.values.length === 0 && (
          <p className="text-sm text-slate-400">No values yet — add your first one below.</p>
        )}
        {draft.values.map((v) => (
          <div
            key={v.id}
            className="flex items-start gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"
          >
            <input
              type="text"
              value={v.icon}
              onChange={(e) => patchItem(v.id, { icon: e.target.value })}
              placeholder="🦊"
              maxLength={4}
              aria-label="Icon"
              className={`${inputBaseClass} w-14 text-center text-lg`}
            />
            <div className="flex flex-1 flex-col gap-1.5">
              <input
                type="text"
                value={v.label}
                onChange={(e) => patchItem(v.id, { label: e.target.value })}
                placeholder="e.g. Family"
                aria-label="Value"
                className={inputClass}
              />
              <input
                type="text"
                value={v.note}
                onChange={(e) => patchItem(v.id, { note: e.target.value })}
                placeholder="Why this matters — optional"
                aria-label="Note"
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => removeItem(v.id)}
              aria-label="Remove value"
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="self-start text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          + Add a value
        </button>
      </Card>

      <div className="flex gap-3">
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Cancel
        </SecondaryButton>
        <PrimaryButton onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save values'}
        </PrimaryButton>
      </div>
    </div>
  )
}
