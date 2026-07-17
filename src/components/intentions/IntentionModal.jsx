import { Globe2, Star, Trash2, X } from 'lucide-react';

export default function IntentionModal({
  isOpen,
  filter,
  draft,
  session,
  starredIntentions,
  starredLoading,
  communityIntentions,
  communityLoading,
  communityError,
  suggestions = [],
  suggestionsLoading = false,
  suggestionsError = '',
  shareCustomIntention,
  intentionError,
  onClose,
  onFilterChange,
  onChoose,
  onStarText,
  onRemoveStarred,
  onUpdateVisibility,
  onOpenAuth,
  onDraftChange,
  onShareChange,
  onSubmit,
  isTextStarred
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="intention-modal" role="dialog" aria-modal="true" aria-labelledby="intention-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">DAILY DIRECTION</p>
            <h2 id="intention-modal-title">Choose an intention</h2>
            <p>Start with one of these, or write something that feels true for today.</p>
          </div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}><X size={23} /></button>
        </div>

        <div className="intention-filter" role="tablist" aria-label="Intention collection">
          <button type="button" role="tab" aria-selected={filter === 'recommended'} className={filter === 'recommended' ? 'active' : ''} onClick={() => onFilterChange('recommended')}>Recommended</button>
          <button type="button" role="tab" aria-selected={filter === 'starred'} className={filter === 'starred' ? 'active' : ''} onClick={() => onFilterChange('starred')}><Star size={16} fill="currentColor" />Starred {session ? `(${starredIntentions.length})` : ''}</button>
          <button type="button" role="tab" aria-selected={filter === 'explore'} className={filter === 'explore' ? 'active' : ''} onClick={() => onFilterChange('explore')}><Globe2 size={16} />Explore</button>
        </div>

        {filter === 'recommended' ? (
          <div className="suggestion-grid" aria-label="Recommended intentions">
            {suggestionsLoading ? (
              <p className="starred-status">Loading intentions…</p>
            ) : suggestionsError ? (
              <p className="intention-alert" role="alert">{suggestionsError}</p>
            ) : suggestions.length === 0 ? (
              <div className="starred-empty"><Star size={28} /><p>No recommended intentions are available yet.</p></div>
            ) : (
              suggestions.map((suggestion) => (
                <div className={`suggestion-card ${draft === suggestion.text ? 'selected' : ''}`} key={suggestion.id}>
                  <button type="button" className="suggestion-select" onClick={() => onChoose(suggestion.text)}>“{suggestion.text}”</button>
                  <button type="button" className={`star-action ${isTextStarred(suggestion.text) ? 'active' : ''}`} aria-label={isTextStarred(suggestion.text) ? 'Unstar intention' : 'Star intention'} onClick={(event) => onStarText(event, suggestion.text)}>
                    <Star size={18} fill={isTextStarred(suggestion.text) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : filter === 'starred' ? (
          <div className="starred-intention-list" aria-label="Starred intentions">
            {!session ? (
              <div className="starred-empty"><Star size={28} /><p>Sign in to save and reuse your own intentions.</p><button type="button" className="secondary-button" onClick={() => onOpenAuth('signin')}>Sign in</button></div>
            ) : starredLoading ? (
              <p className="starred-status">Loading your intentions…</p>
            ) : starredIntentions.length === 0 ? (
              <div className="starred-empty"><Star size={28} /><p>Your custom intentions will appear here after you use them.</p></div>
            ) : (
              starredIntentions.map((item) => (
                <div className={`starred-intention-row ${draft === item.text ? 'selected' : ''}`} key={item.id}>
                  <button type="button" className="starred-intention-select" onClick={() => onChoose(item.text)}><Star size={16} fill="currentColor" /><span>“{item.text}”</span></button>
                  <button type="button" className={`visibility-button ${item.is_public ? 'public' : ''}`} onClick={(event) => { event.stopPropagation(); onUpdateVisibility(item, !item.is_public); }}>{item.is_public ? 'Public' : 'Private'}</button>
                  <button type="button" className="starred-delete" aria-label={`Remove ${item.text}`} onClick={(event) => onRemoveStarred(event, item)}><Trash2 size={18} /></button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="modal-community-list" aria-label="Community intentions">
            {!session ? (
              <div className="starred-empty"><Globe2 size={28} /><p>Sign in to explore intentions shared by the community.</p><button type="button" className="secondary-button" onClick={() => onOpenAuth('signin')}>Sign in</button></div>
            ) : communityLoading ? (
              <p className="starred-status">Loading community intentions…</p>
            ) : communityError ? (
              <p className="intention-alert" role="alert">{communityError}</p>
            ) : communityIntentions.length === 0 ? (
              <div className="starred-empty"><Globe2 size={28} /><p>No public intentions have been shared yet.</p></div>
            ) : (
              communityIntentions.map((item) => (
                <div className={`modal-community-row ${draft === item.text ? 'selected' : ''}`} key={item.id}>
                  <button type="button" className="community-intention-select" onClick={() => onChoose(item.text)}>“{item.text}”</button>
                  <button type="button" className={`star-action ${isTextStarred(item.text) ? 'active' : ''}`} aria-label={isTextStarred(item.text) ? 'Unstar intention' : 'Star intention'} onClick={(event) => onStarText(event, item.text)}>
                    <Star size={18} fill={isTextStarred(item.text) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <form className="modal-custom-form" onSubmit={onSubmit}>
          <label htmlFor="custom-intention">Write your own</label>
          <textarea id="custom-intention" value={draft} onChange={(event) => onDraftChange(event.target.value)} maxLength={140} rows={3} placeholder="Today, I will…" autoFocus />
          <label className="community-toggle">
            <input type="checkbox" checked={shareCustomIntention} onChange={(event) => onShareChange(event.target.checked)} />
            <span><strong>Share with the community</strong><small>Anyone signed in can discover this intention. You can make it private later.</small></span>
          </label>
          {intentionError && <p className="intention-alert" role="alert">{intentionError}</p>}
          <div className="modal-footer">
            <span>{draft.length}/140</span>
            <div className="intention-actions">
              <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="save-button" disabled={!draft.trim()}>Use this intention</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
