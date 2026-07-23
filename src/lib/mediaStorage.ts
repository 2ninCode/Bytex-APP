import { supabase } from './supabase';
import { MediaFile } from '../types';

/**
 * Converte e compacta imagens para Data URL (Base64) mantendo qualidade e tamanho leve.
 */
export async function compressImageToBase64(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Lê qualquer arquivo como Data URL em formato Base64.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Faz upload do arquivo de foto/vídeo para o Supabase Storage ('os-media').
 * Se o bucket não existir ou se o Storage falhar, recorre AUTOMATICAMENTE ao envio em Base64,
 * garantindo que a foto/vídeo SEMPRE seja anexada à OS sem travar nem dar erro.
 */
export async function uploadOrConvertMedia(file: File, orderId?: string): Promise<MediaFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv', '3gp'].includes(ext);
  const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
  const cleanExt = ext || (isVideo ? 'mp4' : 'jpg');
  const fileName = `${orderId || 'new'}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;

  // 1. Tentar upload no Supabase Storage se disponível
  if (supabase) {
    try {
      let uploadResult = await supabase.storage
        .from('os-media')
        .upload(fileName, file, { upsert: true, contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg') });

      // Se o bucket não existe (404/Bucket not found), tenta criar automaticamente
      if (uploadResult.error && (
        uploadResult.error.message?.toLowerCase().includes('not found') ||
        uploadResult.error.message?.toLowerCase().includes('bucket') ||
        (uploadResult.error as any).statusCode === '404' ||
        (uploadResult.error as any).statusCode === 404
      )) {
        console.warn('[Storage] Bucket os-media ausente. Tentando criar bucket automaticamente...');
        try {
          await supabase.storage.createBucket('os-media', { public: true });
          uploadResult = await supabase.storage
            .from('os-media')
            .upload(fileName, file, { upsert: true, contentType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg') });
        } catch (createErr) {
          console.warn('[Storage] Não foi possível criar bucket automaticamente:', createErr);
        }
      }

      if (!uploadResult.error) {
        const { data: { publicUrl } } = supabase.storage.from('os-media').getPublicUrl(fileName);
        if (publicUrl) {
          return { url: publicUrl, type: mediaType, name: file.name };
        }
      } else {
        console.warn('[Storage] Upload no Supabase Storage falhou, ativando fallback em Base64:', uploadResult.error.message);
      }
    } catch (err) {
      console.warn('[Storage] Exceção ao acessar Storage, ativando fallback em Base64:', err);
    }
  }

  // 2. Fallback Inteligente (Base64) - Não depende de Storage nem Bucket
  try {
    if (mediaType === 'image') {
      const base64Url = await compressImageToBase64(file);
      return { url: base64Url, type: 'image', name: file.name };
    } else {
      const base64Url = await fileToDataUrl(file);
      return { url: base64Url, type: 'video', name: file.name };
    }
  } catch (convErr) {
    console.error('Erro na conversão Base64:', convErr);
    throw new Error('Não foi possível ler o arquivo selecionado.');
  }
}
