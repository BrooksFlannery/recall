"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc/query"
import { AddFactModal } from "@/components/AddFactModal"
import { EditFactModal } from "@/components/EditFactModal"
import { useState } from "react"

export default function FactsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingFact, setEditingFact] = useState<{ id: string; userContent: string } | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { data: facts, isPending, isError } = useQuery(orpc.facts.list.queryOptions())

  const { mutate: deleteFact, isPending: isDeleting } = useMutation({
    ...orpc.facts.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.facts.list.queryOptions().queryKey })
      setConfirmDeleteId(null)
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Facts</h1>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Fact
        </button>
      </div>

      {isPending && <p className="text-gray-500">Loading facts…</p>}

      {isError && (
        <p className="text-red-600">Failed to load facts. Please refresh the page.</p>
      )}

      {facts && facts.length === 0 && (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          <p className="mb-2 font-medium">No facts yet</p>
          <p className="text-sm">Click &ldquo;Add Fact&rdquo; to create your first fact.</p>
        </div>
      )}

      {facts && facts.length > 0 && (
        <ul className="space-y-3">
          {facts.map((fact) => (
            <li key={fact.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{fact.userContent}</p>
                  {fact.latestFactItem && (
                    <p className="mt-1 text-sm text-gray-500">{fact.latestFactItem.question}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(fact.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingFact({ id: fact.id, userContent: fact.userContent })}
                    className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(fact.id)}
                    className="text-sm text-red-500 hover:text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAddModal && <AddFactModal onClose={() => setShowAddModal(false)} />}

      {editingFact && (
        <EditFactModal
          factId={editingFact.id}
          initialContent={editingFact.userContent}
          onClose={() => setEditingFact(null)}
        />
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold mb-2">Delete fact?</h2>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete this fact and all its history.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteFact({ id: confirmDeleteId })}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
