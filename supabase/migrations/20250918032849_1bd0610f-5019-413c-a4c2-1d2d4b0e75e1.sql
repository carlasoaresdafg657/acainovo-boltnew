-- Verificar se existe usuário e criar um para teste
-- Primeiro, vamos criar uma função para verificar e criar usuário de teste
CREATE OR REPLACE FUNCTION criar_usuario_teste()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists boolean := false;
  new_user_id uuid;
BEGIN
  -- Verificar se já existe um usuário com o email chaves@admin.com
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = 'chaves@admin.com'
  ) INTO user_exists;
  
  -- Se não existir, criar o usuário
  IF NOT user_exists THEN
    -- Inserir usuário na tabela auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      confirmation_token,
      recovery_sent_at,
      recovery_token,
      email_change_sent_at,
      email_change,
      email_change_token_new,
      email_change_token_current,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      confirmed_at,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'chaves@admin.com',
      crypt('123456', gen_salt('bf')), -- Hash da senha 123456
      now(),
      now(),
      '',
      null,
      '',
      null,
      '',
      '',
      '',
      null,
      '{"provider": "email", "providers": ["email"]}',
      '{}',
      false,
      now(),
      now(),
      null,
      null,
      '',
      '',
      null,
      now(),
      0,
      null,
      '',
      null
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE 'Usuário de teste criado com ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'Usuário de teste já existe';
  END IF;
END;
$$;

-- Executar a função
SELECT criar_usuario_teste();