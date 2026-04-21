"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function PropsListPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProps();
  }, []);

  async function fetchProps() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", "prop")
      .order("created_at", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  }

  return (
    <div className="p-6 bg-[#fafafa] min-h-screen font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🖼️ Props Inventory</h1>
          <p className="text-gray-500 text-sm">จัดการรายการสินค้าประกอบฉากทั้งหมด</p>
        </div>
        <Link href="/props/upload" className="bg-black text-white px-8 py-3 rounded-2xl hover:bg-gray-800 transition shadow-lg font-medium">
          + Add New Prop
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400 animate-pulse">กำลังดึงข้อมูลให้พ่อยอดชาย...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((item) => (
            <div key={item.id} className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 group">
              <div className="aspect-[4/5] relative overflow-hidden bg-[#f3f3f3] m-2 rounded-[1.5rem]">
                <img 
                  src={item.image_url || "/placeholder.png"} 
                  alt={item.name}
                  className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-700 p-4"
                />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold uppercase">{item.color || 'N/A'}</span>
                  <span className="text-[10px] font-mono text-gray-400">ID: {item.id}</span>
                </div>
                <h3 className="text-sm font-bold text-gray-800 mb-4 line-clamp-1">{item.name}</h3>
                
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Item NO (SKU):</span>
                    <span className="text-gray-700 font-bold">{item.sku}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">CODE (Barcode):</span>
                    <span className="text-gray-700 font-medium">{item.barcode}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div className="bg-blue-50 py-2 rounded-xl">
                    <p className="text-[9px] text-blue-400 uppercase font-bold">W</p>
                    <p className="text-xs font-bold text-blue-700">{item.width_cm || '-'}</p>
                  </div>
                  <div className="bg-green-50 py-2 rounded-xl">
                    <p className="text-[9px] text-green-400 uppercase font-bold">D</p>
                    <p className="text-xs font-bold text-green-700">{item.length_cm || '-'}</p>
                  </div>
                  <div className="bg-purple-50 py-2 rounded-xl">
                    <p className="text-[9px] text-purple-400 uppercase font-bold">H</p>
                    <p className="text-xs font-bold text-purple-700">{item.thickness_cm || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}