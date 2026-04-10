
//src/app/(admin)/inventory/[id]/page.tsx
import WoodSlabForm from "../../../../components/WoodSlabForm" 
import { getProductById } from "../../../../actions/woodslab"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

// กำหนด Type ของ params ให้เป็น Promise
type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  // *** จุดที่แก้: ต้อง await params ก่อนดึง id ออกมา ***
  const resolvedParams = await params
  const id = resolvedParams.id
  
  // กรณีสร้างใหม่ (URL เป็น /inventory/new)
  if (id === 'new') {
      return <WoodSlabForm />
  }

  // กรณีแก้ไข: ดึงข้อมูลเก่าจาก Database
  const { data: product, error } = await getProductById(id)

  if (error || !product) {
    // ถ้าหาไม่เจอให้เด้งไปหน้า 404
    return notFound()
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
       <div className="max-w-6xl mx-auto pt-6 px-4">
          <Link href="/inventory" className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600 transition mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> กลับไปหน้าคลังสินค้า
          </Link>
       </div>

       {/* ส่งข้อมูล product เก่าเข้าไปใน form */}
       <WoodSlabForm initialData={product} />
    </div>
  )
}