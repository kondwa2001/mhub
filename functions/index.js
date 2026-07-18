import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

const googleApiKey = defineSecret('GOOGLE_CUSTOM_SEARCH_API_KEY')
const searchEngineId = defineSecret('GOOGLE_PROGRAMMABLE_SEARCH_ENGINE_ID')

function sourceLocation(item) {
  const metadata = item.pagemap?.metatags?.[0] || {}
  return metadata['og:locale'] || metadata['place:location:latitude'] || 'See donor website'
}

export const discoverOpportunities = onRequest(
  { region: 'africa-south1', cors: true, secrets: [googleApiKey, searchEngineId] },
  async (request, response) => {
    if (request.method !== 'POST') return response.status(405).json({ error: 'Use POST for donor discovery.' })
    const keywords = request.body?.keywords?.trim()
    if (!keywords || keywords.length < 3) return response.status(400).json({ error: 'Provide a project description of at least three characters.' })

    const searchUrl = new URL('https://customsearch.googleapis.com/customsearch/v1')
    searchUrl.search = new URLSearchParams({ key: googleApiKey.value(), cx: searchEngineId.value(), q: `${keywords} (donor OR funder OR grant OR funding opportunity)`, num: '10', safe: 'active' }).toString()
    try {
      const googleResponse = await fetch(searchUrl)
      if (!googleResponse.ok) {
        console.error('Google Custom Search error', googleResponse.status, await googleResponse.text())
        return response.status(502).json({ error: 'Google search is unavailable. Check the Google API key and search engine ID.' })
      }
      const data = await googleResponse.json()
      return response.json({ results: (data.items || []).map((item) => ({ id: item.cacheId || item.link, name: item.title, description: item.snippet, location: sourceLocation(item), url: item.link, source: item.displayLink })) })
    } catch (error) {
      console.error('Donor discovery error', error)
      return response.status(500).json({ error: 'Unable to search Google right now.' })
    }
  },
)
