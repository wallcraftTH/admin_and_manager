"use client"

import { useState } from "react"
import Link from "next/link"
import { Edit, Package, AlertCircle } from "lucide-react"
import RoughWoodForm from "./RoughWoodForm"
import CategoryBadge from "./CategoryBadge"

interface InventoryTableProps {
  products: any[]
  activeTab: string
}

export default function InventoryTable({ products, activeTab }: InventoryTableProps) {
  // State สำหรับ Modal Edit
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [isRoughModalOpen, setIsRoughModalOpen] = useState(false)

  // ฟังก์ชันกดปุ่มแก้ไข
  const handleEdit = (product: any) => {
    if (product.category_id === 'rough_wood') {
      // 1. ถ้าเป็น Rough Wood ให้เปิด Modal
      setEditingProduct(product)
      setIsRoughModalOpen(true)
    } else {
      // 2. ถ้าเป็น Slab ให้ไปหน้า Edit ปกติ (Redirect)
      // (ใช้ Link ใน JSX แทน เพื่อความเร็ว)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount)
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <th className="p-4 w-[100px]">รูปภาพ</th>
                <th className="p-4">ชื่อสินค้า / SKU</th>
                <th className="p-4">หมวดหมู่</th>
                <th className="p-4">ราคา</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!products || products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="font-medium">ไม่พบสินค้าในหมวดหมู่นี้</p>
                      </div>
                  </td>
                </tr>
              ) : (
                products.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden relative group-hover:border-blue-200 transition-colors">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-6 h-6" /></div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-800 text-sm mb-1">{item.name}</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.sku}</span>
                        {item.category_id === 'rough_wood' && item.specs?.size_raw && (
                          <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 font-mono">{item.specs.size_raw}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <CategoryBadge product={item} />
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-700 text-sm">{formatCurrency(item.price)}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>
                        {item.status || 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {/* ✅ จุดสำคัญ: ถ้าเป็น Slab ใช้ Link, ถ้าเป็น Rough ใช้ Button */}
                      {item.category_id === 'SLABS' ? (
                         <Link 
                           href={`/inventory/${item.id}`} 
                           className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-blue-600 hover:text-white transition shadow-sm"
                         >
                           <Edit className="w-4 h-4" /> <span className="hidden sm:inline">แก้ไข</span>
                         </Link>
                      ) : (
                         <button
                           onClick={() => handleEdit(item)}
                           className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-orange-600 hover:text-white transition shadow-sm"
                         >
                           <Edit className="w-4 h-4" /> <span className="hidden sm:inline">แก้ไข</span>
                         </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Modal Edit สำหรับ Rough Wood */}
      <RoughWoodForm 
        isOpen={isRoughModalOpen} 
        onClose={() => {
            setIsRoughModalOpen(false)
            setEditingProduct(null) // Clear data เมื่อปิด
        }}
        initialData={editingProduct} // ส่งข้อมูลสินค้าไปให้ Modal
        onSuccess={() => window.location.reload()}
      />
    </>
  )
}