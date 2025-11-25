import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  ContentPost,
  ContentProfile,
  ContentTag,
  PostingGoal,
  ContentTemplate,
  ContentIdea,
  Person,
  Platform,
  TwitterThread,
} from '../types/content';
import type { Story } from '../types/story';

export const useContentPlanner = () => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [profiles, setProfiles] = useState<ContentProfile[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [postingGoals, setPostingGoals] = useState<PostingGoal[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all content posts
  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('content_posts')
        .select('*')
        .order('scheduled_for', { ascending: false });

      if (error) throw error;

      const formattedPosts = (data || []).map(transformPost);
      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, []);

  // Fetch content profiles
  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('content_profiles')
        .select('*');

      if (error) throw error;

      const formattedProfiles = (data || []).map(transformProfile);
      setProfiles(formattedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('content_tags')
        .select('*')
        .order('tag_name');

      if (error) throw error;

      const formattedTags = (data || []).map(transformTag);
      setTags(formattedTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('content_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;

      const formattedTemplates = (data || []).map(transformTemplate);
      setTemplates(formattedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  // Fetch posting goals
  const fetchPostingGoals = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('posting_goals')
        .select('*');

      if (error) throw error;

      const formattedGoals = (data || []).map(transformPostingGoal);
      setPostingGoals(formattedGoals);
    } catch (error) {
      console.error('Error fetching posting goals:', error);
    }
  }, []);

  // Fetch stories
  const fetchStories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('story_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedStories = (data || []).map(transformStory);
      setStories(formattedStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPosts(),
        fetchProfiles(),
        fetchTags(),
        fetchTemplates(),
        fetchPostingGoals(),
        fetchStories(),
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Save or update a post
  const savePost = async (post: Partial<ContentPost>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const postData = {
        id: post.id,
        person_name: post.personName,
        platform: post.platform,
        content: post.content,
        thread_content: post.threadContent,
        is_thread: post.isThread,
        thread_hook: post.threadHook,
        media_urls: post.mediaUrls || [],
        tags: post.tags || [],
        content_pillar: post.contentPillar,
        sources: post.sources || [],
        scheduled_for: post.scheduledFor,
        optimal_time: post.optimalTime,
        timezone: post.timezone || 'America/New_York',
        status: post.status || 'draft',
        published_at: post.publishedAt,
        publish_error: post.publishError,
        version_number: post.versionNumber || 1,
        parent_post_id: post.parentPostId,
        edit_history: post.editHistory || [],
        created_by: post.createdBy || user?.id,
        approved_by: post.approvedBy,
        approved_at: post.approvedAt,
      };

      const { data, error } = await supabase
        .from('content_posts')
        .upsert(postData)
        .select()
        .single();

      if (error) throw error;

      const formattedPost = transformPost(data);

      // Update local state
      setPosts(prev => {
        const index = prev.findIndex(p => p.id === formattedPost.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = formattedPost;
          return updated;
        }
        return [...prev, formattedPost];
      });

      return formattedPost;
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  };

  // Create a new Twitter thread
  const createThread = async (
    person: Person,
    hook: string,
    threadParts: string[],
    scheduledFor?: string
  ) => {
    const threadContent: TwitterThread[] = threadParts.map((content, index) => ({
      order: index + 1,
      content,
      characterCount: content.length,
    }));

    const post: Partial<ContentPost> = {
      personName: person,
      platform: 'Twitter',
      content: hook, // Store hook as main content
      threadContent,
      isThread: true,
      threadHook: hook,
      status: scheduledFor ? 'scheduled' : 'draft',
      scheduledFor,
    };

    return savePost(post);
  };

  // Delete a post
  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('content_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  // Approve a post
  const approvePost = async (postId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('content_posts')
        .update({
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          status: 'scheduled',
        })
        .eq('id', postId)
        .select()
        .single();

      if (error) throw error;

      const formattedPost = transformPost(data);
      setPosts(prev => prev.map(p => p.id === postId ? formattedPost : p));

      return formattedPost;
    } catch (error) {
      console.error('Error approving post:', error);
      throw error;
    }
  };

  // Duplicate a post
  const duplicatePost = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newPost: Partial<ContentPost> = {
      ...post,
      id: undefined,
      status: 'draft',
      scheduledFor: undefined,
      publishedAt: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      parentPostId: postId,
    };

    return savePost(newPost);
  };

  // Save a template from a post
  const saveAsTemplate = async (
    postId: string,
    templateName: string
  ) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');

      const { data: { user } } = await supabase.auth.getUser();

      const templateData = {
        template_name: templateName,
        person_name: post.personName,
        platform: post.platform,
        content_template: post.content,
        thread_template: post.threadContent,
        variables: [],
        created_by: user?.id,
      };

      const { data, error } = await supabase
        .from('content_templates')
        .insert(templateData)
        .select()
        .single();

      if (error) throw error;

      const formattedTemplate = transformTemplate(data);
      setTemplates(prev => [...prev, formattedTemplate]);

      return formattedTemplate;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  // Update posting goals
  const updatePostingGoal = async (goal: PostingGoal) => {
    try {
      const goalData = {
        person_name: goal.personName,
        platform: goal.platform,
        posts_per_week: goal.postsPerWeek,
        posts_per_month: goal.postsPerMonth,
        preferred_times: goal.preferredTimes || [],
      };

      const { data, error } = await supabase
        .from('posting_goals')
        .upsert(goalData, {
          onConflict: 'person_name,platform',
        })
        .select()
        .single();

      if (error) throw error;

      const formattedGoal = transformPostingGoal(data);
      setPostingGoals(prev => {
        const index = prev.findIndex(
          g => g.personName === goal.personName && g.platform === goal.platform
        );
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = formattedGoal;
          return updated;
        }
        return [...prev, formattedGoal];
      });

      return formattedGoal;
    } catch (error) {
      console.error('Error updating posting goal:', error);
      throw error;
    }
  };

  // Get posts for calendar view
  const getCalendarPosts = useCallback((
    startDate: Date,
    endDate: Date,
    person?: Person,
    platform?: Platform
  ) => {
    return posts.filter(post => {
      if (person && post.personName !== person) return false;
      if (platform && post.platform !== platform) return false;

      if (!post.scheduledFor) return false;

      const postDate = new Date(post.scheduledFor);
      return postDate >= startDate && postDate <= endDate;
    });
  }, [posts]);

  // Get posting frequency stats
  const getPostingStats = useCallback((
    person: Person,
    platform: Platform,
    period: 'week' | 'month' = 'week'
  ) => {
    const now = new Date();
    const startDate = new Date();

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const relevantPosts = posts.filter(post =>
      post.personName === person &&
      post.platform === platform &&
      post.status === 'published' &&
      post.publishedAt &&
      new Date(post.publishedAt) >= startDate
    );

    const goal = postingGoals.find(
      g => g.personName === person && g.platform === platform
    );

    const target = period === 'week' ? goal?.postsPerWeek : goal?.postsPerMonth;

    return {
      actual: relevantPosts.length,
      target: target || 0,
      percentage: target ? (relevantPosts.length / target) * 100 : 0,
    };
  }, [posts, postingGoals]);

  // Create a new tag
  const createTag = async (tag: Omit<ContentTag, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabase
        .from('content_tags')
        .insert({
          tag_name: tag.tagName,
          tag_category: tag.tagCategory,
          color: tag.color,
          description: tag.description,
        })
        .select()
        .single();

      if (error) throw error;

      const formattedTag = transformTag(data);
      setTags(prev => [...prev, formattedTag]);

      return formattedTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  };

  // Update a tag
  const updateTag = async (id: string, updates: Partial<ContentTag>) => {
    try {
      const { data, error } = await supabase
        .from('content_tags')
        .update({
          tag_name: updates.tagName,
          tag_category: updates.tagCategory,
          color: updates.color,
          description: updates.description,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const formattedTag = transformTag(data);
      setTags(prev => prev.map(t => t.id === id ? formattedTag : t));

      return formattedTag;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  };

  // Delete a tag
  const deleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTags(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  };

  // Story management functions
  const addStory = async (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const storyData = {
        person_name: story.personName,
        title: story.title,
        transcript: story.transcript,
        story_type: story.storyType,
        funding_type: story.fundingType,
        themes: story.themes,
        key_takeaways: story.keyTakeaways,
        client_industry: story.clientIndustry,
        loan_amount_range: story.loanAmountRange,
        source_type: story.sourceType,
        source_url: story.sourceUrl,
        recorded_date: story.recordedDate,
        is_approved: story.isApproved,
        usage_notes: story.usageNotes,
      };

      const { data, error } = await supabase
        .from('story_library')
        .insert(storyData)
        .select()
        .single();

      if (error) throw error;

      const formattedStory = transformStory(data);
      setStories(prev => [formattedStory, ...prev]);

      return formattedStory;
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  };

  const updateStory = async (id: string, updates: Partial<Story>) => {
    try {
      const storyData: any = {};
      if (updates.personName) storyData.person_name = updates.personName;
      if (updates.title) storyData.title = updates.title;
      if (updates.transcript) storyData.transcript = updates.transcript;
      if (updates.storyType) storyData.story_type = updates.storyType;
      if (updates.fundingType) storyData.funding_type = updates.fundingType;
      if (updates.themes) storyData.themes = updates.themes;
      if (updates.keyTakeaways) storyData.key_takeaways = updates.keyTakeaways;
      if (updates.clientIndustry) storyData.client_industry = updates.clientIndustry;
      if (updates.loanAmountRange) storyData.loan_amount_range = updates.loanAmountRange;
      if (updates.sourceType) storyData.source_type = updates.sourceType;
      if (updates.sourceUrl) storyData.source_url = updates.sourceUrl;
      if (updates.recordedDate) storyData.recorded_date = updates.recordedDate;
      if (updates.isApproved !== undefined) storyData.is_approved = updates.isApproved;
      if (updates.usageNotes) storyData.usage_notes = updates.usageNotes;

      const { data, error } = await supabase
        .from('story_library')
        .update(storyData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const formattedStory = transformStory(data);
      setStories(prev => prev.map(s => s.id === id ? formattedStory : s));

      return formattedStory;
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  };

  const deleteStory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('story_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setStories(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  };

  const approveStory = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('story_library')
        .update({ is_approved: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const formattedStory = transformStory(data);
      setStories(prev => prev.map(s => s.id === id ? formattedStory : s));

      return formattedStory;
    } catch (error) {
      console.error('Error approving story:', error);
      throw error;
    }
  };

  return {
    // Data
    posts,
    profiles,
    tags,
    templates,
    postingGoals,
    stories,
    loading,

    // Actions
    savePost,
    createThread,
    deletePost,
    approvePost,
    duplicatePost,
    saveAsTemplate,
    updatePostingGoal,
    createTag,
    updateTag,
    deleteTag,
    addStory,
    updateStory,
    deleteStory,
    approveStory,

    // Queries
    getCalendarPosts,
    getPostingStats,

    // Refresh
    refetch: {
      posts: fetchPosts,
      profiles: fetchProfiles,
      tags: fetchTags,
      templates: fetchTemplates,
      postingGoals: fetchPostingGoals,
      stories: fetchStories,
    },
  };
};

// Transform functions to convert snake_case to camelCase
function transformPost(data: any): ContentPost {
  return {
    id: data.id,
    personName: data.person_name,
    platform: data.platform,
    content: data.content,
    threadContent: data.thread_content,
    isThread: data.is_thread,
    threadHook: data.thread_hook,
    mediaUrls: data.media_urls,
    tags: data.tags,
    contentPillar: data.content_pillar,
    sources: data.sources,
    scheduledFor: data.scheduled_for,
    optimalTime: data.optimal_time,
    timezone: data.timezone,
    status: data.status,
    publishedAt: data.published_at,
    publishError: data.publish_error,
    versionNumber: data.version_number,
    parentPostId: data.parent_post_id,
    editHistory: data.edit_history,
    createdBy: data.created_by,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformProfile(data: any): ContentProfile {
  return {
    id: data.id,
    personName: data.person_name,
    contentPillars: data.content_pillars,
    brandVoice: data.brand_voice,
    keyMessaging: data.key_messaging,
    aiContext: data.ai_context || {},
    postingGoals: data.posting_goals || {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function transformTag(data: any): ContentTag {
  return {
    id: data.id,
    tagName: data.tag_name,
    tagCategory: data.tag_category,
    color: data.color,
    description: data.description,
    createdAt: data.created_at,
  };
}

function transformTemplate(data: any): ContentTemplate {
  return {
    id: data.id,
    templateName: data.template_name,
    personName: data.person_name,
    platform: data.platform,
    contentTemplate: data.content_template,
    threadTemplate: data.thread_template,
    variables: data.variables,
    usageCount: data.usage_count,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

function transformPostingGoal(data: any): PostingGoal {
  return {
    id: data.id,
    personName: data.person_name,
    platform: data.platform,
    postsPerWeek: data.posts_per_week,
    postsPerMonth: data.posts_per_month,
    preferredTimes: data.preferred_times,
    currentWeekPosts: data.current_week_posts,
    currentMonthPosts: data.current_month_posts,
    lastResetDate: data.last_reset_date,
  };
}

function transformStory(data: any): Story {
  return {
    id: data.id,
    personName: data.person_name,
    title: data.title,
    transcript: data.transcript,
    storyType: data.story_type,
    fundingType: data.funding_type,
    themes: data.themes,
    keyTakeaways: data.key_takeaways,
    clientIndustry: data.client_industry,
    loanAmountRange: data.loan_amount_range,
    sourceType: data.source_type,
    sourceUrl: data.source_url,
    recordedDate: data.recorded_date,
    isApproved: data.is_approved,
    usageNotes: data.usage_notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}