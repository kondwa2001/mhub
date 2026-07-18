/** Browser apps cannot responsibly scrape arbitrary websites. Call this from a
 * Cloud Function / approved search provider, then save reviewed results to Firestore. */
function sourceName(result) {
  if (result.siteName || result.source) return result.siteName || result.source
  try {
    return new URL(result.siteUrl || result.url || result.link).hostname.replace('www.', '')
  } catch {
    return 'Source website'
  }
}

export async function discoverOpportunities({ keywords }) {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const endpoint = import.meta.env.VITE_DISCOVERY_API_URL || (projectId && `https://africa-south1-${projectId}.cloudfunctions.net/discoverOpportunities`)
  if (!endpoint) throw new Error('Set VITE_FIREBASE_PROJECT_ID or VITE_DISCOVERY_API_URL to enable internet search')
  let response
  try {
    response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords }) })
  } catch {
    throw new Error('Donor search is not online yet. Deploy the discoverOpportunities Firebase Function, then try again.')
  }
  if (!response.ok) throw new Error('Discovery service is unavailable')
  const payload = await response.json()
  const results = Array.isArray(payload) ? payload : payload.results || payload.opportunities || []

  return results.map((result, index) => ({
    id: result.id || result.url || `discovery-${index}`,
    initials: (result.name || result.title || 'DO').split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase(),
    name: result.name || result.title || 'Donor opportunity',
    focus: result.focus || result.description || 'Funding opportunity found online',
    region: result.region || result.location || 'Location not specified',
    siteUrl: result.siteUrl || result.url || result.link,
    siteName: sourceName(result),
    match: Number.isFinite(result.match) ? result.match : null,
    deadline: result.deadline || result.deadlineLabel || 'Check source',
    tone: ['green', 'orange', 'purple'][index % 3],
  }))
}
