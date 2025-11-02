import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Unified Inbox</h1>
        <p className="text-xl text-gray-600 mb-8">Multi-Channel Customer Outreach Platform</p>
        <div className="flex gap-4 justify-center mb-8">
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            SMS
          </span>
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            WhatsApp
          </span>
          <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            Email
          </span>
          <span className="px-4 py-2 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
            Social
          </span>
        </div>
        <Link
          href="/auth"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
