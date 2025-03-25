// 1. Código para configurar o upload anônimo
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// Obter variáveis de ambiente
const extra = Constants.expoConfig?.extra || {};
const supabaseUrl = extra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = extra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Criar cliente
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Upload de imagem para o Supabase com suporte a acesso anônimo
 */
export const uploadImageToSupabase = async (
  uri: string,
  bucket: string = 'avatars', // Use o nome do bucket correto configurado no Supabase
  userId: string = 'anon' // ID para identificação no caminho
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    console.log('Iniciando upload com acesso anônimo...');
    
    // 1. Comprimir a imagem primeiro
    console.log('Comprimindo imagem...');
    const compressedImage = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 600 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    // 2. Criar um caminho que siga a estrutura permitida pela política RLS
    // Tipicamente, o bucket precisa ter uma pasta pública para acessos anônimos
    const fileName = `${Date.now()}.jpg`;
    const filePath = `public/${userId}/${fileName}`;
    
    console.log(`Caminho do arquivo: ${filePath}`);
    
    // 3. Upload usando a API Storage do Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, {
        uri: compressedImage.uri,
        type: 'image/jpeg',
        name: fileName,
      } as any, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Erro do Supabase:', error);
      throw new Error(`Erro ao fazer upload: ${error.message}`);
    }
    
    // 4. Obter a URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    console.log('URL gerada:', urlData.publicUrl);
    
    return { url: urlData.publicUrl, error: null };
  } catch (error) {
    console.error('Erro completo:', error);
    return { url: null, error: error as Error };
  }
};

/**
 * Excluir imagem (versão para acesso anônimo)
 */
export const deleteImageFromSupabase = async (
  url: string,
  bucket: string = 'avatars'
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Extrair o caminho do arquivo da URL
    const urlPath = url.split(`/storage/v1/object/public/${bucket}/`)[1];
    if (!urlPath) {
      throw new Error('URL inválida');
    }
    
    console.log(`Excluindo arquivo: ${urlPath}`);
    
    // Remover arquivo
    const { error } = await supabase.storage
      .from(bucket)
      .remove([urlPath]);
      
    if (error) {
      console.error('Erro ao excluir:', error);
      throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Erro ao excluir:', error);
    return { success: false, error: error as Error };
  }
};