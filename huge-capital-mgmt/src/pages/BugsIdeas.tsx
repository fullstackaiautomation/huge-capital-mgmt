import { useState } from 'react';
import { Lightbulb, Upload, X } from 'lucide-react';
import { useBugsIdeas } from '../hooks/useBugsIdeas';

export const BugsIdeas = () => {
  const { submissions, addSubmission, loading } = useBugsIdeas();
  const [page, setPage] = useState('');
  const [note, setNote] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await addSubmission({
      page,
      note,
      submitted_at: new Date().toISOString(),
    }, screenshot || undefined);

    // Reset form
    setPage('');
    setNote('');
    setScreenshot(null);
    setPreviewUrl('');
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setPreviewUrl('');
  };

  return (
    <div className="w-full px-10 space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-8 h-8 text-white" />
        <h1 className="text-3xl font-bold text-white">Bugs & Requests</h1>
      </div>

      {/* Submission Form */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Submit Bug or Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Page
            </label>
            <select
              value={page}
              onChange={(e) => setPage(e.target.value)}
              required
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a page...</option>
              <option value="Funding Dashboard">Funding Dashboard</option>
              <option value="Task Tracker">Task Tracker</option>
              <option value="AI Roadmap">AI Roadmap</option>
              <option value="AI Projects">AI Projects</option>
              <option value="Content Planner">Content Planner</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Note / Description
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={4}
              placeholder="Describe the bug or idea..."
              className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Screenshot (Optional)
            </label>
            {!previewUrl ? (
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-600/50 rounded-lg cursor-pointer hover:border-purple-500/50 transition-colors">
                <div className="flex flex-col items-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Click to upload screenshot</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Screenshot preview"
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-600/50"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2 p-1 bg-red-600 rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Submit
          </button>
        </form>
      </div>

      {/* Submissions List */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="p-4 border-b border-gray-700/50">
          <h2 className="text-xl font-bold text-white">Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50 bg-gray-800/80">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Date</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Submitted By</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Page</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Note</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    No submissions yet
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-gray-700/50 hover:bg-brand-500/5 transition-colors">
                    <td className="py-3 px-4 text-white text-sm">
                      {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-white text-sm">{submission.submitted_by || 'Unknown'}</td>
                    <td className="py-3 px-4 text-white text-sm">{submission.page}</td>
                    <td className="py-3 px-4 text-gray-300 text-sm">{submission.note}</td>
                    <td className="py-3 px-4 text-center">
                      {submission.screenshot ? (
                        <a
                          href={submission.screenshot}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
