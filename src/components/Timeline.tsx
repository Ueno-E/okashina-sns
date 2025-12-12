import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostCard from './PostCard';
import { Loader2 } from 'lucide-react';

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  title: string;
  description: string;
  region: string | null;
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

interface TimelineProps {
  filters?: {
    region?: string;
    tag?: string;
    search?: string;
  };
  userId?: string;
  onUserClick?: (userId: string) => void;
  showFollowingOnly?: boolean;
  layoutMode?: 'desktop' | 'mobile';
}

export default function Timeline({ filters, userId, onUserClick, showFollowingOnly, layoutMode = 'mobile' }: TimelineProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [filters, userId, showFollowingOnly]);

  const loadPosts = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url,
            is_admin,
            is_verified
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (showFollowingOnly && user) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (followingData && followingData.length > 0) {
          const followingIds = followingData.map(f => f.following_id);
          query = query.in('user_id', followingIds);
        } else {
          setPosts([]);
          setLoading(false);
          return;
        }
      }

      if (filters?.region) {
        query = query.eq('region', filters.region);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredPosts = data || [];

      if (filters?.tag) {
        const { data: postTagsData } = await supabase
          .from('post_tags')
          .select('post_id, tags!inner(name)')
          .eq('tags.name', filters.tag);

        if (postTagsData) {
          const postIds = new Set(postTagsData.map((pt) => pt.post_id));
          filteredPosts = filteredPosts.filter((post) => postIds.has(post.id));
        }
      }

      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {showFollowingOnly
            ? 'フォロー中のユーザーの投稿がありません'
            : 'まだ投稿がありません'}
        </p>
      </div>
    );
  }

  const handlePostDeleted = () => {
    loadPosts();
  };

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onUserClick={onUserClick}
          onPostDeleted={handlePostDeleted}
          layoutMode={layoutMode}
        />
      ))}
    </div>
  );
}
