import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const dummyUsers = [
  { email: 'user1@example.com', password: 'password123', username: 'choco_lover', displayName: 'チョコ好き太郎', avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=200' },
  { email: 'user2@example.com', password: 'password123', username: 'wagashi_fan', displayName: '和菓子ファン', avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=200' },
  { email: 'user3@example.com', password: 'password123', username: 'cookie_master', displayName: 'クッキーマスター', avatarUrl: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?w=200' },
  { email: 'user4@example.com', password: 'password123', username: 'candy_queen', displayName: 'キャンディクイーン', avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=200' },
  { email: 'user5@example.com', password: 'password123', username: 'mochi_lover', displayName: 'もち好き花子', avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=200' },
  { email: 'user6@example.com', password: 'password123', username: 'snack_hunter', displayName: 'スナックハンター', avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=200' },
  { email: 'user7@example.com', password: 'password123', username: 'sweet_tooth', displayName: '甘党さん', avatarUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=200' },
  { email: 'user8@example.com', password: 'password123', username: 'okashi_otaku', displayName: 'お菓子オタク', avatarUrl: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?w=200' },
  { email: 'user9@example.com', password: 'password123', username: 'gourmet_sweets', displayName: 'グルメスイーツ', avatarUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=200' },
  { email: 'user10@example.com', password: 'password123', username: 'dessert_lover', displayName: 'デザート愛好家', avatarUrl: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?w=200' }
];

const allPosts = [
  { title: '白い恋人', description: '北海道の定番お土産！サクサクのクッキーとホワイトチョコの組み合わせが最高です。', region: '北海道', tags: ['チョコレート', '北海道限定', 'クッキー'] },
  { title: 'ロイズの生チョコレート', description: '濃厚でとろける食感がたまりません。', region: '北海道', tags: ['チョコレート', '北海道限定'] },
  { title: '六花亭のマルセイバターサンド', description: 'レーズン入りのバタークリームが絶品。', region: '北海道', tags: ['クッキー', '北海道限定'] },

  { title: '東京ばな奈', description: '東京土産の王道。バナナクリームがたっぷり入っていて美味しい！', region: '東京都', tags: ['東京限定', 'お土産', 'バナナ'] },
  { title: 'シュガーバターの木', description: 'サクサク食感のシリアル生地が美味しい。', region: '東京都', tags: ['東京限定', 'クッキー'] },
  { title: 'ねんりん家のバームクーヘン', description: 'しっとりとした食感が最高です。', region: '東京都', tags: ['東京限定', 'バームクーヘン'] },

  { title: '八つ橋', description: '京都の伝統的なお菓子。ニッキの香りが懐かしい味わいです。', region: '京都府', tags: ['和菓子', '京都限定', '伝統菓子'] },
  { title: '阿闍梨餅', description: 'もちもちの皮とあんこが絶妙です。', region: '京都府', tags: ['和菓子', '京都限定'] },
  { title: '抹茶チョコレート', description: '濃厚な抹茶の風味が楽しめます。', region: '京都府', tags: ['抹茶', '京都限定', 'チョコレート'] },

  { title: 'じゃがピリカ', description: 'じゃがポックルよりピリ辛でクセになる味。', region: '北海道', tags: ['北海道限定', 'スナック'] },
  { title: 'いももち', description: 'もちもちで優しい味わいです。', region: '北海道', tags: ['北海道限定', 'もち'] },

  { title: '萩の月', description: '仙台の銘菓。ふわふわのカステラ生地とカスタードクリームが絶品。', region: '宮城県', tags: ['カステラ', '仙台限定', 'お土産'] },
  { title: 'ずんだ餅', description: '枝豆の風味が爽やかで美味しい。', region: '宮城県', tags: ['和菓子', '宮城限定', 'ずんだ'] },
  { title: '喜久福', description: 'ずんだクリームと生クリームの大福。', region: '宮城県', tags: ['和菓子', '宮城限定'] },

  { title: 'うなぎパイ', description: '静岡の夜のお菓子。パイ生地がサクサクで香ばしい！', region: '静岡県', tags: ['パイ', '静岡限定', 'バター'] },
  { title: '安倍川餅', description: 'きな粉たっぷりの優しい味わい。', region: '静岡県', tags: ['和菓子', '静岡限定', 'きな粉'] },
  { title: '富士山頂', description: 'チョコレートケーキの名品。', region: '静岡県', tags: ['静岡限定', 'チョコレート'] },

  { title: 'もみじ饅頭', description: '広島の定番土産。あんこたっぷりで美味しいです。', region: '広島県', tags: ['和菓子', '広島限定', 'あんこ'] },
  { title: 'かき餅', description: '牡蠣の風味が効いた珍しいお菓子。', region: '広島県', tags: ['広島限定', 'せんべい'] },
  { title: '生もみじ', description: 'もちもちの生地が新食感。', region: '広島県', tags: ['和菓子', '広島限定'] },

  { title: 'ちんすこう', description: '沖縄の伝統菓子。素朴な甘さとサクサク食感が癖になる。', region: '沖縄県', tags: ['沖縄限定', '伝統菓子', 'クッキー'] },
  { title: '紅いもタルト', description: '紅芋の甘さが引き立つタルト。', region: '沖縄県', tags: ['沖縄限定', 'タルト'] },
  { title: 'サーターアンダギー', description: '沖縄風ドーナツ。外はカリッと中はもっちり。', region: '沖縄県', tags: ['沖縄限定', 'ドーナツ'] },

  { title: 'へんばや餅', description: 'シンプルで飽きのこない美味しさ。', region: '三重県', tags: ['和菓子', '三重限定'] },
  { title: '安永餅', description: 'こしあんと餅の絶妙なバランス。', region: '三重県', tags: ['和菓子', '三重限定', 'あんこ'] },

  { title: 'きびだんご', description: '岡山の桃太郎伝説にちなんだお菓子。もちもち食感が楽しい。', region: '岡山県', tags: ['和菓子', '岡山限定', 'もち'] },
  { title: '大手まんぢゅう', description: '上品な甘さの酒まんじゅう。', region: '岡山県', tags: ['和菓子', '岡山限定'] },
  { title: '調布', description: 'つぶあんをぎゅうひで包んだ銘菓。', region: '岡山県', tags: ['和菓子', '岡山限定', 'あんこ'] }
];

const imageUrls = [
  'https://images.pexels.com/photos/890577/pexels-photo-890577.jpeg',
  'https://images.pexels.com/photos/3758132/pexels-photo-3758132.jpeg',
  'https://images.pexels.com/photos/1395323/pexels-photo-1395323.jpeg',
  'https://images.pexels.com/photos/1119479/pexels-photo-1119479.jpeg',
  'https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg',
  'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg',
  'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg',
  'https://images.pexels.com/photos/3776942/pexels-photo-3776942.jpeg',
  'https://images.pexels.com/photos/2144095/pexels-photo-2144095.jpeg',
  'https://images.pexels.com/photos/1055272/pexels-photo-1055272.jpeg'
];

function getRandomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const hoursAgo = Math.floor(Math.random() * 24);
  const minutesAgo = Math.floor(Math.random() * 60);

  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  date.setMinutes(date.getMinutes() - minutesAgo);

  return date.toISOString();
}

async function seedData() {
  console.log('Starting to seed dummy data...');

  for (let i = 0; i < dummyUsers.length; i++) {
    const user = dummyUsers[i];
    const userPosts = allPosts.slice(i * 3, i * 3 + 3);

    console.log(`\nCreating user ${i + 1}: ${user.username}`);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
    });

    if (authError) {
      console.error(`Error creating user ${user.username}:`, authError.message);
      continue;
    }

    if (!authData.user) {
      console.error(`No user data returned for ${user.username}`);
      continue;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: user.username,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        bio: `お菓子が大好きです！特に${userPosts[0].title}が好き♪`
      });

    if (profileError) {
      console.error(`Error creating profile for ${user.username}:`, profileError.message);
      continue;
    }

    for (let j = 0; j < userPosts.length; j++) {
      const post = userPosts[j];
      const imageUrl = imageUrls[(i * 3 + j) % imageUrls.length];

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: authData.user.id,
          image_url: imageUrl,
          title: post.title,
          description: post.description,
          region: post.region,
          created_at: getRandomDate()
        })
        .select()
        .single();

      if (postError) {
        console.error(`Error creating post for ${user.username}:`, postError.message);
        continue;
      }

      for (const tagName of post.tags) {
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

          if (tagError) {
            console.error(`Error creating tag ${tagName}:`, tagError.message);
            continue;
          }
          tagId = newTag.id;
        }

        await supabase.from('post_tags').insert({
          post_id: postData.id,
          tag_id: tagId,
        });
      }

      console.log(`  ✓ Created post: "${post.title}"`);
    }

    console.log(`✓ Successfully created user ${user.username} with ${userPosts.length} posts`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\nDummy data seeding completed!');
  console.log(`Total: ${dummyUsers.length} users with 3 posts each = ${dummyUsers.length * 3} posts`);
}

seedData().catch(console.error);
