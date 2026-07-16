import { Camera, CheckCircle2, Leaf, Save, Timer, X } from 'lucide-react';

export default function PracticeSessionModal({
  practice,
  notes,
  photos,
  saving,
  error,
  onClose,
  onNotesChange,
  onAddPhotos,
  onRemovePhoto,
  onSave
}) {
  if (!practice) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="practice-session-modal" role="dialog" aria-modal="true" aria-labelledby="practice-session-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading"><div><p className="eyebrow">PRACTICE SESSION</p><h2 id="practice-session-title">{practice.title}</h2><p>{practice.instructions}</p></div><button className="modal-close" type="button" aria-label="Close" onClick={onClose}><X size={23}/></button></div>
        <div className="session-meta"><span><Timer size={18}/> {practice.duration_minutes} min</span>{practice.benefit && <span><Leaf size={18}/> {practice.benefit}</span>}</div>
        <label className="session-notes">Notes<textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} placeholder="What did you notice? What changed while you practiced?" rows={6}/></label>
        <div className="session-photos-heading"><div><strong>Photos</strong><small>Add up to six images from the practice.</small></div><label className="photo-upload-button"><Camera size={18}/> Add photos<input type="file" accept="image/*" multiple onChange={onAddPhotos}/></label></div>
        {photos.length > 0 && <div className="session-photo-grid">{photos.map((photo) => <figure key={photo.id}><img src={photo.preview} alt="Practice preview"/><button type="button" aria-label="Remove photo" onClick={() => onRemovePhoto(photo.id)}><X size={16}/></button></figure>)}</div>}
        {error && <p className="intention-alert" role="alert">{error}</p>}
        <div className="practice-session-actions"><button className="secondary-button" type="button" disabled={saving} onClick={() => onSave('draft')}><Save size={17}/> Save for later</button><button className="save-button" type="button" disabled={saving} onClick={() => onSave('completed')}><CheckCircle2 size={17}/> {saving ? 'Saving…' : 'Complete practice'}</button></div>
      </section>
    </div>
  );
}
