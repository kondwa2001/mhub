import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './auth/useAuth'
import { activityDate, isPastDue } from './backend/data/activityDates'
import { collaboratorDirectory, donorOpportunities, mhubActivities } from './backend/data/seedData'
import { createActivity, getCollaborators, getCollection } from './backend/firebase/firestoreService'
import { Icon } from './ui/components/Icon'
import { ActivityPanel } from './ui/components/ActivityPanel'
import { AuthForm } from './ui/components/AuthForm'
import { LandingPage } from './ui/components/LandingPage'
import { Settings } from './ui/components/Settings'
import { CollaboratorsPage } from './ui/components/CollaboratorsPage'
import { AdminDashboard } from './ui/components/AdminDashboard'
import './ui/styles/app.css'
import './ui/styles/activities.css'
import './ui/styles/discovery.css'
import './ui/styles/settings.css'
import './ui/styles/notifications.css'
import './ui/styles/bright-theme.css'
import './ui/styles/brand-logo.css'

// The member-facing nav still uses the 'Collaborators' tab key internally
// (component, props, Firestore collection all unchanged) -- this just
// relabels what members see it called.
const navLabel = (item) => (item === 'Collaborators' ? 'Donors' : item)

function App() {
  const { user, loading, signOut } = useAuth()
  const [tab, setTab] = useState('Overview')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')
  const [directory, setDirectory] = useState(donorOpportunities)
  const [activities, setActivities] = useState(mhubActivities)
  const [collaborators, setCollaborators] = useState(collaboratorDirectory)
  // 'seed' until Firestore returns real records, so the UI can be honest about
  // showing placeholder data rather than passing it off as the real directory.
  const [collaboratorSource, setCollaboratorSource] = useState('seed')

  useEffect(() => {
    // Firestore requires signedIn() for every read here, so firing this before
    // Firebase Auth finishes restoring the session (user still null) gets a
    // silent permission-denied and leaves the UI stuck on empty/sample data
    // forever -- wait for a real uid before asking.
    if (!user?.uid) return
    // Only the admin dashboard reads this list now; members no longer browse
    // donor opportunities directly, so there's nothing to map into UI shape.
    getCollection('opportunities').then((items) => {
      if (items.length) setDirectory(items)
    }).catch(() => {
      // Local starter records keep the admin dashboard usable before Firestore is seeded.
    })
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    getCollection('activities').then((items) => {
      setActivities(items.map((item) => ({ ...item, copy: item.description || item.copy || '' })))
    }).catch(() => {
      // Keep the local starter records visible until the calendar is seeded.
    })
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    getCollaborators().then((items) => {
      if (!items.length) return
      setCollaborators(items)
      setCollaboratorSource('firestore')
    }).catch(() => {
      // Placeholder collaborators keep matching demonstrable before seeding.
    })
  }, [user?.uid])

  const upcomingActivities = useMemo(
    () => activities.filter((activity) => !isPastDue(activity)).sort((a, b) => (activityDate(a) ?? 0) - (activityDate(b) ?? 0)),
    [activities],
  )
  const nextDeadline = upcomingActivities.length ? activityDate(upcomingActivities[0]) : null

  const selectNavigation = (item) => {
    setTab(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const addActivity = async (activity) => {
    const savedActivity = await createActivity(activity)
    setActivities((current) => [...current, { ...savedActivity, copy: savedActivity.description || '' }])
  }

  const addCollaborator = (collaborator) => {
    // The first real record retires the placeholders rather than sitting
    // alongside them, so the directory never mixes sample and live data.
    setCollaborators((current) => (collaboratorSource === 'seed' ? [collaborator] : [...current, collaborator]))
    setCollaboratorSource('firestore')
  }

  if (loading) return <main className="auth-loading" aria-live="polite">Checking your secure session…</main>
  if (!user) return <>
    <LandingPage onSignIn={() => { setAuthMode('signin'); setAuthOpen(true) }} onRegister={() => { setAuthMode('register'); setAuthOpen(true) }} />
    {authOpen && <AuthForm initialMode={authMode} onClose={() => setAuthOpen(false)} />}
  </>

  // Admins get an entirely separate workspace -- its own nav, its own landing
  // page -- rather than one more item bolted onto the member sidebar.
  if (user.role === 'admin') {
    // Admin is a read-only oversight view -- no activity-creation form, no
    // collaborator directory form. Those are member tasks; the admin
    // workspace only ever shows the AdminDashboard tables and account Settings.
    const adminNavItems = ['Admin', 'Settings']
    const adminPageContent = tab === 'Settings'
      ? <Settings user={user} onSignOut={signOut} onNavigate={selectNavigation} />
      : <AdminDashboard collaborators={collaborators} donors={directory} activities={activities} isSampleData={collaboratorSource === 'seed'} />

    return <main className="app-shell admin-shell">
      <aside className="sidebar">
        <a className="brand" href="#admin" onClick={(event) => { event.preventDefault(); selectNavigation('Admin') }} aria-label="MHub admin home"><img src="/mhub-logo.svg" alt="mHub" /></a>
        <div className="workspace"><span>ADMIN WORKSPACE</span><button>mHub administration <Icon name="chevron" /></button></div>
        <nav aria-label="Admin navigation">{adminNavItems.map((item) => <button key={item} className={tab === item || (item === 'Admin' && tab === 'Overview') ? 'nav-item active' : 'nav-item'} onClick={() => selectNavigation(item)}><Icon name={item === 'Admin' ? 'shield' : 'settings'} />{item === 'Admin' ? 'Overview' : item}</button>)}</nav>
        <div className="sidebar-bottom">
          <button className="nav-item logout-button" onClick={signOut}><Icon name="logout" />Log out</button>
          <div className="profile"><div className="avatar">{user.name?.[0] || 'M'}</div><div><strong>{user.name || 'MHub team'}</strong><small>{user.email}</small></div></div>
        </div>
      </aside>
      <section className="content">
        <header className="topbar"><div className="crumb"><span>mHub</span><Icon name="chevron" />Administration</div></header>
        <div className="page">{adminPageContent}</div>
      </section>
    </main>
  }

  const pageContent = tab === 'Activities' ? <ActivityPanel activities={activities} onCreate={addActivity} /> : tab === 'Collaborators' ? <CollaboratorsPage activities={activities} collaborators={collaborators} isSampleData={collaboratorSource === 'seed'} onCollaboratorAdded={addCollaborator} /> : tab === 'Settings' ? <Settings user={user} onSignOut={signOut} onNavigate={selectNavigation} /> : <><section className="welcome"><div><p className="eyebrow">OPPORTUNITY INTELLIGENCE</p><h1>Good morning, {user.name?.split(' ')[0] || 'MHub'} <span>✦</span></h1><p>Find aligned funders and keep your team close to the work that matters.</p></div><button className="primary-button" onClick={() => selectNavigation('Collaborators')}><Icon name="spark" />Find a donor</button></section><section className="metrics" aria-label="Opportunity metrics"><div className="metric"><span className="metric-icon green"><Icon name="target" /></span><div><strong>{collaborators.length}</strong><p>Potential donors</p></div></div><div className="metric"><span className="metric-icon purple"><Icon name="calendar" /></span><div><strong>{activities.length}</strong><p>Active programmes</p></div></div><div className="metric"><span className="metric-icon orange"><Icon name="clock" /></span><div><strong>{upcomingActivities.length}</strong><p>Deadlines ahead</p><small>{nextDeadline ? `Next: ${nextDeadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'No deadlines scheduled'}</small></div></div></section></>

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={(event) => { event.preventDefault(); selectNavigation('Overview') }} aria-label="MHub opportunities home"><img src="/mhub-logo.svg" alt="mHub" /></a>
      <div className="workspace"><span>WORKSPACE</span><button>Opportunity desk <Icon name="chevron" /></button></div>
      <nav aria-label="Main navigation">{['Overview', 'Collaborators', 'Activities', 'Settings'].map((item) => <button key={item} className={tab === item ? 'nav-item active' : 'nav-item'} onClick={() => selectNavigation(item)}><Icon name={item === 'Overview' ? 'grid' : item === 'Collaborators' ? 'user' : item === 'Activities' ? 'calendar' : 'settings'} />{navLabel(item)}</button>)}</nav>
      <div className="sidebar-bottom">
        <button className="nav-item logout-button" onClick={signOut}><Icon name="logout" />Log out</button>
        <div className="profile"><div className="avatar">{user.name?.[0] || 'M'}</div><div><strong>{user.name || 'MHub team'}</strong><small>{user.email}</small></div></div>
      </div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="crumb"><span>mHub</span><Icon name="chevron" />Opportunity desk</div></header>
      <div className="page">
        {pageContent}
      </div>
    </section>
    {authOpen && <AuthForm onClose={() => setAuthOpen(false)} />}
  </main>
}

export default App
