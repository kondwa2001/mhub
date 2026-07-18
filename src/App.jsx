import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth/useAuth'
import { donorOpportunities, mhubActivities } from './backend/data/seedData'
import { createContactRequest, getCollection } from './backend/firebase/firestoreService'
import { DonorCard } from './ui/components/DonorCard'
import { DonorDetails } from './ui/components/DonorDetails'
import { Icon } from './ui/components/Icon'
import { ActivityPanel } from './ui/components/ActivityPanel'
import { AuthForm } from './ui/components/AuthForm'
import './ui/styles/app.css'
import './ui/styles/discovery.css'

function App() {
  const { user, loading, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [saved, setSaved] = useState(() => new Set())
  const [tab, setTab] = useState('Overview')
  const [authOpen, setAuthOpen] = useState(false)
  const [directory, setDirectory] = useState(donorOpportunities)
  const [directoryState, setDirectoryState] = useState('loading')
  const [selectedDonor, setSelectedDonor] = useState(null)

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

  const donors = useMemo(() => directory.filter((donor) =>
    `${donor.name} ${donor.focus} ${donor.region} ${donor.description || ''}`.toLowerCase().includes(query.toLowerCase()),
  ), [directory, query])

  const toggleSaved = (id) => setSaved((previous) => {
    const next = new Set(previous)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const sendContactRequest = ({ donor, message }) => createContactRequest({ donorId: donor.id, donorName: donor.name, message, user })

  if (loading) return <main className="auth-loading" aria-live="polite">Checking your secure session…</main>
  if (!user) return <AuthForm required />

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="MHub opportunities home"><span className="brand-mark"><i></i><i></i><i></i></span><span>mHub</span></a>
      <div className="workspace"><span>WORKSPACE</span><button>Opportunity desk <Icon name="chevron" /></button></div>
      <nav aria-label="Main navigation">{['Overview', 'Donor finder', 'Activities', 'Saved'].map((item) => <button key={item} className={tab === item ? 'nav-item active' : 'nav-item'} onClick={() => setTab(item)}><Icon name={item === 'Overview' ? 'grid' : item === 'Donor finder' ? 'search' : item === 'Activities' ? 'calendar' : 'bookmark'} />{item}{item === 'Saved' && saved.size > 0 && <b>{saved.size}</b>}</button>)}</nav>
      <div className="sidebar-bottom"><button className="nav-item"><Icon name="settings" />Settings</button><div className="profile"><div className="avatar">{user.name?.[0] || 'M'}</div><div><strong>{user.name || 'MHub team'}</strong><small>{user.email}</small></div><button className="more" onClick={signOut} aria-label="Sign out"><Icon name="dots" /></button></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="crumb"><span>mHub</span><Icon name="chevron" />Opportunity desk</div><div className="header-actions"><button className="icon-button"><Icon name="bell" /></button><button className="help-button">?</button></div></header>
      <div className="page">
        <section className="welcome" id="overview"><div><p className="eyebrow">OPPORTUNITY INTELLIGENCE</p><h1>Good morning, {user.name?.split(' ')[0] || 'MHub'} <span>✦</span></h1><p>Find aligned funders and keep your team close to the work that matters.</p></div><button className="primary-button" onClick={() => document.getElementById('donors')?.scrollIntoView({ behavior: 'smooth' })}><Icon name="spark" />Find a donor</button></section>
        <section className="metrics" aria-label="Opportunity metrics"><div className="metric"><span className="metric-icon green"><Icon name="target" /></span><div><strong>{directory.length}</strong><p>Potential donors</p><small>Private donor directory</small></div></div><div className="metric"><span className="metric-icon purple"><Icon name="calendar" /></span><div><strong>08</strong><p>Active programmes</p><small>3 updated recently</small></div></div><div className="metric"><span className="metric-icon orange"><Icon name="clock" /></span><div><strong>05</strong><p>Deadlines ahead</p><small>Next: 14 May</small></div></div></section>
        <section className="discover" id="donors"><div className="section-heading"><div><p className="eyebrow">YOUR DONOR DIRECTORY</p><h2>Find a donor</h2></div><button className="text-button" onClick={() => setQuery('')}>View all <Icon name="arrow" /></button></div><div className="search-row"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by donor, focus area, or region" aria-label="Search donor directory" /></div><p className="search-help">Search your private directory, then select a donor to review their profile or request an introduction.</p><div className="chips"><button className="chip active">Best match</button><button className="chip">Technology</button><button className="chip">Youth</button><button className="chip">Climate</button><button className="chip">Open now</button></div><div className="curated-results"><p className="eyebrow">{directoryState === 'loading' ? 'LOADING DIRECTORY' : `${donors.length} DIRECTORY ${donors.length === 1 ? 'MATCH' : 'MATCHES'}`}</p><div className="donor-grid">{donors.map((donor) => <DonorCard key={donor.id} donor={donor} saved={saved.has(donor.id)} onSave={toggleSaved} onOpen={setSelectedDonor} />)}</div>{directoryState === 'ready' && donors.length === 0 && <p className="discovery-message">No donors match that search. Try a different name, focus area, or region.</p>}</div></section>
        <ActivityPanel activities={mhubActivities} />
      </div>
    </section>
    {authOpen && <AuthForm onClose={() => setAuthOpen(false)} />}
    {selectedDonor && <DonorDetails donor={selectedDonor} onClose={() => setSelectedDonor(null)} onContact={sendContactRequest} />}
  </main>
}

export default App
