import { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  title: string;
  description: string | null;
  region: string | null;
  url: string | null;
  created_at: string;
  edited_at: string | null;
}

interface EditPostModalProps {
  post: Post;
  onClose: () => void;
  onPostUpdated: () => void;
  layoutMode?: 'desktop' | 'mobile';
}

const REGIONS = [
  '全国', '海外',
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

export default function EditPostModal({ post, onClose, onPostUpdated, layoutMode = 'mobile' }: EditPostModalProps) {
  const { user } = useAuth();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(post.image_url);
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description || '');
  const [region, setRegion] = useState(post.region || '');
  const [url, setUrl] = useState(post.url || '');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExistingTags();
  }, []);

  const loadExistingTags = async () => {
    const { data } = await supabase
      .from('post_tags')
      .select('tags(name)')
      .eq('post_id', post.id);

    if (data) {
      const tagNames = data.map((item: any) => item.tags.name).join(', ');
      setTags(tagNames);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (url && !url.match(/^https?:\/\/.+/)) {
      setError('URLはhttp://またはhttps://から始まる必要があります');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = post.image_url;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('posts')
        .update({
          image_url: imageUrl,
          title,
          description,
          region: region || null,
          url: url || null,
          edited_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateError) throw updateError;

      const { error: deleteTagsError } = await supabase
        .from('post_tags')
        .delete()
        .eq('post_id', post.id);

      if (deleteTagsError) throw deleteTagsError;

      if (tags.trim()) {
        const tagNames = tags.split(',').map(t => t.trim()).filter(Boolean);

        for (const tagName of tagNames) {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .maybeSingle();

          let tagId: string;

          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const { data: newTag, error: tagError } = await supabase
              .from('tags')
              .insert({ name: tagName })
              .select('id')
              .single();

            if (tagError) throw tagError;
            tagId = newTag.id;
          }

          await supabase.from('post_tags').insert({
            post_id: post.id,
            tag_id: tagId,
          });
        }
      }

      onPostUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || '更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-2xl max-h-[90vh] overflow-y-auto ${
        layoutMode === 'desktop' ? 'w-[600px]' : 'w-[350px]'
      }`}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">投稿を編集</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <label className="absolute bottom-2 right-2 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <ImageIcon className="w-4 h-4" />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              タイトル（必須）
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              placeholder="例: 北海道限定 白い恋人"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              placeholder="お菓子の感想や特徴を書いてください"
            />
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
              地域
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            >
              <option value="">選択してください</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              タグ（必須、カンマ区切り）
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              placeholder="例: チョコレート, 北海道限定, お土産"
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
              関連URL（任意）
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              placeholder="例: https://example.com/product"
            />
            <p className="text-xs text-gray-500 mt-1">http://またはhttps://から始まるURLを入力してください</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '更新中...' : '更新する'}
          </button>
        </form>
      </div>
    </div>
  );
}
