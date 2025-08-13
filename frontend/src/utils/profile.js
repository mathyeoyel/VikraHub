/**
 * Profile data normalization utilities
 * Ensures consistent profile data shape across the application
 */

import { asString } from './string';

/**
 * Normalize profile data from API to ensure consistent shape
 * @param data - Raw profile data from API
 * @returns Normalized profile object with safe fallbacks
 */
export const normalizeProfileData = (data) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Extract user info with multiple fallback patterns
  const userId = data.userId ?? data.user_id ?? data.user?.id ?? null;
  const username = asString(data.username ?? data.user?.username ?? '');
  
  // Normalize display name with fallbacks
  const displayName = asString(
    data.display_name ?? 
    data.displayName ?? 
    data.full_name ?? 
    data.fullName ??
    data.user?.first_name + ' ' + data.user?.last_name ??
    data.user?.display_name ??
    username ??
    'Anonymous'
  ).trim();

  // Normalize user type with fallback
  const userType = asString(
    data.user_type ?? 
    data.userType ?? 
    data.type ?? 
    'creator'
  );

  return {
    id: data.id ?? null,
    userId,
    username,
    displayName: displayName || username || 'Anonymous',
    userType,
    avatar: asString(data.avatar ?? ''),
    bio: asString(data.bio ?? ''),
    headline: asString(data.headline ?? ''),
    location: asString(data.location ?? ''),
    website: asString(data.website ?? ''),
    skills: asString(data.skills ?? ''),
    skillsList: Array.isArray(data.skills_list) ? data.skills_list : 
                Array.isArray(data.skillsList) ? data.skillsList : [],
    recognitionsList: Array.isArray(data.recognitions_list) ? data.recognitions_list :
                     Array.isArray(data.recognitionsList) ? data.recognitionsList : [],
    memberSince: data.member_since ?? data.memberSince ?? data.date_joined ?? null,
    portfolioItems: Array.isArray(data.portfolio_items) ? data.portfolio_items :
                   Array.isArray(data.portfolioItems) ? data.portfolioItems : [],
    stats: normalizeStats(data.stats),
    // Keep original data for any missed fields
    _original: data
  };
};

/**
 * Normalize stats data with safe fallbacks
 * @param stats - Raw stats object from API
 * @returns Normalized stats object
 */
export const normalizeStats = (stats) => {
  if (!stats || typeof stats !== 'object') {
    return {
      followersCount: 0,
      followingCount: 0,
      projectsCount: 0,
      isFollowing: false
    };
  }

  return {
    followersCount: Math.max(0, parseInt(stats.followers_count ?? stats.followersCount ?? 0, 10)),
    followingCount: Math.max(0, parseInt(stats.following_count ?? stats.followingCount ?? 0, 10)),
    projectsCount: Math.max(0, parseInt(stats.projects_count ?? stats.projectsCount ?? 0, 10)),
    isFollowing: Boolean(stats.is_following ?? stats.isFollowing ?? false)
  };
};

/**
 * Validate if profile has minimum required data
 * @param profile - Profile object to validate
 * @returns boolean indicating if profile is valid
 */
export const isValidProfile = (profile) => {
  if (!profile || typeof profile !== 'object') {
    return false;
  }

  // Must have at least userId, username, and displayName
  return Boolean(
    profile.userId && 
    profile.username && 
    profile.displayName
  );
};

/**
 * Create a skeleton profile object for loading states
 * @returns Skeleton profile object
 */
export const createSkeletonProfile = () => ({
  id: null,
  userId: null,
  username: '',
  displayName: 'Loading...',
  userType: 'creator',
  avatar: '',
  bio: '',
  headline: '',
  location: '',
  website: '',
  skills: '',
  skillsList: [],
  recognitionsList: [],
  memberSince: null,
  portfolioItems: [],
  stats: {
    followersCount: 0,
    followingCount: 0,
    projectsCount: 0,
    isFollowing: false
  },
  _loading: true
});

const profileUtils = {
  normalizeProfileData,
  normalizeStats,
  isValidProfile,
  createSkeletonProfile
};

export default profileUtils;
