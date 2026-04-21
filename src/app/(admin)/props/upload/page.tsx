"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function UploadPropPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const itemNo = formData.get("item_no") as string; // จะเอาไปใส่ sku
    const codeSku = formData.get("code_sku") as string; // จะเอาไปใส่ barcode
    
    const specsData = {
      width_cm: formData.get("width_cm"),
      length_cm: formData.get("length_cm"),
      thickness_cm: formData.get("thickness_cm"),
    };

    const { error } = await supabase.from("products").insert({
      name: `Prop - ${itemNo}`, 
      sku: itemNo,      // สลับตามหลานสั่ง: Item NO. -> SKU
      barcode: codeSku, // สลับตามหลานสั่ง: CODE/SKU -> Barcode
      color: formData.get("color"),
      category_id: "prop",
      // รูปดึงจาก barcode (ซึ่งเก็บ CODE/SKU เดิมไว้จ้ะ)
      image_url: `https://pub-258bd10e7e8c4a7690a74c54cfbdef93.r2.dev/props/${codeSku}.png`,
      specs: specsData,
      status: "active"
    });

    if (error) {
        alert("โอ๊ยหลาน! มีปัญหาตอนบันทึก: " + error.message);
    } else {
        alert("บันทึกสินค้า Prop เรียบร้อยแล้วจ้ะหลานรัก!");
        router.push("/props");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-10">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-50">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-black text-gray-900">📥 New Prop Registration</h1>
          <p className="text-gray-400 text-sm mt-2">กรอกข้อมูลเพื่อบันทึกสินค้าประกอบฉากเข้าสต็อก</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Item NO. (จะเป็น SKU)</label>
              <input name="item_no" required placeholder="HPST..." className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">CODE/SKU (จะเป็น Barcode)</label>
              <input name="code_sku" required placeholder="ML-VA-CR-..." className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Color (สีสินค้า)</label>
            <input name="color" placeholder="Pink, Grey, Beige..." className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all" />
          </div>

          <div className="bg-gray-900 rounded-[2rem] p-8 text-white">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-4 text-center tracking-widest">Dimensions (Centimeters)</p>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-blue-400 uppercase text-center block">Width (W)</label>
                <input name="width_cm" type="number" step="0.1" placeholder="0.0" className="w-full p-3 bg-gray-800 border-none rounded-xl outline-none text-center font-bold text-blue-400 focus:ring-1 focus:ring-blue-400" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-green-400 uppercase text-center block">Depth (D)</label>
                <input name="length_cm" type="number" step="0.1" placeholder="0.0" className="w-full p-3 bg-gray-800 border-none rounded-xl outline-none text-center font-bold text-green-400 focus:ring-1 focus:ring-green-400" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-purple-400 uppercase text-center block">Height (H)</label>
                <input name="thickness_cm" type="number" step="0.1" placeholder="0.0" className="w-full p-3 bg-gray-800 border-none rounded-xl outline-none text-center font-bold text-purple-400 focus:ring-1 focus:ring-purple-400" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:bg-gray-300"
          >
            {loading ? "กำลังบันทึกลงฐานข้อมูล..." : "บันทึกข้อมูลสินค้า"}
          </button>
        </form>
      </div>
    </div>
  );
}