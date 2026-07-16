import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { intentionSuggestions } from './constants/intentions';
import Hero from './components/layout/Hero';
import Navigation from './components/layout/Navigation';
import AuthModal from './components/auth/AuthModal';
import IntentionModal from './components/intentions/IntentionModal';
import PracticeSessionModal from './components/practice/PracticeSessionModal';
import TodayPage from './pages/TodayPage';
import PracticePage from './pages/PracticePage';
import DiaryPage from './pages/DiaryPage';
import ProfilePage from './pages/ProfilePage';
import useJourneyStats from './hooks/useJourneyStats';
import useIntentionWorld from './hooks/useIntentionWorld';
import './styles.css';

function App() {
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem('groundedMood') || '');
  const [reflectionDraft, setReflectionDraft] = useState('');
  const [reflectionSaving, setReflectionSaving] = useState(false);
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
  const [diaryIntentions, setDiaryIntentions] = useState([]);
  const [diaryCheckIns, setDiaryCheckIns] = useState([]);

  const { stats: journeyStats, loading: journeyLoading, refresh: refreshJourneyStats } = useJourneyStats(session?.user?.id);
  const {
    items: intentionWorldItems,
    loading: intentionWorldLoading,
    error: intentionWorldError,
    vote: voteForIntentionItem,
    contribute: contributeToIntention,
    refresh: refreshIntentionWorld
  } = useIntentionWorld({ intention, userId: session?.user?.id });

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
    if (!['Today', 'Practice'].includes(activeTab)) return;
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
      const [practiceResult, intentionResult, checkInResult] = await Promise.all([
        supabase
          .from('practice_diary_entries')
          .select('id, practice_id, practice_title, notes, photo_paths, status, duration_minutes, started_at, completed_at, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('daily_intentions')
          .select('intention_date, intention_text')
          .order('intention_date', { ascending: false }),
        supabase
          .from('daily_check_ins')
          .select('check_in_date, mood_label, mood_score, reflection_text')
          .order('check_in_date', { ascending: false })
      ]);

      if (!active) return;

      const error = practiceResult.error || intentionResult.error || checkInResult.error;
      if (error) {
        setPageError(error.message);
        setDiaryLoading(false);
        return;
      }

      const entries = practiceResult.data || [];
      setDiaryEntries(entries);
      setDiaryIntentions(intentionResult.data || []);
      setDiaryCheckIns(checkInResult.data || []);

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

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function saveReflection(event) {
    event.preventDefault();
    if (!session?.user || !reflectionDraft.trim()) {
      if (!session?.user) openAuthModal('signin');
      return;
    }

    setReflectionSaving(true);
    setPageError('');

    const { error } = await supabase
      .from('daily_check_ins')
      .upsert(
        {
          user_id: session.user.id,
          check_in_date: localDateKey(),
          reflection_text: reflectionDraft.trim()
        },
        { onConflict: 'user_id,check_in_date' }
      );

    if (error) {
      setPageError(error.message);
    } else {
      setDiaryCheckIns((current) => {
        const today = localDateKey();
        const existing = current.find((item) => item.check_in_date === today);
        const updated = { ...existing, check_in_date: today, reflection_text: reflectionDraft.trim() };
        return existing
          ? current.map((item) => item.check_in_date === today ? updated : item)
          : [updated, ...current];
      });
      refreshJourneyStats();
    }

    setReflectionSaving(false);
  }

  async function saveMood(label) {
    setSelectedMood(label);
    localStorage.setItem('groundedMood', label);

    if (!session?.user) return;

    const moodScore = { Hard: 1, Okay: 2, Good: 3, Great: 4, Amazing: 5 }[label];
    const { error } = await supabase
      .from('daily_check_ins')
      .upsert(
        {
          user_id: session.user.id,
          check_in_date: localDateKey(),
          mood_label: label,
          mood_score: moodScore
        },
        { onConflict: 'user_id,check_in_date' }
      );

    if (error) setPageError(error.message);
    else refreshJourneyStats();
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

    if (session?.user) {
      const { error } = await supabase
        .from('daily_intentions')
        .upsert(
          {
            user_id: session.user.id,
            intention_date: localDateKey(),
            intention_text: next
          },
          { onConflict: 'user_id,intention_date' }
        );

      if (error) {
        setIntentionError(error.message);
        return;
      }
    }

    setIntention(next);
    localStorage.setItem('groundedIntention', next);
    setShareCustomIntention(false);
    setIsIntentionModalOpen(false);
    refreshJourneyStats();
    refreshIntentionWorld();
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


  async function startTodaysPractice(preferredPractice = null) {
    if (!session?.user) {
      openAuthModal('signin');
      return;
    }

    if (preferredPractice) {
      startPracticeSession(preferredPractice);
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
    refreshJourneyStats();
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

  function openIntentionChooser() {
    setIntentionDraft(intention);
    setIntentionFilter('recommended');
    setIntentionError('');
    setShareCustomIntention(false);
    setIsIntentionModalOpen(true);
  }

  function changeAuthMode(mode) {
    setAuthMode(mode);
    setAuthError('');
    setAuthMessage('');
  }

  return (
    <main className="app-shell">
      <Hero
        authLoading={authLoading}
        session={session}
        userName={userName}
        installPrompt={installPrompt}
        onInstall={installApp}
        onOpenAuth={openAuthModal}
        onSignOut={signOut}
      />

      {activeTab === 'Today' && (
        <TodayPage
          intention={intention}
          selectedMood={selectedMood}
          pageError={pageError}
          journeyStats={journeyStats}
          journeyLoading={journeyLoading}
          practices={practices}
          intentionWorldItems={intentionWorldItems}
          intentionWorldLoading={intentionWorldLoading}
          intentionWorldError={intentionWorldError}
          onVoteIntentionItem={voteForIntentionItem}
          onContributeToIntention={contributeToIntention}
          reflectionDraft={reflectionDraft}
          reflectionSaving={reflectionSaving}
          onReflectionChange={setReflectionDraft}
          onSaveReflection={saveReflection}
          onEditIntention={openIntentionChooser}
          onStartPractice={startTodaysPractice}
          onSaveMood={saveMood}
        />
      )}

      {activeTab === 'Practice' && (
        <PracticePage
          practices={practices}
          loading={practicesLoading}
          error={pageError}
          onStartPractice={startPracticeSession}
        />
      )}

      {activeTab === 'Diary' && (
        <DiaryPage
          session={session}
          loading={diaryLoading}
          error={pageError}
          entries={diaryEntries}
          intentions={diaryIntentions}
          checkIns={diaryCheckIns}
          photoUrls={diaryPhotoUrls}
          onOpenAuth={openAuthModal}
          onBrowsePractices={() => setActiveTab('Practice')}
        />
      )}

      {activeTab === 'Me' && (
        <ProfilePage
          session={session}
          userName={userName}
          starredIntentions={starredIntentions}
          diaryCount={diaryEntries.length}
          onOpenAuth={openAuthModal}
          onSignOut={signOut}
          onUpdateVisibility={updateIntentionVisibility}
        />
      )}

      <PracticeSessionModal
        practice={selectedPractice}
        notes={practiceSessionNotes}
        photos={practiceSessionPhotos}
        saving={practiceSessionSaving}
        error={practiceSessionError}
        onClose={closePracticeSession}
        onNotesChange={setPracticeSessionNotes}
        onAddPhotos={addPracticePhotos}
        onRemovePhoto={removePracticePhoto}
        onSave={savePracticeSession}
      />

      <IntentionModal
        isOpen={isIntentionModalOpen}
        filter={intentionFilter}
        draft={intentionDraft}
        session={session}
        starredIntentions={starredIntentions}
        starredLoading={starredLoading}
        communityIntentions={communityIntentions}
        communityLoading={communityLoading}
        communityError={communityError}
        shareCustomIntention={shareCustomIntention}
        intentionError={intentionError}
        onClose={closeIntentionModal}
        onFilterChange={setIntentionFilter}
        onChoose={chooseSuggestedIntention}
        onStarText={starIntentionText}
        onRemoveStarred={removeStarredIntention}
        onUpdateVisibility={updateIntentionVisibility}
        onOpenAuth={openAuthModal}
        onDraftChange={(value) => { setIntentionDraft(value); setIntentionError(''); }}
        onShareChange={setShareCustomIntention}
        onSubmit={saveIntention}
        isTextStarred={isTextStarred}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        form={authForm}
        submitting={authSubmitting}
        error={authError}
        message={authMessage}
        onClose={closeAuthModal}
        onModeChange={changeAuthMode}
        onFieldChange={updateAuthField}
        onSubmit={submitAuth}
      />

      <Navigation
        activeTab={activeTab}
        session={session}
        onNavigate={setActiveTab}
        onOpenAuth={openAuthModal}
      />
    </main>
  );
}

export default App;
