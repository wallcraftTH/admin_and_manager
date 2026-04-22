// src/components/BulkUploadProducts.tsx
"use client"

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { bulkCreateProducts } from '../actions/woodslab'
import { 
  FileUp, CheckCircle, AlertCircle, Loader2, 
  Table as TableIcon, Trash2, Save, X, Layers, Hammer, Info 
} from 'lucide-react'

const SLAB_TYPES = [
  "Wood slabs",
  "Small table",
  "Leg",
  "Chair/Stool",
  "Cabinet",
  "Table",
  "Small Furniture",
]

// null = ยังไม่เลือก, "" = Rough Wood, อื่น = spec_type ของ SLABS
type SelectedType = string | null

export default function BulkUploadProducts() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null)

  const [defaultCategory, setDefaultCategory] = useState<'SLABS' | 'rough_wood' | 'prop'>('SLABS')
  const [selectedType, setSelectedType] = useState<SelectedType>(null)

  const handleSelectType = (type: SelectedType) => {
    setSelectedType(type)
    if (type === 'rough_wood') setDefaultCategory('rough_wood')
    else if (type === 'prop') setDefaultCategory('prop')
    else setDefaultCategory('SLABS')
  }

  // --- 1. ฟังก์ชันแกะตัวเลขจาก Size String ---
  const parseDims = (sizeText: string) => {
    const nums = sizeText.match(/(\d+(?:\.\d+)?)/g)?.map(Number) || []
    if (nums.length < 3) return null
    return { l: nums[0], w: nums.length > 3 ? Math.max(...nums.slice(1, -1)) : nums[1], t: nums[nums.length - 1] }
  }

  // --- 2. ฟังก์ชันดาวน์โหลด Template ---
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    if (selectedType === 'prop') {
      const propTemplate = [{
        "Item NO.": "HPST3584P",
        "ชื่อโรงงาน": "Merlin",
        "Group Sisz": "L",
        "Link Picture": "https://pub-258bd10e7e8c4a7690a74c54cfbdef93.r2.dev/props/ML-VA-CR-HPST3584P.png",
        "Product Group": "ML-PP-DECOR000001",
        "Description": "",
        "Product Sub": "Vase",
        "Material": "Ceramic",
        "Color": "Pink",
        "CODE/SKU": "ML-VA-CR-HPST3584P",
        "W": 7.1,
        "D": 5.5,
        "H": 28,
        "Stock": 1,
      }];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(propTemplate), "Props Template");
      XLSX.writeFile(wb, "props_import_template.xlsx");
    } else {
      const templateHeader = [{
        Barcode: "BX001",
        sku: "WOODSLABS-001",
        name: "ไม้แผ่นตัวอย่าง",
        category_id: "SLABS",
        color: "Natural",
        unit: "แผ่น",
        description: "ไม้เนื้อแข็งลายสวยงาม เหมาะสำหรับทำโต๊ะ...",
        cost: 0,
        price: 5000,
        status: "active",
        image_url: "https://.../main.webp",
        size: "200-80-5 CM",
        width: 80,
        length: 200,
        thickness: 5,
        weight: 25,
        material: "Beech Wood",
        finish: "Wood Wax Oil",
        grade: "A",
        spec_type: "Wood slabs",
        panel_design: "Natural",
        edge_design: "Live Edge",
        color_craft: "Original",
        panel_craft: "Solid",
        images_1: "https://.../extra1.webp",
        images_2: "https://.../extra2.webp",
        images_3: ""
      }];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(templateHeader), "Template");
      XLSX.writeFile(wb, "product_import_template.xlsx");
    }
  };

  // --- 3. ฟังก์ชันจัดการไฟล์อัปโหลด ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const rawJson = XLSX.utils.sheet_to_json(ws)
      
      const processed = rawJson.map((row: any, idx: number) => {
        // --- Props mode ---
        if (selectedType === 'prop') {
          const itemNo = row["Item NO."]?.toString() || row["item_no"]?.toString() || `PROP-${Date.now()}-${idx}`
          const codeSku = row["CODE/SKU"]?.toString() || row["code_sku"]?.toString() || ""
          const w = row["W"] != null ? Number(row["W"]) : null
          const d = row["D"] != null ? Number(row["D"]) : null
          const h = row["H"] != null ? Number(row["H"]) : null

          return {
            name: `Prop - ${itemNo}`,
            sku: itemNo,
            barcode: codeSku,
            color: row["Color"]?.toString() || row["color"]?.toString() || null,
            category_id: "prop",
            image_url: row["Link Picture"]?.toString() || row["image_url"]?.toString() ||
              (codeSku ? `https://pub-258bd10e7e8c4a7690a74c54cfbdef93.r2.dev/props/${codeSku}.png` : null),
            status: "active",
            cost: 0,
            price: 0,
            weight: 0,
            unit: "ชิ้น",
            description: row["Description"]?.toString() || null,
            specs: {
              width_cm: w,
              length_cm: d,
              thickness_cm: h,
              brand: row["ชื่อโรงงาน"]?.toString() || null,
              group_size: row["Group Sisz"]?.toString() || row["Group Size"]?.toString() || null,
              product_group: row["Product Group"]?.toString() || null,
              product_sub: row["Product Sub"]?.toString() || null,
              material: row["Material"]?.toString() || null,
              stock: row["Stock"] != null ? Number(row["Stock"]) : null,
            }
          }
        }

        // --- SLABS / Rough Wood mode ---
        const resolvedSpecType = row.spec_type || (selectedType !== 'rough_wood' ? selectedType : undefined) || undefined
        const specs: any = {
          material: row.material,
          finish: row.finish,
          grade: row.grade,
          spec_type: resolvedSpecType,
          type: resolvedSpecType,
          panel_design: row.panel_design,
          edge_design: row.edge_design,
          color_craft: row.color_craft,
          panel_craft: row.panel_craft,
        }

        if (row.size) {
          const dims = parseDims(row.size.toString())
          if (dims) {
            specs.size = row.size;
            specs.length_cm = dims.l;
            specs.width_cm = dims.w;
            specs.thickness_cm = dims.t;
          }
        } else if (row.length && row.width && row.thickness) {
          specs.size = `${row.length}-${row.width}-${row.thickness} MM`;
          specs.length_cm = Number(row.length);
          specs.width_cm = Number(row.width);
          specs.thickness_cm = Number(row.thickness);
        }

        const extraImages: any[] = []
        Object.keys(row).forEach(key => {
          if (key.startsWith('images_') && row[key]) {
            extraImages.push({ path: row[key], role: "extra", sort: parseInt(key.split('_')[1] || "1") })
          }
        })
        specs.images = extraImages
        specs.images_count = extraImages.length

        let finalCategory = defaultCategory;
        if (row.category_id) {
          finalCategory = row.category_id;
        } else if (row.sku?.toString().toUpperCase().startsWith('ROUGH')) {
          finalCategory = 'rough_wood';
        }

        return {
          name: row.name || "Untitled Product",
          barcode: row.Barcode?.toString() || row.barcode?.toString(),
          sku: row.sku?.toString() || `WOODSLABS-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          image_url: row.image_url,
          status: row.status || 'active',
          cost: Number(row.cost?.toString().replace(/[^0-9.]/g, '') || 0),
          price: Number(row.price?.toString().replace(/[^0-9.]/g, '') || 0),
          weight: Number(row.weight || 0),
          specs: specs,
          category_id: finalCategory,
          color: row.color?.toString() || null,
          unit: row.unit?.toString() || 'แผ่น',
          description: row.description?.toString() || null
        }
      })

      // กรองข้อมูลที่ SKU ซ้ำกันในไฟล์ออก (เอาแถวล่าสุดไว้)
      const skuCount = new Map<string, number>()
      processed.forEach(item => skuCount.set(item.sku, (skuCount.get(item.sku) || 0) + 1))
      const dupSkus = Array.from(skuCount.entries()).filter(([, c]) => c > 1).map(([sku]) => sku)

      const uniqueData = Array.from(
        new Map(processed.map((item) => [item.sku, item])).values()
      );

      if (dupSkus.length > 0) {
        setStatus({
          type: 'info',
          msg: `พบ SKU ซ้ำ ${dupSkus.length} รายการ (ระบบเก็บแถวล่าสุดไว้): ${dupSkus.join(', ')}`
        })
      }

      setData(uniqueData)
    }
    reader.readAsBinaryString(file)
  }

  // --- 4. ส่งข้อมูลไปเซฟ ---
  const handleSaveAll = async () => {
    if (data.length === 0) return
    setLoading(true)
    const res = await bulkCreateProducts(data)
    setLoading(false)

    if (res.error) {
      setStatus({ type: 'error', msg: res.error })
    } else {
      setStatus({ type: 'success', msg: `นำเข้าและอัปเดตข้อมูลสำเร็จ ${res.count} รายการ!` })
      setData([]) // เคลียร์ตาราง
    }
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileUp className="text-blue-600" /> นำเข้าข้อมูลสินค้า (Bulk Upload)
          </h2>
          <p className="text-slate-500 text-xs mt-1">อัปโหลดไฟล์ Excel เพื่อเพิ่มหรืออัปเดตสินค้าทีละหลายรายการ (อิงตาม SKU)</p>
        </div>
        
        <div className="flex gap-2">
          {/* ปุ่มโหลด Template */}
          <button 
            type="button"
            onClick={downloadTemplate}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            <TableIcon className="w-4 h-4" /> ดาวน์โหลดไฟล์ตัวอย่าง
          </button>
          
          {data.length > 0 && (
            <button 
              onClick={handleSaveAll} 
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
              ยืนยันนำเข้า {data.length} รายการ
            </button>
          )}
        </div>
      </div>

      {/* เลือกประเภทสินค้าก่อน Import */}
      {data.length === 0 && (
        <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700 mb-3">
            เลือกประเภทสินค้าที่ต้องการ Import:
          </p>

          {/* SLABS types */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Layers size={12} /> Wood Slabs
            </p>
            <div className="flex flex-wrap gap-2">
              {SLAB_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSelectType(t)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all
                    ${selectedType === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rough Wood */}
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Hammer size={12} /> Rough Wood
            </p>
            <button
              type="button"
              onClick={() => handleSelectType('rough_wood')}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all
                ${selectedType === 'rough_wood'
                  ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600'}`}
            >
              Rough Wood (ไม้ดิบ)
            </button>
          </div>

          {/* Props */}
          <div className="border-t border-slate-200 pt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              🖼️ Props / Decor
            </p>
            <button
              type="button"
              onClick={() => handleSelectType('prop')}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all
                ${selectedType === 'prop'
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:text-purple-600'}`}
            >
              Props / Decor (สินค้าประกอบฉาก)
            </button>
            {selectedType === 'prop' && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Info size={13} /> ใช้ column: Item NO., CODE/SKU, Color, Link Picture, W, D, H, Material, Product Sub ฯลฯ
              </p>
            )}
          </div>

          {selectedType === null && (
            <p className="text-xs text-amber-600 mt-3 flex items-center gap-1 font-medium">
              <Info size={13} /> กรุณาเลือกประเภทสินค้าก่อนอัปโหลดไฟล์
            </p>
          )}
          {selectedType !== null && (
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
              <Info size={13} />
              หากในไฟล์มีคอลัมน์ <b>spec_type</b> ระบบจะยึดค่าในไฟล์เป็นหลัก
            </p>
          )}
        </div>
      )}

      {/* Upload Zone */}
      {data.length === 0 && (
        <div className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all relative
          ${selectedType === null
            ? 'border-slate-200 bg-slate-100 cursor-not-allowed opacity-50'
            : 'border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-400 cursor-pointer'}`}>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            disabled={selectedType === null}
            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="bg-white p-4 rounded-full shadow-md mb-4">
            <FileUp className={`w-8 h-8 ${selectedType === null ? 'text-slate-300' : 'text-blue-500'}`} />
          </div>
          <p className="text-slate-600 font-medium">
            {selectedType === null ? 'เลือกประเภทสินค้าก่อน แล้วค่อยอัปโหลดไฟล์' : 'คลิกหรือลากไฟล์ Excel / CSV มาวางที่นี่'}
          </p>
          <p className="text-slate-400 text-xs mt-2">ระบบจะเพิ่มใหม่หรืออัปเดตสินค้าที่มีอยู่แล้วตามรหัส SKU</p>
        </div>
      )}

      {/* Preview Table */}
      {data.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-end">
             <button onClick={() => {setData([]); setStatus(null);}} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition">
              <Trash2 className="w-4 h-4" /> ล้างข้อมูลและอัปโหลดใหม่
            </button>
          </div>
          <div className="overflow-x-auto border rounded-xl max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-sm border-collapse relative">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] sticky top-0 z-10 shadow-sm">
                {selectedType === 'prop' ? (
                  <tr>
                    <th className="p-3 border-b">Item NO. (SKU)</th>
                    <th className="p-3 border-b">CODE/SKU (Barcode)</th>
                    <th className="p-3 border-b">Color</th>
                    <th className="p-3 border-b">Material</th>
                    <th className="p-3 border-b">Product Sub</th>
                    <th className="p-3 border-b text-center">W</th>
                    <th className="p-3 border-b text-center">D</th>
                    <th className="p-3 border-b text-center">H</th>
                    <th className="p-3 border-b text-center">Stock</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="p-3 border-b">SKU</th>
                    <th className="p-3 border-b">Category</th>
                    <th className="p-3 border-b">Barcode</th>
                    <th className="p-3 border-b">Name</th>
                    <th className="p-3 border-b">Size</th>
                    <th className="p-3 border-b text-right">Price</th>
                    <th className="p-3 border-b text-center">Images</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  selectedType === 'prop' ? (
                    <tr key={idx} className="hover:bg-purple-50 transition">
                      <td className="p-3 border-b font-mono text-xs font-bold text-purple-700">{item.sku}</td>
                      <td className="p-3 border-b font-mono text-xs text-slate-600">{item.barcode || '-'}</td>
                      <td className="p-3 border-b text-xs">{item.color || '-'}</td>
                      <td className="p-3 border-b text-xs">{item.specs.material || '-'}</td>
                      <td className="p-3 border-b text-xs">{item.specs.product_sub || '-'}</td>
                      <td className="p-3 border-b text-center text-xs text-blue-700 font-bold">{item.specs.width_cm != null && !isNaN(item.specs.width_cm) ? item.specs.width_cm : '-'}</td>
                      <td className="p-3 border-b text-center text-xs text-green-700 font-bold">{item.specs.length_cm != null && !isNaN(item.specs.length_cm) ? item.specs.length_cm : '-'}</td>
                      <td className="p-3 border-b text-center text-xs text-purple-700 font-bold">{item.specs.thickness_cm != null && !isNaN(item.specs.thickness_cm) ? item.specs.thickness_cm : '-'}</td>
                      <td className="p-3 border-b text-center">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[10px] font-bold">{item.specs.stock != null && !isNaN(item.specs.stock) ? item.specs.stock : '-'}</span>
                      </td>
                    </tr>
                  ) : (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 border-b font-mono text-xs font-bold text-blue-700">{item.sku}</td>
                      <td className="p-3 border-b">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.category_id === 'SLABS' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {item.category_id}
                        </span>
                      </td>
                      <td className="p-3 border-b font-mono text-xs text-slate-600">{item.barcode || '-'}</td>
                      <td className="p-3 border-b font-medium text-slate-800">{item.name}</td>
                      <td className="p-3 border-b text-slate-500 text-xs">{item.specs.size || '-'}</td>
                      <td className="p-3 border-b text-right text-blue-600 font-bold">{item.price.toLocaleString()}</td>
                      <td className="p-3 border-b text-center">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-[10px] font-bold">+{item.specs.images_count}</span>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {status && (
        <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 
          ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            status.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
            'bg-red-50 text-red-700 border border-red-200'}`}
        >
          {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
           status.type === 'info' ? <Info className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-bold">{status.msg}</span>
          <button onClick={() => setStatus(null)} className="ml-auto hover:bg-white/50 p-1 rounded-full transition"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  )
}