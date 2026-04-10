'use client'

import { useState } from 'react'

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`
        text-xs px-3 py-1.5 rounded-full
        backdrop-blur font-medium
        transition
        ${copied
          ? 'bg-green-500 text-white'
          : 'bg-white/90 text-gray-900 hover:bg-white'
        }
      `}
    >
      {copied ? 'Copied ✓' : 'Copy URL'}
    </button>
  )
}
