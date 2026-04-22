"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

function BarcodeSvg({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: "CODE128",
          width: 1.4,
          height: 32,
          displayValue: true,
          fontSize: 9,
          margin: 2,
          textMargin: 1,
        });
      } catch {}
    }
  }, [value]);
  return <svg ref={ref} className="w-full" />;
}

interface Props { products: any[] }

export default function PropsClient({ products }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [printTargets, setPrintTargets] = useState<any[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () =>
    setSelected(selected.size === products.length ? new Set() : new Set(products.map(p => p.id)));

  const openModal = (targets: any[]) => {
    const q: Record<number, number> = {};
    targets.forEach(p => { q[p.id] = 1; });
    setQuantities(q);
    setPrintTargets(targets);
    setShowModal(true);
  };

  const totalSets = printTargets.reduce((s, p) => s + (quantities[p.id] || 1), 0);

  const printQrPhoto = async () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    const groups: string[] = [];
    for (const p of printTargets) {
      const sets = quantities[p.id] || 1;
      const val = p.barcode || p.sku || '';
      let qrImg = '';
      try { qrImg = await QRCode.toDataURL(val, { width: 200, margin: 1, errorCorrectionLevel: 'M' }); } catch {}
      const specs = p.specs || {};
      const L = p.length_cm ?? specs.length_cm ?? '';
      const W = p.width_cm ?? specs.width_cm ?? '';
      const T = p.thickness_cm ?? specs.thickness_cm ?? '';
      const sizeStr = (L || W || T) ? `${L}×${W}×${T} CM` : (specs.size || '');
      const colorStr = p.color || '';
      for (let i = 0; i < sets; i++) {
        groups.push(`
          <div class="group">
            <div class="photo-cell"><img src="${p.image_url || ''}" onerror="this.style.display='none'" /></div>
            <div class="qr-col">
              <div class="qr-cell"><img src="${qrImg}" /><div class="code">${val}</div></div>
              <div class="qr-cell"><img src="${qrImg}" /><div class="code">${val}</div></div>
            </div>
            <div class="info">
              <div class="pname">${p.name || ''}</div>
              <div class="rows">
                <div class="col">
                  ${colorStr ? `<div class="row"><span class="label">Color</span><span>${colorStr}</span></div>` : ''}
                  ${sizeStr ? `<div class="row"><span class="label">Size</span><span>${sizeStr}</span></div>` : ''}
                </div>
                <div class="col">
                  <div class="row"><span class="label">SKU</span><span>${p.sku || ''}</span></div>
                  ${p.barcode ? `<div class="row"><span class="label">Barcode</span><span>${p.barcode}</span></div>` : ''}
                </div>
              </div>
            </div>
          </div>`);
      }
    }
    const pages: string[] = [];
    for (let i = 0; i < groups.length; i += 9) {
      const chunk = groups.slice(i, i + 9);
      pages.push(`<div class="page"><div class="grid">${chunk.join("")}</div></div>`);
    }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title></title>
    <style>
      @page{size:A4;margin:8mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{margin:0;padding:0}
      .page{width:calc(210mm - 16mm);height:calc(297mm - 16mm);overflow:hidden;page-break-after:always}
      .page:last-child{page-break-after:auto}
      .grid{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:3mm;height:100%}
      .group{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr auto;border:1px solid #bbb;border-radius:2mm;overflow:hidden;background:#fff;min-height:0}
      .photo-cell{grid-column:1;grid-row:1;border-right:0.8px solid #ccc;background:#f8f8f8;display:flex;align-items:center;justify-content:center;padding:1.5mm;overflow:hidden;min-height:0}
      .photo-cell img{width:100%;height:100%;object-fit:contain;display:block}
      .qr-col{grid-column:2;grid-row:1;display:flex;flex-direction:column;min-height:0;overflow:hidden}
      .qr-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1mm;flex:1;border-bottom:0.8px solid #ddd;background:#fff;min-height:0;overflow:hidden}
      .qr-cell:last-child{border-bottom:none}
      .qr-cell img{width:75%;display:block;object-fit:contain}
      .info{grid-column:1/3;grid-row:2;border-top:1px solid #bbb;padding:2mm 3mm;background:#fff;overflow:hidden}
      .pname{font-size:7pt;font-family:sans-serif;font-weight:bold;color:#111;margin-bottom:1.2mm;line-height:1.3}
      .rows{display:flex;flex-direction:row;gap:3mm}
      .col{display:flex;flex-direction:column;gap:0.6mm;flex:1}
      .row{display:flex;gap:2mm;font-size:6pt;font-family:monospace;color:#333;line-height:1.4}
      .label{color:#888;flex-shrink:0;min-width:13mm;font-weight:bold}
      .code{font-size:4pt;font-family:monospace;text-align:center;padding:0.5mm 0 0;word-break:break-all;color:#555}
    </style></head><body>
    ${pages.join("")}
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
    </body></html>`);
    win.document.close();
  };

  const allSelected = selected.size === products.length && products.length > 0;
  const selectedProducts = products.filter(p => selected.has(p.id));

  return (
    <>
      <div className="p-6 bg-[#fafafa] min-h-screen font-sans">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🖼️ Props Inventory</h1>
            <p className="text-gray-500 text-sm">จัดการรายการสินค้าประกอบฉากทั้งหมด ({products.length} รายการ)</p>
          </div>
          <Link href="/props/upload" className="bg-black text-white px-6 py-3 rounded-2xl hover:bg-gray-800 transition shadow-lg font-medium text-sm">
            + Add New Prop
          </Link>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex-wrap">
          <button onClick={toggleAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition">
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${allSelected ? 'bg-black border-black' : 'border-gray-400'}`}>
              {allSelected && <span className="text-white text-[10px]">✓</span>}
            </span>
            {allSelected ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
          </button>

          {selected.size > 0 && (
            <button onClick={() => openModal(selectedProducts)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow">
              🖨️ ปริ้นที่เลือก ({selected.size})
            </button>
          )}
          <button onClick={() => openModal(products)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-white text-sm font-semibold hover:bg-black transition shadow">
            🖨️ ปริ้นทั้งหมด
          </button>
          {selected.size > 0 && <span className="ml-auto text-sm text-gray-500">เลือก {selected.size} รายการ</span>}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((item) => {
            const specs = item.specs || {};
            const L = item.length_cm ?? specs.length_cm ?? '';
            const W = item.width_cm ?? specs.width_cm ?? '';
            const T = item.thickness_cm ?? specs.thickness_cm ?? '';
            const sizeStr = (L || W || T) ? `${L}×${W}×${T}` : (specs.size || '');
            return (
              <div key={item.id} onClick={() => toggleSelect(item.id)}
                className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border-2 cursor-pointer
                  ${selected.has(item.id) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200'}`}>

                <div className="relative aspect-square bg-[#f3f3f3] m-1.5 rounded-xl overflow-hidden">
                  <div className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded border-2 flex items-center justify-center shadow
                    ${selected.has(item.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                    {selected.has(item.id) && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <img src={item.image_url || "/placeholder.png"} alt={item.name}
                    className="object-contain w-full h-full p-2" />
                </div>

                <div className="px-2.5 pb-3 pt-1">
                  <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold uppercase">{item.color || '–'}</span>
                    {sizeStr && (
                      <span className="text-[9px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full font-bold">{sizeStr}</span>
                    )}
                  </div>
                  <h3 className="text-[10px] font-bold text-gray-800 mb-1.5 line-clamp-1">{item.name}</h3>

                  <div className="bg-gray-50 rounded-lg px-1 py-1">
                    {item.barcode
                      ? <BarcodeSvg value={item.barcode} />
                      : <p className="text-center text-[9px] text-gray-400 py-2">ไม่มีบาร์โค้ด</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Print Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">🖨️ เลือกจำนวนที่ต้องการปริ้น</h2>
              <p className="text-gray-500 text-sm mt-1">
                รวม <b>{totalSets} ชุด</b> | 1 ชุด = รูป + QR×2 + ข้อมูล
              </p>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-3">
              {printTargets.map(p => {
                const specs = p.specs || {};
                const L = p.length_cm ?? specs.length_cm ?? '';
                const W = p.width_cm ?? specs.width_cm ?? '';
                const T = p.thickness_cm ?? specs.thickness_cm ?? '';
                const sizeStr = (L || W || T) ? `${L}×${W}×${T} CM` : (specs.size || '');
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                    <img src={p.image_url || "/placeholder.png"} alt={p.name}
                      className="w-10 h-10 object-contain rounded-lg bg-white border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs font-mono text-gray-400 truncate">{p.barcode || p.sku}</p>
                      {sizeStr && <p className="text-xs text-blue-500 font-semibold">{sizeStr}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-gray-500">ชุด:</span>
                      <button onClick={() => setQuantities(q => ({ ...q, [p.id]: Math.max(1, (q[p.id] || 1) - 1) }))}
                        className="w-7 h-7 rounded-lg bg-gray-200 font-bold text-gray-700 hover:bg-gray-300 transition text-sm">−</button>
                      <input type="number" min={1} value={quantities[p.id] || 1}
                        onChange={e => setQuantities(q => ({ ...q, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                        className="w-11 text-center border rounded-lg text-sm font-bold py-1" />
                      <button onClick={() => setQuantities(q => ({ ...q, [p.id]: (q[p.id] || 1) + 1 }))}
                        className="w-7 h-7 rounded-lg bg-gray-200 font-bold text-gray-700 hover:bg-gray-300 transition text-sm">+</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t flex flex-col gap-3">
              <button onClick={printQrPhoto}
                className="flex flex-col items-center gap-1 py-5 rounded-2xl border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 transition font-semibold text-gray-700 text-sm">
                <span className="text-3xl">🔲🖼️</span>
                <span className="font-bold text-base">ปริ้น QR + รูป + ข้อมูล</span>
                <span className="text-xs text-gray-400 font-normal">รูปซ้าย · QR ขวาซ้อน 2 อัน · ข้อมูลล่าง</span>
              </button>
              <button onClick={() => setShowModal(false)}
                className="w-full py-3 rounded-2xl border-2 border-gray-200 font-semibold text-gray-500 hover:bg-gray-50 transition text-sm">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
