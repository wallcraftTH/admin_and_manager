"use server"

import { createClient } from "../lib/supabase/server" 

// --- Types ---
export interface SaleItem {
  id: number
  product_name: string
  barcode: string | null
  qty: number
  unit_price: number
  line_discount: number
  line_total: number
}

export interface SaleRecord {
  id: number
  receipt_no: string | null
  sold_at: string
  total: number
  subtotal: number
  discount: number
  vat_amount: number
  payment_method: string
  paid_amount: number
  change_amount: number
  status: string
  note: string | null
  branch_id: number
  cashier_name?: string | null
  branches?: { branch_name: string }
  sale_items?: SaleItem[]
}

// --- Helper: Check Auth ---
async function checkAuth(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error("Unauthorized: กรุณาเข้าสู่ระบบ")
  }
  return user
}

// ✅ [เพิ่มใหม่] ฟังก์ชันดึง Profile + Role (ใช้ร่วมกันทั้ง Admin/Manager)
export async function getUserProfile() {
  const supabase = await createClient()
  try {
    const user = await checkAuth(supabase)

    const { data: pf, error } = await supabase
      .from("profiles")
      .select("branch_id, full_name, role, branches(branch_name)")
      .eq("user_id", user.id)
      .single()

    if (error) throw new Error(error.message)

    return { 
      user: { id: user.id, email: user.email }, 
      profile: {
        branch_id: pf.branch_id || 1,
        // @ts-ignore
        branch_name: pf.branches?.branch_name || "Unknown Branch",
        full_name: pf.full_name || user.email,
        role: pf.role 
      }, 
      error: null 
    }
  } catch (err: any) {
    return { user: null, profile: null, error: err.message }
  }
}

// 1. ดึงข้อมูลใบเสร็จ (Smart Logic: รองรับทั้ง Admin และ Manager)
export async function getReceipts(
  page: number = 1,
  pageSize: number = 15,
  filters: {
    search?: string
    date?: string
    payment?: string
    branch?: string // Admin ส่ง "ALL" หรือ ID ได้, Manager จะถูก Override
  }
) {
  const supabase = await createClient()
  
  try {
    const user = await checkAuth(supabase)

    // ตรวจสอบ Role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, branch_id")
      .eq("user_id", user.id)
      .single()

    // ✨ Security Logic: บังคับสาขาตามสิทธิ์
    let targetBranchId = filters.branch

    if (profile?.role === 'manager' || profile?.role === 'staff') {
        // ถ้าเป็น Manager/Staff บังคับดูได้แค่สาขาตัวเองเท่านั้น
        targetBranchId = String(profile.branch_id)
    }

    // คำนวณ Pagination
    const fromIdx = (page - 1) * pageSize
    const toIdx = fromIdx + pageSize - 1

    let query = supabase
        .from("sales")
        .select(`
        *,
        branches ( branch_name )
        `, { count: "exact" })
        .order("sold_at", { ascending: false })
        .range(fromIdx, toIdx)

    // Apply Filters
    if (targetBranchId && targetBranchId !== "ALL") {
        query = query.eq("branch_id", Number(targetBranchId))
    }
    if (filters.search) {
        query = query.ilike("receipt_no", `%${filters.search}%`)
    }
    if (filters.payment && filters.payment !== "ALL") {
        query = query.eq("payment_method", filters.payment)
    }
    if (filters.date) {
        query = query.gte("sold_at", `${filters.date}T00:00:00`)
                     .lte("sold_at", `${filters.date}T23:59:59.999`)
    }

    const { data, count, error } = await query

    if (error) throw new Error(error.message)

    return { data: data as SaleRecord[], count: count || 0, error: null }

  } catch (err: any) {
    console.error("Fetch Receipts Error:", err.message)
    return { data: [], count: 0, error: err.message }
  }
}

// 2. ดึงรายละเอียดรายการสินค้าในบิล (Sale Items)
export async function getSaleItems(saleId: number) {
  const supabase = await createClient()
  
  try {
    await checkAuth(supabase)

    const { data, error } = await supabase
        .from("sale_items")
        .select("*")
        .eq("sale_id", saleId)
        .order("id")

    if (error) throw new Error(error.message)
    return { data: data as SaleItem[], error: null }

  } catch (err: any) {
    return { data: [], error: err.message }
  }
}

// 3. ดึงสาขา (สำหรับ Dropdown ใน Admin)
export async function getBranches() {
    const supabase = await createClient()
    try {
        await checkAuth(supabase)
        const { data } = await supabase.from("branches").select("id, branch_name").order("id")
        return data || []
    } catch (err) {
        return []
    }
}