import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SearchModalProps {
  onClose: () => void;
  onSearch: (filters: { region?: string; tag?: string; search?: string }) => void;
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

export default function SearchModal({ onClose, onSearch, layoutMode = 'mobile' }: SearchModalProps) {
  const [region, setRegion] = useState('');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [popularTags, setPopularTags] = useState<string[]>([]);

  useEffect(() => {
    loadPopularTags();
  }, []);

  const loadPopularTags = async () => {
    const { data } = await supabase
      .from('tags')
      .select('name')
      .limit(20);

    if (data) {
      setPopularTags(data.map((t) => t.name));
    }
  };

  const handleSearch = () => {
    const filters: { region?: string; tag?: string; search?: string } = {};

    if (region) filters.region = region;
    if (tag) filters.tag = tag;
    if (search) filters.search = search;

    onSearch(filters);
    onClose();
  };

  const handleReset = () => {
    setRegion('');
    setTag('');
    setSearch('');
    onSearch({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-2xl max-h-[90vh] overflow-y-auto ${
        layoutMode === 'desktop' ? 'w-[600px]' : 'w-[350px]'
      }`}>
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">検索・フィルター</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              キーワード検索
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="お菓子名で検索"
              />
            </div>
          </div>

          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
              地域で絞り込み
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
            >
              <option value="">すべての地域</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-2">
              タグで絞り込み
            </label>
            <input
              id="tag"
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent mb-2"
              placeholder="タグを入力"
            />
            {popularTags.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">人気のタグ:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTag(t)}
                      className="text-xs bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 px-3 py-1 rounded-full transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              リセット
            </button>
            <button
              onClick={handleSearch}
              className="flex-1 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-semibold py-2 rounded-lg hover:from-pink-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
            >
              検索
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
