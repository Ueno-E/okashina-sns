-- 管理者フラグを設定するSQL
-- 使用方法: メールアドレスを指定して、そのユーザーを管理者に設定します

-- 管理者に設定したいユーザーのメールアドレス
-- この例: uenet2023@gmail.com

UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'uenet2023@gmail.com'
);
