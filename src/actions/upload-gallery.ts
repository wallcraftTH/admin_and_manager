'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/* =======================
   UPLOAD IMAGE
======================= */
export async function uploadGalleryImage(
  prevState: any,
  formData: FormData
) {
  const supabase = await createClient()

  const file = formData.get('file') as File | null
  const customName = (formData.get('customName') as string) || ''
  const category = 'general'

  if (!file || file.size === 0) {
    return { message: '❌ กรุณาเลือกไฟล์รูปภาพ' }
  }

  const fileExt =
    file.type === 'image/webp'
      ? 'webp'
      : file.name.split('.').pop()?.toLowerCase() || 'jpg'

  const baseName = customName
    ? customName.trim()
    : file.name.replace(/\.[^/.]+$/, '')

  const safeName = baseName
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()

  const fileName = `${safeName}-${Date.now()}.${fileExt}`
  const filePath = `${category}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(filePath, file, {
      contentType: 'image/webp',
      upsert: false,
    })

  if (uploadError) {
    return { message: `❌ Upload failed: ${uploadError.message}` }
  }

  const { data } = supabase
    .storage
    .from('site-assets')
    .getPublicUrl(filePath)

  await supabase.from('site_gallery').insert({
    file_name: fileName,
    image_url: data.publicUrl,
    storage_path: filePath,
    category,
    file_size: file.size,
  })

  revalidatePath('/gallery')
  return { message: '✅ Upload สำเร็จ' }
}

/* =======================
   DELETE IMAGE
======================= */
export async function deleteImage(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const path = formData.get('path') as string
  if (!id || !path) return

  await supabase.storage.from('site-assets').remove([path])
  await supabase.from('site_gallery').delete().eq('id', id)

  revalidatePath('/gallery')
}

/* =======================
   RENAME IMAGE
======================= */
export async function renameImage(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!id || !name) return

  await supabase
    .from('site_gallery')
    .update({ file_name: name })
    .eq('id', id)

  revalidatePath('/gallery')
}
