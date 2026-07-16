import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell, BookOpen, ChevronRight, CircleUserRound, Flame, Home, Leaf,
  Menu, Mountain, Pencil, Quote, Sparkles, Sprout, Sun, Timer,
  TreePine, UsersRound
} from 'lucide-react';
import './styles.css';

const moods = [
  { label: 'Hard', face: '☹' },
  { label: 'Okay', face: '−' },
  { label: 'Good', face: '☺' },
  { label: 'Great', face: '●' },
  { label: 'Amazing', face: '✦' }
];

function App() {
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem('groundedMood') || '');
  const [practiceDone, setPracticeDone] = useState(() => localStorage.getItem('groundedPracticeDone') === 'true');
  const [activeTab, setActiveTab] = useState('Today');
  const [intention, setIntention] = useState(() => localStorage.getItem('groundedIntention') || 'I will pay attention to beauty.');
  const [intentionDraft, setIntentionDraft] = useState(intention);
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js');
      return;
    }

    // A production service worker can otherwise keep serving stale files on localhost.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });

    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
  }, []);

  const practiceText = useMemo(() => practiceDone ? 'Practice Completed' : 'Start Practice', [practiceDone]);

  function saveMood(label) {
    setSelectedMood(label);
    localStorage.setItem('groundedMood', label);
  }

  function saveIntention(event) {
    event.preventDefault();
    const next = intentionDraft.trim();
    if (!next) return;
    setIntention(next);
    localStorage.setItem('groundedIntention', next);
    setIsEditingIntention(false);
  }

  function cancelIntentionEdit() {
    setIntentionDraft(intention);
    setIsEditingIntention(false);
  }

  function togglePractice() {
    const next = !practiceDone;
    setPracticeDone(next);
    localStorage.setItem('groundedPracticeDone', String(next));
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="sky-glow" />
        <div className="mountain mountain-back" />
        <div className="mountain mountain-mid" />
        <div className="mountain mountain-front" />
        <div className="lake" />

        <header className="topbar">
          <button className="icon-button" aria-label="Open menu"><Menu size={31} strokeWidth={1.7} /></button>
          <button className="icon-button" aria-label="Notifications"><Bell size={29} strokeWidth={1.7} /></button>
        </header>

        <div className="welcome">
          <div className="greeting-row">
            <h1>Good morning, Georgia</h1>
            <Sun size={44} className="sun-icon" strokeWidth={1.6} />
          </div>
          <p>Let’s live with intention today.</p>
          {installPrompt && <button className="install-chip" onClick={installApp}>Install app</button>}
        </div>
      </section>

      <section className="content-stack">
        <article className={`card intention-card ${isEditingIntention ? 'editing' : ''}`}>
          <div className="intention-content">
            <div className="intention-heading">
              <p className="eyebrow">TODAY’S INTENTION</p>
              {!isEditingIntention && (
                <button
                  className="intention-edit-button"
                  type="button"
                  aria-label="Edit today’s intention"
                  onClick={() => setIsEditingIntention(true)}
                >
                  <Pencil size={21} strokeWidth={1.7} />
                </button>
              )}
            </div>

            {isEditingIntention ? (
              <form className="intention-form" onSubmit={saveIntention}>
                <textarea
                  value={intentionDraft}
                  onChange={(event) => setIntentionDraft(event.target.value)}
                  maxLength={140}
                  rows={3}
                  autoFocus
                  aria-label="Today’s intention"
                />
                <div className="intention-actions">
                  <button type="button" className="secondary-button" onClick={cancelIntentionEdit}>Cancel</button>
                  <button type="submit" className="save-button" disabled={!intentionDraft.trim()}>Save</button>
                </div>
              </form>
            ) : (
              <blockquote>“{intention}”</blockquote>
            )}
          </div>
          {!isEditingIntention && <div className="botanical"><Leaf size={92} strokeWidth={1.1} /></div>}
        </article>

        <article className="card practice-card">
          <p className="eyebrow">TODAY’S PRACTICE</p>
          <div className="practice-row">
            <div className="round-icon"><TreePine size={50} strokeWidth={1.5} /></div>
            <div className="practice-copy">
              <h2>Awe Walk</h2>
              <p>Take a slow walk outside and notice one thing that fills you with awe.</p>
              <div className="meta-row">
                <span><Timer size={21} /> 5–15 min</span>
                <i />
                <span><Leaf size={21} /> Cultivates wonder</span>
              </div>
            </div>
            <ChevronRight className="chevron" size={35} strokeWidth={1.6} />
          </div>
          <button className={`primary-button ${practiceDone ? 'done' : ''}`} onClick={togglePractice}>
            {practiceText}
          </button>
        </article>

        <article className="card reflection-card">
          <div className="reflection-heading">
            <div>
              <p className="eyebrow">EVENING REFLECTION</p>
              <h2>How did today change you?</h2>
            </div>
            <button className="edit-button" aria-label="Write reflection"><Pencil size={31} strokeWidth={1.6} /></button>
          </div>
          <p className="rate-label">Rate today</p>
          <div className="mood-row">
            {moods.map((mood) => (
              <button
                className={`mood ${selectedMood === mood.label ? 'selected' : ''}`}
                key={mood.label}
                onClick={() => saveMood(mood.label)}
              >
                <span className="mood-face">{mood.face}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="card journey-card">
          <p className="eyebrow">YOUR JOURNEY</p>
          <div className="journey-grid">
            <div className="journey-item">
              <Flame size={35} strokeWidth={1.4} />
              <strong>17</strong>
              <span>day streak</span>
            </div>
            <div className="journey-item middle">
              <Sprout size={35} strokeWidth={1.4} />
              <strong>237</strong>
              <span>practices completed</span>
            </div>
            <div className="journey-item meaning">
              <Mountain size={35} strokeWidth={1.4} />
              <b>Meaning Score</b>
              <div className="score-bars">{Array.from({ length: 10 }).map((_, index) => <span key={index} className={index < 8 ? 'filled' : ''} />)}</div>
              <small>8.2 / 10</small>
            </div>
          </div>
        </article>

        <article className="quote-card">
          <Quote size={39} strokeWidth={1.6} />
          <div>
            <p>We are a way for the cosmos<br />to know itself.</p>
            <span>— Carl Sagan</span>
          </div>
        </article>
      </section>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {[
          ['Today', Home], ['Practice', Sprout], ['Commonplace', BookOpen],
          ['Wonder', Sparkles], ['Community', UsersRound], ['Me', CircleUserRound]
        ].map(([label, Icon]) => (
          <button key={label} className={activeTab === label ? 'active' : ''} onClick={() => setActiveTab(label)}>
            <Icon size={28} strokeWidth={1.7} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
