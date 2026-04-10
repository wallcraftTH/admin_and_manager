"use client"

import { useState, useEffect, useCallback } from "react"
// ✅ ลบ createBrowserClient ออกทั้งหมดเพื่อความปลอดภัย
import { 
  Package, Search, RefreshCcw, ChevronLeft, ChevronRight, 
  Loader2, AlertTriangle, Barcode, Tag, LogOut
} from "lucide-react"
// ✅ เรียกใช้ Server Actions ที่คุณเตรียมไว้
import { getStockList, getStockStats, getInitialProfile, type ProductStock } from "../../../../actions/publicstock"
import { logoutAction } from "../../../../actions/auth" 
import { useRouter } from "next/navigation"

// Helper Formatters
const fmtQty = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 0 })
const fmtDT = (d: string) => new Intl.DateTimeFormat("en-GB", { 
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
}).format(new Date(d))

export default function PublicStockPage() {
  const router = useRouter()
  
  // --- State ---
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [products, setProducts] = useState<ProductStock[]>([])
  
  // Profile & Auth
  const [profile, setProfile] = useState<{ branch_id: number, branch_name: string } | null>(null)
  
  // Pagination & Filter
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(30)
  const [searchQ, setSearchQ] = useState("")
  const [onlyNeg, setOnlyNeg] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({ totalSku: 0, negativeItems: 0 })
  const [lastUpdate, setLastUpdate] = useState("-")

  // --- 1. Init: Load Profile ผ่าน Server Action เท่านั้น ---
  useEffect(() => {
    const init = async () => {
      // ✅ ใช้ getInitialProfile ที่เรียกผ่าน server.ts เพื่อความปลอดภัย
      const res = await getInitialProfile()
      if (!res) {
        router.push("/login")
        return
      }
      setProfile(res)
      setLoading(false)
    }
    init()
  }, [router])

  // --- 2. Load Data Function ---
  const fetchData = useCallback(async () => {
    if (!profile) return
    setDataLoading(true)

    // ✅ เรียกข้อมูลผ่าน Server Actions (getStockList, getStockStats)
    const [listRes, statsRes] = await Promise.all([
      getStockList(profile.branch_id, page, pageSize, searchQ, onlyNeg),
      getStockStats(profile.branch_id)
    ])

    if (listRes.data) {
      setProducts(listRes.data)
      setTotalCount(listRes.total)
    }
    
    setStats(statsRes)
    setLastUpdate("Updated " + new Date().toLocaleTimeString())
    setDataLoading(false)
  }, [profile, page, pageSize, searchQ, onlyNeg])

  // Trigger Fetch
  useEffect(() => {
    if (profile) fetchData()
  }, [fetchData, profile])

  // Auto Refresh Stats every 60s (ใช้ Server Action เช่นกัน)
  useEffect(() => {
    if (!profile) return
    const interval = setInterval(() => {
      getStockStats(profile.branch_id).then(setStats)
      setLastUpdate("Updated " + new Date().toLocaleTimeString())
    }, 60000)
    return () => clearInterval(interval)
  }, [profile])

  // --- Handlers ---
  const handleLogout = async () => {
    // ✅ ใช้ logoutAction ที่เป็น Server Action แทนการเรียก supabase client ตรงๆ
    await logoutAction()
    router.push("/login")
    router.refresh()
  }

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    setSearchQ("")
    setOnlyNeg(false)
    setPage(1)
  }

  const pageAll = Math.max(1, Math.ceil(totalCount / pageSize))

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-slate-400 gap-2 font-sans">
      <Loader2 className="animate-spin" /> กำลังตรวจสอบสิทธิ์ที่ปลอดภัย...
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-600" />
            สต็อกสินค้า (Public Stock)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            สาขา: <span className="font-bold text-slate-700">{profile?.branch_name}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1 border border-emerald-100 bg-emerald-50 transition-all">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-600">Online (Secure)</span>
           </div>

           <button onClick={fetchData} className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white border border-slate-200 rounded-xl shadow-sm">
             <RefreshCcw className={`w-5 h-5 ${dataLoading ? 'animate-spin' : ''}`} />
           </button>
           
           
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <div className="text-blue-100 text-sm font-medium opacity-80 uppercase tracking-widest leading-none mb-1">จำนวนสินค้าทั้งหมด</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{stats.totalSku.toLocaleString()}</span>
              <span className="text-sm font-medium opacity-70 italic">SKUs</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 md:border-l md:border-white/20 md:pl-8">
          <div>
            <div className="text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">สต็อกติดลบ</div>
            <div className="flex items-baseline gap-1.5 text-rose-200">
               <span className="text-xl font-bold">{stats.negativeItems.toLocaleString()}</span>
               <span className="text-[10px] uppercase font-bold">Items</span>
            </div>
          </div>
          <div>
            <div className="text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">อัปเดตล่าสุด</div>
            <div className="text-xs font-bold whitespace-nowrap opacity-90">{lastUpdate}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อสินค้า, SKU หรือ Barcode..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto px-2">
            <label className="relative inline-flex items-center cursor-pointer group">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={onlyNeg}
                onChange={(e) => { setOnlyNeg(e.target.checked); setPage(1); }}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-xs font-bold text-slate-500 uppercase tracking-tight">เฉพาะติดลบ</span>
            </label>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handleReset} className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">
              ล้างค่า
            </button>
            <button onClick={handleSearch} className="flex-1 md:flex-none px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              ค้นหา
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-400 font-black">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">ชื่อสินค้า / สถานะ</th>
                <th className="px-6 py-4">Barcode / SKU</th>
                <th className="px-6 py-4 text-center">หน่วย</th>
                <th className="px-6 py-4 text-right">จำนวนคงเหลือ</th>
                <th className="px-6 py-4 text-right">อัปเดตล่าสุด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dataLoading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                   <tr key={i} className="animate-pulse">
                     <td className="px-6 py-4"><div className="h-4 w-8 bg-slate-100 rounded"></div></td>
                     <td className="px-6 py-4 font-bold text-slate-800 text-sm"><div className="h-4 w-40 bg-slate-100 rounded"></div></td>
                     <td colSpan={4}></td>
                   </tr>
                 ))
              ) : products.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">ไม่พบสินค้าในสต็อก</td>
                 </tr>
              ) : (
                 products.map((r) => {
                   const q = r.qty;
                   let qtyStyle = q < 0 ? "text-rose-600 font-black" : "text-slate-800 font-bold";
                   let statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">In Stock</span>;

                   if (q < 0) {
                     statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase">Negative</span>;
                   } else if (q === 0) {
                     statusBadge = <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 uppercase">Out</span>;
                   }

                   return (
                     <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-6 py-4 font-mono text-xs text-slate-400">#{r.product_id}</td>
                       <td className="px-6 py-4">
                         <div className="font-bold text-slate-800 text-sm">{r.products?.name || "Unknown"}</div>
                         <div className="mt-1.5">{statusBadge}</div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col gap-1 text-xs text-slate-500 font-mono tracking-tighter">
                           <div className="flex items-center gap-1"><Barcode className="w-3 h-3 text-slate-300"/> {r.products?.barcode || "-"}</div>
                           <div className="flex items-center gap-1"><Tag className="w-3 h-3 text-slate-300"/> {r.products?.sku || "-"}</div>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                         <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[10px] font-black uppercase text-slate-500 border border-slate-200">{r.products?.unit || "PCS"}</span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className={`${qtyStyle} text-lg`}>{fmtQty(r.qty)}</div>
                       </td>
                       <td className="px-6 py-4 text-right text-[11px] text-slate-400 font-mono">{fmtDT(r.updated_at)}</td>
                     </tr>
                   )
                 })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            หน้า {page} จาก {pageAll}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setPage(p => Math.min(pageAll, p + 1))} disabled={page >= pageAll} className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

    </div>
  )
}