import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { addSessions } from '../lib/db'
import { createEmptySession } from '../lib/session'
import type { Session } from '../lib/types'
import { colorForHierarchy } from '../lib/colors'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'
import SessionFields, { inputClass, Field } from '../components/SessionFields'

type Phase = 'setup' | 'running' | 'wrapup'

interface Draft {
  phase: Phase
  session: Session
  startedAt: number | null
}

const DRAFT_KEY = 'erp-insights/live-session-draft'
const SUDS_SCALE = Array.from({ length: 11 }, (_, i) => i)

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Draft
  } catch {
    return null
  }
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function LiveSession() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('setup')
  const [session, setSession] = useState<Session>(createEmptySession)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [preSuds, setPreSuds] = useState<number | ''>('')
  const [customSuds, setCustomSuds] = useState('')
  const [nowTick, setNowTick] = useState(Date.now())
  const [saving, setSaving] = useState(false)
  const [restoredNotice, setRestoredNotice] = useState(false)

  // Restore an in-progress session if one exists (e.g. after an accidental reload).
  useEffect(() => {
    const draft = loadDraft()
    if (draft && draft.phase !== 'setup') {
      setPhase(draft.phase)
      setSession(draft.session)
      setStartedAt(draft.startedAt)
      setRestoredNotice(true)
    }
  }, [])

  // Persist progress once a session is actually underway — nothing to lose during setup.
  useEffect(() => {
    if (phase === 'setup') {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ phase, session, startedAt }))
  }, [phase, session, startedAt])

  useEffect(() => {
    if (phase !== 'running') return
    const interval = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [phase])

  const elapsedMs = phase === 'running' && startedAt ? nowTick - startedAt : 0
  const color = colorForHierarchy(session.hierarchy)

  const canStart = session.hierarchy.trim() !== '' && session.rung !== null && preSuds !== ''

  const startSession = () => {
    const now = Date.now()
    setSession((s) => ({
      ...s,
      date: new Date().toISOString().slice(0, 10),
      readings: [{ label: 'pre', time_or_minute: 0, suds: Number(preSuds) }],
      peak_suds: Number(preSuds),
    }))
    setStartedAt(now)
    setPhase('running')
  }

  const logReading = (suds: number) => {
    // Rounded to the nearest 0.01min (~0.6s) — fine enough that closely-timed taps
    // still land at distinct points on the curve, without the ugly long-decimal
    // display an unrounded value would produce in the wrap-up readings editor.
    // "pre" is reserved for the baseline rating taken before the timer starts — a
    // live reading is never relabeled "pre" just because it rounds down to 0min.
    const minutes = startedAt ? Math.round(((Date.now() - startedAt) / 60000) * 100) / 100 : 0
    const label = `${Math.round(minutes * 10) / 10}min`
    setSession((s) => ({
      ...s,
      readings: [...s.readings, { label, time_or_minute: minutes, suds }],
      peak_suds: s.peak_suds === null ? suds : Math.max(s.peak_suds, suds),
    }))
  }

  const logCustom = () => {
    const value = Number(customSuds)
    if (Number.isNaN(value)) return
    logReading(value)
    setCustomSuds('')
  }

  const removeReading = (index: number) => {
    setSession((s) => {
      const readings = s.readings.filter((_, i) => i !== index)
      const peak = readings.length ? Math.max(...readings.map((r) => r.suds)) : null
      return { ...s, readings, peak_suds: peak }
    })
  }

  const stopSession = () => {
    const elapsedMinutes = startedAt ? Math.round((Date.now() - startedAt) / 60000) : 0
    setSession((s) => ({
      ...s,
      planned_duration_minutes: elapsedMinutes,
      end_suds: s.readings.length ? s.readings[s.readings.length - 1].suds : s.end_suds,
    }))
    setPhase('wrapup')
  }

  const cancelSession = () => {
    if (!confirm('Discard this in-progress session? Everything logged so far will be lost.')) return
    localStorage.removeItem(DRAFT_KEY)
    setSession(createEmptySession())
    setStartedAt(null)
    setPreSuds('')
    setPhase('setup')
  }

  const saveSession = async () => {
    setSaving(true)
    await addSessions([session])
    localStorage.removeItem(DRAFT_KEY)
    setSaving(false)
    navigate('/')
  }

  const chartData = session.readings.map((r) => ({
    minutes: typeof r.time_or_minute === 'number' ? r.time_or_minute : 0,
    suds: r.suds,
    label: r.label,
  }))

  if (phase === 'setup') {
    return (
      <div className="flex flex-col gap-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Start a live session</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Set up the exposure, rate how you feel right now, then start the timer. Everything stays on this
            device the whole time.
          </p>
        </div>
        <Card className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Hierarchy">
              <input
                type="text"
                value={session.hierarchy}
                onChange={(e) => setSession((s) => ({ ...s, hierarchy: e.target.value }))}
                placeholder="e.g. Harm/Contamination"
                className={inputClass}
              />
            </Field>
            <Field label="Rung">
              <input
                type="number"
                value={session.rung ?? ''}
                onChange={(e) =>
                  setSession((s) => ({ ...s, rung: e.target.value === '' ? null : Number(e.target.value) }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Variation">
              <input
                type="text"
                value={session.variation ?? ''}
                onChange={(e) => setSession((s) => ({ ...s, variation: e.target.value || null }))}
                className={inputClass}
              />
            </Field>
            <Field label="Target SUDs range">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={session.target_suds_range?.[0] ?? ''}
                  onChange={(e) =>
                    setSession((s) => ({
                      ...s,
                      target_suds_range: [
                        e.target.value === '' ? 0 : Number(e.target.value),
                        s.target_suds_range?.[1] ?? 0,
                      ],
                    }))
                  }
                  className={inputClass}
                />
                <span className="text-slate-400">–</span>
                <input
                  type="number"
                  value={session.target_suds_range?.[1] ?? ''}
                  onChange={(e) =>
                    setSession((s) => ({
                      ...s,
                      target_suds_range: [
                        s.target_suds_range?.[0] ?? 0,
                        e.target.value === '' ? 0 : Number(e.target.value),
                      ],
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </Field>
            <Field label="Scenario / what the exposure is" full>
              <input
                type="text"
                value={session.rung_description}
                onChange={(e) => setSession((s) => ({ ...s, rung_description: e.target.value }))}
                className={inputClass}
              />
            </Field>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Pre-exposure SUDs — how anxious do you feel right now?
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUDS_SCALE.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPreSuds(n)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    preSuds === n
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                  style={preSuds === n ? { backgroundColor: color.hex } : undefined}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <PrimaryButton onClick={startSession} disabled={!canStart} className="self-start">
            Start exposure
          </PrimaryButton>
          {!canStart && (
            <p className="text-xs text-slate-400">Hierarchy, rung, and a pre-exposure SUDs rating are needed to start.</p>
          )}
        </Card>
      </div>
    )
  }

  if (phase === 'running') {
    return (
      <div className="flex flex-col gap-6 py-4">
        {restoredNotice && (
          <Card className="border-violet-300 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/40">
            <p className="text-sm text-violet-800 dark:text-violet-300">
              Picked back up an in-progress session that was still running.
            </p>
          </Card>
        )}
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {session.hierarchy} · Rung {session.rung}
            {session.variation ? ` · ${session.variation}` : ''}
          </span>
          <span className="text-5xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {formatElapsed(elapsedMs)}
          </span>
          <span className="text-xs text-slate-400">elapsed</span>
        </Card>

        <Card>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Log a SUDs rating
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SUDS_SCALE.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => logReading(n)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: color.hex }}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={customSuds}
              onChange={(e) => setCustomSuds(e.target.value)}
              placeholder="or a precise value, e.g. 2.5"
              className={`${inputClass} w-52`}
            />
            <SecondaryButton onClick={logCustom} disabled={customSuds === ''}>
              Log
            </SecondaryButton>
          </div>
        </Card>

        {chartData.length > 1 && (
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">SUDs so far</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  {session.target_suds_range && (
                    <ReferenceArea
                      y1={session.target_suds_range[0]}
                      y2={session.target_suds_range[1]}
                      fill={color.hex}
                      fillOpacity={0.08}
                    />
                  )}
                  <XAxis dataKey="minutes" tick={{ fontSize: 11 }} label={{ value: 'minutes', position: 'insideBottom', offset: -4, fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(value) => [`${value} SUDs`, '']} />
                  <Line type="monotone" dataKey="suds" stroke={color.hex} strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {session.readings.length > 0 && (
          <Card>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Readings logged
            </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {session.readings.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => removeReading(i)}
                  title="Tap to remove"
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-300"
                >
                  {r.label}: {r.suds} ✕
                </button>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <SecondaryButton
            onClick={cancelSession}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
          >
            Discard
          </SecondaryButton>
          <PrimaryButton onClick={stopSession}>Stop exposure</PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Wrap up the session</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {session.planned_duration_minutes} minute exposure logged. Fill in the rest, then save.
        </p>
      </div>
      <Card className="flex flex-col gap-4">
        <SessionFields session={session} onChange={(patch) => setSession((s) => ({ ...s, ...patch }))} />
        <div className="flex gap-3">
          <SecondaryButton onClick={cancelSession} disabled={saving}>
            Discard
          </SecondaryButton>
          <PrimaryButton onClick={saveSession} disabled={saving}>
            {saving ? 'Saving…' : 'Save session'}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  )
}
