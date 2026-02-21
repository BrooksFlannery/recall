import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold mb-4">Recall</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your personal knowledge base. Save what matters, remember it forever.
        </p>
        <Link
          href="/sign-in"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Get started
        </Link>
      </div>
    </main>
  )
}
