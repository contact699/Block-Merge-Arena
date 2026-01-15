// Social Sharing & TikTok Integration Utilities

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share, Linking, Platform } from 'react-native';
import type {
  ShareableHighlight,
  ShareContent,
  ShareResult,
  SharePlatform,
  RecordingConfig,
  SocialStats,
} from '@/lib/types/social';
import {
  DEFAULT_RECORDING_CONFIG,
  DEFAULT_SOCIAL_STATS,
  HASHTAGS,
  CAPTION_TEMPLATES,
} from '@/lib/types/social';

const HIGHLIGHTS_KEY = '@block_merge_arena:highlights';
const RECORDING_CONFIG_KEY = '@block_merge_arena:recording_config';
const SOCIAL_STATS_KEY = '@block_merge_arena:social_stats';

/**
 * Generate unique highlight ID
 */
function generateHighlightId(): string {
  return `hl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ==================== Recording Config ====================

/**
 * Get recording configuration
 */
export async function getRecordingConfig(): Promise<RecordingConfig> {
  try {
    const data = await AsyncStorage.getItem(RECORDING_CONFIG_KEY);
    return data ? { ...DEFAULT_RECORDING_CONFIG, ...JSON.parse(data) } : DEFAULT_RECORDING_CONFIG;
  } catch (error) {
    console.error('Error loading recording config:', error);
    return DEFAULT_RECORDING_CONFIG;
  }
}

/**
 * Save recording configuration
 */
export async function saveRecordingConfig(config: Partial<RecordingConfig>): Promise<void> {
  try {
    const current = await getRecordingConfig();
    const updated = { ...current, ...config };
    await AsyncStorage.setItem(RECORDING_CONFIG_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recording config:', error);
  }
}

// ==================== Highlights Management ====================

/**
 * Get all saved highlights
 */
export async function getHighlights(): Promise<ShareableHighlight[]> {
  try {
    const data = await AsyncStorage.getItem(HIGHLIGHTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading highlights:', error);
    return [];
  }
}

/**
 * Save a new highlight
 */
export async function saveHighlight(highlight: Omit<ShareableHighlight, 'id'>): Promise<ShareableHighlight> {
  try {
    const config = await getRecordingConfig();
    const highlights = await getHighlights();

    const newHighlight: ShareableHighlight = {
      ...highlight,
      id: generateHighlightId(),
    };

    highlights.unshift(newHighlight);

    // Keep only max highlights
    const trimmed = highlights.slice(0, config.maxHighlights);

    await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(trimmed));
    return newHighlight;
  } catch (error) {
    console.error('Error saving highlight:', error);
    throw error;
  }
}

/**
 * Delete a highlight
 */
export async function deleteHighlight(highlightId: string): Promise<void> {
  try {
    const highlights = await getHighlights();
    const filtered = highlights.filter((h) => h.id !== highlightId);
    await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting highlight:', error);
  }
}

/**
 * Clear all highlights
 */
export async function clearAllHighlights(): Promise<void> {
  try {
    await AsyncStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing highlights:', error);
  }
}

// ==================== Auto-Capture Detection ====================

/**
 * Check if a moment should be auto-captured
 */
export async function shouldAutoCapture(
  comboCount: number,
  multiplier: number,
  linesCleared: number
): Promise<boolean> {
  const config = await getRecordingConfig();

  if (!config.enabled || !config.autoCapture) {
    return false;
  }

  return (
    comboCount >= config.captureThreshold.minCombo ||
    multiplier >= config.captureThreshold.minMultiplier ||
    linesCleared >= config.captureThreshold.minLinesCleared
  );
}

/**
 * Capture a combo highlight
 */
export async function captureComboHighlight(
  comboCount: number,
  multiplier: number,
  score: number,
  replayCode?: string
): Promise<ShareableHighlight> {
  return saveHighlight({
    type: 'combo',
    title: `${comboCount}x Combo!`,
    description: `Scored ${score.toLocaleString()} with a ${multiplier}x multiplier!`,
    score,
    multiplier,
    comboCount,
    timestamp: Date.now(),
    replayCode,
  });
}

/**
 * Capture a high score highlight
 */
export async function captureHighScoreHighlight(
  score: number,
  replayCode?: string
): Promise<ShareableHighlight> {
  return saveHighlight({
    type: 'high_score',
    title: 'New High Score!',
    description: `${score.toLocaleString()} points - a new personal best!`,
    score,
    timestamp: Date.now(),
    replayCode,
  });
}

/**
 * Capture a tournament win highlight
 */
export async function captureTournamentHighlight(
  rank: number,
  score: number,
  replayCode?: string
): Promise<ShareableHighlight> {
  const title = rank === 1 ? '🏆 Tournament Winner!' : `#${rank} in Tournament!`;
  return saveHighlight({
    type: 'tournament_win',
    title,
    description: `Scored ${score.toLocaleString()} in the daily tournament!`,
    score,
    timestamp: Date.now(),
    replayCode,
  });
}

/**
 * Capture a rank up highlight
 */
export async function captureRankUpHighlight(
  newRank: string,
  score: number
): Promise<ShareableHighlight> {
  return saveHighlight({
    type: 'rank_up',
    title: `Ranked Up: ${newRank}!`,
    description: `Climbed the ladder with ${score.toLocaleString()} points!`,
    score,
    timestamp: Date.now(),
  });
}

/**
 * Capture an achievement highlight
 */
export async function captureAchievementHighlight(
  achievementName: string,
  achievementDescription: string
): Promise<ShareableHighlight> {
  return saveHighlight({
    type: 'achievement',
    title: `🏅 ${achievementName}`,
    description: achievementDescription,
    timestamp: Date.now(),
  });
}

// ==================== Caption Generation ====================

/**
 * Generate a share caption based on highlight type
 */
export function generateCaption(highlight: ShareableHighlight): string {
  const templates = CAPTION_TEMPLATES[highlight.type === 'high_score' ? 'highScore' : 
                                       highlight.type === 'tournament_win' ? 'tournament' :
                                       highlight.type === 'rank_up' ? 'rankUp' : 'combo'];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return template
    .replace('{combo}', String(highlight.comboCount || 0))
    .replace('{multiplier}', String(highlight.multiplier || 1))
    .replace('{score}', (highlight.score || 0).toLocaleString())
    .replace('{rank}', highlight.title.replace(/.*: /, ''))
    .replace('{hashtag}', 'BlockMergeArena');
}

/**
 * Get hashtags for a highlight
 */
export function getHashtags(highlight: ShareableHighlight): string[] {
  const base = [...HASHTAGS.default];
  
  switch (highlight.type) {
    case 'combo':
      return [...base, ...HASHTAGS.combo];
    case 'high_score':
      return [...base, ...HASHTAGS.highScore];
    case 'tournament_win':
      return [...base, ...HASHTAGS.tournament];
    case 'achievement':
    case 'rank_up':
      return [...base, ...HASHTAGS.achievement];
    default:
      return base;
  }
}

// ==================== Sharing Functions ====================

/**
 * Get TikTok deep link
 */
function getTikTokDeepLink(): string {
  // TikTok URL scheme for opening the app
  return Platform.OS === 'ios' 
    ? 'tiktok://create' 
    : 'https://www.tiktok.com/upload';
}

/**
 * Check if TikTok is installed
 */
export async function isTikTokInstalled(): Promise<boolean> {
  try {
    const url = Platform.OS === 'ios' ? 'tiktok://' : 'com.zhiliaoapp.musically';
    return await Linking.canOpenURL(url);
  } catch {
    return false;
  }
}

/**
 * Share to TikTok
 */
export async function shareToTikTok(highlight: ShareableHighlight): Promise<ShareResult> {
  try {
    const caption = generateCaption(highlight);
    const hashtags = getHashtags(highlight);
    const hashtagString = hashtags.map((h) => `#${h}`).join(' ');
    
    const fullCaption = `${caption}\n\n${hashtagString}`;
    
    // Check if TikTok is installed
    const installed = await isTikTokInstalled();
    
    if (installed) {
      // Open TikTok with the caption copied
      // Note: TikTok SDK would be needed for direct video sharing
      // This opens TikTok's creation flow
      await Linking.openURL(getTikTokDeepLink());
      
      // Also share the caption via system share so user can paste
      await Share.share({
        message: fullCaption,
      });
    } else {
      // Fallback to web
      const webUrl = `https://www.tiktok.com/upload?caption=${encodeURIComponent(fullCaption)}`;
      await Linking.openURL(webUrl);
    }
    
    // Update stats
    await updateShareStats('tiktok', highlight.id);
    
    return { success: true, platform: 'tiktok', shared: true };
  } catch (error) {
    console.error('Error sharing to TikTok:', error);
    return { success: false, platform: 'tiktok', error: String(error) };
  }
}

/**
 * Share to Instagram
 */
export async function shareToInstagram(highlight: ShareableHighlight): Promise<ShareResult> {
  try {
    const caption = generateCaption(highlight);
    const hashtags = getHashtags(highlight);
    const hashtagString = hashtags.map((h) => `#${h}`).join(' ');
    
    const fullCaption = `${caption}\n\n${hashtagString}`;
    
    // Instagram Stories URL scheme
    const instagramUrl = 'instagram://story-camera';
    const canOpen = await Linking.canOpenURL(instagramUrl);
    
    if (canOpen) {
      await Linking.openURL(instagramUrl);
      // Copy caption for user to paste
      await Share.share({ message: fullCaption });
    } else {
      // Fallback to web
      await Linking.openURL('https://www.instagram.com');
      await Share.share({ message: fullCaption });
    }
    
    await updateShareStats('instagram', highlight.id);
    
    return { success: true, platform: 'instagram', shared: true };
  } catch (error) {
    console.error('Error sharing to Instagram:', error);
    return { success: false, platform: 'instagram', error: String(error) };
  }
}

/**
 * Share to Twitter/X
 */
export async function shareToTwitter(highlight: ShareableHighlight): Promise<ShareResult> {
  try {
    const caption = generateCaption(highlight);
    const hashtags = getHashtags(highlight).slice(0, 3); // Twitter has char limit
    const hashtagString = hashtags.map((h) => `#${h}`).join(' ');
    
    const tweetText = `${caption} ${hashtagString}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    
    await Linking.openURL(twitterUrl);
    await updateShareStats('twitter', highlight.id);
    
    return { success: true, platform: 'twitter', shared: true };
  } catch (error) {
    console.error('Error sharing to Twitter:', error);
    return { success: false, platform: 'twitter', error: String(error) };
  }
}

/**
 * Generic share using system share sheet
 */
export async function shareGeneric(highlight: ShareableHighlight): Promise<ShareResult> {
  try {
    const caption = generateCaption(highlight);
    const hashtags = getHashtags(highlight);
    const hashtagString = hashtags.map((h) => `#${h}`).join(' ');
    
    let message = `${caption}\n\n${hashtagString}`;
    
    // Add replay code if available
    if (highlight.replayCode) {
      message += `\n\n👻 Watch my replay: ${highlight.replayCode}`;
    }
    
    message += '\n\n🎮 Play Block Merge Arena!';
    
    const result = await Share.share({
      message,
      title: highlight.title,
    });
    
    if (result.action === Share.sharedAction) {
      await updateShareStats('generic', highlight.id);
      return { success: true, platform: 'generic', shared: true };
    }
    
    return { success: true, platform: 'generic', shared: false };
  } catch (error) {
    console.error('Error sharing:', error);
    return { success: false, platform: 'generic', error: String(error) };
  }
}

/**
 * Share to a specific platform
 */
export async function shareToPlatform(
  platform: SharePlatform,
  highlight: ShareableHighlight
): Promise<ShareResult> {
  switch (platform) {
    case 'tiktok':
      return shareToTikTok(highlight);
    case 'instagram':
      return shareToInstagram(highlight);
    case 'twitter':
      return shareToTwitter(highlight);
    case 'facebook':
      return shareToFacebook(highlight);
    default:
      return shareGeneric(highlight);
  }
}

/**
 * Share to Facebook
 */
export async function shareToFacebook(highlight: ShareableHighlight): Promise<ShareResult> {
  try {
    const caption = generateCaption(highlight);
    const hashtags = getHashtags(highlight);
    const hashtagString = hashtags.map((h) => `#${h}`).join(' ');
    
    const fullCaption = `${caption}\n\n${hashtagString}`;
    
    // Try Facebook app first
    const fbUrl = 'fb://';
    const canOpen = await Linking.canOpenURL(fbUrl);
    
    if (canOpen) {
      await Share.share({ message: fullCaption });
    } else {
      const webUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(fullCaption)}`;
      await Linking.openURL(webUrl);
    }
    
    await updateShareStats('facebook', highlight.id);
    
    return { success: true, platform: 'facebook', shared: true };
  } catch (error) {
    console.error('Error sharing to Facebook:', error);
    return { success: false, platform: 'facebook', error: String(error) };
  }
}

// ==================== Social Stats ====================

/**
 * Get social stats
 */
export async function getSocialStats(): Promise<SocialStats> {
  try {
    const data = await AsyncStorage.getItem(SOCIAL_STATS_KEY);
    return data ? { ...DEFAULT_SOCIAL_STATS, ...JSON.parse(data) } : DEFAULT_SOCIAL_STATS;
  } catch (error) {
    console.error('Error loading social stats:', error);
    return DEFAULT_SOCIAL_STATS;
  }
}

/**
 * Update share stats
 */
async function updateShareStats(platform: SharePlatform, highlightId: string): Promise<void> {
  try {
    const stats = await getSocialStats();
    
    stats.totalShares += 1;
    stats.sharesByPlatform[platform] += 1;
    stats.lastShareDate = Date.now();
    
    if (!stats.viralHighlights.includes(highlightId)) {
      stats.viralHighlights.push(highlightId);
    }
    
    await AsyncStorage.setItem(SOCIAL_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error updating share stats:', error);
  }
}

/**
 * Get share count for achievements
 */
export async function getShareCount(): Promise<number> {
  const stats = await getSocialStats();
  return stats.totalShares;
}

// ==================== Quick Share Functions ====================

/**
 * Quick share current game score
 */
export async function quickShareScore(
  score: number,
  mode: 'endless' | 'tournament',
  replayCode?: string
): Promise<ShareResult> {
  const highlight = await captureHighScoreHighlight(score, replayCode);
  return shareGeneric(highlight);
}

/**
 * Quick share to TikTok with auto-generated content
 */
export async function quickShareToTikTok(
  score: number,
  comboCount?: number,
  multiplier?: number,
  replayCode?: string
): Promise<ShareResult> {
  let highlight: ShareableHighlight;
  
  if (comboCount && comboCount >= 3) {
    highlight = await captureComboHighlight(comboCount, multiplier || 1, score, replayCode);
  } else {
    highlight = await captureHighScoreHighlight(score, replayCode);
  }
  
  return shareToTikTok(highlight);
}

/**
 * Get shareable highlight for game over screen
 */
export async function getGameOverShareContent(
  score: number,
  isHighScore: boolean,
  maxCombo: number,
  maxMultiplier: number,
  replayCode?: string
): Promise<{ highlight: ShareableHighlight; caption: string; hashtags: string[] }> {
  let highlight: ShareableHighlight;
  
  if (isHighScore) {
    highlight = await captureHighScoreHighlight(score, replayCode);
  } else if (maxCombo >= 3) {
    highlight = await captureComboHighlight(maxCombo, maxMultiplier, score, replayCode);
  } else {
    highlight = await saveHighlight({
      type: 'high_score',
      title: 'Great Game!',
      description: `Scored ${score.toLocaleString()} points in Block Merge Arena!`,
      score,
      timestamp: Date.now(),
      replayCode,
    });
  }
  
  return {
    highlight,
    caption: generateCaption(highlight),
    hashtags: getHashtags(highlight),
  };
}
