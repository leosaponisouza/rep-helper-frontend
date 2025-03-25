## Configuração do Supabase para Upload de Imagens

Para configurar o upload de imagens usando o Supabase Storage, siga os passos abaixo:

1. Crie uma conta no [Supabase](https://supabase.com/) e inicie um novo projeto.

2. Crie um bucket público chamado `avatars`:
   - No dashboard do Supabase, navegue até "Storage" > "Buckets"
   - Clique em "Create New Bucket"
   - Dê o nome "avatars"
   - Marque a opção "Public" para permitir acesso público às imagens
   - Clique em "Create bucket"

3. Configure as políticas de acesso para o bucket:
   - No bucket criado, clique em "Policies"
   - Configure uma política para permitir upload de arquivos autenticados
   - Configure uma política para permitir leitura pública

4. Adicione as credenciais do Supabase ao seu arquivo `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

5. Reinicie o app para que as configurações tenham efeito. 