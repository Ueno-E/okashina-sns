import { useState, useEffect } from 'react';
import { MapPin, Tag, Clock, User, MoreVertical, Edit2, Trash2, ShieldCheck, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EditPostModal from './EditPostModal';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const weekday = weekdays[date.getDay()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} (${weekday}) ${hours}:${minutes}:${seconds}`;
}

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  title: string;
  description: string;
  region: string | null;
  url: string | null;
  ai_genre: string | null;
  created_at: string;
  edited_at: string | null;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_admin: boolean;
    is_verified: boolean;
  };
}

interface Reaction {
  id: string;
  name: string;
  emoji: string;
  sort_order: number;
}

interface PostCardProps {
  post: Post;
  onUserClick?: (userId: string) => void;
  onPostDeleted?: () => void;
  layoutMode?: 'desktop' | 'mobile';
}

export default function PostCard({ post, onUserClick, onPostDeleted, layoutMode = 'mobile' }: PostCardProps) {
  const { user, profile } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  useEffect(() => {
    loadReactions();
    loadReactionCounts();
    loadUserReactions();
    loadTags();
  }, [post.id]);

  const loadReactions = async () => {
    const { data } = await supabase
      .from('reactions')
      .select('*')
      .order('sort_order');

    if (data) setReactions(data);
  };

  const loadReactionCounts = async () => {
    const { data } = await supabase
      .from('post_reactions')
      .select('reaction_id')
      .eq('post_id', post.id);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((r) => {
        counts[r.reaction_id] = (counts[r.reaction_id] || 0) + 1;
      });
      setReactionCounts(counts);
    }
  };

  const loadUserReactions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('post_reactions')
      .select('reaction_id')
      .eq('post_id', post.id)
      .eq('user_id', user.id);

    if (data) {
      setUserReactions(new Set(data.map((r) => r.reaction_id)));
    }
  };

  const loadTags = async () => {
    const { data } = await supabase
      .from('post_tags')
      .select('tags(name)')
      .eq('post_id', post.id);

    if (data) {
      setTags(data.map((pt: any) => pt.tags.name));
    }
  };

  const toggleReaction = async (reactionId: string) => {
    if (!user) return;

    const hasReacted = userReactions.has(reactionId);

    if (hasReacted) {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .eq('reaction_id', reactionId);

      setUserReactions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(reactionId);
        return newSet;
      });

      setReactionCounts((prev) => ({
        ...prev,
        [reactionId]: Math.max(0, (prev[reactionId] || 0) - 1),
      }));
    } else {
      await supabase.from('post_reactions').insert({
        post_id: post.id,
        user_id: user.id,
        reaction_id: reactionId,
      });

      setUserReactions((prev) => new Set([...prev, reactionId]));

      setReactionCounts((prev) => ({
        ...prev,
        [reactionId]: (prev[reactionId] || 0) + 1,
      }));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('この投稿を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      onPostDeleted?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('投稿の削除に失敗しました');
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handlePostUpdated = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('id', post.id)
      .single();

    if (data) {
      setCurrentPost(data);
    }
    loadTags();
  };

  const isOwnPost = user && user.id === post.user_id;
  const isAdmin = profile?.is_admin ?? false;
  const canManagePost = isOwnPost || isAdmin;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-200">
      <div className="p-4 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-orange-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUserClick?.(post.user_id)}
            className="flex-shrink-0"
          >
            {post.profiles?.avatar_url ? (
              <img
                src={post.profiles.avatar_url}
                alt={post.profiles.display_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-orange-300"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0">
            {post.profiles && (
              <button
                onClick={() => onUserClick?.(post.user_id)}
                className="text-sm hover:opacity-80 transition-opacity text-left block w-full"
              >
                <div className="flex items-center gap-1 truncate">
                  <span className="font-bold text-gray-800">{post.profiles.display_name}</span>
                  {(post.profiles.is_admin || post.profiles.is_verified) && (
                    <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                  <span className="text-gray-500 ml-1 truncate">@{post.profiles.username}</span>
                </div>
              </button>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatDate(currentPost.created_at)}</span>
              {currentPost.edited_at && <span className="ml-1">(編集済)</span>}
            </div>
          </div>
          {canManagePost && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-white rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                  {isOwnPost && (
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      編集
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    削除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <img
        src={post.image_url}
        alt={post.title}
        className={layoutMode === 'desktop'
          ? "w-full max-h-96 object-contain bg-gray-50"
          : "w-full h-48 object-cover"
        }
      />

      <div className="p-4 bg-white">
        <h3 className="text-lg font-bold text-gray-800 mb-2">{currentPost.title}</h3>

        {currentPost.description && (
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">{currentPost.description}</p>
        )}

        {currentPost.region && (
          <div className="flex items-center gap-1 text-sm text-orange-600 mb-2 font-semibold">
            <MapPin className="w-4 h-4" />
            <span>{currentPost.region}</span>
          </div>
        )}

        {currentPost.url && (
          <a
            href={currentPost.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-2 font-medium hover:underline transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="truncate">{currentPost.url}</span>
          </a>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag, index) => {
              const colors = [
                'bg-orange-100 text-orange-700 border-orange-300',
                'bg-pink-100 text-pink-700 border-pink-300',
                'bg-yellow-100 text-yellow-700 border-yellow-300',
              ];
              const colorClass = colors[index % colors.length];
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center gap-1 ${colorClass} text-xs px-3 py-1 rounded-full font-semibold border-2`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-3 border-t-2 border-orange-100">
          {reactions.map((reaction, index) => {
            const count = reactionCounts[reaction.id] || 0;
            const isActive = userReactions.has(reaction.id);
            const activeColors = [
              'bg-orange-500',
              'bg-pink-500',
              'bg-yellow-500'
            ];
            const hoverColors = [
              'hover:bg-orange-100',
              'hover:bg-pink-100',
              'hover:bg-yellow-100'
            ];
            const activeColor = activeColors[index % activeColors.length];
            const hoverColor = hoverColors[index % hoverColors.length];

            return (
              <button
                key={reaction.id}
                onClick={() => toggleReaction(reaction.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all ${
                  isActive
                    ? `${activeColor} text-white shadow-md font-bold`
                    : `bg-gray-100 ${hoverColor} text-gray-700 font-medium`
                }`}
              >
                <span className="text-base">{reaction.emoji}</span>
                <span>{reaction.name}</span>
                {count > 0 && <span className="font-bold ml-1">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {showEditModal && (
        <EditPostModal
          post={currentPost}
          onClose={() => setShowEditModal(false)}
          onPostUpdated={handlePostUpdated}
          layoutMode={layoutMode}
        />
      )}
    </div>
  );
}
