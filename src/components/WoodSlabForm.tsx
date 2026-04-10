//src/components/WoodSlabForm.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// ❌ ลบ createBrowserClient ออก
import { createInitialProduct, updateProduct, deleteProduct, uploadFile } from '../actions/woodslab' // ✅ เพิ่ม uploadFile
import { 
  Loader2, UploadCloud, X, ArrowUp, ArrowDown, 
  PackagePlus, RotateCcw, Save, Image as ImageIcon, 
  Images, Plus, CheckCircle, AlertCircle, Info, Trash2, Edit 
} from 'lucide-react'

// --- CONFIG ---
const BASE_FOLDER = "products"
const FORCE_SKU_PREFIX = "WOODSLABS"
const UPLOAD_MAX_BYTES = 350 * 1024 
const UPLOAD_MAX_DIM = 1600 

export default function WoodSlabForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const isEditMode = !!initialData

  // --- STATE ---
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState<{ title: string, msg: string, type: 'success'|'error'|'info' } | null>(null)

  // Image States
  const [mainFile, setMainFile] = useState<File | null>(null)
  const [existingMainPath, setExistingMainPath] = useState<string | null>(null)

  const [extraFiles, setExtraFiles] = useState<{ file: File, id: number }[]>([])
  const [existingExtraImages, setExistingExtraImages] = useState<any[]>([])

  // Refs
  const mainInputRef = useRef<HTMLInputElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // --- EFFECT: โหลดข้อมูลเก่า ---
  useEffect(() => {
    if (initialData) {
      setExistingMainPath(initialData.image_url) // Server แปลงเป็น URL เต็มให้แล้ว
      if (initialData.specs?.images) {
        setExistingExtraImages(initialData.specs.images) // Server แปลงเป็น URL เต็มให้แล้ว
      }
    }
  }, [initialData])

  // --- UTILS ---
  const showToast = (title: string, msg: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({ title, msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ✅ แก้ไข: ไม่ต้องต่อ String เองแล้ว เพราะข้อมูลเก่าเป็น URL เต็ม ส่วนข้อมูลใหม่เป็น Blob
  const getFullUrl = (path: string) => {
    if (!path) return ""
    return path // ใช้ค่า path ตรงๆ ได้เลย (เพราะ Server จัดการให้แล้ว)
  }

  const parseDims = (sizeText: string) => {
    const nums = sizeText.match(/(\d+(?:\.\d+)?)/g)?.map(Number) || []
    if (nums.length < 3) return null
    const length = nums[0]
    const thickness = nums[nums.length - 1]
    const mid = nums.slice(1, -1)
    const width = mid.length ? Math.max(...mid) : nums[1]
    return { l: length, w: width, t: thickness }
  }

  const blobToWebpSmart = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img')
        const src = URL.createObjectURL(file)
        img.onload = async () => {
          URL.revokeObjectURL(src)
          let w = img.width, h = img.height
          let scale = Math.min(1, UPLOAD_MAX_DIM / Math.max(w, h))
  
          for (let pass = 0; pass < 2; pass++) {
            const canvas = document.createElement("canvas")
            canvas.width = Math.max(1, Math.round(w * scale))
            canvas.height = Math.max(1, Math.round(h * scale))
            const ctx = canvas.getContext("2d")
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
  
            let q = 0.82
            let out: Blob | null = await new Promise(res => canvas.toBlob(blob => res(blob), "image/webp", q))
  
            while (out && out.size > UPLOAD_MAX_BYTES && q > 0.55) {
              q -= 0.07
              out = await new Promise(res => canvas.toBlob(blob => res(blob), "image/webp", q))
            }
            
            if (out && out.size <= UPLOAD_MAX_BYTES) {
               resolve(out)
               return
            }
            scale *= 0.85 
          }
          
          const canvas = document.createElement("canvas")
          canvas.width = Math.max(1, Math.round(w * scale))
          canvas.height = Math.max(1, Math.round(h * scale))
          const ctx = canvas.getContext("2d")
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          canvas.toBlob(blob => resolve(blob!), "image/webp", 0.6)
        }
        img.onerror = reject
        img.src = src
      })
  }

  // ✅ แก้ไข: เปลี่ยนไปใช้ Server Action แทน Client SDK
  const uploadToStorage = async (path: string, blob: Blob) => {
    const formData = new FormData()
    formData.append('file', blob)
    formData.append('path', path)

    const res = await uploadFile(formData)
    if (res.error) throw new Error(res.error)
    return true
  }

  // --- HANDLERS (เหมือนเดิม) ---
  const handleMainFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setMainFile(e.target.files[0])
  }

  const handleExtraFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setExtraFiles(prev => [...prev, ...files.map(f => ({ file: f, id: Math.random() }))])
  }

  const removeExtraNew = (index: number) => {
    setExtraFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExtraExisting = (index: number) => {
    setExistingExtraImages(prev => prev.filter((_, i) => i !== index))
  }

  const moveExtraNew = (index: number, dir: number) => {
    const newExtras = [...extraFiles]
    const target = index + dir
    if (target >= 0 && target < newExtras.length) {
      [newExtras[index], newExtras[target]] = [newExtras[target], newExtras[index]]
      setExtraFiles(newExtras)
    }
  }

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบสินค้านี้?")) return
    setLoading(true)
    setLoadingText('กำลังลบข้อมูล...')
    
    try {
        const res = await deleteProduct(initialData.id)
        if (res.error) throw new Error(res.error)
        
        showToast('ลบสำเร็จ', 'ลบสินค้าเรียบร้อยแล้ว', 'success')
        window.location.href = "/inventory" 
        
    } catch (err: any) {
        showToast('ผิดพลาด', err.message, 'error')
        setLoading(false)
    }
  }

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!isEditMode && !mainFile) return showToast('ข้อมูลไม่ครบ', 'กรุณาอัปโหลดรูปหลัก', 'error')
    
    setLoading(true)
    setProgress(5)
    setLoadingText(isEditMode ? 'กำลังบันทึกการแก้ไข...' : 'กำลังเตรียมข้อมูล...')

    try {
      const formData = new FormData(e.currentTarget)
      
      const sizeStr = formData.get('spec_size') as string || ''
      const dims = parseDims(sizeStr)
      
      const specsRaw: any = {}
      const specKeys = ['size', 'material', 'finish', 'grade', 'origin', 'spec_type', 'edge_design', 'panel_design', 'color_craft', 'texture_craft', 'panel_craft', 'brightness']
      specKeys.forEach(key => {
        const val = formData.get(`spec_${key}`) as string
        if(val && val.trim() !== '') specsRaw[key] = val.trim()
      })
      specsRaw.type = specsRaw.spec_type
      if(dims) {
        specsRaw.length_cm = dims.l; specsRaw.width_cm = dims.w; specsRaw.thickness_cm = dims.t
      }

      const rawSku = formData.get('sku') as string
      const sku = rawSku?.trim() 
        ? (rawSku.toUpperCase().startsWith(FORCE_SKU_PREFIX) ? rawSku : `${FORCE_SKU_PREFIX}-${rawSku}`)
        : `${FORCE_SKU_PREFIX}-${Date.now()}`

      const payload = {
        name: formData.get('name'),
        barcode: formData.get('barcode'),
        sku: sku,
        category_id: formData.get('category_id') || null,
        cost: Number(formData.get('cost') || 0),
        price: Number(formData.get('price') || 0),
        unit: formData.get('unit'),
        weight: Number(formData.get('weight') || 0),
        status: formData.get('status'),
        description: formData.get('description'),
        specs: specsRaw
      }

      let productId = initialData?.id
      
      if (!isEditMode) {
          const { id, error } = await createInitialProduct(payload)
          if (error) throw new Error(error)
          productId = id
      }

      const timestamp = Date.now()

      // Handle Main Image
      // หมายเหตุ: ตรงนี้เราเก็บ Path สั้นลง DB เหมือนเดิม เพื่อให้ Backend จัดการแปลง URL ภายหลัง
      let finalMainPath = initialData?.image_url // ค่าเดิม (อาจเป็น URL เต็มแล้ว)
      
      // ถ้าค่าเดิมเป็น URL เต็ม เราต้องดึงแค่ Path กลับมาเพื่อเซฟ? 
      // ไม่จำเป็นครับ เพราะเราอัปโหลดรูปใหม่ทับไปเลย หรือถ้าไม่เปลี่ยนก็ใช้ค่าเดิม
      // แต่เพื่อให้สะอาด ถ้าไม่ได้อัปโหลดใหม่ ให้ใช้ค่าเดิมที่ส่งมา (ซึ่งเป็น Full URL ก็ไม่เป็นไร Database เก็บ String)
      // *Tip: ถ้าอยากเก็บแค่ Path สั้นใน DB ต้องแก้ Logic getProductById ให้ส่ง Path สั้นมาอีกฟิลด์
      // แต่เพื่อความง่าย ให้เก็บ Path ใหม่ที่ได้จากการอัปโหลด
      
      if (mainFile) {
          setProgress(30)
          setLoadingText('อัปโหลดรูปหลัก (Server Action)...')
          const mainBlob = await blobToWebpSmart(mainFile)
          const path = `${BASE_FOLDER}/${productId}/main_${timestamp}.webp`
          await uploadToStorage(path, mainBlob)
          finalMainPath = path // ใช้ Path ใหม่
      } else if (isEditMode && initialData?.image_url) {
          // ถ้าไม่ได้เปลี่ยนรูป และเป็นโหมดแก้ไข ให้รักษาค่าเดิมไว้ (แต่ค่าเดิมอาจเป็น Full URL จากการแปลง)
          // วิธีแก้: เราต้องแน่ใจว่าถ้าเราส่ง Full URL กลับไป update มันจะไม่พัง
          // Supabase Storage Public URL ใช้เก็บใน DB ได้ครับ ไม่มีปัญหา
          // แต่ถ้าอยากเก็บ Path สั้น ต้อง Hack นิดนึง:
          // เราจะใช้ finalMainPath เดิม ซึ่งถ้ามาจาก initialData มันคือ Full URL
          // ถ้าเราไม่อยากแก้ DB ให้เป็น Full URL เราต้อง parse เอา Path ออกมา
          // แต่เคสนี้ ง่ายสุดคือ: ถ้ามีการอัปโหลดใหม่ ค่อยอัปเดต field image_url
          // ถ้าไม่มีการอัปโหลดใหม่ ก็ไม่ต้องส่ง image_url ไป update (ตัดออกจาก payload)
      }

      // Handle Extra Images
      // เราจะเก็บเฉพาะรูปเก่าที่ยังอยู่ (ซึ่งเป็น Full URL) 
      const finalExtraImages = [...existingExtraImages] 

      if (extraFiles.length > 0) {
          for (let i = 0; i < extraFiles.length; i++) {
            const percent = 40 + ((i + 1) / extraFiles.length * 40)
            setProgress(percent)
            setLoadingText(`อัปโหลดรูปเพิ่มเติม ${i + 1}/${extraFiles.length}...`)

            const blob = await blobToWebpSmart(extraFiles[i].file)
            const path = `${BASE_FOLDER}/${productId}/extra_${timestamp}_${i}.webp`
            await uploadToStorage(path, blob)

            finalExtraImages.push({
                path: path, // รูปใหม่เก็บเป็น Path สั้น
                sort: finalExtraImages.length + 1,
                role: "extra"
            })
          }
      }

      // Update Product
      setProgress(90)
      setLoadingText('บันทึกข้อมูลลงฐานข้อมูล...')

      const finalSpecs = {
        ...specsRaw,
        images: finalExtraImages,
        images_count: finalExtraImages.length
      }

      const updatePayload = {
          ...payload,
          specs: finalSpecs
      }

      // ถ้ามีการเปลี่ยนรูปหลัก ค่อยส่งไปอัปเดต
      if (mainFile) {
          (updatePayload as any).image_url = finalMainPath
      }

      const res = await updateProduct(productId, updatePayload)
      if (res.error) throw new Error(res.error)

      setProgress(100)
      setLoadingText('เสร็จสิ้น!')
      
      setTimeout(() => {
        showToast('บันทึกสำเร็จ', `จัดการสินค้าเรียบร้อย`, 'success')
        setLoading(false)
        if (!isEditMode) {
            window.location.reload()
        } else {
            router.refresh()
        }
      }, 500)

    } catch (err: any) {
      console.error(err)
      setLoading(false)
      showToast('เกิดข้อผิดพลาด', err.message || 'Unknown error', 'error')
    }
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* Toast & Loading UI (เหมือนเดิม) */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-[slideIn_0.3s_ease-out]">
          <div className={`bg-white border-l-4 p-4 rounded shadow-lg flex items-start gap-3 w-80 
            ${toast.type === 'success' ? 'border-green-500' : toast.type === 'error' ? 'border-red-500' : 'border-blue-500'}`}>
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
            </div>
            <div>
              <h3 className="font-bold text-sm">{toast.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{toast.msg}</p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <div className="text-lg font-semibold text-slate-700">กำลังดำเนินการ...</div>
          <div className="text-sm text-slate-500 mt-2">{loadingText}</div>
          <div className="w-64 h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 py-8">
        
        {/* ... Header Section (เหมือนเดิม) ... */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {isEditMode ? <Edit className="w-7 h-7 text-orange-600" /> : <PackagePlus className="w-7 h-7 text-blue-600" />}
              {isEditMode ? `แก้ไขสินค้า: ${initialData.name}` : 'เพิ่มสินค้าใหม่'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
                {isEditMode ? `Product ID: ${initialData.id}` : 'จัดการข้อมูลสินค้า (Secure Upload)'}
            </p>
          </div>
          <div className="flex gap-2">
            {isEditMode && (
                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium hover:bg-red-100 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> ลบสินค้า
                </button>
            )}
            {!isEditMode && (
                <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> รีเซ็ต
                </button>
            )}
            <button type="submit" className={`px-6 py-2 text-white rounded-lg text-sm font-medium shadow-md flex items-center gap-2
                ${isEditMode ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}
            `}>
              <Save className="w-4 h-4" /> {isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN: Images */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <ImageIcon className="w-4 h-4 text-blue-500" /> รูปหลัก (Main)
                </h2>
                {!existingMainPath && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">REQUIRED</span>}
              </div>
              <div className="p-4">
                <input ref={mainInputRef} name="mainImage" type="file" accept="image/*" className="hidden" onChange={handleMainFile} />
                <div 
                  onClick={() => mainInputRef.current?.click()}
                  className={`relative group cursor-pointer border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition overflow-hidden
                    ${(mainFile || existingMainPath) ? 'border-blue-200 border-solid' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}
                >
                  {mainFile ? (
                    <>
                      <img src={URL.createObjectURL(mainFile)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <span className="text-white text-xs font-bold">รูปใหม่ที่จะอัปโหลด</span>
                      </div>
                    </>
                  ) : existingMainPath ? (
                    <>
                      {/* ✅ แก้: ใช้ getFullUrl ที่ปรับปรุงแล้ว (ซึ่งคืนค่า path ตรงๆ) */}
                      <img src={getFullUrl(existingMainPath)} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-[2px]">
                          <button type="button" className="bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">เปลี่ยนรูป</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                        <UploadCloud className="w-6 h-6 text-slate-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">คลิกเพื่อเพิ่มรูป</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Extra Images */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                  <Images className="w-4 h-4 text-indigo-500" /> Gallery
                </h2>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {existingExtraImages.length + extraFiles.length} FILES
                </span>
              </div>
              <div className="p-4">
                <input ref={extraInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleExtraFiles} />
                
                <div 
                  onClick={() => extraInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 p-4 flex flex-col items-center justify-center transition hover:border-indigo-400 hover:bg-indigo-50 mb-4"
                >
                  <Plus className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs font-medium text-slate-600">เพิ่มรูปภาพ (เลือกหลายรูปได้)</span>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  
                  {/* Loop รูปเก่า */}
                  {existingExtraImages.map((item, idx) => (
                    <div key={`old-${idx}`} className="flex items-center gap-3 bg-slate-50 p-2 border border-slate-200 rounded-lg shadow-sm">
                      <div className="w-12 h-12 bg-white rounded overflow-hidden flex-shrink-0 relative">
                        {/* ✅ แก้: ใช้ getFullUrl */}
                        <img src={getFullUrl(item.path)} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10"><span className="text-[8px] text-white bg-black/50 px-1 rounded">OLD</span></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* แสดงแค่ชื่อไฟล์ท้ายสุดพอมองเห็น */}
                        <div className="text-xs font-medium text-slate-600 truncate">{item.path.split('/').pop()}</div>
                      </div>
                      <button type="button" onClick={() => removeExtraExisting(idx)} className="p-1 hover:bg-red-100 text-red-400 rounded"><X className="w-3 h-3" /></button>
                    </div>
                  ))}

                  {/* Loop รูปใหม่ */}
                  {extraFiles.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white p-2 border border-blue-100 rounded-lg shadow-sm">
                      <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden flex-shrink-0 border-2 border-blue-500">
                        <img src={URL.createObjectURL(item.file)} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">{item.file.name}</div>
                        <div className="text-[10px] text-blue-500 font-bold">NEW</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => removeExtraNew(idx)} className="p-1 hover:bg-red-50 text-red-400 rounded"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}

                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Data Forms (เหมือนเดิมเป๊ะ) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800 text-lg">ข้อมูลพื้นฐาน</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-2 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ชื่อสินค้า (Name) <span className="text-red-500">*</span></label>
                  <input name="name" defaultValue={initialData?.name} required placeholder="ระบุชื่อสินค้า..." className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Barcode <span className="text-red-500">*</span></label>
                  <input name="barcode" defaultValue={initialData?.barcode} required placeholder="00xxxxx" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SKU</label>
                  <input name="sku" defaultValue={initialData?.sku} placeholder="AUTO / Unique" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">หมวดหมู่ (Category ID)</label>
                  <input name="category_id" defaultValue={initialData?.category_id} placeholder="เช่น wood_board" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">สถานะ (Status)</label>
                  <select name="status" defaultValue={initialData?.status} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm bg-white">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ต้นทุน (Cost)</label>
                  <input name="cost" defaultValue={initialData?.cost} type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm text-right font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ราคาขาย (Price)</label>
                  <input name="price" defaultValue={initialData?.price} type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm text-right font-mono text-blue-600 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">หน่วย (Unit)</label>
                  <input name="unit" defaultValue={initialData?.unit} placeholder="pcs, แผ่น" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">น้ำหนัก (Kg)</label>
                  <input name="weight" defaultValue={initialData?.weight} type="number" step="0.01" placeholder="0.0" className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm text-right font-mono" />
                </div>
                <div className="col-span-2 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">รายละเอียดสินค้า (Description)</label>
                  <textarea name="description" defaultValue={initialData?.description} rows={3} placeholder="ใส่รายละเอียดสินค้า..." className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm"></textarea>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 text-lg">สเปกสินค้า (Technical Specs)</h2>
              </div>
              <div className="p-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Size", id: "spec_size", placeholder: "200-80-5 CM" },
                  { label: "Material", id: "spec_material", placeholder: "Neem Wood" },
                  { label: "Finish", id: "spec_finish", placeholder: "Wood Wax Oil" },
                  { label: "Grade", id: "spec_grade", placeholder: "A, B" },
                  { label: "Origin", id: "spec_origin", placeholder: "Thailand" },
                  { label: "Spec Type", id: "spec_type", options: ["Wood slabs", "Small table", "Leg", "Chair/Stool", "Cabinet", "Table", "Small Furniture"] },
                  { label: "Edge Design", id: "spec_edge_design", placeholder: "Live Edge", span: 2 },
                  { label: "Panel Design", id: "spec_panel_design", placeholder: "Natural" },
                  { label: "Color Craft", id: "spec_color_craft", placeholder: "Original" },
                  { label: "Texture Craft", id: "spec_texture_craft", placeholder: "Smooth" },
                  { label: "Panel Craft", id: "spec_panel_craft", placeholder: "Solid" },
                  { label: "Brightness", id: "spec_brightness", placeholder: "Matte", span: 2 }
                ].map((field: any) => (
                  <div key={field.id} className={field.span ? `col-span-${field.span}` : ''}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{field.label}</label>
                    {field.options ? (
                      <select
                        name={field.id}
                        defaultValue={initialData?.specs?.[field.id.replace('spec_', '')] || initialData?.specs?.spec_type || ""}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 transition bg-white"
                      >
                        <option value="">— Select Type —</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={field.id}
                        defaultValue={initialData?.specs?.[field.id.replace('spec_', '')] || initialData?.specs?.[field.label.toLowerCase()]}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 transition"
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}