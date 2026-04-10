'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Layers, Hammer, ChevronDown, Check, Loader2 } from 'lucide-react'
import { updateProduct } from '../actions/woodslab'

const SLAB_TYPES = [
  "Wood slabs",
  "Small table",
  "Leg",
  "Chair/Stool",
  "Cabinet",
  "Table",
  "Small Furniture",
]

interface CategoryBadgeProps {
  product: any
}

export default function CategoryBadge({ product }: CategoryBadgeProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  const isRough = product.category_id === 'rough_wood'
  const currentType = product.specs?.type || product.specs?.spec_type || ''

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (category: 'SLABS' | 'rough_wood', specType?: string) => {
    setOpen(false)
    startTransition(async () => {
      const newSpecs = {
        ...product.specs,
        type: specType ?? product.specs?.type ?? '',
        spec_type: specType ?? product.specs?.spec_type ?? '',
      }
      await updateProduct(product.id, {
        category_id: category,
        specs: newSpecs,
      })
      window.location.reload()
    })
  }

  return (
    <div ref={ref} className="relative inline-block">
      {/* Badge trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full transition-all border
          ${isRough
            ? 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100'
            : 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100'}
          ${isPending ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isRough ? (
          <Hammer className="w-3 h-3" />
        ) : (
          <Layers className="w-3 h-3" />
        )}
        <span>{isRough ? 'Rough' : (currentType || 'Slab')}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl w-52 py-1.5 overflow-hidden">

          {/* SLABS section */}
          <div className="px-3 py-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Layers className="w-3 h-3" /> Wood Slabs
            </p>
          </div>
          {SLAB_TYPES.map(t => {
            const isActive = !isRough && currentType === t
            return (
              <button
                key={t}
                onClick={() => handleSelect('SLABS', t)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition hover:bg-blue-50
                  ${isActive ? 'text-blue-600 font-semibold' : 'text-slate-700'}`}
              >
                <span>{t}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
              </button>
            )
          })}

          <div className="border-t border-slate-100 mx-3 my-1.5" />

          {/* Rough Wood section */}
          <div className="px-3 py-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Hammer className="w-3 h-3" /> Rough Wood
            </p>
          </div>
          <button
            onClick={() => handleSelect('rough_wood')}
            className={`w-full flex items-center justify-between px-4 py-2 text-sm transition hover:bg-orange-50
              ${isRough ? 'text-orange-600 font-semibold' : 'text-slate-700'}`}
          >
            <span>Rough Wood (ไม้ดิบ)</span>
            {isRough && <Check className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
          </button>

        </div>
      )}
    </div>
  )
}
