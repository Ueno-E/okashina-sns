import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminAccount() {
  const adminEmail = 'uenet2023@gmail.com';
  const adminPassword = 'Hotax2023*';
  const adminDisplayName = '管理者';
  const adminUsername = 'Admin';

  console.log('🔧 管理者アカウントを作成中...');

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        display_name: adminDisplayName,
        username: adminUsername
      }
    });

    if (authError) {
      if (authError.message.includes('already exists') || authError.message.includes('already registered')) {
        console.log('⚠️  このメールアドレスのユーザーは既に存在します');

        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === adminEmail);

        if (user) {
          console.log('📝 既存ユーザーのプロフィールを更新中...');

          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: adminUsername,
              display_name: adminDisplayName,
              is_admin: true,
              bio: '管理者アカウント'
            });

          if (profileError) {
            console.error('❌ プロフィール更新エラー:', profileError);
            process.exit(1);
          }

          console.log('✅ 既存ユーザーを管理者に設定しました');
          console.log('📧 メール:', adminEmail);
          console.log('👤 ユーザー名:', adminUsername);
          console.log('📝 表示名:', adminDisplayName);
          return;
        }
      }

      console.error('❌ 認証エラー:', authError);
      process.exit(1);
    }

    if (!authData.user) {
      console.error('❌ ユーザーデータが取得できませんでした');
      process.exit(1);
    }

    console.log('✅ 認証ユーザー作成完了');

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: adminUsername,
        display_name: adminDisplayName,
        is_admin: true,
        bio: '管理者アカウント'
      });

    if (profileError) {
      console.error('❌ プロフィール作成エラー:', profileError);
      process.exit(1);
    }

    console.log('✅ 管理者アカウントの作成が完了しました！');
    console.log('📧 メール:', adminEmail);
    console.log('🔑 パスワード:', adminPassword);
    console.log('👤 ユーザー名:', adminUsername);
    console.log('📝 表示名:', adminDisplayName);
    console.log('🛡️  管理者権限: 有効');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

createAdminAccount();
