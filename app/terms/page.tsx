import Link from "next/link";

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-pink max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                Welcome to LeanSporty. These Terms of Service ("Terms") govern your access to and use of the LeanSporty
                platform, including our website, mobile applications, and live streaming fitness services (collectively,
                the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                LeanSporty is operated by <strong>Astaprime Sp. z o.o.</strong>, a company registered in Poland.
              </p>
            </section>

            {/* 1. Agreement to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By using LeanSporty, you confirm that you are at least 18 years of age and have the legal capacity to
                enter into this agreement. If you are using the Service on behalf of an organization, you represent that
                you have the authority to bind that organization to these Terms.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                LeanSporty provides live streaming fitness classes, on-demand workout content, and related wellness
                services. You must comply with these Terms and all applicable laws when using our Service.
              </p>
            </section>

            {/* 2. Use of Service */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use of Service</h2>
              <h3 className="text-xl font-medium text-gray-800 mb-3">Permitted Use</h3>
              <p className="text-gray-700 leading-relaxed">
                You may use LeanSporty for personal, non-commercial purposes to participate in fitness classes, track
                your workout progress, and engage with our community.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">Prohibited Activities</h3>
              <p className="text-gray-700 leading-relaxed mb-2">You agree not to:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 ml-4">
                <li>Record, copy, or redistribute our live streams or workout content without permission</li>
                <li>Use automated systems (bots, scrapers) to access the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Impersonate others or provide false information</li>
                <li>Harass, abuse, or harm other users or instructors</li>
                <li>Upload malicious code or attempt to gain unauthorized access</li>
                <li>Use the Service for any illegal purposes</li>
              </ul>
            </section>

            {/* 3. Account Registration */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="text-gray-700 leading-relaxed">
                To access certain features, you may need to create an account using Apple or Google OAuth. You are
                responsible for maintaining the security of your account credentials and for all activities that occur
                under your account. Please notify us immediately at{" "}
                <a href="mailto:team@leansporty.com" className="text-pink-600 hover:text-pink-700 font-medium">
                  team@leansporty.com
                </a>{" "}
                if you suspect unauthorized access to your account.
              </p>
            </section>

            {/* 4. Intellectual Property Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Intellectual Property Rights</h2>
              <p className="text-gray-700 leading-relaxed">
                All content on LeanSporty, including workout videos, class materials, graphics, logos, software, and
                text, is owned by Astaprime Sp. z o.o. or our licensors and is protected by copyright, trademark, and
                other intellectual property laws. You may not copy, modify, distribute, or create derivative works
                without our express written permission.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Any content you upload or share through the Service (such as workout stats or profile information)
                remains your property, but you grant us a license to use, display, and distribute that content as
                necessary to provide the Service.
              </p>
            </section>

            {/* 5. Payment and Tokens */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Payment and Tokens</h2>
              <p className="text-gray-700 leading-relaxed">
                LeanSporty uses a token-based system for enrolling in live classes and accessing premium content. By
                purchasing tokens, you agree to pay all applicable fees. Tokens are non-refundable except as required
                by law. We reserve the right to change our pricing structure with 30 days' notice to users.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                All payments are processed securely through third-party payment processors. We do not store your
                complete payment card information on our servers.
              </p>
            </section>

            {/* 6. Privacy & Data Protection */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy & Data Protection</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Our collection and use of personal information is governed by our{" "}
                <Link href="/privacy" className="text-pink-600 hover:text-pink-700 font-medium">
                  Privacy Policy
                </Link>
                . We comply with GDPR and other applicable data protection laws. We use encryption to protect your data
                and will never sell your personal information to third parties.
              </p>
            </section>

            {/* 7. Health and Safety Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Health and Safety Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-red-600">IMPORTANT:</strong> Before starting any fitness program, please consult
                with your physician or healthcare provider. LeanSporty provides general fitness information and is not
                a substitute for professional medical advice.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                You participate in workouts at your own risk. Listen to your body and stop immediately if you
                experience pain, dizziness, or discomfort. We are not liable for any injuries sustained while using our
                Service.
              </p>
            </section>

            {/* 8. Live Streaming and Recordings */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Live Streaming and Recordings</h2>
              <p className="text-gray-700 leading-relaxed">
                LeanSporty offers live fitness classes via streaming technology. We strive to provide high-quality,
                uninterrupted streams, but we cannot guarantee that the Service will be error-free or always available.
                Technical issues, internet connectivity problems, or other factors may affect stream quality.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Some classes may be recorded and made available for on-demand viewing. By participating in a live
                class, you consent to being potentially visible if you enable your camera during the session.
              </p>
            </section>

            {/* 9. Warranty Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Warranty Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            {/* 10. Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ASTAPRIME SP. Z O.O. SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
                INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES
                RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            {/* 11. Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold harmless Astaprime Sp. z o.o., its officers, directors, employees, and
                agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from
                your use of the Service, your violation of these Terms, or your violation of any rights of another
                party.
              </p>
            </section>

            {/* 12. Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may suspend or terminate your access to the Service at any time, with or without cause, with or
                without notice. You may also terminate your account at any time by contacting us. Upon termination,
                your right to use the Service will immediately cease, and any unused tokens will be forfeited except as
                required by law.
              </p>
            </section>

            {/* 13. Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. If we make material changes, we will provide at
                least 30 days' notice by email or through a notice on our Service. Your continued use of the Service
                after changes become effective constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* 14. Governing Law */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Poland, without regard to
                its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the
                courts of Poland.
              </p>
            </section>

            {/* 15. Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any concerns or disputes, please contact us first at{" "}
                <a href="mailto:team@leansporty.com" className="text-pink-600 hover:text-pink-700 font-medium">
                  team@leansporty.com
                </a>
                . We will attempt to resolve the issue informally before pursuing formal legal action.
              </p>
            </section>

            {/* 16. Severability */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Severability</h2>
              <p className="text-gray-700 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited
                or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force
                and effect.
              </p>
            </section>

            {/* 17. Entire Agreement */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Entire Agreement</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the
                entire agreement between you and Astaprime Sp. z o.o. regarding the use of the Service and supersede
                all prior agreements and understandings.
              </p>
            </section>

            {/* 18. Contact Us */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions, concerns, or feedback about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 bg-pink-50 rounded-lg border border-pink-100">
                <p className="text-gray-800 font-medium">Astaprime Sp. z o.o.</p>
                <p className="text-gray-700 mt-2">
                  Email:{" "}
                  <a href="mailto:team@leansporty.com" className="text-pink-600 hover:text-pink-700 font-medium">
                    team@leansporty.com
                  </a>
                </p>
                <p className="text-gray-700">
                  General inquiries:{" "}
                  <a href="mailto:inquiries@astaprime.com" className="text-pink-600 hover:text-pink-700 font-medium">
                    inquiries@astaprime.com
                  </a>
                </p>
                <p className="text-gray-700 mt-2">
                  Website:{" "}
                  <a href="https://leansporty.com" className="text-pink-600 hover:text-pink-700 font-medium">
                    https://leansporty.com
                  </a>
                </p>
              </div>
            </section>

            {/* 19. Acknowledgment */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. Acknowledgment</h2>
              <p className="text-gray-700 leading-relaxed">
                BY USING LEANSPORTY, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTAND THEM, AND
                AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, PLEASE DO NOT USE OUR SERVICE.
              </p>
            </section>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-gray-600">
          <Link
            href="/privacy"
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
