import { useRef, useState } from 'react'
import { createEmptySession } from '../lib/session'
import type { Session } from '../lib/types'
import { Card, PrimaryButton, SecondaryButton } from './ui'
import SessionFields from './SessionFields'

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

async function toDisplayBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('failed to encode photo'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

export default function PhotoEntry({ onSave }: { onSave: (session: Session) => Promise<void> }) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const [session, setSession] = useState<Session>(createEmptySession)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    setProcessing(true)
    try {
      const blob = await toDisplayBlob(file)
      if (photoUrl) URL.revokeObjectURL(photoUrl)
      setPhotoUrl(URL.createObjectURL(blob))
      setSession((s) => ({ ...s, photo: blob }))
    } catch {
      setError("Couldn't read that photo — try a different file.")
    } finally {
      setProcessing(false)
    }
  }

  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    setSession((s) => ({ ...s, photo: null }))
  }

  const update = (patch: Partial<Session>) => setSession((s) => ({ ...s, ...patch }))

  const save = async () => {
    setSaving(true)
    await onSave(session)
    setSaving(false)
  }

  if (!photoUrl) {
    return (
      <Card className="flex flex-col items-center gap-4 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 0 1 2-2h1.5l1-1.5h9l1 1.5H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"
            />
            <circle cx="12" cy="13" r="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add a photo of a handwritten log</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            No automatic reading — the photo stays right next to a blank form so you can quickly type in what
            you wrote. Nothing is uploaded anywhere; the photo is stored only on this device.
          </p>
        </div>
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <div className="flex flex-wrap justify-center gap-3">
          <PrimaryButton onClick={() => cameraInputRef.current?.click()} disabled={processing}>
            {processing ? 'Processing…' : 'Take a photo'}
          </PrimaryButton>
          <SecondaryButton onClick={() => libraryInputRef.current?.click()} disabled={processing}>
            Upload existing photo
          </SecondaryButton>
        </div>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
      <Card className="flex flex-col gap-2 lg:sticky lg:top-4">
        <button type="button" onClick={() => window.open(photoUrl, '_blank')} className="block">
          <img
            src={photoUrl}
            alt="Uploaded handwritten log"
            style={{ imageOrientation: 'from-image' }}
            className="max-h-[70vh] w-full rounded-xl object-contain"
          />
        </button>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Tap the photo to view full size</span>
          <button
            type="button"
            onClick={clearPhoto}
            className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
          >
            Remove photo
          </button>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <SessionFields session={session} onChange={update} />
        <div className="flex gap-3">
          <SecondaryButton onClick={clearPhoto} disabled={saving}>
            Start over
          </SecondaryButton>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save session'}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  )
}
