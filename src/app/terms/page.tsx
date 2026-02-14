import Link from "next/link";
import { Clock } from "lucide-react";

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: February 13, 2026</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              By accessing or using Work OS (the &quot;Service&quot;), operated by Sobojinski Solutions LLC
              (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Description of Service</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Work OS is a workday management platform for freelancers and independent contractors.
              The Service provides schedule generation, time tracking, client management, and
              integrations with third-party tools. Features vary by subscription plan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Account Registration</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              You must provide accurate and complete information when creating an account. You are
              responsible for maintaining the security of your account credentials and for all
              activity that occurs under your account. Notify us immediately of any unauthorized
              use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Subscription Plans and Billing</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li><strong>Free plan:</strong> Available at no cost with limited features (up to 2 clients).</li>
              <li><strong>Paid plans (Pro, Business):</strong> Billed monthly or annually via Stripe. Prices are listed on our pricing page.</li>
              <li><strong>Free trial:</strong> New paid subscriptions include a 14-day free trial. You will not be charged until the trial ends.</li>
              <li><strong>Cancellation:</strong> You may cancel your subscription at any time from your Settings page. Access to paid features continues until the end of your current billing period.</li>
              <li><strong>Refunds:</strong> We do not offer refunds for partial billing periods. If you believe you were charged in error, contact us.</li>
              <li><strong>Price changes:</strong> We may change our prices with 30 days&apos; notice. Price changes do not affect your current billing period.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Acceptable Use</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Upload malicious code, viruses, or harmful content.</li>
              <li>Use the Service to send unsolicited communications.</li>
              <li>Scrape, crawl, or otherwise extract data from the Service by automated means without permission.</li>
              <li>Resell or redistribute the Service without authorization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Your Data</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              You retain ownership of all data you enter into the Service. We do not claim
              intellectual property rights over your content. By using the Service, you grant us a
              limited license to use your data solely to provide and improve the Service. See our{" "}
              <Link href="/privacy" className="text-gray-900 font-medium hover:underline">
                Privacy Policy
              </Link>{" "}
              for details on how we handle your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Third-Party Integrations</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              The Service allows you to connect third-party applications (Slack, Gmail, Notion,
              ClickUp, calendar services). Your use of these integrations is subject to the
              respective third-party terms and privacy policies. We are not responsible for
              third-party services or their content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Intellectual Property</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              The Service, including its design, features, code, and documentation, is owned by
              Sobojinski Solutions LLC and protected by intellectual property laws. You may not
              copy, modify, distribute, or reverse-engineer any part of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Disclaimer of Warranties</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
              WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Limitation of Liability</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SOBOJINSKI SOLUTIONS LLC SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
              LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF
              DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNTS PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Indemnification</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              You agree to indemnify and hold harmless Sobojinski Solutions LLC from any claims,
              damages, losses, or expenses arising from your use of the Service or your violation
              of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Termination</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may suspend or terminate your access to the Service at any time for violation of
              these Terms or for any other reason with reasonable notice. Upon termination, your
              right to use the Service ceases immediately. Provisions that by their nature should
              survive termination will remain in effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">13. Governing Law</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              These Terms are governed by the laws of the State of Texas, United States, without
              regard to its conflict of law provisions. Any disputes arising under these Terms shall
              be resolved in the courts located in Texas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">14. Changes to These Terms</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes
              by posting the updated terms on this page and updating the &quot;Last updated&quot; date.
              Continued use of the Service after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">15. Contact Us</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              If you have questions about these Terms, please contact us at:{" "}
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
            <Link href="/terms" className="hover:text-gray-600 transition-colors font-medium text-gray-600">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
