import { Key, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useLogins, type LoginEntry } from '../hooks/useLogins';

const initialLoginsData = [
  {
    site_name: 'BLB Deal Portal',
    link: 'https://app.blbnetwork.com/login?redirectPath=%2Fpage-6',
    username: 'zac@hugecapitalfunding.com',
    password: '',
    two_fa: 'No',
    purpose: 'Submit our leads to BLB',
  },
  {
    site_name: 'Business Lending Portal',
    link: 'https://oguz-konar.mykajabi.com/login',
    username: 'deals@hugecapitalfunding.com',
    password: '',
    two_fa: 'No',
    purpose: '',
  },
  {
    site_name: 'Credibly',
    link: 'https://portal.credibly.com/dashboard',
    username: 'luke@hugecapitalfunding.com',
    password: '',
    two_fa: '',
    purpose: '',
  },
  {
    site_name: 'Deals Email',
    link: 'https://mail.google.com',
    username: 'deals@hugecapitalfunding.com',
    password: '',
    two_fa: 'Maybe',
    purpose: 'Company Deal Flow',
  },
  {
    site_name: 'Documents Email',
    link: 'https://mail.google.com',
    username: 'documents@hugecapitalfunding.com',
    password: '',
    two_fa: 'Maybe',
    purpose: 'Company Document Collection',
  },
  {
    site_name: 'Easy Pay Direct',
    link: 'https://secure.easypaydirectgateway.com/merchants/login.php?cookie_check=1&auth_error=1',
    username: 'hugecapitaladmin',
    password: '',
    two_fa: 'Yes',
    purpose: 'ACH Deposits, 2FA to Luke\'s Email',
  },
  {
    site_name: 'GoDaddy',
    link: 'https://www.godaddy.com/',
    username: 'luke.heugly@gmail.com',
    password: '',
    two_fa: 'Yes',
    purpose: 'Domain Hosting, DNS and All Other Tech Shit',
  },
  {
    site_name: 'Idea Financial',
    link: 'https://partner.ideafinancial.com/sign-in',
    username: 'deals@hugecapitalfunding.com',
    password: '',
    two_fa: 'Yes',
    purpose: 'Submit deals',
  },
  {
    site_name: 'IFS Portal',
    link: 'https://partners.ifscapital.com/login',
    username: 'luke@hugecapitalfunding.com',
    password: '',
    two_fa: 'No',
    purpose: 'Submit our leads to IFS',
  },
  {
    site_name: 'Instantly.ai',
    link: 'https://instantly.ai/',
    username: 'deals@hugecapitalfunding.com',
    password: '',
    two_fa: 'Maybe',
    purpose: 'Cold Email',
  },
  {
    site_name: 'ionos',
    link: '',
    username: 'luke@hugecapitalfunding.com',
    password: '',
    two_fa: 'No',
    purpose: 'Cold Email',
  },
  {
    site_name: 'Kiavi',
    link: 'https://login.kiavi.com/u/login?state=hKFo2SBnbXRvWWpfS2s1VHVGVGIzdXh6VVNUQWpYWTEtZFY1caFur3VuaXZlcnNhbC1sb2dpbqN0aWTZIHc1UHZ3YnpBN0h5SHRWcmxLTkNUUVhod3NhZENEN05Qo2NpZNkgbHZvVk81U2RoZFRoazlwRHhmUFZZYzI5WHFMbFo1Vk0',
    username: 'luke@hugecapitalfunding.com',
    password: '',
    two_fa: 'No',
    purpose: 'Real Estate Financing',
  },
  {
    site_name: 'Plexe',
    link: 'https://portal.plexe.co/login',
    username: 'deals@hugecapitalfunding.com',
    password: '',
    two_fa: 'Yes',
    purpose: 'Submit deals',
  },
  {
    site_name: 'Rapid Portal',
    link: 'https://login.rapidfinance.com/Account/Login?ticket=7026e19f5b5f4c49aa3086791221343a&userType=Partner',
    username: 'luke@hugecapitalfunding.com',
    password: '',
    two_fa: 'Yes',
    purpose: 'Submit deals',
  },
  {
    site_name: 'Smartbiz (Deals)',
    link: 'https://smartbizbank.com/assist/session/new',
    username: 'deals@hugecapitalfunding.com',
    password: '',
    two_fa: 'Yes',
    purpose: 'Sub $350k SBA deals, Bank Term Loans and Line of Credits',
  },
  {
    site_name: 'Smartbiz (Luke)',
    link: 'https://smartbizbank.com/assist/session/new',
    username: 'luke@hugecapitalfunding.com',
    password: '',
    two_fa: 'Yes',
    purpose: 'Sub $350k SBA deals, Bank Term Loans and Line of Credits',
  },
  {
    site_name: 'SubMagic',
    link: 'https://app.submagic.co/',
    username: 'admin@hypnos-sleep.com',
    password: '',
    two_fa: 'Yes (Through Gmail)',
    purpose: 'AI Scripting Videos (I already paid for it, cool for content - free until march 2026)',
  },
];

export const Logins = () => {
  const { logins, loading, addLogin, updateLogin, deleteLogin } = useLogins();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<LoginEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogin, setNewLogin] = useState({
    site_name: '',
    link: '',
    username: '',
    password: '',
    two_fa: '',
    purpose: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const openLink = (link: string) => {
    if (link && link.trim()) {
      let url = link.trim();
      // Add https:// if no protocol is specified
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank');
    }
  };

  const isClickable = (link: string) => link && link.trim().length > 0;

  const handleEdit = (login: LoginEntry) => {
    setEditingId(login.id);
    setEditData({ ...login });
  };

  const handleSave = async () => {
    if (editData) {
      try {
        setIsSaving(true);
        await updateLogin(editData.id, {
          site_name: editData.site_name,
          link: editData.link,
          username: editData.username,
          password: editData.password,
          two_fa: editData.two_fa,
          purpose: editData.purpose,
        });
        setEditingId(null);
        setEditData(null);
      } catch (err) {
        console.error('Failed to save:', err);
        alert('Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = async () => {
    if (editData && window.confirm(`Are you sure you want to delete "${editData.site_name}"?`)) {
      try {
        setIsSaving(true);
        await deleteLogin(editData.id);
        setEditingId(null);
        setEditData(null);
      } catch (err) {
        console.error('Failed to delete:', err);
        alert('Failed to delete login');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleInputChange = (field: keyof LoginEntry, value: string) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

  const handleAddLoginChange = (field: string, value: string) => {
    setNewLogin({ ...newLogin, [field]: value });
  };

  const handleAddLogin = async () => {
    if (newLogin.site_name.trim()) {
      try {
        setIsSaving(true);
        await addLogin({
          site_name: newLogin.site_name,
          link: newLogin.link,
          username: newLogin.username,
          password: newLogin.password,
          two_fa: newLogin.two_fa,
          purpose: newLogin.purpose,
        });
        setShowAddModal(false);
        setNewLogin({
          site_name: '',
          link: '',
          username: '',
          password: '',
          two_fa: '',
          purpose: '',
        });
      } catch (err) {
        console.error('Failed to add login:', err);
        alert('Failed to add login');
      } finally {
        setIsSaving(false);
      }
    } else {
      alert('Please enter a site name');
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewLogin({
      site_name: '',
      link: '',
      username: '',
      password: '',
      two_fa: '',
      purpose: '',
    });
  };

  const handleInitializeData = async () => {
    try {
      setIsSaving(true);
      for (const login of initialLoginsData) {
        try {
          await addLogin(login);
        } catch (err) {
          // Skip if already exists
          console.log(`Skipping ${login.site_name} - might already exist`);
        }
      }
      alert('Initial data loaded!');
    } catch (err) {
      console.error('Failed to initialize data:', err);
      alert('Failed to initialize data');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading logins...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Key className="w-8 h-8 text-white" />
          <h1 className="text-3xl font-bold text-white">Logins</h1>
        </div>
        <div className="flex gap-2">
          {logins.length === 0 && (
            <button
              onClick={handleInitializeData}
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              {isSaving ? 'Loading...' : 'Load Initial Data'}
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Login
          </button>
        </div>
      </div>

      {/* Add Login Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add New Login</h2>
              <button
                onClick={handleCancelAdd}
                className="p-1 text-gray-400 hover:text-gray-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Site Name</label>
                <input
                  type="text"
                  value={newLogin.site_name}
                  onChange={(e) => handleAddLoginChange('site_name', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., GoDaddy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Link</label>
                <input
                  type="text"
                  value={newLogin.link}
                  onChange={(e) => handleAddLoginChange('link', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={newLogin.username}
                  onChange={(e) => handleAddLoginChange('username', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                <input
                  type="text"
                  value={newLogin.password}
                  onChange={(e) => handleAddLoginChange('password', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">2FA</label>
                <input
                  type="text"
                  value={newLogin.two_fa}
                  onChange={(e) => handleAddLoginChange('two_fa', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="Yes / No / Maybe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Purpose</label>
                <input
                  type="text"
                  value={newLogin.purpose}
                  onChange={(e) => handleAddLoginChange('purpose', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="What is this account for?"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleAddLogin}
                disabled={isSaving}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-4 py-2 rounded font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Add Login'}
              </button>
              <button
                onClick={handleCancelAdd}
                disabled={isSaving}
                className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50 bg-gray-800/80">
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Site Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Link</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Username</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Password</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">2FA</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Purpose</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No logins yet. Click "Load Initial Data" to get started.
                  </td>
                </tr>
              ) : (
                logins.map((login) => (
                  <tr key={login.id} className="border-b border-gray-700/50 hover:bg-brand-500/5 transition-colors">
                    {editingId === login.id ? (
                      <>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editData?.site_name || ''}
                            onChange={(e) => handleInputChange('site_name', e.target.value)}
                            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editData?.link || ''}
                            onChange={(e) => handleInputChange('link', e.target.value)}
                            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editData?.username || ''}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editData?.password || ''}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editData?.two_fa || ''}
                            onChange={(e) => handleInputChange('two_fa', e.target.value)}
                            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editData?.purpose || ''}
                            onChange={(e) => handleInputChange('purpose', e.target.value)}
                            className="w-full bg-gray-700 text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4 flex justify-center gap-2">
                          <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="p-2 text-green-500 hover:text-green-400 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="p-2 text-red-500 hover:text-red-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="p-2 text-gray-400 hover:text-gray-300 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 text-white text-sm">{login.site_name}</td>
                        <td className="py-3 px-4 text-sm">
                          {isClickable(login.link) ? (
                            <button
                              onClick={() => openLink(login.link)}
                              className="text-blue-400 hover:text-blue-300 underline transition-colors"
                            >
                              Website
                            </button>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{login.username}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{login.password}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{login.two_fa}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{login.purpose}</td>
                        <td className="py-3 px-4 flex justify-center">
                          <button
                            onClick={() => handleEdit(login)}
                            disabled={isSaving}
                            className="p-2 text-gray-400 hover:text-blue-400 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    )}
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
