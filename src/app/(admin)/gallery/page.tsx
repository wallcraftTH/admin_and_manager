import { createClient } from '@/lib/supabase/server'
import CopyButton from './copy-button'
import UploadForm from './upload-form'
import { deleteImage, renameImage } from '@/actions/upload-gallery'

export default async function GalleryPage() {
  const supabase = await createClient()

  const { data: images } = await supabase
    .from('site_gallery')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Media Library
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload • Rename • Copy • Delete
        </p>
      </div>

      <UploadForm />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-5">
        {images?.map(img => (
          <div
            key={img.id}
            className="group relative rounded-2xl overflow-hidden
                       border bg-white shadow-sm
                       hover:shadow-xl transition"
          >
            <img
              src={img.image_url}
              className="aspect-square object-cover
                         group-hover:scale-105 transition duration-300"
            />

            {/* overlay */}
            <div className="
              absolute inset-0
              bg-gradient-to-t from-black/70 via-black/30 to-transparent
              opacity-0 group-hover:opacity-100 transition
              flex flex-col justify-end gap-2 p-3
            ">
              <CopyButton url={img.image_url} />

              <form action={renameImage}>
                <input type="hidden" name="id" value={img.id} />
                <input
                  name="name"
                  defaultValue={img.file_name}
                  className="
                    w-full text-xs px-2 py-1.5 rounded-md
                    bg-white/90 backdrop-blur
                    fo
                    :outline-none focus:ring-2 focus:ring-blue-500
                  "
                />
              </form>

              <form action={deleteImage}>
                <input type="hidden" name="id" value={img.id} />
                <input type="hidden" name="path" value={img.storage_path} />
                <button
                  className="
                    text-xs text-red-300
                    hover:text-red-500
                    self-end
                  "
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
