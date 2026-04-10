"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
// ❌ ลบ createBrowserClient
import { 
  BarChart3, RefreshCcw, FileText, Store
} from "lucide-react"
// ✅ Import Action
import { getSalesReport, getReportBranches } from "../../../actions/sales_report"

// ... (Interface และ Helper Functions เหมือนเดิม) ...
interface SaleRecord {
  day: string
  branch_id: number
  bills: number
  subtotal: number
  discount: number
  vat_amount: number
  total: number
  cash_total: number
  promptpay_total: number
  note: string | null
  branches?: { branch_name: string }
}

interface GroupedRow extends SaleRecord {
  period: string
  branch_name: string
}

const fmtMoney = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const safeNum = (x: any) => (Number.isFinite(Number(x)) ? Number(x) : 0)
const pad2 = (n: number | string) => String(n).padStart(2, "0")

export default function AdminSalesReportPage() {
  const [loading, setLoading] = useState(true)
  const [rawData, setRawData] = useState<SaleRecord[]>([])
  const [branches, setBranches] = useState<{id: number, branch_name: string}[]>([])
  
  const [mode, setMode] = useState<"day" | "month" | "year">("month")
  const [selYear, setSelYear] = useState<number>(new Date().getFullYear())
  const [selMonth, setSelMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterBranch, setFilterBranch] = useState<string>("ALL")

  // --- 1. Load Branches (Server Action) ---
  useEffect(() => {
    getReportBranches().then(data => setBranches(data))
  }, [])

  // --- 2. Load Data (Server Action) ---
  const loadData = useCallback(async () => {
    setLoading(true)
    
    // ✅ เรียกใช้ Action แทนการยิงตรง
    const { data, error } = await getSalesReport(mode, selYear, selMonth, filterBranch)

    if (error) {
        alert("Error loading report: " + error)
    } else {
        setRawData(data as SaleRecord[])
    }
    
    setLoading(false)
  }, [mode, selYear, selMonth, filterBranch])

  useEffect(() => { loadData() }, [loadData])

  // --- 3. Grouping Logic (Client-Side Calculation) ---
  // ส่วนนี้ใช้ Logic เดิมได้เลย เพราะเป็นการประมวลผล Array ในหน้าจอ User ไม่เกี่ยวกับ Security
  const processedData = useMemo(() => {
    const map = new Map<string, GroupedRow>()
    
    rawData.forEach(r => {
      const timePart = mode === "day" ? r.day : (mode === "month" ? r.day.slice(0, 7) : r.day.slice(0, 4))
      const branchKey = filterBranch === "ALL" ? `b-${r.branch_id}` : "fixed"
      const key = `${timePart}-${branchKey}`
      
      if (!map.has(key)) {
        map.set(key, {
          period: timePart,
          day: r.day,
          branch_id: r.branch_id,
          branch_name: r.branches?.branch_name || "N/A",
          bills: 0, subtotal: 0, discount: 0, vat_amount: 0, 
          total: 0, cash_total: 0, promptpay_total: 0, 
          note: "",
        })
      }

      const cur = map.get(key)!
      cur.bills += safeNum(r.bills)
      cur.subtotal += safeNum(r.subtotal)
      cur.discount += safeNum(r.discount)
      cur.vat_amount += safeNum(r.vat_amount)
      cur.total += safeNum(r.total)
      cur.cash_total += safeNum(r.cash_total)
      cur.promptpay_total += safeNum(r.promptpay_total)
    })

    return Array.from(map.values()).sort((a, b) => b.day.localeCompare(a.day))
  }, [rawData, mode, filterBranch])

  const summary = useMemo(() => {
    return {
      total: processedData.reduce((acc, r) => acc + r.total, 0),
      bills: processedData.reduce((acc, r) => acc + r.bills, 0)
    }
  }, [processedData])

  // --- Render (เหมือนเดิมเป๊ะ) ---
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
       {/* ... (Header, Filters, Cards, Table เหมือนเดิมทุกอย่าง) ... */}
       {/* แค่เปลี่ยนปุ่ม Refresh ให้เรียก loadData ก็พอ ซึ่งทำอยู่แล้ว */}
       
       {/* ตัวอย่าง Header ปุ่ม Refresh */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-7 h-7 text-blue-600" />
                    รายงานยอดขายรวม (ทุกสาขาต้องกดปิดผลัดก่อนถึงจะเห็นยอดขายวันนั้น)
                </h1>
                <p className="text-slate-500 text-sm">ตรวจสอบรายได้แบบปลอดภัย</p>
            </div>
            <button onClick={loadData} className="p-2 text-slate-400 hover:text-blue-600 bg-white border rounded-xl shadow-sm">
                <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>

        {/* ... ส่วนอื่น Copy มาวางได้เลยครับ ... */}
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">เลือกสาขา</label>
                <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <select 
                        value={filterBranch}
                        onChange={(e) => setFilterBranch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                    >
                        <option value="ALL">ทุกสาขา</option>
                        {branches.map(b => <option key={b.id} value={String(b.id)}>{b.branch_name}</option>)}
                    </select>
                </div>
            </div>
            {/* ... ตัวเลือก Mode/Year/Month เหมือนเดิม ... */}
             <div className="flex bg-slate-100 p-1 rounded-xl h-[42px]">
                {["day", "month", "year"].map((m) => (
                    <button
                    key={m}
                    onClick={() => setMode(m as any)}
                    className={`flex-1 px-4 rounded-lg text-xs font-bold transition-all ${mode === m ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
                    >
                    {m === "day" ? "รายวัน" : m === "month" ? "รายเดือน" : "รายปี"}
                    </button>
                ))}
            </div>

            <select 
                value={selYear} 
                onChange={(e) => setSelYear(Number(e.target.value))}
                className="h-[42px] px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
            >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>ปี {y}</option>)}
            </select>

            {mode === "day" && (
                <select 
                    value={selMonth} 
                    onChange={(e) => setSelMonth(Number(e.target.value))}
                    className="h-[42px] px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                >
                    {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>เดือน {pad2(i+1)}</option>
                    ))}
                </select>
            )}
        </div>

        {/* Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">ยอดขายรวมสุทธิ</p>
                    <h2 className="text-4xl font-black mt-1">฿{fmtMoney(summary.total)}</h2>
                </div>
                <BarChart3 className="w-24 h-24 absolute -right-4 -bottom-4 text-white/10" />
            </div>
            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl flex items-center justify-between">
                <div>
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">จำนวนบิลที่เกิดขึ้น</p>
                    <h2 className="text-4xl font-black mt-1">{summary.bills.toLocaleString()} <span className="text-lg opacity-60">Bills</span></h2>
                </div>
                <FileText className="w-12 h-12 text-blue-400/50" />
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ช่วงเวลา</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">สาขา</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">จำนวนบิล</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ยอดรวมสุทธิ</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">เงินสด</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">โอน/QR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {processedData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                                    {loading ? "กำลังวิเคราะห์ข้อมูล..." : "ไม่พบข้อมูลการขายในช่วงเวลานี้"}
                                </td>
                            </tr>
                        ) : (
                            processedData.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                            <span className="text-sm font-bold text-slate-700">{r.period}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                            {r.branch_name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">{r.bills}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-slate-900">{fmtMoney(r.total)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">{fmtMoney(r.cash_total)}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-blue-600 pr-8">{fmtMoney(r.promptpay_total)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    </div>
  )
}