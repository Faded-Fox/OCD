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
