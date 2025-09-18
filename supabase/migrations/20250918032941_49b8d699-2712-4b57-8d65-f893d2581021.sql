-- Criar usuário de teste sem usar função
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
) VALUES (
  'a47f8a40-1234-5678-9abc-def000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'chaves@admin.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false
) ON CONFLICT (email) DO NOTHING;