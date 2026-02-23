"use client"

import { useQuery } from "@tanstack/react-query"
import { orpc } from "@/lib/orpc/query"
import { AddFactModal } from "@/components/AddFactModal"
import { useState } from "react"

export default function FactsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const { data: facts, isPending, isError } = useQuery(orpc.facts.list.queryOptions())

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
              <p className="font-medium text-gray-900">{fact.userContent}</p>
              {fact.latestFactItem && (
                <p className="mt-1 text-sm text-gray-500">{fact.latestFactItem.question}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {new Date(fact.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      {showAddModal && <AddFactModal onClose={() => setShowAddModal(false)} />}
    </div>
  )
}
