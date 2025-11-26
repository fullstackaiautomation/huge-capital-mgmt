/**
 * Scheduling Service (D2 - Content Calendar Generator)
 *
 * Uses Winston's persona/platform knowledge to suggest optimal posting times.
 * Based on data from persona YAML files and industry best practices.
 */

import type { Person, Platform, ContentPost } from '../types/content';
import type { GeneratedContent } from './skillsRunner';

// =============================================================================
// TYPES
// =============================================================================

export interface ScheduledPost {
  id: string;
  content: string;
  persona: Person;
  platform: Platform;
  scheduledFor: string; // ISO date string
  hashtags: string[];
  imagePrompt?: {
    subject: string;
    briefConceptPrompt: string;
    plugAndPlayPrompt: string;
  };
  status: 'scheduled' | 'published' | 'draft';
  createdAt: string;
}

export interface SuggestedTime {
  date: Date;
  time: string; // "9:00 AM"
  label: string; // "Tomorrow at 9:00 AM"
  reason: string; // "Optimal engagement time for LinkedIn"
}

// =============================================================================
// OPTIMAL POSTING SCHEDULE (From Winston's Persona YAML Data)
// =============================================================================

interface PlatformSchedule {
  optimalDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  optimalTimes: string[]; // ["8:00 AM", "12:00 PM", "5:00 PM"]
  frequency: string;
  engagementPeak: string;
}

const POSTING_SCHEDULES: Record<Person, Record<Platform, PlatformSchedule>> = {
  'Zac': {
    'LinkedIn': {
      optimalDays: [1, 3, 5], // Mon, Wed, Fri
      optimalTimes: ['8:00 AM', '12:00 PM', '5:00 PM'],
      frequency: '3x per week',
      engagementPeak: 'Morning commute and lunch break',
    },
    'Instagram': {
      optimalDays: [1, 3, 5, 0], // Mon, Wed, Fri, Sun
      optimalTimes: ['9:00 AM', '1:00 PM', '7:00 PM'],
      frequency: '4x per week',
      engagementPeak: 'Evening scroll time',
    },
    'Facebook': {
      optimalDays: [1, 3, 5], // Mon, Wed, Fri
      optimalTimes: ['9:00 AM', '1:00 PM', '4:00 PM'],
      frequency: '2-3x per week',
      engagementPeak: 'Afternoon break',
    },
    'Twitter': {
      optimalDays: [1, 2, 3, 4, 5], // Weekdays
      optimalTimes: ['8:00 AM', '12:00 PM', '6:00 PM'],
      frequency: 'Daily',
      engagementPeak: 'Throughout the day',
    },
    'Blog': {
      optimalDays: [2, 4], // Tue, Thu
      optimalTimes: ['10:00 AM'],
      frequency: '2x per week',
      engagementPeak: 'Mid-morning',
    },
    'Newsletter': {
      optimalDays: [2], // Tuesday
      optimalTimes: ['10:00 AM'],
      frequency: 'Weekly',
      engagementPeak: 'Tuesday morning',
    },
    'Skool': {
      optimalDays: [1, 3, 5], // Mon, Wed, Fri
      optimalTimes: ['10:00 AM', '2:00 PM'],
      frequency: '3x per week',
      engagementPeak: 'Mid-day',
    },
    'ISO Newsletter': {
      optimalDays: [2], // Tuesday
      optimalTimes: ['10:00 AM'],
      frequency: 'Weekly',
      engagementPeak: 'Tuesday morning',
    },
  },
  'Luke': {
    'LinkedIn': {
      optimalDays: [1, 3, 5], // Mon, Wed, Fri
      optimalTimes: ['8:00 AM', '12:00 PM', '5:00 PM'],
      frequency: '3x per week',
      engagementPeak: 'Business hours',
    },
    'Instagram': {
      optimalDays: [1, 3, 5, 0], // Mon, Wed, Fri, Sun
      optimalTimes: ['9:00 AM', '1:00 PM', '7:00 PM'],
      frequency: '4x per week',
      engagementPeak: 'Evening for real estate investors',
    },
    'Facebook': {
      optimalDays: [1, 3, 5], // Mon, Wed, Fri
      optimalTimes: ['9:00 AM', '1:00 PM', '6:00 PM'],
      frequency: '2-3x per week',
      engagementPeak: 'Lunch and after work',
    },
    'Twitter': {
      optimalDays: [1, 2, 3, 4, 5],
      optimalTimes: ['8:00 AM', '12:00 PM', '6:00 PM'],
      frequency: 'Daily',
      engagementPeak: 'Throughout the day',
    },
    'Skool': {
      optimalDays: [0, 1, 2, 3, 4, 5, 6], // Daily
      optimalTimes: ['10:00 AM', '2:00 PM', '8:00 PM'],
      frequency: 'Daily community engagement',
      engagementPeak: 'Evening for investors',
    },
    'Blog': {
      optimalDays: [2, 4],
      optimalTimes: ['10:00 AM'],
      frequency: '2x per week',
      engagementPeak: 'Mid-morning',
    },
    'Newsletter': {
      optimalDays: [2],
      optimalTimes: ['10:00 AM'],
      frequency: 'Weekly',
      engagementPeak: 'Tuesday morning',
    },
    'ISO Newsletter': {
      optimalDays: [2],
      optimalTimes: ['10:00 AM'],
      frequency: 'Weekly',
      engagementPeak: 'Tuesday morning',
    },
  },
  'Huge Capital': {
    'Facebook': {
      optimalDays: [1, 3, 5, 6], // Mon, Wed, Fri, Sat
      optimalTimes: ['9:00 AM', '1:00 PM', '6:00 PM'],
      frequency: '3-4x per week',
      engagementPeak: 'Weekends for small business owners',
    },
    'Blog': {
      optimalDays: [2, 4], // Tue, Thu
      optimalTimes: ['10:00 AM'],
      frequency: '2x per week',
      engagementPeak: 'Mid-morning search traffic',
    },
    'Newsletter': {
      optimalDays: [2], // Tuesday
      optimalTimes: ['10:00 AM'],
      frequency: 'Weekly',
      engagementPeak: 'Tuesday morning opens',
    },
    'LinkedIn': {
      optimalDays: [1, 3, 5],
      optimalTimes: ['8:00 AM', '12:00 PM'],
      frequency: '3x per week',
      engagementPeak: 'Business hours',
    },
    'Instagram': {
      optimalDays: [1, 3, 5, 0],
      optimalTimes: ['9:00 AM', '1:00 PM', '7:00 PM'],
      frequency: '4x per week',
      engagementPeak: 'Evening',
    },
    'Twitter': {
      optimalDays: [1, 2, 3, 4, 5],
      optimalTimes: ['8:00 AM', '12:00 PM'],
      frequency: 'Daily',
      engagementPeak: 'Throughout the day',
    },
    'Skool': {
      optimalDays: [1, 3, 5],
      optimalTimes: ['10:00 AM', '2:00 PM'],
      frequency: '3x per week',
      engagementPeak: 'Mid-day',
    },
    'ISO Newsletter': {
      optimalDays: [2],
      optimalTimes: ['10:00 AM'],
      frequency: 'Weekly',
      engagementPeak: 'Tuesday morning',
    },
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hours: 9, minutes: 0 };

  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  if (isToday) return 'Today';
  if (isTomorrow) return 'Tomorrow';

  return `${DAY_NAMES[date.getDay()]}, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getNextOccurrence(targetDay: number, targetTime: string, startFrom: Date = new Date()): Date {
  const result = new Date(startFrom);
  const { hours, minutes } = parseTime(targetTime);

  // Find the next occurrence of the target day
  const currentDay = result.getDay();
  let daysToAdd = targetDay - currentDay;

  if (daysToAdd < 0) daysToAdd += 7;
  if (daysToAdd === 0) {
    // Same day - check if time has passed
    result.setHours(hours, minutes, 0, 0);
    if (result <= startFrom) {
      daysToAdd = 7; // Next week
    }
  }

  if (daysToAdd > 0) {
    result.setDate(result.getDate() + daysToAdd);
  }

  result.setHours(hours, minutes, 0, 0);
  return result;
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Get 3 suggested optimal posting times for a persona/platform combination
 */
export function getSuggestedTimes(persona: Person, platform: Platform): SuggestedTime[] {
  console.log(`[Scheduling] Getting suggested times for: ${persona} on ${platform}`);

  // Ensure persona is valid
  const validPersonas: Person[] = ['Zac', 'Luke', 'Huge Capital'];
  if (!validPersonas.includes(persona)) {
    console.warn(`[Scheduling] Invalid persona: "${persona}", falling back to defaults`);
  }

  const schedule = POSTING_SCHEDULES[persona]?.[platform];
  console.log(`[Scheduling] Schedule found:`, schedule ? 'Yes' : 'No');

  if (!schedule) {
    console.log(`[Scheduling] Using default times for ${persona} on ${platform}`);
    // Default fallback with persona-specific times
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Use persona-aware default times
    const defaultHour = persona === 'Huge Capital' ? 10 : persona === 'Luke' ? 9 : 8;
    tomorrow.setHours(defaultHour, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    dayAfter.setHours(12, 0, 0, 0);

    const twoDaysLater = new Date(tomorrow);
    twoDaysLater.setDate(twoDaysLater.getDate() + 2);
    twoDaysLater.setHours(17, 0, 0, 0);

    return [
      {
        date: tomorrow,
        time: `${defaultHour}:00 AM`,
        label: `Tomorrow at ${defaultHour}:00 AM`,
        reason: `Suggested time for ${persona}`,
      },
      {
        date: dayAfter,
        time: '12:00 PM',
        label: `${formatDate(dayAfter)} at 12:00 PM`,
        reason: 'Midday engagement window',
      },
      {
        date: twoDaysLater,
        time: '5:00 PM',
        label: `${formatDate(twoDaysLater)} at 5:00 PM`,
        reason: 'End of day engagement',
      },
    ];
  }

  const suggestions: SuggestedTime[] = [];
  const now = new Date();
  const usedDates = new Set<string>();

  // Generate suggestions based on optimal days and times
  for (const day of schedule.optimalDays) {
    for (const time of schedule.optimalTimes) {
      if (suggestions.length >= 3) break;

      const suggestedDate = getNextOccurrence(day, time, now);
      const dateKey = suggestedDate.toISOString();

      // Avoid duplicate dates
      if (usedDates.has(dateKey)) continue;
      usedDates.add(dateKey);

      suggestions.push({
        date: suggestedDate,
        time,
        label: `${formatDate(suggestedDate)} at ${time}`,
        reason: `${schedule.engagementPeak} - ${schedule.frequency}`,
      });
    }
    if (suggestions.length >= 3) break;
  }

  // Sort by date
  suggestions.sort((a, b) => a.date.getTime() - b.date.getTime());

  return suggestions.slice(0, 3);
}

/**
 * Get the schedule configuration for a persona/platform
 */
export function getScheduleInfo(persona: Person, platform: Platform): PlatformSchedule | null {
  return POSTING_SCHEDULES[persona]?.[platform] || null;
}

// =============================================================================
// LOCAL STORAGE MANAGEMENT
// =============================================================================

const STORAGE_KEY = 'huge-capital-scheduled-posts';

/**
 * Get all scheduled posts from localStorage
 */
export function getScheduledPosts(): ScheduledPost[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load scheduled posts:', error);
    return [];
  }
}

/**
 * Save a new scheduled post
 */
export function saveScheduledPost(
  content: GeneratedContent,
  scheduledFor: Date
): ScheduledPost {
  const posts = getScheduledPosts();

  console.log(`[Scheduling] Saving post for persona: "${content.metadata.persona}", platform: "${content.metadata.platform}"`);

  const newPost: ScheduledPost = {
    id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: content.content,
    persona: content.metadata.persona,
    platform: content.metadata.platform,
    scheduledFor: scheduledFor.toISOString(),
    hashtags: content.hashtags,
    imagePrompt: content.imagePrompt,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };

  posts.push(newPost);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    console.log(`[Scheduling] Post saved successfully. Total posts: ${posts.length}`);
    console.log(`[Scheduling] Posts by persona:`, posts.reduce((acc, p) => {
      acc[p.persona] = (acc[p.persona] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
  } catch (error) {
    console.error('Failed to save scheduled post:', error);
  }

  return newPost;
}

/**
 * Update a scheduled post's status
 */
export function updatePostStatus(postId: string, status: ScheduledPost['status']): void {
  const posts = getScheduledPosts();
  const index = posts.findIndex(p => p.id === postId);

  if (index !== -1) {
    posts[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }
}

/**
 * Delete a scheduled post
 */
export function deleteScheduledPost(postId: string): void {
  const posts = getScheduledPosts().filter(p => p.id !== postId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/**
 * Get posts for a specific date range (for calendar view)
 */
export function getPostsForDateRange(startDate: Date, endDate: Date): ScheduledPost[] {
  const posts = getScheduledPosts();

  return posts.filter(post => {
    const postDate = new Date(post.scheduledFor);
    return postDate >= startDate && postDate <= endDate;
  });
}

/**
 * Get posts for a specific date (for calendar day view)
 */
export function getPostsForDate(date: Date): ScheduledPost[] {
  const posts = getScheduledPosts();
  const targetDate = date.toDateString();

  return posts.filter(post => {
    const postDate = new Date(post.scheduledFor);
    return postDate.toDateString() === targetDate;
  });
}

/**
 * Convert ScheduledPost to ContentPost format (for compatibility with existing calendar)
 */
export function toContentPost(post: ScheduledPost): ContentPost {
  return {
    id: post.id,
    content: post.content,
    personName: post.persona,
    platform: post.platform,
    scheduledFor: post.scheduledFor,
    tags: post.hashtags,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.createdAt,
  };
}

export default {
  getSuggestedTimes,
  getScheduleInfo,
  getScheduledPosts,
  saveScheduledPost,
  updatePostStatus,
  deleteScheduledPost,
  getPostsForDateRange,
  getPostsForDate,
  toContentPost,
};
