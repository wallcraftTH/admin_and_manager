// src/app/(admin)/inventory/page.tsx
import Link from "next/link"
import { getProducts } from "../../../actions/woodslab"
import InventoryActions from "../../../components/InventoryActions"
import InventoryTable from "../../../components/InventoryTable"
import TypeFilterDropdown from "../../../components/TypeFilterDropdown"
import { Package, Layers, Hammer, FileUp } from "lucide-react"

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function InventoryPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const activeTab = (resolvedSearchParams.tab as string) || 'SLABS'
  const activeType = (resolvedSearchParams.type as string) || ''

  const dbCategory = activeTab === 'SLABS' ? 'SLABS' : 'rough_wood'
  const { data: products, error } = await getProducts(dbCategory, activeType || undefined)

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-blue-600" />
              คลังสินค้า (Inventory)
            </h1>
            <p className="text-slate-500 text-sm mt-1 ml-10">
              จัดการรายการสินค้าทั้งหมดในระบบ
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href="/inventory/import"
              className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-bold hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <FileUp className="w-4 h-4" />
              นำเข้า Excel
            </Link>
            <InventoryActions />
          </div>
        </div>

        {/* Main Category Tabs */}
        <div className="mb-0 border-b border-slate-200">
          <div className="flex gap-6">
            <Link
              href="/inventory?tab=SLABS"
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors
                ${activeTab === 'SLABS'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Layers className="w-4 h-4" /> Wood Slabs (แผ่นไม้)
            </Link>
            <Link
              href="/inventory?tab=ROUGH"
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors
                ${activeTab === 'ROUGH'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Hammer className="w-4 h-4" /> Rough Wood (ไม้ดิบ)
            </Link>
          </div>
        </div>

        {/* Sub-type dropdown — แสดงเฉพาะ SLABS */}
        {activeTab === 'SLABS' && (
          <div className="flex items-center gap-3 py-3 px-1 bg-white border-b border-slate-200 mb-6">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">กรองตามประเภท</span>
            <TypeFilterDropdown activeType={activeType} />
          </div>
        )}

        {activeTab !== 'SLABS' && <div className="mb-6" />}

        {/* Content */}
        {error ? (
          <div className="p-8 text-center text-red-500 bg-white rounded-xl border border-red-100 shadow-sm">
            <div className="flex flex-col items-center gap-2">
              <Package className="w-12 h-12 text-red-200" />
              <p className="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
              <p className="text-sm opacity-70">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <InventoryTable products={products || []} activeTab={activeTab} />
          </div>
        )}

      </div>
    </div>
  )
}
