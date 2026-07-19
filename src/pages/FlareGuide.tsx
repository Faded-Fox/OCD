import { useState } from 'react'
import { saveFlareGuide } from '../lib/db'
import { createEmptyFlareGuide, isFlareGuideEmpty, type FlareGuide } from '../lib/flareGuide'
import { useFlareGuide } from '../lib/useFlareGuide'
import { Card, PrimaryButton, SecondaryButton, EmptyState } from '../components/ui'
import { inputClass, Field } from '../components/SessionFields'

export default function FlareGuidePage() {
  const { guide, loading, refresh } = useFlareGuide()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<FlareGuide | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  const startEdit = () => {
    setDraft(guide ?? createEmptyFlareGuide())
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(null)
    setEditing(false)
  }

  const save = async () => {
    if (!draft) return
    setSaving(true)
    await saveFlareGuide({ ...draft, updatedAt: new Date().toISOString() })
    setSaving(false)
    setEditing(false)
    setDraft(null)
    refresh()
  }

  if (editing && draft) {
    return <FlareGuideForm draft={draft} onChange={setDraft} onCancel={cancelEdit} onSave={save} saving={saving} />
  }

  if (!guide || isFlareGuideEmpty(guide)) {
    return (
      <EmptyState
        title="No flare guide yet"
        body="A guide for the people you trust — what a hard stretch looks like for you, what actually helps, and what to do if things feel really bad. Written by you, stored only on this device."
        action={<PrimaryButton onClick={startEdit}>Get started</PrimaryButton>}
      />
    )
  }

  return <FlareGuideView guide={guide} onEdit={startEdit} />
}

function FlareGuideView({ guide, onEdit }: { guide: FlareGuide; onEdit: () => void }) {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Flare-Up Guide</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Written for the people you trust. Hand them your phone, open to this page.
          </p>
        </div>
        <SecondaryButton onClick={onEdit}>Edit</SecondaryButton>
      </div>

      {guide.introNote.trim() && (
        <Card>
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{guide.introNote}</p>
        </Card>
      )}

      {guide.signs.trim() && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            What it looks like when things are hard
          </h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{guide.signs}</p>
        </Card>
      )}

      {guide.whatHelps.trim() && (
        <Card className="border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <h2 className="mb-2 text-sm font-semibold text-emerald-900 dark:text-emerald-300">What helps most</h2>
          <p className="whitespace-pre-wrap text-sm text-emerald-800 dark:text-emerald-300">{guide.whatHelps}</p>
        </Card>
      )}

      {guide.mostHelpfulThing.trim() && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <h2 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
            The single most helpful thing
          </h2>
          <p className="whitespace-pre-wrap text-sm text-amber-800 dark:text-amber-300">{guide.mostHelpfulThing}</p>
        </Card>
      )}

      {guide.whatDoesntHelp.trim() && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            What doesn't help (even if it seems kind)
          </h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{guide.whatDoesntHelp}</p>
        </Card>
      )}

      {guide.reassuranceNote.trim() && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">If reassurance is asked for</h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{guide.reassuranceNote}</p>
        </Card>
      )}

      {guide.agreedPhrase.trim() && (
        <Card className="border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
          <h2 className="mb-2 text-sm font-semibold text-emerald-900 dark:text-emerald-300">The agreed phrase</h2>
          <p className="whitespace-pre-wrap text-lg italic text-emerald-800 dark:text-emerald-300">
            "{guide.agreedPhrase}"
          </p>
        </Card>
      )}

      {(guide.contactName.trim() || guide.contactPhone.trim() || guide.spaceOrStayNote.trim() || guide.whatNotToDo.trim()) && (
        <Card className="border-rose-200 dark:border-rose-900">
          <h2 className="mb-2 text-sm font-semibold text-rose-700 dark:text-rose-400">If things feel really bad</h2>
          <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
            {(guide.contactName.trim() || guide.contactPhone.trim()) && (
              <p>
                <span className="font-medium">Support contact: </span>
                {guide.contactName}
                {guide.contactName && guide.contactPhone ? ' — ' : ''}
                {guide.contactPhone}
              </p>
            )}
            {guide.spaceOrStayNote.trim() && (
              <p className="whitespace-pre-wrap">{guide.spaceOrStayNote}</p>
            )}
            {guide.whatNotToDo.trim() && (
              <p className="whitespace-pre-wrap">
                <span className="font-medium">What not to do: </span>
                {guide.whatNotToDo}
              </p>
            )}
          </div>
        </Card>
      )}

      {guide.recoverySigns.trim() && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Signs things are getting better
          </h2>
          <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{guide.recoverySigns}</p>
        </Card>
      )}

      {guide.closingNote.trim() && (
        <Card>
          <p className="whitespace-pre-wrap text-sm italic text-slate-600 dark:text-slate-300">{guide.closingNote}</p>
        </Card>
      )}
    </div>
  )
}

function FlareGuideForm({
  draft,
  onChange,
  onCancel,
  onSave,
  saving,
}: {
  draft: FlareGuide
  onChange: (draft: FlareGuide) => void
  onCancel: () => void
  onSave: () => void
  saving: boolean
}) {
  const patch = (p: Partial<FlareGuide>) => onChange({ ...draft, ...p })

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
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Flare-Up Guide</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Everything here stays on this device — nothing is ever uploaded. Write it for the specific people you'd
          hand your phone to.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <Field label="A note from you">
          <textarea
            value={draft.introNote}
            onChange={(e) => patch({ introNote: e.target.value })}
            placeholder="Why you're sharing this, and what you want the reader to know going in."
            rows={3}
            className={inputClass}
          />
        </Field>
        <Field label="What it looks like when things are hard">
          <textarea
            value={draft.signs}
            onChange={(e) => patch({ signs: e.target.value })}
            placeholder="Signs someone close to you might notice."
            rows={3}
            className={inputClass}
          />
        </Field>
        <Field label="What helps most">
          <textarea
            value={draft.whatHelps}
            onChange={(e) => patch({ whatHelps: e.target.value })}
            placeholder="Things that genuinely help in the moment."
            rows={3}
            className={inputClass}
          />
        </Field>
        <Field label="The single most helpful thing">
          <textarea
            value={draft.mostHelpfulThing}
            onChange={(e) => patch({ mostHelpfulThing: e.target.value })}
            placeholder="If there's one thing that reliably works, put it here."
            rows={2}
            className={inputClass}
          />
        </Field>
        <Field label="What doesn't help (even if it seems kind)">
          <textarea
            value={draft.whatDoesntHelp}
            onChange={(e) => patch({ whatDoesntHelp: e.target.value })}
            placeholder="Well-intentioned things that can make it worse."
            rows={3}
            className={inputClass}
          />
        </Field>
        <Field label="If reassurance is asked for">
          <textarea
            value={draft.reassuranceNote}
            onChange={(e) => patch({ reassuranceNote: e.target.value })}
            placeholder="What's going on if you ask the same question more than once, and why."
            rows={3}
            className={inputClass}
          />
        </Field>
        <Field label="The agreed phrase">
          <input
            type="text"
            value={draft.agreedPhrase}
            onChange={(e) => patch({ agreedPhrase: e.target.value })}
            placeholder="The exact words that help, said calmly."
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Support contact name">
            <input
              type="text"
              value={draft.contactName}
              onChange={(e) => patch({ contactName: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Support contact phone">
            <input
              type="tel"
              value={draft.contactPhone}
              onChange={(e) => patch({ contactPhone: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Space or stay">
          <textarea
            value={draft.spaceOrStayNote}
            onChange={(e) => patch({ spaceOrStayNote: e.target.value })}
            placeholder="How to tell whether you want company or space, and how to ask."
            rows={2}
            className={inputClass}
          />
        </Field>
        <Field label="What not to do if things feel really bad">
          <textarea
            value={draft.whatNotToDo}
            onChange={(e) => patch({ whatNotToDo: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </Field>
        <Field label="Signs things are getting better">
          <textarea
            value={draft.recoverySigns}
            onChange={(e) => patch({ recoverySigns: e.target.value })}
            rows={3}
            className={inputClass}
          />
        </Field>
        <Field label="Closing note">
          <textarea
            value={draft.closingNote}
            onChange={(e) => patch({ closingNote: e.target.value })}
            placeholder="Anything you want to say at the end."
            rows={2}
            className={inputClass}
          />
        </Field>
      </Card>

      <div className="flex gap-3">
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Cancel
        </SecondaryButton>
        <PrimaryButton onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save guide'}
        </PrimaryButton>
      </div>
    </div>
  )
}
