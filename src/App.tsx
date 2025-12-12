import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Timeline from './components/Timeline';
import CreatePostModal from './components/CreatePostModal';
import SearchModal from './components/SearchModal';
import ProfileModal from './components/ProfileModal';
import { Plus, Search, User, LogOut, Candy, Monitor, Smartphone } from 'lucide-react';

function AppContent() {
  const { user, loading, hasProfile, profile } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<{ region?: string; tag?: string; search?: string }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [timelineMode, setTimelineMode] = useState<'all' | 'following'>('all');
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'mobile'>('mobile');
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  const handleUserClick = (userId: string) => {
    setViewUserId(userId);
    setShowProfileModal(true);
  };

  useEffect(() => {
    setShowHeader(true);
    lastScrollY.current = 0;
  }, [layoutMode]);

  useEffect(() => {
    if (layoutMode !== 'desktop') return;

    const mainElement = document.getElementById('desktop-main-scroll');
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;

      if (currentScrollY < 10) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowHeader(true);
      }

      lastScrollY.current = currentScrollY;
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mainElement.removeEventListener('scroll', handleScroll);
    };
  }, [layoutMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sweets-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasProfile) {
    return <Auth />;
  }

  const { signOut } = useAuth();

  if (layoutMode === 'mobile') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sweets-pattern p-4">
        <div className="relative w-[390px] h-[844px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          <header className="bg-gradient-to-r from-orange-200 via-pink-200 to-amber-100 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-md">
            <div className="flex items-center">
              <img src="/logo1.png" alt="お菓子なSNS" className="h-9" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLayoutMode('desktop')}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="PC用レイアウト"
              >
                <Monitor className="w-5 h-5 text-orange-600" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 bg-white text-orange-600 px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all text-sm font-bold"
              >
                <Plus className="w-4 h-4" />
                投稿
              </button>
            </div>
          </header>

          <div className="flex-shrink-0 bg-white border-b-2 border-orange-200 px-4 py-2 flex gap-2">
            <button
              onClick={() => setTimelineMode('all')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                timelineMode === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全ての投稿
            </button>
            <button
              onClick={() => setTimelineMode('following')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                timelineMode === 'following'
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              フォロー中
            </button>
          </div>

          <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 bg-gradient-to-b from-orange-50 to-pink-50">
            <Timeline
              key={refreshKey}
              filters={filters}
              onUserClick={handleUserClick}
              showFollowingOnly={timelineMode === 'following'}
              layoutMode={layoutMode}
            />
          </main>

          <nav className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-orange-200 px-4 py-3 flex justify-around items-center shadow-lg">
            <button
              onClick={() => {
                setViewUserId(undefined);
                setShowProfileModal(true);
              }}
              className="flex flex-col items-center gap-1 p-2 hover:bg-orange-50 rounded-xl transition-all"
            >
              <User className="w-6 h-6 text-orange-500" />
              <span className="text-xs text-gray-700 font-semibold">プロフィール</span>
            </button>

            <button
              onClick={() => setShowSearchModal(true)}
              className="flex flex-col items-center gap-1 p-2 hover:bg-pink-50 rounded-xl transition-all"
            >
              <Search className="w-6 h-6 text-pink-500" />
              <span className="text-xs text-gray-700 font-semibold">検索</span>
            </button>

            <button
              onClick={signOut}
              className="flex flex-col items-center gap-1 p-2 hover:bg-yellow-50 rounded-xl transition-all"
            >
              <LogOut className="w-6 h-6 text-yellow-600" />
              <span className="text-xs text-gray-700 font-semibold">ログアウト</span>
            </button>
          </nav>

          {showCreateModal && (
            <CreatePostModal
              onClose={() => setShowCreateModal(false)}
              onPostCreated={() => {
                setRefreshKey((prev) => prev + 1);
                setShowCreateModal(false);
              }}
              layoutMode={layoutMode}
            />
          )}

          {showSearchModal && (
            <SearchModal
              onClose={() => setShowSearchModal(false)}
              onSearch={(newFilters) => {
                setFilters(newFilters);
                setRefreshKey((prev) => prev + 1);
              }}
              layoutMode={layoutMode}
            />
          )}

          {showProfileModal && (
            <ProfileModal
              onClose={() => {
                setShowProfileModal(false);
                setViewUserId(undefined);
              }}
              viewUserId={viewUserId}
              layoutMode={layoutMode}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-sweets-pattern overflow-hidden">
      <div className="max-w-6xl mx-auto flex h-full">
        <aside className="w-80 h-full bg-white border-r-2 border-orange-200 p-4 flex flex-col flex-shrink-0">
          <div className="mb-6">
            <img src="/logo1.png" alt="お菓子なSNS" className="h-12 mb-6" />
          </div>

          <nav className="flex-1 space-y-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              投稿
            </button>

            <button
              onClick={() => {
                setViewUserId(undefined);
                setShowProfileModal(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 transition-colors text-left"
            >
              <User className="w-5 h-5 text-orange-500" />
              <span className="text-gray-800 font-semibold">プロフィール</span>
            </button>

            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-pink-50 transition-colors text-left"
            >
              <Search className="w-5 h-5 text-pink-500" />
              <span className="text-gray-800 font-semibold">検索</span>
            </button>

            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-yellow-50 transition-colors text-left"
            >
              <LogOut className="w-5 h-5 text-yellow-600" />
              <span className="text-gray-800 font-semibold">ログアウト</span>
            </button>

            <button
              onClick={() => setLayoutMode('mobile')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              title="スマートフォン用レイアウト"
            >
              <Smartphone className="w-5 h-5 text-gray-600" />
              <span className="text-gray-800 font-semibold">モバイル表示</span>
            </button>
          </nav>

          {profile && (
            <div className="mt-auto pt-4 border-t-2 border-orange-200">
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer" onClick={() => {
                setViewUserId(undefined);
                setShowProfileModal(true);
              }}>
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate">{profile.display_name}</p>
                  <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        <main id="desktop-main-scroll" className="flex-1 h-full overflow-y-auto">
          <div
            className="bg-white border-b-2 border-orange-200 px-6 py-4 sticky top-0 z-10 backdrop-blur-sm bg-white/95 transition-transform duration-300"
            style={{
              transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
            }}
          >
            <div className="flex gap-2">
              <button
                onClick={() => setTimelineMode('all')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  timelineMode === 'all'
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全ての投稿
              </button>
              <button
                onClick={() => setTimelineMode('following')}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                  timelineMode === 'following'
                    ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                フォロー中
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-gradient-to-b from-orange-50 to-pink-50 min-h-full">
            <Timeline
              key={refreshKey}
              filters={filters}
              onUserClick={handleUserClick}
              showFollowingOnly={timelineMode === 'following'}
              layoutMode={layoutMode}
            />
          </div>
        </main>
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => {
            setRefreshKey((prev) => prev + 1);
            setShowCreateModal(false);
          }}
          layoutMode={layoutMode}
        />
      )}

      {showSearchModal && (
        <SearchModal
          onClose={() => setShowSearchModal(false)}
          onSearch={(newFilters) => {
            setFilters(newFilters);
            setRefreshKey((prev) => prev + 1);
          }}
          layoutMode={layoutMode}
        />
      )}

      {showProfileModal && (
        <ProfileModal
          onClose={() => {
            setShowProfileModal(false);
            setViewUserId(undefined);
          }}
          viewUserId={viewUserId}
          layoutMode={layoutMode}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
