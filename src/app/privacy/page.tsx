import Link from "next/link"
import { Logo } from "@/components/logo"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="inline-block mb-8">
          <Logo className="h-7" />
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: January 23, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              mogrank is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Information you provide:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Discord account information (username, avatar, user ID) when you sign in</li>
                  <li>Order details and service preferences</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Information collected automatically:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>IP address</li>
                  <li>Browser type and device information</li>
                  <li>Pages visited and interactions with our service</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Payment information:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Payment processing is handled entirely by our third-party payment processor. We do not store your credit card numbers, bank details, or other sensitive payment information on our servers.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <div className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>To fulfill and deliver your orders</li>
                <li>To communicate with you about your orders via Discord</li>
                <li>To prevent fraud and abuse of our service</li>
                <li>To improve our service and user experience</li>
                <li>To comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-medium text-foreground">Discord OAuth</span> &mdash; for authentication and user identification</li>
                <li><span className="font-medium text-foreground">Payment processor</span> &mdash; for secure payment handling</li>
                <li><span className="font-medium text-foreground">Supabase</span> &mdash; for data storage and hosting</li>
              </ul>
              <p>We do not sell, trade, or rent your personal information to third parties for marketing purposes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>We implement appropriate security measures to protect your information, including:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>SSL/TLS encryption for all data in transit</li>
                <li>Secure authentication via Discord OAuth</li>
                <li>Access controls limiting who can view customer data</li>
              </ul>
              <p>However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Retention</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>We retain your information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Specifically:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Account information is retained while your account is active</li>
                <li>Order records are retained for up to 2 years for business and legal purposes</li>
                <li>You may request deletion of your data at any time by contacting us via Discord</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Your Rights</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p>To exercise any of these rights, contact us via Discord. We will respond within 30 days.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Cookies</h2>
            <p className="text-muted-foreground">
              We use essential cookies to maintain your session and authentication state. These are necessary for the service to function and cannot be disabled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. Changes will be indicated by an updated &ldquo;Last Updated&rdquo; date. Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
            <p className="text-muted-foreground">
              For questions about this Privacy Policy or to exercise your data rights, contact us via Discord DM.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link href="/" className="text-sm text-muted-foreground hover:underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
