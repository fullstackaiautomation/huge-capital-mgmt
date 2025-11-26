/**
 * Content Library Service
 *
 * Manages the storage and retrieval of ALL generated content.
 * This is separate from scheduled posts - this stores everything that's ever been generated.
 */

import type { Person, Platform } from '../types/content';
import type { GeneratedContent } from './skillsRunner';

// =============================================================================
// TYPES
// =============================================================================

export interface LibraryItem {
  id: string;
  content: string;
  persona: Person;
  platform: Platform;
  hashtags: string[];
  imagePrompt: {
    subject: string;
    briefConceptPrompt: string;
    plugAndPlayPrompt: string;
  };
  topic?: string;
  voiceScore?: number;
  complianceScore?: number;
  createdAt: string;
  isScheduled: boolean;
  scheduledPostId?: string;
}

export interface LibraryFilters {
  personas: Person[];
  platforms: Platform[];
  topic?: string;
  searchQuery?: string;
}

// =============================================================================
// LOCAL STORAGE MANAGEMENT
// =============================================================================

const STORAGE_KEY = 'huge-capital-content-library';

/**
 * Get all content from the library
 */
export function getAllLibraryContent(): LibraryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('[ContentLibrary] Failed to load content:', error);
    return [];
  }
}

/**
 * Save a single piece of generated content to the library
 */
export function saveToLibrary(
  content: GeneratedContent,
  topic?: string
): LibraryItem {
  const library = getAllLibraryContent();

  const newItem: LibraryItem = {
    id: `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: content.content,
    persona: content.metadata.persona,
    platform: content.metadata.platform,
    hashtags: content.hashtags,
    imagePrompt: content.imagePrompt,
    topic,
    voiceScore: content.metadata.voiceScore,
    complianceScore: content.metadata.complianceScore,
    createdAt: new Date().toISOString(),
    isScheduled: false,
  };

  library.unshift(newItem); // Add to beginning (newest first)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    console.log(`[ContentLibrary] Saved content for ${content.metadata.persona} on ${content.metadata.platform}. Library size: ${library.length}`);
  } catch (error) {
    console.error('[ContentLibrary] Failed to save content:', error);
  }

  return newItem;
}

/**
 * Save multiple pieces of generated content to the library (batch save)
 */
export function saveMultipleToLibrary(
  contents: GeneratedContent[],
  topic?: string
): LibraryItem[] {
  const library = getAllLibraryContent();
  const newItems: LibraryItem[] = [];

  for (const content of contents) {
    const newItem: LibraryItem = {
      id: `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: content.content,
      persona: content.metadata.persona,
      platform: content.metadata.platform,
      hashtags: content.hashtags,
      imagePrompt: content.imagePrompt,
      topic,
      voiceScore: content.metadata.voiceScore,
      complianceScore: content.metadata.complianceScore,
      createdAt: new Date().toISOString(),
      isScheduled: false,
    };
    newItems.push(newItem);
  }

  // Add all new items to the beginning of the library
  const updatedLibrary = [...newItems, ...library];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLibrary));
    console.log(`[ContentLibrary] Batch saved ${newItems.length} items. Library size: ${updatedLibrary.length}`);
  } catch (error) {
    console.error('[ContentLibrary] Failed to batch save content:', error);
  }

  return newItems;
}

/**
 * Mark a library item as scheduled
 */
export function markAsScheduled(libraryId: string, scheduledPostId: string): void {
  const library = getAllLibraryContent();
  const index = library.findIndex(item => item.id === libraryId);

  if (index !== -1) {
    library[index].isScheduled = true;
    library[index].scheduledPostId = scheduledPostId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    console.log(`[ContentLibrary] Marked ${libraryId} as scheduled`);
  }
}

/**
 * Delete an item from the library
 */
export function deleteFromLibrary(libraryId: string): void {
  const library = getAllLibraryContent().filter(item => item.id !== libraryId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  console.log(`[ContentLibrary] Deleted item ${libraryId}. Library size: ${library.length}`);
}

/**
 * Get filtered content from the library
 */
export function getFilteredLibraryContent(filters: LibraryFilters): LibraryItem[] {
  let library = getAllLibraryContent();

  // Filter by personas
  if (filters.personas.length > 0) {
    library = library.filter(item => filters.personas.includes(item.persona));
  }

  // Filter by platforms
  if (filters.platforms.length > 0) {
    library = library.filter(item => filters.platforms.includes(item.platform));
  }

  // Filter by topic
  if (filters.topic) {
    library = library.filter(item => item.topic === filters.topic);
  }

  // Filter by search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    library = library.filter(item =>
      item.content.toLowerCase().includes(query) ||
      item.hashtags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  return library;
}

/**
 * Get library statistics
 */
export function getLibraryStats(): {
  total: number;
  byPersona: Record<Person, number>;
  byPlatform: Record<Platform, number>;
  scheduled: number;
} {
  const library = getAllLibraryContent();

  const stats = {
    total: library.length,
    byPersona: {} as Record<Person, number>,
    byPlatform: {} as Record<Platform, number>,
    scheduled: 0,
  };

  for (const item of library) {
    stats.byPersona[item.persona] = (stats.byPersona[item.persona] || 0) + 1;
    stats.byPlatform[item.platform] = (stats.byPlatform[item.platform] || 0) + 1;
    if (item.isScheduled) stats.scheduled++;
  }

  return stats;
}

/**
 * Clear all content from the library (use with caution!)
 */
export function clearLibrary(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[ContentLibrary] Library cleared');
}

export default {
  getAllLibraryContent,
  saveToLibrary,
  saveMultipleToLibrary,
  markAsScheduled,
  deleteFromLibrary,
  getFilteredLibraryContent,
  getLibraryStats,
  clearLibrary,
};
