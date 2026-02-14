import Link from "next/link";
import { Clock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-bold text-lg">Work OS</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Back to home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: February 13, 2026</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Introduction</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Sobojinski Solutions LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
              Work OS (the &quot;Service&quot;). This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              We collect information you provide directly to us:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>Account information:</strong> name, email address, and password when you create an account.</li>
              <li><strong>Client and schedule data:</strong> client names, hourly rates, availability, time entries, and schedule configurations you enter into the Service.</li>
              <li><strong>Integration data:</strong> when you connect third-party services (Slack, Gmail, Notion, ClickUp, calendar feeds), we access data from those services as authorized by you to provide our features.</li>
              <li><strong>Payment information:</strong> billing details are processed by Stripe. We do not store your credit card numbers.</li>
              <li><strong>Communications:</strong> support tickets, feedback, and other messages you send us.</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-3 mb-2">
              We automatically collect:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>Usage data:</strong> pages visited, features used, and interactions with the Service.</li>
              <li><strong>Device information:</strong> browser type, operating system, and IP address.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Provide, maintain, and improve the Service.</li>
              <li>Generate schedules, track time, and deliver features you request.</li>
              <li>Process payments and manage your subscription.</li>
              <li>Send transactional emails (password resets, account notifications).</li>
              <li>Respond to your support requests and feedback.</li>
              <li>Detect, prevent, and address technical issues or abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Third-Party Integrations</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              When you connect third-party services (Slack, Gmail, Notion, ClickUp, or calendar feeds),
              we access only the data necessary to provide the features you enable. Integration tokens
              are encrypted at rest. You can disconnect integrations at any time from your Settings page,
              which revokes our access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">
              We do not sell your personal information. We may share your information only in these circumstances:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>Service providers:</strong> Stripe (payments), Resend (transactional email), and hosting providers that help us operate the Service.</li>
              <li><strong>Legal requirements:</strong> when required by law, regulation, or legal process.</li>
              <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Data Security</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We implement industry-standard security measures to protect your data. Passwords are
              hashed using bcrypt. Integration tokens are encrypted at rest. Authentication uses
              secure JWT tokens. However, no method of transmission over the Internet is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Data Retention</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide the
              Service. If you delete your account, we will delete your personal data within 30 days,
              except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Your Rights</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate information in your account.</li>
              <li>Delete your account and associated data.</li>
              <li>Export your data (available via CSV export on Pro and Business plans).</li>
              <li>Withdraw consent for optional data processing.</li>
            </ul>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">
              To exercise these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Cookies</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We use essential cookies required for authentication and session management. We do not
              use third-party advertising cookies or cross-site tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Children&apos;s Privacy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              The Service is not intended for users under 16 years of age. We do not knowingly collect
              personal information from children under 16.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Changes to This Policy</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Contact Us</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:{" "}
              <a href="mailto:support@mytime.day" className="text-gray-900 font-medium hover:underline">
                support@mytime.day
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} Sobojinski Solutions LLC</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors font-medium text-gray-600">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
