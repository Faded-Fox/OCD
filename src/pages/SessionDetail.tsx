import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useSessions } from '../lib/useSessions'
import { deleteSession, updateSession } from '../lib/db'
import { displayCurve } from '../lib/insights'
import { colorForHierarchy } from '../lib/colors'
import { Card, EmptyState, Badge, SecondaryButton, PrimaryButton } from '../components/ui'
import HierarchyBadge from '../components/HierarchyBadge'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const { sessions, loading, refresh } = useSessions()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const session = sessions.find((s) => s.id === id)

  useEffect(() => {
    if (!session?.photo) {
      setPhotoUrl(null)
      return
    }
    const url = URL.createObjectURL(session.photo)
    setPhotoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [session?.photo])

  if (loading) return <p className="py-10 text-center text-sm text-slate-400">Loading…</p>

  if (!session) {
    return <EmptyState title="Session not found" body="It may have been deleted." />
  }

  const color = colorForHierarchy(session.hierarchy)
  const { points: curve, isTimeBased } = displayCurve(session)

  const removePhoto = async () => {
    if (!confirm('Remove the attached photo? The session itself will be kept.')) return
    await updateSession({ ...session, photo: null })
    refresh()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this session? This cannot be undone.')) return
    await deleteSession(session.id)
    navigate('/')
  }

  const startEdit = () => {
    setNotes(session.notes)
    setEditing(true)
  }

  const saveNotes = async () => {
    await updateSession({ ...session, notes })
    setEditing(false)
    refresh()
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <Link
          to={`/hierarchy/${encodeURIComponent(session.hierarchy)}`}
          className="text-sm text-violet-600 hover:underline dark:text-violet-400"
        >
          ← {session.hierarchy || 'Unlabeled'}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HierarchyBadge hierarchy={session.hierarchy} />
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Rung {session.rung ?? '—'}
              {session.variation ? ` · ${session.variation}` : ''}
            </h1>
          </div>
          <SecondaryButton onClick={handleDelete} className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950">
            Delete session
          </SecondaryButton>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{session.date || 'no date'}</p>
      </div>

      {session.flags.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Flagged during import
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-amber-800 dark:text-amber-300">
            {session.flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Peak SUDs</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">{session.peak_suds ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">End SUDs</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">{session.end_suds ?? '—'}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Target range</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">
            {session.target_suds_range ? `${session.target_suds_range[0]}–${session.target_suds_range[1]}` : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Resistance</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">
            {session.compulsions_resisted === true ? 'Full' : session.compulsions_resisted === false ? 'Partial' : '—'}
          </p>
        </Card>
      </div>

      {curve.length > 1 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">SUDs curve</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                {session.target_suds_range && (
                  <ReferenceArea
                    y1={session.target_suds_range[0]}
                    y2={session.target_suds_range[1]}
                    fill={color.hex}
                    fillOpacity={0.08}
                  />
                )}
                <XAxis
                  dataKey="x"
                  tick={{ fontSize: 11 }}
                  label={{ value: isTimeBased ? 'minutes' : 'reading order', position: 'insideBottom', offset: -4, fontSize: 11 }}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  formatter={(value) => [`${value} SUDs`, '']}
                  labelFormatter={(x, payload) =>
                    isTimeBased ? `${payload?.[0]?.payload?.label ?? ''} · ${x} min` : `${payload?.[0]?.payload?.label ?? ''}`
                  }
                />
                <Line type="monotone" dataKey="suds" stroke={color.hex} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {!isTimeBased && (
            <p className="mt-2 text-xs text-slate-400">
              Readings couldn't be matched to exact times, so they're shown in logged order rather than on a
              real timeline.
            </p>
          )}
        </Card>
      )}

      {photoUrl && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Original photo</h2>
            <button
              type="button"
              onClick={removePhoto}
              className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
            >
              Remove photo
            </button>
          </div>
          <button type="button" onClick={() => window.open(photoUrl, '_blank')} className="block">
            <img
              src={photoUrl}
              alt="Original handwritten log"
              style={{ imageOrientation: 'from-image' }}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          </button>
          <p className="mt-2 text-xs text-slate-400">Tap the photo to view full size</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Compulsions targeted</h2>
          {session.compulsions_targeted.length ? (
            <div className="flex flex-wrap gap-1.5">
              {session.compulsions_targeted.map((c, i) => (
                <Badge
                  key={i}
                  className={
                    session.compulsions_completed.includes(c)
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }
                >
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">None logged</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Techniques used</h2>
          {session.techniques_used.length ? (
            <div className="flex flex-wrap gap-1.5">
              {session.techniques_used.map((t, i) => (
                <Badge key={i} className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  {t}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">None logged</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</h2>
          {!editing && (
            <button type="button" onClick={startEdit} className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400">
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-violet-900"
            />
            <div className="flex gap-2">
              <PrimaryButton onClick={saveNotes}>Save</PrimaryButton>
              <SecondaryButton onClick={() => setEditing(false)}>Cancel</SecondaryButton>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300">{session.notes || 'No notes.'}</p>
        )}
      </Card>

      {session.rung_description && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Scenario</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{session.rung_description}</p>
        </Card>
      )}
    </div>
  )
}
