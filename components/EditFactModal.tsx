"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc/query"
import { useState } from "react"

interface EditFactModalProps {
  factId: string
  initialContent: string
  onClose: () => void
}

export function EditFactModal({ factId, initialContent, onClose }: EditFactModalProps) {
  const [userContent, setUserContent] = useState(initialContent)
  const [keepSchedule, setKeepSchedule] = useState(true)
  const queryClient = useQueryClient()

  const { mutate: updateFact, isPending, error } = useMutation({
    ...orpc.facts.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.facts.list.queryOptions().queryKey })
      onClose()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userContent.trim()) { return }
    updateFact({ id: factId, userContent: userContent.trim(), keepSchedule })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Edit Fact</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={userContent}
            onChange={(e) => setUserContent(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          />

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={keepSchedule}
                onChange={(e) => setKeepSchedule(e.target.checked)}
                disabled={isPending}
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors ${keepSchedule ? "bg-blue-600" : "bg-gray-300"}`}
              />
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${keepSchedule ? "translate-x-5" : "translate-x-1"}`}
              />
            </div>
            <span className="text-sm text-gray-700">Keep schedule</span>
          </label>

          {error && (
            <p className="text-sm text-red-600">Failed to update fact. Please try again.</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !userContent.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
