import { useMemo, useState } from 'react';
import {
  BookOpen, Camera, Check, ChevronRight, Flame, Heart, Image, Leaf, Lightbulb,
  ListPlus, Mountain, Music, Palette, Pencil, Plus, Quote, Search, Sparkles,
  Sprout, Timer, TreePine, X
} from 'lucide-react';
import { moods } from '../constants/intentions';

const TYPE_META = {
  quote: { label: 'Quote', icon: Quote },
  poem: { label: 'Poem', icon: BookOpen },
  passage: { label: 'Passage', icon: BookOpen },
  photo: { label: 'Photograph', icon: Camera },
  book: { label: 'Book', icon: BookOpen },
  music: { label: 'Music', icon: Music },
  artwork: { label: 'Artwork', icon: Palette },
  film: { label: 'Film', icon: Image },
  fact: { label: 'Fact', icon: Lightbulb },
  reflection: { label: 'Reflection', icon: Sparkles },
  prompt: { label: 'Prompt', icon: Pencil },
  practice: { label: 'Practice', icon: Sprout }
};

function WorldItem({ item, onVote }) {
  const meta = TYPE_META[item.content_type] || TYPE_META.passage;
  const Icon = meta.icon;

  return (
    <article className={`world-item world-item-${item.content_type}`}>
      <div className="world-item-type"><Icon size={16} /> {meta.label}</div>
      {item.title && <h3>{item.title}</h3>}
      {item.body && item.content_type === 'quote'
        ? <blockquote>“{item.body}”</blockquote>
        : item.body && <p>{item.body}</p>
      }
      {item.creator && <span className="world-item-creator">— {item.creator}</span>}
      {item.external_url && <a href={item.external_url} target="_blank" rel="noreferrer">Open source</a>}
      <button className={`world-love ${item.hasVoted ? 'loved' : ''}`} type="button" onClick={() => onVote(item)}>
        <Heart size={17} fill={item.hasVoted ? 'currentColor' : 'none'} />
        {item.voteCount}
      </button>
    </article>
  );
}

function PracticeChooser({
  practices,
  selectedPractice,
  recommendations,
  onClose,
  onSelect,
  onSuggest,
  onVote
}) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  const filtered = practices.filter((practice) => {
    const haystack = `${practice.title} ${practice.description || ''} ${practice.category || ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  async function choose(practice) {
    setSavingId(practice.id);
    setError('');
    try {
      await onSelect(practice);
      onClose();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSavingId(null);
    }
  }

  async function suggest(practice) {
    setSavingId(practice.id);
    setError('');
    try {
      await onSuggest(practice.id);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSavingId(null);
    }
  }

  async function vote(recommendation) {
    setError('');
    try {
      await onVote(recommendation);
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  return (
    <div className="modal-backdrop practice-picker-backdrop" onMouseDown={onClose}>
      <section className="practice-picker-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">CHOOSE TODAY’S PRACTICE</p>
            <h2>Pick what fits your intention</h2>
            <p>The automatic recommendation is only a starting point. You can change it at any time today.</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose}><X size={20} /></button>
        </div>

        {recommendations.length > 0 && (
          <section className="practice-picker-section">
            <h3>Community matches</h3>
            <div className="practice-recommendation-list">
              {recommendations.map((recommendation) => (
                <article className="practice-recommendation-row" key={recommendation.id}>
                  <button className="practice-recommendation-main" type="button" onClick={() => choose(recommendation.practice)}>
                    <div>
                      <strong>{recommendation.practice.title}</strong>
                      <span>{recommendation.practice.description}</span>
                    </div>
                    {selectedPractice?.id === recommendation.practice.id && <Check size={20} />}
                  </button>
                  <button className={`practice-vote-button ${recommendation.hasVoted ? 'loved' : ''}`} type="button" onClick={() => vote(recommendation)}>
                    <Heart size={17} fill={recommendation.hasVoted ? 'currentColor' : 'none'} />
                    {recommendation.voteCount}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="practice-picker-section">
          <div className="practice-picker-section-heading">
            <h3>All practices</h3>
            <label className="practice-search">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search practices" />
            </label>
          </div>

          <div className="practice-option-list">
            {filtered.map((practice) => (
              <article className="practice-option-row" key={practice.id}>
                <button className="practice-option-main" type="button" onClick={() => choose(practice)} disabled={savingId === practice.id}>
                  <div>
                    <strong>{practice.title}</strong>
                    <span>{practice.description}</span>
                  </div>
                  {selectedPractice?.id === practice.id && <Check size={20} />}
                </button>
                <button className="suggest-match-button" type="button" onClick={() => suggest(practice)} disabled={savingId === practice.id}>
                  <ListPlus size={17} />
                  Suggest match
                </button>
              </article>
            ))}
          </div>
        </section>

        {error && <p className="auth-alert error">{error}</p>}
      </section>
    </div>
  );
}

export default function TodayPage({
  intention,
  dailyIntentionLoading,
  selectedMood,
  pageError,
  journeyStats,
  journeyLoading,
  practices,
  todayPractice,
  todayPracticeSource,
  dailyPracticeLoading,
  dailyPracticeError,
  practiceRecommendations,
  onSelectDailyPractice,
  onSuggestPractice,
  onVotePracticeRecommendation,
  intentionWorldItems,
  intentionWorldLoading,
  intentionWorldError,
  onVoteIntentionItem,
  onContributeToIntention,
  reflectionDraft,
  reflectionSaving,
  onReflectionChange,
  onSaveReflection,
  onEditIntention,
  onStartPractice,
  onSaveMood
}) {
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isPracticePickerOpen, setIsPracticePickerOpen] = useState(false);
  const [contribution, setContribution] = useState({
    contentType: 'quote',
    title: '',
    body: '',
    creator: '',
    externalUrl: '',
    imageFile: null
  });
  const [contributionSaving, setContributionSaving] = useState(false);
  const [contributionError, setContributionError] = useState('');

  const companion = useMemo(
    () => intentionWorldItems.find((item) => !['prompt', 'practice', 'reflection'].includes(item.content_type)),
    [intentionWorldItems]
  );
  const prompt = intentionWorldItems.find((item) => item.content_type === 'prompt');
  const inspiration = intentionWorldItems
    .filter((item) => item.id !== companion?.id && !['prompt', 'practice'].includes(item.content_type))
    .slice(0, 8);
  const communityReflections = intentionWorldItems.filter((item) => item.content_type === 'reflection').slice(0, 3);

  const recommendationLabel = {
    automatic: 'Automatically recommended for today',
    community: 'Top community match for this intention',
    manual: 'Chosen by you for today'
  }[todayPracticeSource] || 'Recommended for today';

  async function submitContribution(event) {
    event.preventDefault();
    setContributionSaving(true);
    setContributionError('');
    try {
      await onContributeToIntention(contribution);
      setContribution({ contentType: 'quote', title: '', body: '', creator: '', externalUrl: '', imageFile: null });
      setIsContributionOpen(false);
    } catch (error) {
      setContributionError(error.message || 'Could not add this contribution.');
    } finally {
      setContributionSaving(false);
    }
  }

  async function vote(item) {
    try {
      await onVoteIntentionItem(item);
    } catch (error) {
      setContributionError(error.message);
    }
  }

  return (
    <section className="content-stack intention-world-home">
      <article className="card intention-card intention-world-hero">
        <div className="intention-content">
          <div className="intention-heading">
            <div>
              <p className="eyebrow">TODAY’S INTENTION</p>
              <span className="recommendation-badge"><Sparkles size={14} /> Automatically recommended · change anytime</span>
            </div>
            <button className="intention-edit-button" type="button" aria-label="Choose today’s intention" onClick={onEditIntention}>
              <Pencil size={21} strokeWidth={1.7} />
            </button>
          </div>
          <blockquote>{dailyIntentionLoading ? 'Choosing today’s intention…' : `“${intention}”`}</blockquote>
          <p className="intention-world-intro">For today, let everything on this page grow from this one idea.</p>
        </div>
        <div className="botanical"><Leaf size={92} strokeWidth={1.1} /></div>
      </article>

      <article className="card companion-card">
        <div className="world-section-heading">
          <div><p className="eyebrow">TODAY’S COMPANION</p><h2>Something to carry with you</h2></div>
          <Sparkles size={27} />
        </div>
        {intentionWorldLoading ? <p className="page-status">Gathering today’s world…</p>
          : companion ? <WorldItem item={companion} onVote={vote} />
          : <p className="page-status">This intention is waiting for its first community contribution.</p>}
      </article>

      <article className="card practice-card intention-practice-card">
        <div className="practice-card-topline">
          <div>
            <p className="eyebrow">TODAY’S RECOMMENDED PRACTICE</p>
            <span className="recommendation-badge"><Sparkles size={14} /> {recommendationLabel}</span>
          </div>
          <button className="change-practice-button" type="button" onClick={() => setIsPracticePickerOpen(true)}>
            Change practice
          </button>
        </div>

        {dailyPracticeLoading ? (
          <p className="page-status">Choosing a practice for today…</p>
        ) : todayPractice ? (
          <>
            <div className="practice-row">
              <div className="round-icon"><TreePine size={50} strokeWidth={1.5} /></div>
              <div className="practice-copy">
                <h2>{todayPractice.title}</h2>
                <p>{todayPractice.description}</p>
                <div className="meta-row">
                  <span><Timer size={21} /> {todayPractice.duration_minutes || '5–15'} min</span>
                  {todayPractice.benefit && <><i /><span><Leaf size={21} /> {todayPractice.benefit}</span></>}
                </div>
              </div>
              <ChevronRight className="chevron" size={35} strokeWidth={1.6} />
            </div>
            <button className="primary-button" type="button" onClick={() => onStartPractice(todayPractice)}>Start Practice</button>
          </>
        ) : (
          <div className="world-empty">
            <p>No practice is available yet.</p>
            <button className="secondary-button" onClick={() => setIsPracticePickerOpen(true)}>Choose one</button>
          </div>
        )}

        {(pageError || dailyPracticeError) && <p className="intention-alert" role="alert">{pageError || dailyPracticeError}</p>}

        <div className="community-practice-preview">
          <div>
            <strong>Practices people connect with this intention</strong>
            <span>{practiceRecommendations.length
              ? `${practiceRecommendations.length} community ${practiceRecommendations.length === 1 ? 'match' : 'matches'}`
              : 'No community matches yet'}</span>
          </div>
          <button type="button" onClick={() => setIsPracticePickerOpen(true)}>
            <ListPlus size={18} />
            View or suggest
          </button>
        </div>
      </article>

      <section className="card community-inspiration-card">
        <div className="world-section-heading">
          <div><p className="eyebrow">COMMUNITY INSPIRATION</p><h2>Things people believe belong here</h2></div>
          <button className="contribute-button" type="button" onClick={() => setIsContributionOpen(true)}><Plus size={18} /> Contribute</button>
        </div>
        {intentionWorldError && <p className="intention-alert">{intentionWorldError}</p>}
        {contributionError && <p className="intention-alert">{contributionError}</p>}
        {inspiration.length
          ? <div className="world-grid">{inspiration.map((item) => <WorldItem key={item.id} item={item} onVote={vote} />)}</div>
          : <div className="world-empty"><p>No community favorites yet.</p><button className="secondary-button" onClick={() => setIsContributionOpen(true)}>Add the first one</button></div>}
      </section>

      <article className="card reflection-card intention-reflection-card">
        <div className="reflection-heading"><div><p className="eyebrow">EVENING REFLECTION</p><h2>{prompt?.body || `How did “${intention}” change the way you moved through today?`}</h2></div></div>
        <form className="daily-reflection-form" onSubmit={onSaveReflection}>
          <textarea value={reflectionDraft} onChange={(event) => onReflectionChange(event.target.value)} placeholder="Write what you noticed, learned, or want to remember…" aria-label="Daily reflection" />
          <button className="save-button" type="submit" disabled={reflectionSaving || !reflectionDraft.trim()}>{reflectionSaving ? 'Saving…' : 'Save reflection'}</button>
        </form>
        <p className="rate-label">Rate today</p>
        <div className="mood-row">
          {moods.map((mood) => (
            <button className={`mood ${selectedMood === mood.label ? 'selected' : ''}`} key={mood.label} onClick={() => onSaveMood(mood.label)}>
              <span className="mood-face">{mood.face}</span><span>{mood.label}</span>
            </button>
          ))}
        </div>
      </article>

      {communityReflections.length > 0 && (
        <section className="card community-reflections-card">
          <div className="world-section-heading"><div><p className="eyebrow">COMMUNITY REFLECTIONS</p><h2>How others lived this intention</h2></div></div>
          <div className="community-reflection-list">{communityReflections.map((item) => <WorldItem key={item.id} item={item} onVote={vote} />)}</div>
        </section>
      )}

      <article className="card journey-card">
        <p className="eyebrow">YOUR JOURNEY</p>
        <div className="journey-grid">
          <div className="journey-item"><Flame size={35} strokeWidth={1.4} /><strong>{journeyLoading ? '—' : journeyStats.streak}</strong><span>day streak</span></div>
          <div className="journey-item middle"><Sprout size={35} strokeWidth={1.4} /><strong>{journeyLoading ? '—' : journeyStats.completedPractices}</strong><span>practices completed</span></div>
          <div className="journey-item meaning"><Mountain size={35} strokeWidth={1.4} /><b>Meaning Score</b><div className="score-bars">{Array.from({ length: 10 }).map((_, index) => <span key={index} className={!journeyLoading && index < Math.round(journeyStats.meaningScore) ? 'filled' : ''} />)}</div><small>{journeyLoading ? 'Calculating…' : `${journeyStats.meaningScore.toFixed(1)} / 10`}</small></div>
        </div>
      </article>

      {isPracticePickerOpen && (
        <PracticeChooser
          practices={practices}
          selectedPractice={todayPractice}
          recommendations={practiceRecommendations}
          onClose={() => setIsPracticePickerOpen(false)}
          onSelect={onSelectDailyPractice}
          onSuggest={onSuggestPractice}
          onVote={onVotePracticeRecommendation}
        />
      )}

      {isContributionOpen && (
        <div className="modal-backdrop" onMouseDown={() => !contributionSaving && setIsContributionOpen(false)}>
          <form className="contribution-modal" onSubmit={submitContribution} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div><p className="eyebrow">CONTRIBUTE SOMETHING</p><h2>What belongs with this intention?</h2><p>Share something that helped you understand or live it.</p></div>
              <button className="modal-close" type="button" onClick={() => setIsContributionOpen(false)}><X size={20} /></button>
            </div>
            <label>Type<select value={contribution.contentType} onChange={(event) => setContribution((current) => ({ ...current, contentType: event.target.value }))}>
              {Object.entries(TYPE_META).filter(([type]) => !['prompt', 'practice'].includes(type)).map(([type, meta]) => <option value={type} key={type}>{meta.label}</option>)}
            </select></label>
            <label>Title<input value={contribution.title} onChange={(event) => setContribution((current) => ({ ...current, title: event.target.value }))} placeholder="Optional title" /></label>
            <label>Words<textarea value={contribution.body} onChange={(event) => setContribution((current) => ({ ...current, body: event.target.value }))} placeholder="Quote, reflection, description, fact, or short passage" /></label>
            <label>Creator or source<input value={contribution.creator} onChange={(event) => setContribution((current) => ({ ...current, creator: event.target.value }))} placeholder="Author, artist, musician…" /></label>
            <label>Source link<input type="url" value={contribution.externalUrl} onChange={(event) => setContribution((current) => ({ ...current, externalUrl: event.target.value }))} placeholder="https://…" /></label>
            {contribution.contentType === 'photo' && <label>Photograph<input type="file" accept="image/*" onChange={(event) => setContribution((current) => ({ ...current, imageFile: event.target.files?.[0] || null }))} /></label>}
            {contributionError && <p className="auth-alert error">{contributionError}</p>}
            <button className="auth-submit" type="submit" disabled={contributionSaving || (!contribution.body.trim() && !contribution.title.trim() && !contribution.imageFile)}>{contributionSaving ? 'Contributing…' : 'Add to this intention'}</button>
          </form>
        </div>
      )}
    </section>
  );
}
