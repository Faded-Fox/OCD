/**
 * A single, editable guide meant to be handed to (or read by) the people you
 * trust during a hard OCD stretch. Unlike Focus Plan's SUDS_SCALE/DEFUSION_TECHNIQUES,
 * none of this content is templated in source — it's inherently personal (and the
 * contact fields specifically must never live in a public repo), so every field
 * starts blank and is filled in and stored locally, like session/journal data.
 */
export interface FlareGuide {
  id: string
  updatedAt: string
  introNote: string
  signs: string
  whatHelps: string
  mostHelpfulThing: string
  whatDoesntHelp: string
  reassuranceNote: string
  agreedPhrase: string
  contactName: string
  contactPhone: string
  spaceOrStayNote: string
  whatNotToDo: string
  recoverySigns: string
  closingNote: string
}

export const FLARE_GUIDE_ID = 'singleton'

export function createEmptyFlareGuide(): FlareGuide {
  return {
    id: FLARE_GUIDE_ID,
    updatedAt: new Date().toISOString(),
    introNote: '',
    signs: '',
    whatHelps: '',
    mostHelpfulThing: '',
    whatDoesntHelp: '',
    reassuranceNote: '',
    agreedPhrase: '',
    contactName: '',
    contactPhone: '',
    spaceOrStayNote: '',
    whatNotToDo: '',
    recoverySigns: '',
    closingNote: '',
  }
}

/** Formats the guide's filled-in sections into one plain-text block, suitable for
 *  the native share sheet or clipboard — skips any section that's still blank. */
export function buildFlareGuideText(guide: FlareGuide): string {
  const lines: string[] = ['My OCD Flare-Up Guide', '']

  const section = (heading: string | null, body: string) => {
    if (!body.trim()) return
    if (heading) lines.push(heading)
    lines.push(body.trim(), '')
  }

  section(null, guide.introNote)
  section('WHAT IT LOOKS LIKE WHEN THINGS ARE HARD', guide.signs)
  section('WHAT HELPS MOST', guide.whatHelps)
  section('THE SINGLE MOST HELPFUL THING', guide.mostHelpfulThing)
  section("WHAT DOESN'T HELP (EVEN IF IT SEEMS KIND)", guide.whatDoesntHelp)
  section('IF REASSURANCE IS ASKED FOR', guide.reassuranceNote)
  if (guide.agreedPhrase.trim()) {
    lines.push('THE AGREED PHRASE', `"${guide.agreedPhrase.trim()}"`, '')
  }

  const contact = [guide.contactName.trim(), guide.contactPhone.trim()].filter(Boolean).join(' — ')
  if (contact || guide.spaceOrStayNote.trim() || guide.whatNotToDo.trim()) {
    lines.push('IF THINGS FEEL REALLY BAD')
    if (contact) lines.push(`Support contact: ${contact}`)
    if (guide.spaceOrStayNote.trim()) lines.push(guide.spaceOrStayNote.trim())
    if (guide.whatNotToDo.trim()) lines.push(`What not to do: ${guide.whatNotToDo.trim()}`)
    lines.push('')
  }

  section('SIGNS THINGS ARE GETTING BETTER', guide.recoverySigns)
  section(null, guide.closingNote)

  return lines.join('\n').trim()
}

export function isFlareGuideEmpty(guide: FlareGuide): boolean {
  return (
    !guide.introNote.trim() &&
    !guide.signs.trim() &&
    !guide.whatHelps.trim() &&
    !guide.mostHelpfulThing.trim() &&
    !guide.whatDoesntHelp.trim() &&
    !guide.reassuranceNote.trim() &&
    !guide.agreedPhrase.trim() &&
    !guide.contactName.trim() &&
    !guide.contactPhone.trim() &&
    !guide.spaceOrStayNote.trim() &&
    !guide.whatNotToDo.trim() &&
    !guide.recoverySigns.trim() &&
    !guide.closingNote.trim()
  )
}
