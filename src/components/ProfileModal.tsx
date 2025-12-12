import { useState, useEffect, useRef } from 'react';
import { X, User as UserIcon, Camera, UserPlus, UserMinus, ShieldCheck, Edit2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Timeline from './Timeline';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_admin: boolean;
  is_verified: boolean;
  created_at: string;
}

interface ProfileModalProps {
  onClose: () => void;
  viewUserId?: string;
  layoutMode?: 'desktop' | 'mobile';
}

export default function ProfileModal({ onClose, viewUserId, layoutMode = 'mobile' }: ProfileModalProps) {
  const { user } = useAuth();
  const targetUserId = viewUserId || user?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOwnProfile = user?.id === targetUserId;

  useEffect(() => {
    if (targetUserId) {
      loadProfile();
      loadPostCount();
      loadFollowCounts();
      loadFollowStatus();
    }
  }, [targetUserId]);

  const loadProfile = async () => {
    if (!targetUserId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setBio(data.bio || '');
    }
    setLoading(false);
  };

  const loadPostCount = async () => {
    if (!targetUserId) return;

    const { count } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    setPostCount(count || 0);
  };

  const loadFollowCounts = async () => {
    if (!targetUserId) return;

    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetUserId);

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);

    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);
  };

  const loadFollowStatus = async () => {
    if (!user || !targetUserId || isOwnProfile) return;

    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const handleFollowToggle = async () => {
    if (!user || !targetUserId) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('フォロー操作に失敗しました');
    }
  };

  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 400;
          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          const sourceSize = Math.min(img.width, img.height);
          const sx = (img.width - sourceSize) / 2;
          const sy = (img.height - sourceSize) / 2;

          ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          }, 'image/jpeg', 0.9);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }

    setUploading(true);

    try {
      const resizedBlob = await resizeImage(file);
      const fileName = `${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile!, avatar_url: publicUrl });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error?.message || 'アイコン画像のアップロードに失敗しました';
      alert(`アイコン画像のアップロードに失敗しました\n\nエラー: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleBioSave = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile!, bio });
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error updating bio:', error);
      alert('一言コメントの更新に失敗しました');
    }
  };

  if (loading || !profile) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className={`bg-white rounded-2xl max-h-[90vh] overflow-y-auto ${
        layoutMode === 'desktop' ? 'w-[700px]' : 'w-[350px]'
      }`}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
          <h2 className="text-xl font-bold text-gray-800">マイページ</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-8 pb-8 border-b border-gray-200">
            <div className="mb-4">
              <div className="flex items-start gap-4 mb-3">
                <div className="flex-shrink-0 relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                      <UserIcon className="w-10 h-10 text-white" />
                    </div>
                  )}
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h3 className="text-xl font-bold text-gray-800 truncate">
                      {profile.display_name}
                    </h3>
                    {(profile.is_admin || profile.is_verified) && (
                      <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm truncate">@{profile.username}</p>
                </div>
              </div>

              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-bold text-gray-800">{postCount}</span>
                  <span className="text-gray-600 ml-1">投稿</span>
                </div>
                <div>
                  <span className="font-bold text-gray-800">{followingCount}</span>
                  <span className="text-gray-600 ml-1">フォロー中</span>
                </div>
                <div>
                  <span className="font-bold text-gray-800">{followerCount}</span>
                  <span className="text-gray-600 ml-1">フォロワー</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              {isOwnProfile ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">一言コメント</label>
                    {!isEditingBio ? (
                      <button
                        onClick={() => setIsEditingBio(true)}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                      >
                        <Edit2 className="w-3 h-3" />
                        編集
                      </button>
                    ) : (
                      <button
                        onClick={handleBioSave}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        <Check className="w-3 h-3" />
                        保存
                      </button>
                    )}
                  </div>
                  {isEditingBio ? (
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={150}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm"
                      placeholder="自己紹介を書いてください（150文字まで）"
                    />
                  ) : (
                    <p className="text-gray-700 text-sm">{bio || '未設定'}</p>
                  )}
                </div>
              ) : (
                profile.bio && <p className="text-gray-700 text-sm">{profile.bio}</p>
              )}
            </div>

            {!isOwnProfile && user && (
              <button
                onClick={handleFollowToggle}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 shadow-md hover:shadow-lg'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    フォロー中
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    フォローする
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-800 mb-4">投稿一覧</h4>
            <Timeline userId={targetUserId} layoutMode={layoutMode} />
          </div>
        </div>
      </div>
    </div>
  );
}
