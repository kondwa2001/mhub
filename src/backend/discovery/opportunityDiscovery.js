/** Browser apps cannot responsibly scrape arbitrary websites. Call this from a
 * Cloud Function / approved search provider, then save reviewed results to Firestore. */
export async function discoverOpportunities({ keywords }) {
  const endpoint = import.meta.env.VITE_DISCOVERY_API_URL
  if (!endpoint) throw new Error('Set VITE_DISCOVERY_API_URL to your Cloud Function endpoint')
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords }) })
  if (!response.ok) throw new Error('Discovery service is unavailable')
  return response.json()
}
