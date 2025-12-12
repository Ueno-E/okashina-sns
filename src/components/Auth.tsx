import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Camera, UserCircle, ChevronLeft, CheckCircle, Monitor, Smartphone } from 'lucide-react';

type SignUpStep = 'credentials' | 'profile' | 'avatar';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [signUpStep, setSignUpStep] = useState<SignUpStep>('credentials');
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'mobile'>('mobile');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signIn, signUpStep1, createProfile, checkUsernameAvailable } = useAuth();

  useEffect(() => {
    if (user && !isLogin) {
      setSignUpStep('profile');
    }
  }, [user, isLogin]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'パスワードは8文字以上である必要があります';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'パスワードには英字を含める必要があります';
    }
    if (!/[0-9]/.test(password)) {
      return 'パスワードには数字を含める必要があります';
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUpStep1(email, password);
      if (signUpError) throw signUpError;

      const { error: signInError } = await signIn(email, password);
      if (signInError) throw signInError;

      setSignUpStep('profile');
    } catch (err: any) {
      setError(err.message || 'アカウント作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckUsername = async (value: string) => {
    setUsername(value);

    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    const available = await checkUsernameAvailable(value);
    setUsernameAvailable(available);
    setUsernameChecking(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !displayName) {
      setError('ユーザー名と表示名を入力してください');
      return;
    }

    if (usernameAvailable === false) {
      setError('このユーザー名は既に使用されています');
      return;
    }

    setSignUpStep('avatar');
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = async (skipAvatar: boolean = false) => {
    setError('');
    setLoading(true);

    try {
      const { error } = await createProfile(
        username,
        displayName,
        skipAvatar ? undefined : avatarFile || undefined
      );

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'プロフィール作成に失敗しました');
      setLoading(false);
    }
  };

  const resetSignUp = () => {
    setSignUpStep('credentials');
    setEmail('');
    setPassword('');
    setPasswordConfirm('');
    setUsername('');
    setDisplayName('');
    setAvatarFile(null);
    setAvatarPreview('');
    setError('');
    setUsernameAvailable(null);
  };

  const renderLoginForm = () => (
    <>
      <div className="flex flex-col items-center mb-8">
        <img src="/okashi_logo copy copy copy copy.png" alt="お菓子なSNS" className="w-80 mb-6" />
        <p className="text-base font-semibold text-gray-700 text-center">
          私だけの、まだ見ぬお菓子と出会う場所。
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            placeholder="パスワードを入力"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white font-bold py-3 rounded-full hover:from-orange-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '処理中...' : 'ログイン'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsLogin(false);
            setError('');
          }}
          className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
        >
          アカウントを作成する
        </button>
      </div>
    </>
  );

  const renderSignUpStep1 = () => (
    <>
      <div className="flex items-center mb-6">
        <button
          onClick={() => {
            setIsLogin(true);
            resetSignUp();
          }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 flex-1 text-center mr-9">アカウント作成</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6 text-center">
        メールアドレスとパスワードを入力してください
      </p>

      <form onSubmit={handleSignUpStep1} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            placeholder="英数字8文字以上"
          />
          <p className="text-xs text-gray-500 mt-1">
            8文字以上、英字と数字を含む（記号も使用可）
          </p>
        </div>

        <div>
          <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード（確認）
          </label>
          <input
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            placeholder="パスワードを再入力"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white font-bold py-3 rounded-full hover:from-orange-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '処理中...' : '次へ'}
        </button>
      </form>
    </>
  );

  const renderProfileStep = () => (
    <>
      <div className="flex items-center mb-6">
        <button
          onClick={() => setSignUpStep('credentials')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 flex-1 text-center mr-9">プロフィール設定</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6 text-center">
        表示名とユーザー名を入力してください
      </p>

      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            表示名
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
            placeholder="お菓子太郎"
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            ユーザー名（@○○）
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
              @
            </span>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => handleCheckUsername(e.target.value)}
              required
              pattern="[a-zA-Z0-9_]{3,20}"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
              placeholder="okashi_taro"
            />
            {usernameChecking && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                確認中...
              </span>
            )}
            {!usernameChecking && usernameAvailable === true && username.length >= 3 && (
              <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
            )}
            {!usernameChecking && usernameAvailable === false && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500 text-sm">
                使用済み
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            3〜20文字、英数字とアンダースコアのみ使用可
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!usernameAvailable || usernameChecking}
          className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white font-bold py-3 rounded-full hover:from-orange-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          次へ
        </button>
      </form>
    </>
  );

  const renderAvatarStep = () => (
    <>
      <div className="flex items-center mb-6">
        <button
          onClick={() => setSignUpStep('profile')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-800 flex-1 text-center mr-9">アイコン設定</h2>
      </div>

      <p className="text-sm text-gray-600 mb-6 text-center">
        プロフィールアイコンを設定してください（スキップ可能）
      </p>

      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-4">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="アイコンプレビュー"
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
              <UserCircle className="w-20 h-20 text-white" />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition-colors shadow-lg"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleFinalSubmit(false)}
          disabled={loading || !avatarFile}
          className="w-full bg-gradient-to-r from-orange-400 to-pink-400 text-white font-bold py-3 rounded-full hover:from-orange-500 hover:to-pink-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '登録中...' : 'この画像で登録'}
        </button>

        <button
          onClick={() => handleFinalSubmit(true)}
          disabled={loading}
          className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-full hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          スキップして登録
        </button>
      </div>
    </>
  );

  const renderContent = () => {
    if (isLogin) {
      return renderLoginForm();
    }

    switch (signUpStep) {
      case 'credentials':
        return renderSignUpStep1();
      case 'profile':
        return renderProfileStep();
      case 'avatar':
        return renderAvatarStep();
      default:
        return renderSignUpStep1();
    }
  };

  if (layoutMode === 'mobile') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-auth-pattern p-4">
        <div className="w-[390px] h-[844px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
          {isLogin && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setLayoutMode('desktop')}
                className="p-2 bg-orange-100 rounded-full hover:bg-orange-200 transition-colors"
                title="PC用レイアウト"
              >
                <Monitor className="w-5 h-5 text-orange-600" />
              </button>
            </div>
          )}
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-auth-pattern flex items-center justify-center p-8 relative">
      {isLogin && (
        <button
          onClick={() => setLayoutMode('mobile')}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-lg z-10"
          title="スマートフォン用レイアウト"
        >
          <Smartphone className="w-5 h-5 text-gray-600" />
          <span className="text-gray-800 font-medium">モバイル表示</span>
        </button>
      )}

      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="w-full max-w-md mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
