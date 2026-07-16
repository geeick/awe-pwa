import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function dateSeed(dateKey, intention) {
  const source = `${dateKey}:${intention}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function normalizeRecommendations(rows, votedIds) {
  return (rows || [])
    .map((row) => ({
      id: row.id,
      intentionText: row.intention_text,
      practiceId: row.practice_id,
      submittedBy: row.submitted_by,
      createdAt: row.created_at,
      practice: row.practices,
      voteCount: row.intention_practice_votes?.[0]?.count || 0,
      hasVoted: votedIds.has(row.id)
    }))
    .filter((item) => item.practice)
    .sort((a, b) => b.voteCount - a.voteCount || new Date(b.createdAt) - new Date(a.createdAt));
}

export default function useDailyPractice({
  intention,
  practices,
  userId,
  dateKey
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [selectionSource, setSelectionSource] = useState('automatic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);

  const automaticPractice = useMemo(() => {
    if (!practices.length || !intention) return null;
    return practices[dateSeed(dateKey, intention) % practices.length];
  }, [dateKey, intention, practices]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!intention || !practices.length) {
        setRecommendations([]);
        setSelectedPractice(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const recommendationResult = await supabase
        .from('intention_practice_recommendations')
        .select(`
          id,
          intention_text,
          practice_id,
          submitted_by,
          created_at,
          practices (
            id,
            title,
            description,
            instructions,
            category,
            duration_minutes,
            benefit,
            icon
          ),
          intention_practice_votes(count)
        `)
        .eq('intention_text', intention)
        .order('created_at', { ascending: false });

      if (!active) return;

      if (recommendationResult.error) {
        setError(recommendationResult.error.message);
        setSelectedPractice(automaticPractice);
        setSelectionSource('automatic');
        setLoading(false);
        return;
      }

      const rows = recommendationResult.data || [];
      let votedIds = new Set();

      if (userId && rows.length) {
        const { data: votes } = await supabase
          .from('intention_practice_votes')
          .select('recommendation_id')
          .eq('user_id', userId)
          .in('recommendation_id', rows.map((row) => row.id));

        votedIds = new Set((votes || []).map((vote) => vote.recommendation_id));
      }

      const normalized = normalizeRecommendations(rows, votedIds);
      if (!active) return;
      setRecommendations(normalized);

      const communityChoice = normalized[0]?.practice || null;
      const recommended = communityChoice || automaticPractice;

      if (!userId) {
        setSelectedPractice(recommended);
        setSelectionSource(communityChoice ? 'community' : 'automatic');
        setLoading(false);
        return;
      }

      const { data: savedSelection, error: selectionError } = await supabase
        .from('daily_practice_selections')
        .select('practice_id, source, practices(id, title, description, instructions, category, duration_minutes, benefit, icon)')
        .eq('user_id', userId)
        .eq('selection_date', dateKey)
        .maybeSingle();

      if (!active) return;

      if (selectionError) {
        setError(selectionError.message);
        setSelectedPractice(recommended);
        setSelectionSource(communityChoice ? 'community' : 'automatic');
        setLoading(false);
        return;
      }

      if (savedSelection?.practices) {
        setSelectedPractice(savedSelection.practices);
        setSelectionSource(savedSelection.source || 'manual');
        setLoading(false);
        return;
      }

      if (recommended) {
        const source = communityChoice ? 'community' : 'automatic';
        const { error: saveError } = await supabase
          .from('daily_practice_selections')
          .upsert(
            {
              user_id: userId,
              selection_date: dateKey,
              intention_text: intention,
              practice_id: recommended.id,
              source
            },
            { onConflict: 'user_id,selection_date' }
          );

        if (saveError) setError(saveError.message);
        setSelectedPractice(recommended);
        setSelectionSource(source);
      }

      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [automaticPractice, dateKey, intention, practices, refreshToken, userId]);

  const selectPractice = useCallback(async (practice) => {
    if (!practice) return;
    if (!userId) {
      setSelectedPractice(practice);
      setSelectionSource('manual');
      return;
    }

    const { error: saveError } = await supabase
      .from('daily_practice_selections')
      .upsert(
        {
          user_id: userId,
          selection_date: dateKey,
          intention_text: intention,
          practice_id: practice.id,
          source: 'manual'
        },
        { onConflict: 'user_id,selection_date' }
      );

    if (saveError) throw saveError;
    setSelectedPractice(practice);
    setSelectionSource('manual');
  }, [dateKey, intention, userId]);

  const suggestPractice = useCallback(async (practiceId) => {
    if (!userId) throw new Error('Sign in to suggest a practice.');
    const { error: insertError } = await supabase
      .from('intention_practice_recommendations')
      .insert({
        intention_text: intention,
        practice_id: practiceId,
        submitted_by: userId
      });

    if (insertError && insertError.code !== '23505') throw insertError;
    refresh();
  }, [intention, refresh, userId]);

  const vote = useCallback(async (recommendation) => {
    if (!userId) throw new Error('Sign in to vote for a practice.');

    if (recommendation.hasVoted) {
      const { error: deleteError } = await supabase
        .from('intention_practice_votes')
        .delete()
        .eq('recommendation_id', recommendation.id)
        .eq('user_id', userId);
      if (deleteError) throw deleteError;
    } else {
      const { error: insertError } = await supabase
        .from('intention_practice_votes')
        .insert({
          recommendation_id: recommendation.id,
          user_id: userId
        });
      if (insertError) throw insertError;
    }

    setRecommendations((current) => current
      .map((item) => item.id === recommendation.id
        ? {
            ...item,
            hasVoted: !item.hasVoted,
            voteCount: Math.max(0, item.voteCount + (item.hasVoted ? -1 : 1))
          }
        : item)
      .sort((a, b) => b.voteCount - a.voteCount)
    );
  }, [userId]);

  return {
    selectedPractice,
    selectionSource,
    recommendations,
    loading,
    error,
    selectPractice,
    suggestPractice,
    vote,
    refresh
  };
}
