"use server"; // คำสั่งศักดิ์สิทธิ์ บอก Next.js ว่านี่คือฝั่ง Server นะ!

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// เชื่อมต่อ Supabase ฝั่ง Server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function addProp(formData: FormData) {
  try {
    // 1. ดึงข้อมูลจาก Form ที่หลานส่งมา
    const itemNo = formData.get("item_no") as string;
    const codeSku = formData.get("code_sku") as string;
    const color = formData.get("color") as string;
    
    // ดึงค่า W, D, H
    const width_cm = formData.get("width_cm");
    const length_cm = formData.get("length_cm");
    const thickness_cm = formData.get("thickness_cm");

    // 2. จัดระเบียบ JSONB
    const specsData = {
      width_cm: width_cm ? Number(width_cm) : null,
      length_cm: length_cm ? Number(length_cm) : null,
      thickness_cm: thickness_cm ? Number(thickness_cm) : null,
    };

    // 3. ยิงเข้า Database
    const { data, error } = await supabase.from("products").insert({
      name: `Prop - ${itemNo}`,
      sku: itemNo,      // Item NO. -> SKU
      barcode: codeSku, // CODE/SKU -> Barcode
      color: color,
      category_id: "prop",
      image_url: `https://pub-258bd10e7e8c4a7690a74c54cfbdef93.r2.dev/props/${codeSku}.png`,
      specs: specsData,
      status: "active",
    });

    if (error) {
      throw new Error(error.message);
    }

    // 4. สั่งให้ Next.js รีเฟรชข้อมูลหน้า /props ทันที จะได้เห็นของใหม่เลย
    revalidatePath("/props");
    
    return { success: true };

  } catch (error: any) {
    // ถ้าพัง ให้เด้ง Error กลับไปหาหน้า Client ที่หลานเขียน try-catch ไว้
    throw new Error(error.message || "เกิดข้อผิดพลาดในการบันทึก");
  }
}