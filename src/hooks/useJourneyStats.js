import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const EMPTY_STATS = {
  streak: 0,
  completedPractices: 0,
  meaningScore: 0
};

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function calculateStreak(completedDates) {
  const uniqueDates = new Set(completedDates);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const today = dateKey(cursor);
  if (!uniqueDates.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (uniqueDates.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function calculateMeaningScore({ completedEntries, checkIns, intentions }) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 13);

  const recentEntries = completedEntries.filter((entry) => new Date(entry.completed_at || entry.created_at) >= cutoff);
  const completedDays = new Set(recentEntries.map((entry) => dateKey(entry.completed_at || entry.created_at))).size;
  const consistencyScore = Math.min(completedDays / 14, 1) * 35;

  const recentCheckIns = checkIns.filter((entry) => new Date(`${entry.check_in_date}T00:00:00`) >= cutoff);
  const checkInDays = new Set(recentCheckIns.map((entry) => entry.check_in_date)).size;
  const averageMood = recentCheckIns.length
    ? recentCheckIns.reduce((sum, entry) => sum + Number(entry.mood_score || 0), 0) / recentCheckIns.length
    : 0;
  const reflectionScore = Math.min(checkInDays / 14, 1) * 15 + Math.min(averageMood / 5, 1) * 10;

  const recentIntentions = intentions.filter((entry) => new Date(`${entry.intention_date}T00:00:00`) >= cutoff);
  const intentionDays = new Set(recentIntentions.map((entry) => entry.intention_date)).size;
  const intentionScore = Math.min(intentionDays / 14, 1) * 20;

  const minutes = recentEntries.reduce((sum, entry) => sum + Number(entry.duration_minutes || 0), 0);
  const detailedEntries = recentEntries.filter(
    (entry) => Boolean(entry.notes?.trim()) || (entry.photo_paths?.length || 0) > 0
  ).length;
  const depthScore = Math.min(minutes / 150, 1) * 10 + Math.min(detailedEntries / 7, 1) * 10;

  return Math.min((consistencyScore + reflectionScore + intentionScore + depthScore) / 10, 10);
}

export default function useJourneyStats(userId) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!userId) {
      setStats(EMPTY_STATS);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    async function loadStats() {
      const [practiceResult, checkInResult, intentionResult] = await Promise.all([
        supabase
          .from('practice_diary_entries')
          .select('status, duration_minutes, notes, photo_paths, completed_at, created_at')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false }),
        supabase
          .from('daily_check_ins')
          .select('check_in_date, mood_score')
          .order('check_in_date', { ascending: false })
          .limit(60),
        supabase
          .from('daily_intentions')
          .select('intention_date')
          .order('intention_date', { ascending: false })
          .limit(60)
      ]);

      if (!active) return;

      const error = practiceResult.error || checkInResult.error || intentionResult.error;
      if (error) {
        console.error('Could not load journey stats:', error);
        setLoading(false);
        return;
      }

      const completedEntries = practiceResult.data || [];
      const completedDates = completedEntries.map((entry) => entry.completed_at || entry.created_at);

      setStats({
        streak: calculateStreak(completedDates),
        completedPractices: completedEntries.length,
        meaningScore: calculateMeaningScore({
          completedEntries,
          checkIns: checkInResult.data || [],
          intentions: intentionResult.data || []
        })
      });
      setLoading(false);
    }

    loadStats();
    return () => {
      active = false;
    };
  }, [userId, refreshToken]);

  return { stats, loading, refresh };
}
