import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell, ChevronRight, CircleUserRound, Flame, Home, Leaf,
  BookHeart, Camera, CheckCircle2, Globe2, Image, LogIn, LogOut, Menu, Mountain, Pencil, Quote, Save, Sparkles, Sprout, Star, Sun,
  Timer, Trash2, TreePine, UsersRound, X
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
  const [intentionFilter, setIntentionFilter] = useState('recommended');
  const [starredIntentions, setStarredIntentions] = useState([]);
  const [starredLoading, setStarredLoading] = useState(false);
  const [intentionError, setIntentionError] = useState('');
  const [shareCustomIntention, setShareCustomIntention] = useState(false);
  const [communityIntentions, setCommunityIntentions] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [practices, setPractices] = useState([]);
  const [practicesLoading, setPracticesLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [practiceSessionNotes, setPracticeSessionNotes] = useState('');
  const [practiceSessionPhotos, setPracticeSessionPhotos] = useState([]);
  const [practiceSessionSaving, setPracticeSessionSaving] = useState(false);
  const [practiceSessionError, setPracticeSessionError] = useState('');
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [diaryLoading, setDiaryLoading] = useState(false);
  const [diaryPhotoUrls, setDiaryPhotoUrls] = useState({});

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
    if (!session?.user) {
      setStarredIntentions([]);
      return;
    }

    let active = true;
    setStarredLoading(true);

    supabase
      .from('starred_intentions')
      .select('id, text, created_at, is_public')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setIntentionError(error.message);
        else setStarredIntentions(data || []);
        setStarredLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const exploreVisible = isIntentionModalOpen && intentionFilter === 'explore';
    if (!exploreVisible || !session?.user) return;
    let active = true;
    setCommunityLoading(true);
    setCommunityError('');
    supabase
      .from('starred_intentions')
      .select('id, user_id, text, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setCommunityError(error.message);
        else setCommunityIntentions(data || []);
        setCommunityLoading(false);
      });
    return () => { active = false; };
  }, [intentionFilter, isIntentionModalOpen, session?.user?.id]);

  useEffect(() => {
    if (activeTab !== 'Practice') return;
    let active = true;
    setPracticesLoading(true);
    setPageError('');
    supabase
      .from('practices')
      .select('id, title, description, instructions, category, duration_minutes, benefit, icon')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('title')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setPageError(error.message);
        else setPractices(data || []);
        setPracticesLoading(false);
      });
    return () => { active = false; };
  }, [activeTab]);




  useEffect(() => {
    if (activeTab !== 'Diary' || !session?.user) return;
    let active = true;
    setDiaryLoading(true);
    setPageError('');

    async function loadDiary() {
      const { data, error } = await supabase
        .from('practice_diary_entries')
        .select('id, practice_id, practice_title, notes, photo_paths, status, duration_minutes, started_at, completed_at, created_at')
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) {
        setPageError(error.message);
        setDiaryLoading(false);
        return;
      }

      const entries = data || [];
      setDiaryEntries(entries);
      const paths = entries.flatMap((entry) => entry.photo_paths || []);
      if (paths.length) {
        const { data: signed, error: signedError } = await supabase.storage
          .from('practice-diary')
          .createSignedUrls(paths, 3600);
        if (!signedError && active) {
          const nextUrls = {};
          (signed || []).forEach((item, index) => {
            if (item.signedUrl) nextUrls[paths[index]] = item.signedUrl;
          });
          setDiaryPhotoUrls(nextUrls);
        }
      } else {
        setDiaryPhotoUrls({});
      }
      setDiaryLoading(false);
    }

    loadDiary();
    return () => { active = false; };
  }, [activeTab, session?.user?.id]);

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

  const userName = session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'there';

  function saveMood(label) {
    setSelectedMood(label);
    localStorage.setItem('groundedMood', label);
  }

  async function saveIntention(event) {
    event.preventDefault();
    const next = intentionDraft.trim();
    if (!next) return;

    const isRecommended = intentionSuggestions.includes(next);

    if (!isRecommended) {
      if (!session?.user) {
        setIntentionError('Sign in to save custom intentions to your starred list.');
        openAuthModal('signin');
        return;
      }

      setStarredLoading(true);
      setIntentionError('');

      const existing = starredIntentions.find(
        (item) => item.text.toLocaleLowerCase() === next.toLocaleLowerCase()
      );

      if (!existing) {
        const { data, error } = await supabase
          .from('starred_intentions')
          .insert({ user_id: session.user.id, text: next, is_public: shareCustomIntention })
          .select('id, text, created_at, is_public')
          .single();

        if (error) {
          setIntentionError(error.message);
          setStarredLoading(false);
          return;
        }

        setStarredIntentions((current) => [data, ...current]);
      }

      setStarredLoading(false);
    }

    setIntention(next);
    localStorage.setItem('groundedIntention', next);
    setShareCustomIntention(false);
    setIsIntentionModalOpen(false);
  }

  function closeIntentionModal() {
    setIntentionDraft(intention);
    setIntentionError('');
    setShareCustomIntention(false);
    setIsIntentionModalOpen(false);
  }

  function chooseSuggestedIntention(suggestion) {
    setIntentionDraft(suggestion);
    setIntentionError('');
  }

  async function removeStarredIntention(event, item) {
    event.stopPropagation();
    setIntentionError('');

    const { error } = await supabase
      .from('starred_intentions')
      .delete()
      .eq('id', item.id);

    if (error) {
      setIntentionError(error.message);
      return;
    }

    setStarredIntentions((current) => current.filter((saved) => saved.id !== item.id));
    if (intentionDraft === item.text) setIntentionDraft('');
  }

  function isTextStarred(text) {
    return starredIntentions.some((item) => item.text.toLocaleLowerCase() === text.toLocaleLowerCase());
  }

  async function starIntentionText(event, text) {
    event?.stopPropagation();
    if (!session?.user) { openAuthModal('signin'); return; }
    const existing = starredIntentions.find((item) => item.text.toLocaleLowerCase() === text.toLocaleLowerCase());
    if (existing) {
      const { error } = await supabase.from('starred_intentions').delete().eq('id', existing.id);
      if (error) { setIntentionError(error.message); setCommunityError(error.message); return; }
      setStarredIntentions((current) => current.filter((item) => item.id !== existing.id));
      return;
    }
    const { data, error } = await supabase
      .from('starred_intentions')
      .insert({ user_id: session.user.id, text, is_public: false })
      .select('id, text, created_at, is_public')
      .single();
    if (error) { setIntentionError(error.message); setCommunityError(error.message); return; }
    setStarredIntentions((current) => [data, ...current]);
  }

  async function updateIntentionVisibility(item, isPublic) {
    const { data, error } = await supabase
      .from('starred_intentions')
      .update({ is_public: isPublic })
      .eq('id', item.id)
      .select('id, text, created_at, is_public')
      .single();
    if (error) { setIntentionError(error.message); return; }
    setStarredIntentions((current) => current.map((saved) => saved.id === item.id ? data : saved));
  }


  function startPracticeSession(practice) {
    if (!session?.user) {
      openAuthModal('signin');
      return;
    }
    setSelectedPractice(practice);
    setPracticeSessionNotes('');
    setPracticeSessionPhotos([]);
    setPracticeSessionError('');
  }


  async function startTodaysPractice() {
    if (!session?.user) {
      openAuthModal('signin');
      return;
    }

    setPageError('');
    const cachedAweWalk = practices.find((practice) => practice.title === 'Awe Walk');
    if (cachedAweWalk) {
      startPracticeSession(cachedAweWalk);
      return;
    }

    const { data, error } = await supabase
      .from('practices')
      .select('id, title, description, instructions, category, duration_minutes, benefit, icon')
      .eq('title', 'Awe Walk')
      .eq('is_active', true)
      .single();

    if (error) {
      setPageError(error.message);
      return;
    }

    setPractices((current) => current.some((practice) => practice.id === data.id) ? current : [data, ...current]);
    startPracticeSession(data);
  }

  function closePracticeSession() {
    if (practiceSessionSaving) return;
    practiceSessionPhotos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setSelectedPractice(null);
    setPracticeSessionNotes('');
    setPracticeSessionPhotos([]);
    setPracticeSessionError('');
  }

  function addPracticePhotos(event) {
    const files = Array.from(event.target.files || []);
    const accepted = files.filter((file) => file.type.startsWith('image/')).slice(0, 6 - practiceSessionPhotos.length);
    const next = accepted.map((file) => ({ file, preview: URL.createObjectURL(file), id: `${file.name}-${file.lastModified}-${Math.random()}` }));
    setPracticeSessionPhotos((current) => [...current, ...next]);
    event.target.value = '';
  }

  function removePracticePhoto(photoId) {
    setPracticeSessionPhotos((current) => {
      const removed = current.find((photo) => photo.id === photoId);
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter((photo) => photo.id !== photoId);
    });
  }

  async function savePracticeSession(status) {
    if (!session?.user || !selectedPractice) return;
    setPracticeSessionSaving(true);
    setPracticeSessionError('');

    const photoPaths = [];
    for (const photo of practiceSessionPhotos) {
      const safeName = photo.file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${session.user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('practice-diary')
        .upload(path, photo.file, { upsert: false, contentType: photo.file.type });
      if (uploadError) {
        setPracticeSessionError(uploadError.message);
        setPracticeSessionSaving(false);
        return;
      }
      photoPaths.push(path);
    }

    const payload = {
      user_id: session.user.id,
      practice_id: selectedPractice.id,
      practice_title: selectedPractice.title,
      notes: practiceSessionNotes.trim() || null,
      photo_paths: photoPaths,
      status,
      duration_minutes: selectedPractice.duration_minutes,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
      .from('practice_diary_entries')
      .insert(payload)
      .select('id, practice_id, practice_title, notes, photo_paths, status, duration_minutes, started_at, completed_at, created_at')
      .single();

    if (error) {
      setPracticeSessionError(error.message);
      setPracticeSessionSaving(false);
      return;
    }

    setDiaryEntries((current) => [data, ...current]);
    closePracticeSession();
    setActiveTab('Diary');
    setPracticeSessionSaving(false);
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

      {activeTab === 'Today' && (
        <section className="content-stack">
          <article className="card intention-card">
            <div className="intention-content">
              <div className="intention-heading">
                <p className="eyebrow">TODAY’S INTENTION</p>
                <button className="intention-edit-button" type="button" aria-label="Choose today’s intention" onClick={() => {
                  setIntentionDraft(intention);
                  setIntentionFilter('recommended');
                  setIntentionError('');
                  setShareCustomIntention(false);
                  setIsIntentionModalOpen(true);
                }}><Pencil size={21} strokeWidth={1.7} /></button>
              </div>
              <blockquote>“{intention}”</blockquote>
            </div>
            <div className="botanical"><Leaf size={92} strokeWidth={1.1} /></div>
          </article>

          <article className="card practice-card">
            <p className="eyebrow">TODAY’S PRACTICE</p>
            <div className="practice-row">
              <div className="round-icon"><TreePine size={50} strokeWidth={1.5} /></div>
              <div className="practice-copy"><h2>Awe Walk</h2><p>Take a slow walk outside and notice one thing that fills you with awe.</p><div className="meta-row"><span><Timer size={21} /> 5–15 min</span><i /><span><Leaf size={21} /> Cultivates wonder</span></div></div>
              <ChevronRight className="chevron" size={35} strokeWidth={1.6} />
            </div>
            <button className="primary-button" type="button" onClick={startTodaysPractice}>Start Practice</button>
            {pageError && <p className="intention-alert" role="alert">{pageError}</p>}
          </article>

          <article className="card reflection-card">
            <div className="reflection-heading"><div><p className="eyebrow">EVENING REFLECTION</p><h2>How did today change you?</h2></div></div>
            <p className="rate-label">Rate today</p>
            <div className="mood-row">{moods.map((mood) => <button className={`mood ${selectedMood === mood.label ? 'selected' : ''}`} key={mood.label} onClick={() => saveMood(mood.label)}><span className="mood-face">{mood.face}</span><span>{mood.label}</span></button>)}</div>
          </article>

          <article className="card journey-card"><p className="eyebrow">YOUR JOURNEY</p><div className="journey-grid"><div className="journey-item"><Flame size={35} strokeWidth={1.4} /><strong>17</strong><span>day streak</span></div><div className="journey-item middle"><Sprout size={35} strokeWidth={1.4} /><strong>237</strong><span>practices completed</span></div><div className="journey-item meaning"><Mountain size={35} strokeWidth={1.4} /><b>Meaning Score</b><div className="score-bars">{Array.from({ length: 10 }).map((_, index) => <span key={index} className={index < 8 ? 'filled' : ''} />)}</div><small>8.2 / 10</small></div></div></article>
          <article className="quote-card"><Quote size={39} strokeWidth={1.6} /><div><p>We are a way for the cosmos<br />to know itself.</p><span>— Carl Sagan</span></div></article>
        </section>
      )}

      {activeTab === 'Practice' && (
        <section className="app-page">
          <header className="page-heading"><p className="eyebrow">PRACTICE LIBRARY</p><h2>Ways to practice attention and meaning</h2><p>Choose something that fits the time and energy you have today.</p></header>
          {practicesLoading ? <p className="page-status">Loading practices…</p> : pageError ? <p className="intention-alert">{pageError}</p> : (
            <div className="practice-library-grid">{practices.map((item) => <article className="library-card" key={item.id}><div className="library-icon"><Sprout size={28} /></div><div><span className="category-chip">{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><div className="library-meta"><span><Timer size={17} /> {item.duration_minutes} min</span>{item.benefit && <span><Leaf size={17} /> {item.benefit}</span>}</div><button className="library-start-button" type="button" onClick={() => startPracticeSession(item)}><Sparkles size={17} /> Start practice</button><details><summary>How to practice</summary><p>{item.instructions}</p></details></div></article>)}</div>
          )}
        </section>
      )}



      {activeTab === 'Diary' && (
        <section className="app-page diary-page">
          <header className="page-heading"><p className="eyebrow">PRACTICE DIARY</p><h2>Your record of attention</h2><p>Notes and photographs from the practices you have begun.</p></header>
          {!session ? <div className="page-empty card"><BookHeart size={38}/><h3>Sign in to keep a practice diary</h3><button className="save-button" onClick={() => openAuthModal('signin')}>Sign in</button></div> : diaryLoading ? <p className="page-status">Loading diary…</p> : pageError ? <p className="intention-alert">{pageError}</p> : diaryEntries.length === 0 ? <div className="page-empty card"><BookHeart size={38}/><h3>Your diary is ready</h3><p>Start a practice and save notes or photos to create your first entry.</p><button className="save-button" onClick={() => setActiveTab('Practice')}>Browse practices</button></div> : <div className="diary-grid">{diaryEntries.map((entry) => <article className="diary-card card" key={entry.id}><div className="diary-card-heading"><div><span className={`diary-status ${entry.status}`}>{entry.status === 'completed' ? 'Completed' : 'Saved for later'}</span><h3>{entry.practice_title}</h3></div><small>{new Date(entry.created_at).toLocaleString()}</small></div>{entry.notes && <p className="diary-notes">{entry.notes}</p>}{entry.photo_paths?.length > 0 && <div className="diary-photo-grid">{entry.photo_paths.map((path) => diaryPhotoUrls[path] ? <img src={diaryPhotoUrls[path]} alt={`Practice note for ${entry.practice_title}`} key={path} /> : <div className="diary-photo-placeholder" key={path}><Image size={22}/></div>)}</div>}<div className="diary-meta"><Timer size={16}/><span>{entry.duration_minutes || '—'} min</span></div></article>)}</div>}
        </section>
      )}

      {activeTab === 'Me' && (
        <section className="app-page profile-page">
          <header className="page-heading"><p className="eyebrow">YOUR PROFILE</p><h2>{session ? userName : 'Your journey'}</h2><p>Manage your saved intentions and account.</p></header>
          {!session ? <div className="page-empty card"><CircleUserRound size={38}/><h3>Sign in to see your profile</h3><button className="save-button" onClick={() => openAuthModal('signin')}>Sign in</button></div> : <>
            <article className="profile-card card"><CircleUserRound size={46}/><div><h3>{userName}</h3><p>{session.user.email}</p></div><button className="secondary-button" onClick={signOut}><LogOut size={17}/> Sign out</button></article>
            <div className="profile-stats"><article className="card"><strong>{starredIntentions.length}</strong><span>starred intentions</span></article><article className="card"><strong>{starredIntentions.filter((item) => item.is_public).length}</strong><span>shared publicly</span></article><article className="card"><strong>{diaryEntries.length}</strong><span>diary entries</span></article></div>
            <section className="profile-section"><h3>Your intentions</h3>{starredIntentions.length === 0 ? <p className="page-status">No starred intentions yet.</p> : starredIntentions.map((item) => <div className="profile-intention" key={item.id}><span>“{item.text}”</span><button className={`visibility-button ${item.is_public ? 'public' : ''}`} onClick={() => updateIntentionVisibility(item, !item.is_public)}>{item.is_public ? 'Public' : 'Private'}</button></div>)}</section>
          </>}
        </section>
      )}
      {selectedPractice && (
        <div className="modal-backdrop" role="presentation" onMouseDown={closePracticeSession}>
          <section className="practice-session-modal" role="dialog" aria-modal="true" aria-labelledby="practice-session-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading"><div><p className="eyebrow">PRACTICE SESSION</p><h2 id="practice-session-title">{selectedPractice.title}</h2><p>{selectedPractice.instructions}</p></div><button className="modal-close" type="button" aria-label="Close" onClick={closePracticeSession}><X size={23}/></button></div>
            <div className="session-meta"><span><Timer size={18}/> {selectedPractice.duration_minutes} min</span>{selectedPractice.benefit && <span><Leaf size={18}/> {selectedPractice.benefit}</span>}</div>
            <label className="session-notes">Notes<textarea value={practiceSessionNotes} onChange={(event) => setPracticeSessionNotes(event.target.value)} placeholder="What did you notice? What changed while you practiced?" rows={6}/></label>
            <div className="session-photos-heading"><div><strong>Photos</strong><small>Add up to six images from the practice.</small></div><label className="photo-upload-button"><Camera size={18}/> Add photos<input type="file" accept="image/*" multiple onChange={addPracticePhotos}/></label></div>
            {practiceSessionPhotos.length > 0 && <div className="session-photo-grid">{practiceSessionPhotos.map((photo) => <figure key={photo.id}><img src={photo.preview} alt="Practice preview"/><button type="button" aria-label="Remove photo" onClick={() => removePracticePhoto(photo.id)}><X size={16}/></button></figure>)}</div>}
            {practiceSessionError && <p className="intention-alert" role="alert">{practiceSessionError}</p>}
            <div className="practice-session-actions"><button className="secondary-button" type="button" disabled={practiceSessionSaving} onClick={() => savePracticeSession('draft')}><Save size={17}/> Save for later</button><button className="save-button" type="button" disabled={practiceSessionSaving} onClick={() => savePracticeSession('completed')}><CheckCircle2 size={17}/> {practiceSessionSaving ? 'Saving…' : 'Complete practice'}</button></div>
          </section>
        </div>
      )}

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
            <div className="intention-filter" role="tablist" aria-label="Intention collection">
              <button
                type="button"
                role="tab"
                aria-selected={intentionFilter === 'recommended'}
                className={intentionFilter === 'recommended' ? 'active' : ''}
                onClick={() => setIntentionFilter('recommended')}
              >
                Recommended
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={intentionFilter === 'starred'}
                className={intentionFilter === 'starred' ? 'active' : ''}
                onClick={() => setIntentionFilter('starred')}
              >
                <Star size={16} fill="currentColor" />
                Starred {session ? `(${starredIntentions.length})` : ''}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={intentionFilter === 'explore'}
                className={intentionFilter === 'explore' ? 'active' : ''}
                onClick={() => setIntentionFilter('explore')}
              >
                <Globe2 size={16} />
                Explore
              </button>
            </div>

            {intentionFilter === 'recommended' ? (
              <div className="suggestion-grid" aria-label="Recommended intentions">
                {intentionSuggestions.map((suggestion) => (
                  <div className={`suggestion-card ${intentionDraft === suggestion ? 'selected' : ''}`} key={suggestion}>
                    <button type="button" className="suggestion-select" onClick={() => chooseSuggestedIntention(suggestion)}>
                      “{suggestion}”
                    </button>
                    <button
                      type="button"
                      className={`star-action ${isTextStarred(suggestion) ? 'active' : ''}`}
                      aria-label={isTextStarred(suggestion) ? 'Unstar intention' : 'Star intention'}
                      onClick={(event) => starIntentionText(event, suggestion)}
                    >
                      <Star size={18} fill={isTextStarred(suggestion) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>
            ) : intentionFilter === 'starred' ? (
              <div className="starred-intention-list" aria-label="Starred intentions">
                {!session ? (
                  <div className="starred-empty">
                    <Star size={28} />
                    <p>Sign in to save and reuse your own intentions.</p>
                    <button type="button" className="secondary-button" onClick={() => openAuthModal('signin')}>Sign in</button>
                  </div>
                ) : starredLoading ? (
                  <p className="starred-status">Loading your intentions…</p>
                ) : starredIntentions.length === 0 ? (
                  <div className="starred-empty">
                    <Star size={28} />
                    <p>Your custom intentions will appear here after you use them.</p>
                  </div>
                ) : (
                  starredIntentions.map((item) => (
                    <div className={`starred-intention-row ${intentionDraft === item.text ? 'selected' : ''}`} key={item.id}>
                      <button type="button" className="starred-intention-select" onClick={() => chooseSuggestedIntention(item.text)}>
                        <Star size={16} fill="currentColor" />
                        <span>“{item.text}”</span>
                      </button>
                      <button
                        type="button"
                        className={`visibility-button ${item.is_public ? 'public' : ''}`}
                        onClick={(event) => { event.stopPropagation(); updateIntentionVisibility(item, !item.is_public); }}
                      >
                        {item.is_public ? 'Public' : 'Private'}
                      </button>
                      <button type="button" className="starred-delete" aria-label={`Remove ${item.text}`} onClick={(event) => removeStarredIntention(event, item)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="modal-community-list" aria-label="Community intentions">
                {!session ? (
                  <div className="starred-empty">
                    <Globe2 size={28} />
                    <p>Sign in to explore intentions shared by the community.</p>
                    <button type="button" className="secondary-button" onClick={() => openAuthModal('signin')}>Sign in</button>
                  </div>
                ) : communityLoading ? (
                  <p className="starred-status">Loading community intentions…</p>
                ) : communityError ? (
                  <p className="intention-alert" role="alert">{communityError}</p>
                ) : communityIntentions.length === 0 ? (
                  <div className="starred-empty">
                    <Globe2 size={28} />
                    <p>No public intentions have been shared yet.</p>
                  </div>
                ) : (
                  communityIntentions.map((item) => (
                    <div className={`modal-community-row ${intentionDraft === item.text ? 'selected' : ''}`} key={item.id}>
                      <button type="button" className="community-intention-select" onClick={() => chooseSuggestedIntention(item.text)}>
                        “{item.text}”
                      </button>
                      <button
                        type="button"
                        className={`star-action ${isTextStarred(item.text) ? 'active' : ''}`}
                        aria-label={isTextStarred(item.text) ? 'Unstar intention' : 'Star intention'}
                        onClick={(event) => starIntentionText(event, item.text)}
                      >
                        <Star size={18} fill={isTextStarred(item.text) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            <form className="modal-custom-form" onSubmit={saveIntention}>
              <label htmlFor="custom-intention">Write your own</label>
              <textarea id="custom-intention" value={intentionDraft} onChange={(event) => { setIntentionDraft(event.target.value); setIntentionError(''); }} maxLength={140} rows={3} placeholder="Today, I will…" autoFocus />
              <label className="community-toggle">
                <input type="checkbox" checked={shareCustomIntention} onChange={(event) => setShareCustomIntention(event.target.checked)} />
                <span><strong>Share with the community</strong><small>Anyone signed in can discover this intention. You can make it private later.</small></span>
              </label>
              {intentionError && <p className="intention-alert" role="alert">{intentionError}</p>}
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
          ['Today', Home], ['Practice', Sprout], ['Diary', BookHeart], ['Me', CircleUserRound]
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
