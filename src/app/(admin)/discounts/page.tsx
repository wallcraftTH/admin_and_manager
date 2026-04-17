import { createClient } from "../../../lib/supabase/server"; // ✅ ดึงกุญแจลับจาก Server
import DiscountClient from "./DiscountUI"; 

export default async function DiscountsPage() {
  const supabase = await createClient();

  // ดึงข้อมูลแบบมิดชิด (Server-side)
  const { data: discounts } = await supabase
    .from('discounts')
    .select('*, discount_rules(*)')
    .order('created_at', { ascending: false });

  // ดึงสินค้าทั้งหมด (วน loop เพราะ Supabase จำกัด 1,000 rows/ครั้ง)
  let allProducts: any[] = [];
  let from = 0;
  while (true) {
    const { data: chunk } = await supabase
      .from('products')
      .select('id, name, sku, image_url')
      .order('sku')
      .range(from, from + 999);
    if (!chunk || chunk.length === 0) break;
    allProducts = allProducts.concat(chunk);
    if (chunk.length < 1000) break;
    from += 1000;
  }
  const products = allProducts;
  const { data: branches } = await supabase.from('branches').select('id, branch_name');

  return (
    <DiscountClient 
      discounts={discounts || []} 
      products={products || []} 
      branches={branches || []} 
    />
  );
}