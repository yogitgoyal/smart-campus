'use client'

import { useState } from 'react'

export default function DownloadButton({ fileUrl }: { fileUrl: string }) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    if (!fileUrl) return
    setDownloading(true)
    try {
      let blob: Blob

      if (fileUrl.startsWith('data:')) {
        // Base64 data URL — convert to blob
        const [meta, base64] = fileUrl.split(',')
        const mimeMatch = meta.match(/data:([^;]+)/)
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i)
        }
        blob = new Blob([bytes], { type: mime })
      } else {
        // Regular URL — fetch it
        const res = await fetch(fileUrl)
        blob = await res.blob()
      }

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const mimeToExt: Record<string, string> = {
        'application/pdf': 'assignment.pdf',
        'application/msword': 'assignment.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'assignment.docx',
        'application/vnd.ms-powerpoint': 'assignment.ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'assignment.pptx',
        'application/vnd.ms-excel': 'assignment.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'assignment.xlsx',
        'image/jpeg': 'assignment.jpg',
        'image/png': 'assignment.png',
        'application/zip': 'assignment.zip',
        'application/x-zip-compressed': 'assignment.zip',
      }
      const mime = blob.type || 'application/octet-stream'
      a.download = mimeToExt[mime] || 'assignment'

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
    setDownloading(false)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
      style={{ background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)', color: '#6366f1' }}>
      {downloading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          Downloading...
        </>
      ) : (
        <>📎 Download Attachment</>
      )}
    </button>
  )
}