import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-pink-600 hover:text-pink-700 font-medium mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* iubenda Privacy Policy Embed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-pink max-w-none">
            <iframe
              src="https://www.iubenda.com/privacy-policy/24358493"
              title="Privacy Policy"
              className="w-full min-h-[800px] border-0"
              style={{ minHeight: '800px' }}
            />
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-8 p-6 bg-pink-50 rounded-lg border border-pink-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Questions about our Privacy Policy?
          </h2>
          <p className="text-gray-700">
            If you have any questions or concerns about our privacy practices,
            please contact us at{" "}
            <a
              href="mailto:team@leansporty.com"
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              team@leansporty.com
            </a>
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-gray-600">
          <Link
            href="/terms"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
