import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell, BookOpen, ChevronRight, CircleUserRound, Flame, Home, Leaf,
  Menu, Mountain, Pencil, Quote, Sparkles, Sprout, Sun, Timer,
  TreePine, UsersRound, X
} from 'lucide-react';
import './styles.css';

const intentionSuggestions = [
  'I will pay attention to beauty.',
  'I will meet uncertainty with curiosity.',
  'I will make room for wonder today.',
  'I will respond with patience instead of reacting.',
  'I will notice what is already enough.',
  'I will leave people better than I found them.'
];

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
  const [isIntentionModalOpen, setIsIntentionModalOpen] = useState(false);
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
    setIsIntentionModalOpen(false);
  }

  function cancelIntentionEdit() {
    setIntentionDraft(intention);
    setIsIntentionModalOpen(false);
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
        <article className="card intention-card">
          <div className="intention-content">
            <div className="intention-heading">
              <p className="eyebrow">TODAY’S INTENTION</p>
              <button
                className="intention-edit-button"
                type="button"
                aria-label="Choose today’s intention"
                onClick={() => {
                  setIntentionDraft(intention);
                  setIsIntentionModalOpen(true);
                }}
              >
                <Pencil size={21} strokeWidth={1.7} />
              </button>
            </div>
            <blockquote>“{intention}”</blockquote>
          </div>
          <div className="botanical"><Leaf size={92} strokeWidth={1.1} /></div>
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

      {isIntentionModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeIntentionModal}>
          <section
            className="intention-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="intention-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">DAILY DIRECTION</p>
                <h2 id="intention-modal-title">Choose an intention</h2>
                <p>Start with one of these, or write something that feels true for today.</p>
              </div>
              <button className="modal-close" type="button" aria-label="Close" onClick={closeIntentionModal}>
                <X size={23} />
              </button>
            </div>

            <div className="suggestion-grid" aria-label="Recommended intentions">
              {intentionSuggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  className={`suggestion-card ${intentionDraft === suggestion ? 'selected' : ''}`}
                  onClick={() => chooseSuggestedIntention(suggestion)}
                >
                  “{suggestion}”
                </button>
              ))}
            </div>

            <form className="modal-custom-form" onSubmit={saveIntention}>
              <label htmlFor="custom-intention">Write your own</label>
              <textarea
                id="custom-intention"
                value={intentionDraft}
                onChange={(event) => setIntentionDraft(event.target.value)}
                maxLength={140}
                rows={3}
                placeholder="Today, I will…"
                autoFocus
              />
              <div className="modal-footer">
                <span>{intentionDraft.length}/140</span>
                <div className="intention-actions">
                  <button type="button" className="secondary-button" onClick={closeIntentionModal}>Cancel</button>
                  <button type="submit" className="save-button" disabled={!intentionDraft.trim()}>Use this intention</button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}

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
