/** Deterministic collaborator matching.
 *
 * Given a project (either a saved mHub activity or a typed brief) this ranks
 * collaborators by how well they fit funding or partnering on it. No AI call:
 * scoring is weighted tag overlap, so it is instant, free, and -- more usefully
 * -- explainable. Every result carries the reasons that produced its score, so
 * the UI can tell a user *why* something ranked where it did.
 *
 * The scoring model is a weighted sum of three signals, each normalised to
 * 0..1, with weights summing to 1:
 *
 *   focus fit  (0.80) -- overlap between the project's focus areas and the
 *                        collaborator's, weighted so mHub's core areas count
 *                        double a peripheral sector
 *   region fit (0.12) -- does the collaborator actually operate where the
 *                        project runs
 *   support fit(0.08) -- does it offer the kind of help the project asked for
 *
 * A collaborator with no focus overlap at all is excluded rather than scored,
 * so the list never pads itself out with irrelevant organisations.
 */
import { FOCUS_AREAS, focusLabel, focusWeight, normaliseFocusTags } from '../data/focusAreas'

const WEIGHT_FOCUS = 0.8
const WEIGHT_REGION = 0.12
const WEIGHT_SUPPORT = 0.08

/** Asking for funding and being shown an organisation that cannot fund anything
 * is a bad answer however well its focus areas line up. The 0.08 support weight
 * is far too small to express that on its own, so a collaborator offering none
 * of the support explicitly requested has its score scaled down instead. It
 * stays in the list -- the focus overlap is still real, and it may be worth
 * approaching for another reason -- but it no longer outranks organisations
 * that can actually do the thing that was asked for. */
const NO_SUPPORT_PENALTY = 0.65

/** How much of the project's focus the collaborator covers vs. how much of the
 * collaborator's remit this project occupies. Coverage dominates -- a broad
 * funder that covers everything we need is still a good match -- but the focus
 * term stops a scattergun organisation from beating a specialist. */
const COVERAGE_SHARE = 0.75
const SPECIFICITY_SHARE = 0.25

const sumWeight = (tags) => tags.reduce((total, tag) => total + focusWeight(tag), 0)

/** Resolve free text to focus-area tags using the vocabulary's keywords.
 * Deliberately conservative: it only ever returns ids from FOCUS_AREAS, so a
 * typed brief can never introduce a tag the collaborator database doesn't use. */
export function deriveTags(text) {
  if (typeof text !== 'string' || !text.trim()) return []
  const haystack = text.toLowerCase()
  return FOCUS_AREAS.filter((area) => area.keywords.some((word) => haystack.includes(word))).map((area) => area.id)
}

/** Build a project descriptor from a saved activity record. */
export function projectFromActivity(activity) {
  const text = [activity?.title, activity?.description, activity?.copy, activity?.type].filter(Boolean).join(' ')
  return {
    title: activity?.title || 'Untitled activity',
    tags: deriveTags(text),
    region: activity?.region || 'Malawi',
    supportTypes: [],
  }
}

/** Build a project descriptor from a typed brief. */
export function projectFromBrief({ title, brief, tags, region, supportTypes } = {}) {
  return {
    title: title?.trim() || 'New project',
    // An explicit tag selection always wins over keyword inference.
    tags: normaliseFocusTags(tags?.length ? tags : deriveTags(brief)),
    region: region || 'Malawi',
    supportTypes: supportTypes || [],
  }
}

/** 1 when the collaborator plainly operates where the project runs, tapering
 * for continental and global reach. Unknown coverage scores mid, not zero --
 * an unrecorded region is missing data, not evidence of a bad fit. */
function regionFit(project, collaborator) {
  const regions = (collaborator.regions || []).map((region) => region.toLowerCase())
  if (!regions.length) return 0.5
  const target = (project.region || '').toLowerCase()
  if (target && regions.some((region) => region.includes(target) || target.includes(region))) return 1
  if (regions.some((region) => region.includes('malawi'))) return 1
  if (regions.some((region) => region.includes('africa'))) return 0.8
  if (regions.some((region) => region.includes('global'))) return 0.6
  return 0.2
}

/** Share of the requested support types the collaborator actually offers.
 * Asking for nothing in particular is not held against anyone. */
function supportFit(project, collaborator) {
  const requested = project.supportTypes || []
  if (!requested.length) return 0.5
  const offered = new Set(collaborator.supportTypes || [])
  const met = requested.filter((type) => offered.has(type))
  return met.length / requested.length
}

/** Score one collaborator against one project.
 * Returns null when there is no focus overlap -- the caller drops it. */
export function scoreCollaborator(project, collaborator) {
  const projectTags = normaliseFocusTags(project.tags)
  const collaboratorTags = normaliseFocusTags(collaborator.focusTags)
  if (!projectTags.length || !collaboratorTags.length) return null

  const matched = projectTags.filter((tag) => collaboratorTags.includes(tag))
  if (!matched.length) return null

  const matchedWeight = sumWeight(matched)
  const coverage = matchedWeight / sumWeight(projectTags)
  const specificity = matchedWeight / sumWeight(collaboratorTags)
  const focus = COVERAGE_SHARE * coverage + SPECIFICITY_SHARE * specificity

  const region = regionFit(project, collaborator)
  const support = supportFit(project, collaborator)
  const penalty = (project.supportTypes || []).length && support === 0 ? NO_SUPPORT_PENALTY : 1
  const weighted = WEIGHT_FOCUS * focus + WEIGHT_REGION * region + WEIGHT_SUPPORT * support
  const score = Math.round(100 * weighted * penalty)

  const reasons = [`Works in ${matched.map(focusLabel).join(', ')}`]
  if (region === 1) reasons.push(`Operates in ${project.region}`)
  else if (region >= 0.6) reasons.push(`Regional reach covers ${project.region}`)
  else if (region <= 0.2) reasons.push('No recorded presence in this region')

  const requested = project.supportTypes || []
  if (requested.length) {
    const offered = new Set(collaborator.supportTypes || [])
    const met = requested.filter((type) => offered.has(type))
    if (met.length === requested.length) reasons.push('Offers every kind of support requested')
    else if (met.length) reasons.push('Offers some of the support requested')
    else reasons.push('Does not offer the support requested')
  }

  const missing = projectTags.filter((tag) => !collaboratorTags.includes(tag))

  return { collaborator, score, matchedTags: matched, missingTags: missing, reasons }
}

/** Rank a whole directory against a project, best first. */
export function rankCollaborators(project, collaborators) {
  return (collaborators || [])
    .map((collaborator) => scoreCollaborator(project, collaborator))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.collaborator.name.localeCompare(b.collaborator.name))
}
