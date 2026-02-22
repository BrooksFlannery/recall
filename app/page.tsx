import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold mb-4">Recall</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your personal knowledge base. Save what matters, remember it forever.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors text-center"
          >
            Get started
          </Link>
          <Link
            href="/sign-in"
            className="inline-block border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors text-center"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
