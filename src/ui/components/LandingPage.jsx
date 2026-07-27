import { Icon } from './Icon'
import '../styles/landing.css'

const features = [
  { icon: 'target', title: 'Donor matching', copy: 'Surface aligned funders for every programme from a private, curated directory.' },
  { icon: 'calendar', title: 'Activity tracking', copy: 'Keep every deadline, application, and follow-up visible in one shared calendar.' },
  { icon: 'user', title: 'Team collaboration', copy: 'Give your whole team a single source of truth for who is funding what.' },
]

export function LandingPage({ onSignIn, onRegister }) {
  return <main className="landing">
    <header className="landing-nav">
      <a className="landing-brand" href="#top"><img src="/mhub-logo.svg" alt="mHub" /></a>
      <div className="landing-nav-actions">
        <button className="landing-link" onClick={onSignIn}>Sign in</button>
        <button className="primary-button" onClick={onRegister}>Get started</button>
      </div>
    </header>

    <section className="landing-hero">
      <p className="eyebrow">MHUB OPPORTUNITY DESK</p>
      <h1>Find the donors who are already looking for work like yours</h1>
      <p className="landing-lede">mHub keeps your funding pipeline, activities, and team aligned in one private workspace, so no opportunity slips through.</p>
      <div className="landing-cta">
        <button className="primary-button" onClick={onRegister}><Icon name="spark" />Create an account</button>
        <button className="landing-link" onClick={onSignIn}>Sign in <Icon name="arrow" /></button>
      </div>
    </section>

    <section className="landing-features" aria-label="What mHub does">
      {features.map((feature) => <div key={feature.title} className="landing-feature">
        <span className="landing-feature-icon"><Icon name={feature.icon} /></span>
        <h3>{feature.title}</h3>
        <p>{feature.copy}</p>
      </div>)}
    </section>

    <footer className="landing-footer">
      <p>© {new Date().getFullYear()} mHub. All rights reserved.</p>
    </footer>
  </main>
}
