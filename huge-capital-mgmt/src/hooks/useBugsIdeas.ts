import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type BugRequestSubmission = {
  id: string;
  page: string;
  note: string;
  screenshot?: string;
  submitted_at: string;
  created_by?: string;
  submitted_by?: string;
};

export const useBugsIdeas = () => {
  const [submissions, setSubmissions] = useState<BugRequestSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('bugs_requests')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubmission = async (submission: Omit<BugRequestSubmission, 'id' | 'created_by' | 'submitted_by'>, file?: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      console.log('Current user:', user);

      // Get user's full name from profiles
      let userName = user?.email || 'Unknown';
      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profile?.full_name) {
          userName = profile.full_name;
        }
      }

      let screenshotUrl = null;

      // Upload screenshot to Supabase Storage if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `bugs-screenshots/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bugs-requests')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('bugs-requests')
            .getPublicUrl(filePath);

          screenshotUrl = publicUrl;
        }
      }

      const submissionData = {
        id: `submission-${Date.now()}`,
        page: submission.page,
        note: submission.note,
        screenshot: screenshotUrl,
        submitted_at: submission.submitted_at,
        submitted_by: userName,
        created_by: user?.id,
      };

      console.log('Submitting data:', submissionData);

      const { data, error } = await supabase
        .from('bugs_requests')
        .insert(submissionData)
        .select();

      console.log('Insert result:', { data, error });

      if (error) throw error;

      await fetchSubmissions();
    } catch (error) {
      console.error('Error adding submission:', error);
      alert('Failed to submit. Check console for details.');
    }
  };

  return {
    submissions,
    loading,
    addSubmission,
    refetch: fetchSubmissions,
  };
};
