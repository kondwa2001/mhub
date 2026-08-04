/** mHub's focus areas -- the controlled vocabulary for the collaborator database.
 *
 * This list is the "only what mHub does" constraint: a collaborator record is
 * only accepted into Firestore if it is tagged with at least one id from here,
 * and any tag outside this list is rejected. Widening what the platform stores
 * means adding an entry here first, deliberately.
 *
 * `keywords` let a free-text project brief be resolved to tags without an AI
 * call -- see deriveTags() in ../matching/collaboratorMatching.js. Keep them
 * lowercase and distinctive; a keyword that appears in most briefs (e.g.
 * "project") drags every area in and makes the ranking meaningless.
 *
 * `core` marks the areas mHub is actually built around, as opposed to the
 * sectors its ventures happen to operate in. Core areas count for more when
 * scoring, so a digital-skills funder outranks a generic health funder on a
 * digital-skills project.
 */
export const FOCUS_AREAS = [
  {
    id: 'ict',
    label: 'Technology & ICT',
    core: true,
    keywords: ['technology', 'tech ', 'ict', 'software', 'digital solution', 'platform', 'app ', 'engineering'],
  },
  {
    id: 'entrepreneurship',
    label: 'Entrepreneurship & startups',
    core: true,
    keywords: ['entrepreneur', 'startup', 'start-up', 'venture', 'founder', 'business skill', 'sme', 'enterprise'],
  },
  {
    id: 'youth',
    label: 'Youth development',
    core: true,
    keywords: ['youth', 'young people', 'young person', 'adolescent', 'teenager', 'graduate'],
  },
  {
    id: 'digital-skills',
    label: 'Digital skills training',
    core: true,
    keywords: ['digital skill', 'coding', 'computer literacy', 'ict training', 'bootcamp', 'curriculum', 'upskill', 'training lab'],
  },
  {
    id: 'incubation',
    label: 'Incubation & acceleration',
    core: true,
    keywords: ['incubat', 'accelerat', 'cohort', 'pitch night', 'pitch competition', 'sprint', 'demo day'],
  },
  {
    id: 'mentorship',
    label: 'Mentorship & networks',
    core: true,
    keywords: ['mentor', 'coaching', 'advisor', 'peer network', 'community of practice'],
  },
  {
    id: 'women-girls',
    label: 'Women & girls inclusion',
    core: true,
    keywords: ['women', 'girl', 'gender', 'female founder', 'inclusion'],
  },
  {
    id: 'jobs',
    label: 'Job creation & employability',
    core: true,
    keywords: ['job creation', 'jobs', 'employment', 'employab', 'livelihood', 'internship', 'placement'],
  },
  {
    id: 'innovation',
    label: 'Innovation & research',
    core: false,
    keywords: ['innovation', 'research', 'prototype', 'r&d', 'pilot study'],
  },
  {
    id: 'finance',
    label: 'Access to finance & investment',
    core: false,
    keywords: ['access to finance', 'investment', 'grant funding', 'seed capital', 'loan', 'financial inclusion'],
  },
  {
    id: 'agritech',
    label: 'Agriculture & agritech',
    core: false,
    keywords: ['agricultur', 'agritech', 'farmer', 'farming', 'crop', 'agri-'],
  },
  {
    id: 'climate',
    label: 'Climate & environment',
    core: false,
    keywords: ['climate', 'environment', 'renewable', 'solar', 'clean energy', 'sustainab'],
  },
  {
    id: 'health',
    label: 'Health',
    core: false,
    keywords: ['health', 'clinic', 'medical', 'patient', 'nutrition'],
  },
  {
    id: 'education',
    label: 'Education',
    core: false,
    keywords: ['education', 'school', 'classroom', 'learner', 'teacher', 'stem'],
  },
  {
    id: 'creative',
    label: 'Creative industries',
    core: false,
    keywords: ['creative', 'design', 'media', 'film', 'music', 'arts'],
  },
]

/** What a collaborator can offer a project. Used as a secondary match signal. */
export const SUPPORT_TYPES = [
  { id: 'funding', label: 'Funding' },
  { id: 'training', label: 'Training delivery' },
  { id: 'mentorship', label: 'Mentorship' },
  { id: 'infrastructure', label: 'Space & infrastructure' },
  { id: 'market-access', label: 'Market access' },
  { id: 'research', label: 'Research & data' },
]

const FOCUS_BY_ID = new Map(FOCUS_AREAS.map((area) => [area.id, area]))
const SUPPORT_IDS = new Set(SUPPORT_TYPES.map((type) => type.id))

export const isFocusArea = (id) => FOCUS_BY_ID.has(id)

/** A collaborator with no focus area can't be matched against any project,
 * so every donor count and list in the app is scoped to this. */
export const hasFocusArea = (collaborator) => Array.isArray(collaborator?.focusTags) && collaborator.focusTags.length > 0
export const getFocusArea = (id) => FOCUS_BY_ID.get(id)
export const focusLabel = (id) => FOCUS_BY_ID.get(id)?.label || id
export const isSupportType = (id) => SUPPORT_IDS.has(id)

/** Weight a focus area carries when scoring. Core areas count roughly double. */
export const focusWeight = (id) => (FOCUS_BY_ID.get(id)?.core ? 2 : 1)

/** Drop anything outside the vocabulary, de-duplicated and order-stable. */
export function normaliseFocusTags(tags) {
  if (!Array.isArray(tags)) return []
  return [...new Set(tags.filter(isFocusArea))]
}

export function normaliseSupportTypes(types) {
  if (!Array.isArray(types)) return []
  return [...new Set(types.filter(isSupportType))]
}
