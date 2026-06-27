'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function DeleteAssignmentButton({
  assignmentId,
  assignmentTitle
}: {
  assignmentId: string
  assignmentTitle: string
}) {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/dashboard/assignments')
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    }
    setDeleting(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
        style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.2)', color: '#f43f5e' }}>
        🗑 Delete Assignment
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Assignment?</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              This will permanently delete <strong style={{ color: 'var(--text-primary)' }}>&quot;{assignmentTitle}&quot;</strong> and all its submissions. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 text-white"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}