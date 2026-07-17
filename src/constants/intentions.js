export const intentionSuggestions = [];

export function setIntentionSuggestions(suggestions) {
  intentionSuggestions.splice(0, intentionSuggestions.length, ...suggestions);
}

export const moods = [
  { label: 'Hard', face: '☹' },
  { label: 'Okay', face: '−' },
  { label: 'Good', face: '☺' },
  { label: 'Great', face: '●' },
  { label: 'Amazing', face: '✦' }
];
