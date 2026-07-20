import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth/useAuth'
import { donorOpportunities, mhubActivities } from './backend/data/seedData'
import { createActivity, createContactRequest, getCollection } from './backend/firebase/firestoreService'
import { DonorCard } from './ui/components/DonorCard'
import { DonorDetails } from './ui/components/DonorDetails'
import { Icon } from './ui/components/Icon'
import { ActivityPanel } from './ui/components/ActivityPanel'
import { AuthForm } from './ui/components/AuthForm'
import { Settings } from './ui/components/Settings'
import './ui/styles/app.css'
import './ui/styles/activities.css'
import './ui/styles/discovery.css'
import './ui/styles/settings.css'

function App() {
  const { user, loading, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [donorFilter, setDonorFilter] = useState('Best match')
  const [saved, setSaved] = useState(() => new Set())
  const [tab, setTab] = useState('Overview')
  const [authOpen, setAuthOpen] = useState(false)
  const [directory, setDirectory] = useState(donorOpportunities)
  const [directoryState, setDirectoryState] = useState('loading')
  const [selectedDonor, setSelectedDonor] = useState(null)
  const [activities, setActivities] = useState(mhubActivities)

  useEffect(() => {
    getCollection('opportunities').then((items) => {
      if (!items.length) return
      setDirectory(items.map((item) => ({
        ...item,
        focus: Array.isArray(item.focus) ? item.focus.join(' · ') : item.focus,
        region: Array.isArray(item.region) ? item.region.join(' · ') : item.region,
        match: item.matchScore,
        deadline: item.deadlineLabel,
      })))
    }).catch(() => {
      // Local starter records keep the directory usable before Firestore is seeded.
    }).finally(() => setDirectoryState('ready'))
  }, [])

  useEffect(() => {
    getCollection('activities').then((items) => {
      setActivities(items.map((item) => ({ ...item, copy: item.description || item.copy || '' })))
    }).catch(() => {
      // Keep the local starter records visible until the calendar is seeded.
    })
  }, [])

  const donors = useMemo(() => directory.filter((donor) => {
    const searchable = `${donor.name} ${donor.focus} ${donor.region} ${donor.description || ''}`.toLowerCase()
    const matchesSearch = searchable.includes(query.toLowerCase())
    const matchesFilter = donorFilter === 'Best match' || (donorFilter === 'Technology' && /technology|digital/.test(searchable)) || (donorFilter === 'Youth' && searchable.includes('youth')) || (donorFilter === 'Climate' && searchable.includes('climate')) || (donorFilter === 'Open now' && (donor.status === 'open' || (!donor.status && donor.deadline !== 'Closed')))
    return matchesSearch && matchesFilter
  }), [directory, query, donorFilter])

  const toggleSaved = (id) => setSaved((previous) => {
    const next = new Set(previous)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const sendContactRequest = ({ donor, message }) => createContactRequest({ donorId: donor.id, donorName: donor.name, message, user })
  const selectNavigation = (item) => {
    setTab(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const addActivity = async (activity) => {
    const savedActivity = await createActivity(activity)
    setActivities((current) => [...current, { ...savedActivity, copy: savedActivity.description || '' }])
  }

  if (loading) return <main className="auth-loading" aria-live="polite">Checking your secure session…</main>
  if (!user) return <AuthForm required />

  const donorDirectory = <section className="discover"><div className="section-heading"><div><p className="eyebrow">YOUR DONOR DIRECTORY</p><h2>Find a donor</h2></div><button className="text-button" onClick={() => { setQuery(''); setDonorFilter('Best match') }}>View all <Icon name="arrow" /></button></div><div className="search-row"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by donor, focus area, or region" aria-label="Search donor directory" /></div><p className="search-help">Search your private directory, then select a donor to review their profile or request an introduction.</p><div className="chips">{['Best match', 'Technology', 'Youth', 'Climate', 'Open now'].map((filter) => <button key={filter} className={donorFilter === filter ? 'chip active' : 'chip'} onClick={() => setDonorFilter(filter)}>{filter}</button>)}</div><div className="curated-results"><p className="eyebrow">{directoryState === 'loading' ? 'LOADING DIRECTORY' : `${donors.length} DIRECTORY ${donors.length === 1 ? 'MATCH' : 'MATCHES'}`}</p><div className="donor-grid">{donors.map((donor) => <DonorCard key={donor.id} donor={donor} saved={saved.has(donor.id)} onSave={toggleSaved} onOpen={setSelectedDonor} />)}</div>{directoryState === 'ready' && donors.length === 0 && <p className="discovery-message">No donors match that search. Try a different name, focus area, or region.</p>}</div></section>
  const savedDonors = directory.filter((donor) => saved.has(donor.id))
  const pageContent = tab === 'Activities' ? <ActivityPanel activities={activities} onCreate={addActivity} /> : tab === 'Donor finder' ? <><section className="welcome"><div><p className="eyebrow">OPPORTUNITY INTELLIGENCE</p><h1>Donor finder</h1><p>Explore and connect with aligned funding opportunities.</p></div></section>{donorDirectory}</> : tab === 'Saved' ? <section className="discover"><div className="section-heading"><div><p className="eyebrow">YOUR SHORTLIST</p><h2>Saved opportunities</h2></div></div><div className="donor-grid">{savedDonors.map((donor) => <DonorCard key={donor.id} donor={donor} saved onSave={toggleSaved} onOpen={setSelectedDonor} />)}</div>{savedDonors.length === 0 && <p className="discovery-message">Save a donor opportunity to keep it in your shortlist.</p>}</section> : tab === 'Settings' ? <Settings user={user} onSignOut={signOut} /> : <><section className="welcome"><div><p className="eyebrow">OPPORTUNITY INTELLIGENCE</p><h1>Good morning, {user.name?.split(' ')[0] || 'MHub'} <span>✦</span></h1><p>Find aligned funders and keep your team close to the work that matters.</p></div><button className="primary-button" onClick={() => selectNavigation('Donor finder')}><Icon name="spark" />Find a donor</button></section><section className="metrics" aria-label="Opportunity metrics"><div className="metric"><span className="metric-icon green"><Icon name="target" /></span><div><strong>{directory.length}</strong><p>Potential donors</p><small>Private donor directory</small></div></div><div className="metric"><span className="metric-icon purple"><Icon name="calendar" /></span><div><strong>08</strong><p>Active programmes</p><small>3 updated recently</small></div></div><div className="metric"><span className="metric-icon orange"><Icon name="clock" /></span><div><strong>05</strong><p>Deadlines ahead</p><small>Next: 14 May</small></div></div></section></>

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); selectNavigation('Overview') }} aria-label="MHub opportunities home"><span className="brand-mark"><i></i><i></i><i></i></span><span>mHub</span></a>
      <div className="workspace"><span>WORKSPACE</span><button>Opportunity desk <Icon name="chevron" /></button></div>
      <nav aria-label="Main navigation">{['Overview', 'Donor finder', 'Activities', 'Saved', 'Settings'].map((item) => <button key={item} className={tab === item ? 'nav-item active' : 'nav-item'} onClick={() => selectNavigation(item)}><Icon name={item === 'Overview' ? 'grid' : item === 'Donor finder' ? 'search' : item === 'Activities' ? 'calendar' : item === 'Saved' ? 'bookmark' : 'settings'} />{item}{item === 'Saved' && saved.size > 0 && <b>{saved.size}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item logout-button" onClick={signOut}><Icon name="logout" />Log out</button><div className="profile"><div className="avatar">{user.name?.[0] || 'M'}</div><div><strong>{user.name || 'MHub team'}</strong><small>{user.email}</small></div></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="crumb"><span>mHub</span><Icon name="chevron" />Opportunity desk</div><div className="header-actions"><button className="icon-button"><Icon name="bell" /></button><button className="help-button">?</button></div></header>
      <div className="page">
        {pageContent}
        {tab === 'Legacy' && <>
        <section className="welcome" id="overview"><div><p className="eyebrow">OPPORTUNITY INTELLIGENCE</p><h1>Good morning, {user.name?.split(' ')[0] || 'MHub'} <span>✦</span></h1><p>Find aligned funders and keep your team close to the work that matters.</p></div><button className="primary-button" onClick={() => document.getElementById('donors')?.scrollIntoView({ behavior: 'smooth' })}><Icon name="spark" />Find a donor</button></section>
        <section className="metrics" aria-label="Opportunity metrics"><div className="metric"><span className="metric-icon green"><Icon name="target" /></span><div><strong>{directory.length}</strong><p>Potential donors</p><small>Private donor directory</small></div></div><div className="metric"><span className="metric-icon purple"><Icon name="calendar" /></span><div><strong>08</strong><p>Active programmes</p><small>3 updated recently</small></div></div><div className="metric"><span className="metric-icon orange"><Icon name="clock" /></span><div><strong>05</strong><p>Deadlines ahead</p><small>Next: 14 May</small></div></div></section>
        <section className="discover" id="donors"><div className="section-heading"><div><p className="eyebrow">YOUR DONOR DIRECTORY</p><h2>Find a donor</h2></div><button className="text-button" onClick={() => setQuery('')}>View all <Icon name="arrow" /></button></div><div className="search-row"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by donor, focus area, or region" aria-label="Search donor directory" /></div><p className="search-help">Search your private directory, then select a donor to review their profile or request an introduction.</p><div className="chips"><button className="chip active">Best match</button><button className="chip">Technology</button><button className="chip">Youth</button><button className="chip">Climate</button><button className="chip">Open now</button></div><div className="curated-results"><p className="eyebrow">{directoryState === 'loading' ? 'LOADING DIRECTORY' : `${donors.length} DIRECTORY ${donors.length === 1 ? 'MATCH' : 'MATCHES'}`}</p><div className="donor-grid">{donors.map((donor) => <DonorCard key={donor.id} donor={donor} saved={saved.has(donor.id)} onSave={toggleSaved} onOpen={setSelectedDonor} />)}</div>{directoryState === 'ready' && donors.length === 0 && <p className="discovery-message">No donors match that search. Try a different name, focus area, or region.</p>}</div></section>
        <ActivityPanel activities={activities} onCreate={addActivity} />
        </>}
      </div>
    </section>
    {authOpen && <AuthForm onClose={() => setAuthOpen(false)} />}
    {selectedDonor && <DonorDetails donor={selectedDonor} onClose={() => setSelectedDonor(null)} onContact={sendContactRequest} />}
  </main>
}

export default App
