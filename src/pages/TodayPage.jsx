import { useMemo, useState } from 'react';
import {
  BookOpen, Camera, ChevronRight, Flame, Heart, Image, Leaf, Lightbulb,
  Mountain, Music, Palette, Pencil, Plus, Quote, Sparkles, Sprout, Timer,
  TreePine, X
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
      {item.external_url && (
        <a href={item.external_url} target="_blank" rel="noreferrer">Open source</a>
      )}
      <button className={`world-love ${item.hasVoted ? 'loved' : ''}`} type="button" onClick={() => onVote(item)}>
        <Heart size={17} fill={item.hasVoted ? 'currentColor' : 'none'} />
        {item.voteCount}
      </button>
    </article>
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
  const linkedPracticeItem = intentionWorldItems.find((item) => item.content_type === 'practice' && item.practice_id);
  const todayPractice = practices.find((practice) => practice.id === linkedPracticeItem?.practice_id)
    || practices.find((practice) => practice.title === linkedPracticeItem?.title)
    || practices.find((practice) => practice.title === 'Awe Walk')
    || practices[0];
  const inspiration = intentionWorldItems
    .filter((item) => item.id !== companion?.id && !['prompt', 'practice'].includes(item.content_type))
    .slice(0, 8);
  const communityReflections = intentionWorldItems.filter((item) => item.content_type === 'reflection').slice(0, 3);

  async function submitContribution(event) {
    event.preventDefault();
    setContributionSaving(true);
    setContributionError('');
    try {
      await onContributeToIntention(contribution);
      setContribution({
        contentType: 'quote',
        title: '',
        body: '',
        creator: '',
        externalUrl: '',
        imageFile: null
      });
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
              <span className="today-date">{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
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
        {intentionWorldLoading ? (
          <p className="page-status">Gathering today’s world…</p>
        ) : companion ? (
          <WorldItem item={companion} onVote={vote} />
        ) : (
          <p className="page-status">This intention is waiting for its first community contribution.</p>
        )}
      </article>

      <section className="card community-inspiration-card">
        <div className="world-section-heading">
          <div><p className="eyebrow">COMMUNITY INSPIRATION</p><h2>Things people believe belong here</h2></div>
          <button className="contribute-button" type="button" onClick={() => setIsContributionOpen(true)}>
            <Plus size={18} /> Contribute
          </button>
        </div>
        {intentionWorldError && <p className="intention-alert">{intentionWorldError}</p>}
        {contributionError && <p className="intention-alert">{contributionError}</p>}
        {inspiration.length ? (
          <div className="world-grid">{inspiration.map((item) => <WorldItem key={item.id} item={item} onVote={vote} />)}</div>
        ) : (
          <div className="world-empty"><p>No community favorites yet.</p><button className="secondary-button" onClick={() => setIsContributionOpen(true)}>Add the first one</button></div>
        )}
      </section>

      <article className="card practice-card intention-practice-card">
        <p className="eyebrow">TODAY’S PRACTICE</p>
        <div className="practice-row">
          <div className="round-icon"><TreePine size={50} strokeWidth={1.5} /></div>
          <div className="practice-copy">
            <h2>{todayPractice?.title || 'A practice for this intention'}</h2>
            <p>{todayPractice?.description || 'Choose a practice from the library and connect it to today’s intention.'}</p>
            <div className="meta-row">
              <span><Timer size={21} /> {todayPractice?.duration_minutes || '5–15'} min</span>
              {todayPractice?.benefit && <><i /><span><Leaf size={21} /> {todayPractice.benefit}</span></>}
            </div>
          </div>
          <ChevronRight className="chevron" size={35} strokeWidth={1.6} />
        </div>
        <button className="primary-button" type="button" onClick={() => onStartPractice(todayPractice)} disabled={!todayPractice}>Start Practice</button>
        {pageError && <p className="intention-alert" role="alert">{pageError}</p>}
      </article>

      <article className="card reflection-card intention-reflection-card">
        <div className="reflection-heading">
          <div>
            <p className="eyebrow">EVENING REFLECTION</p>
            <h2>{prompt?.body || `How did “${intention}” change the way you moved through today?`}</h2>
          </div>
        </div>
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
          <div className="community-reflection-list">
            {communityReflections.map((item) => <WorldItem key={item.id} item={item} onVote={vote} />)}
          </div>
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
