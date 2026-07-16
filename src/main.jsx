import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell, BookOpen, ChevronRight, CircleUserRound, Flame, Home, Leaf,
  LogIn, LogOut, Menu, Mountain, Pencil, Quote, Sparkles, Sprout, Sun,
  Timer, TreePine, UsersRound, X
} from 'lucide-react';
import { supabase } from './lib/supabase';
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
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authForm, setAuthForm] = useState({ displayName: '', email: '', password: '' });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      if (nextSession) setIsAuthModalOpen(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js');
      return;
    }

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });

    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
  }, []);

  const practiceText = useMemo(() => practiceDone ? 'Practice Completed' : 'Start Practice', [practiceDone]);
  const userName = session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'there';

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

  function closeIntentionModal() {
    setIntentionDraft(intention);
    setIsIntentionModalOpen(false);
  }

  function chooseSuggestedIntention(suggestion) {
    setIntentionDraft(suggestion);
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

  function openAuthModal(mode = 'signin') {
    setAuthMode(mode);
    setAuthError('');
    setAuthMessage('');
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    if (authSubmitting) return;
    setIsAuthModalOpen(false);
    setAuthError('');
    setAuthMessage('');
  }

  function updateAuthField(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError('');
    setAuthMessage('');

    try {
      if (authMode === 'signup') {
        const displayName = authForm.displayName.trim();
        if (!displayName) throw new Error('Please enter your name.');

        const { data, error } = await supabase.auth.signUp({
          email: authForm.email.trim(),
          password: authForm.password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;

        if (!data.session) {
          setAuthMessage('Check your email to confirm your account, then return here to sign in.');
          setAuthMode('signin');
          setAuthForm((current) => ({ ...current, password: '' }));
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email.trim(),
          password: authForm.password
        });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function signOut() {
    setAuthError('');
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
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
          <div className="topbar-actions">
            {!authLoading && (
              session ? (
                <button className="account-chip" type="button" onClick={signOut} title="Sign out">
                  <CircleUserRound size={19} />
                  <span>{userName}</span>
                  <LogOut size={17} />
                </button>
              ) : (
                <button className="account-chip" type="button" onClick={() => openAuthModal('signin')}>
                  <LogIn size={18} />
                  <span>Sign in</span>
                </button>
              )
            )}
            <button className="icon-button" aria-label="Notifications"><Bell size={29} strokeWidth={1.7} /></button>
          </div>
        </header>

        <div className="welcome">
          <div className="greeting-row">
            <h1>Good morning, {session ? userName : 'Georgia'}</h1>
            <Sun size={44} className="sun-icon" strokeWidth={1.6} />
          </div>
          <p>Let’s live with intention today.</p>
          <div className="welcome-actions">
            {installPrompt && <button className="install-chip" onClick={installApp}>Install app</button>}
            {!session && !authLoading && (
              <button className="signup-chip" type="button" onClick={() => openAuthModal('signup')}>Create account</button>
            )}
          </div>
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
          <section className="intention-modal" role="dialog" aria-modal="true" aria-labelledby="intention-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">DAILY DIRECTION</p>
                <h2 id="intention-modal-title">Choose an intention</h2>
                <p>Start with one of these, or write something that feels true for today.</p>
              </div>
              <button className="modal-close" type="button" aria-label="Close" onClick={closeIntentionModal}><X size={23} /></button>
            </div>
            <div className="suggestion-grid" aria-label="Recommended intentions">
              {intentionSuggestions.map((suggestion) => (
                <button type="button" key={suggestion} className={`suggestion-card ${intentionDraft === suggestion ? 'selected' : ''}`} onClick={() => chooseSuggestedIntention(suggestion)}>
                  “{suggestion}”
                </button>
              ))}
            </div>
            <form className="modal-custom-form" onSubmit={saveIntention}>
              <label htmlFor="custom-intention">Write your own</label>
              <textarea id="custom-intention" value={intentionDraft} onChange={(event) => setIntentionDraft(event.target.value)} maxLength={140} rows={3} placeholder="Today, I will…" autoFocus />
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

      {isAuthModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeAuthModal}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <p className="eyebrow">YOUR JOURNEY</p>
                <h2 id="auth-modal-title">{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
                <p>{authMode === 'signup' ? 'Save your practices, intentions, and reflections across devices.' : 'Sign in to continue your personal practice.'}</p>
              </div>
              <button className="modal-close" type="button" aria-label="Close" onClick={closeAuthModal}><X size={23} /></button>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              <button type="button" className={authMode === 'signin' ? 'active' : ''} onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthMessage(''); }}>Sign in</button>
              <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthMessage(''); }}>Create account</button>
            </div>

            <form className="auth-form" onSubmit={submitAuth}>
              {authMode === 'signup' && (
                <label>
                  Name
                  <input name="displayName" value={authForm.displayName} onChange={updateAuthField} autoComplete="name" required />
                </label>
              )}
              <label>
                Email
                <input name="email" type="email" value={authForm.email} onChange={updateAuthField} autoComplete="email" required />
              </label>
              <label>
                Password
                <input name="password" type="password" value={authForm.password} onChange={updateAuthField} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
              </label>

              {authError && <p className="auth-alert error" role="alert">{authError}</p>}
              {authMessage && <p className="auth-alert success" role="status">{authMessage}</p>}

              <button className="auth-submit" type="submit" disabled={authSubmitting}>
                {authSubmitting ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            </form>
          </section>
        </div>
      )}

      <nav className="bottom-nav" aria-label="Primary navigation">
        {[
          ['Today', Home], ['Practice', Sprout], ['Commonplace', BookOpen],
          ['Wonder', Sparkles], ['Community', UsersRound], ['Me', CircleUserRound]
        ].map(([label, Icon]) => (
          <button key={label} className={activeTab === label ? 'active' : ''} onClick={() => label === 'Me' && !session ? openAuthModal('signin') : setActiveTab(label)}>
            <Icon size={28} strokeWidth={1.7} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
