"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc/query"
import { useState } from "react"

interface AddFactModalProps {
  onClose: () => void
}

export function AddFactModal({ onClose }: AddFactModalProps) {
  const [userContent, setUserContent] = useState("")
  const queryClient = useQueryClient()

  const { mutate: createFact, isPending, error } = useMutation({
    ...orpc.facts.create.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.facts.list.queryOptions().queryKey })
      onClose()
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userContent.trim()) { return }
    createFact({ userContent: userContent.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4">Add Fact</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={userContent}
            onChange={(e) => setUserContent(e.target.value)}
            placeholder="Enter your fact…"
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          />

          {error && (
            <p className="text-sm text-red-600">Failed to create fact. Please try again.</p>
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
