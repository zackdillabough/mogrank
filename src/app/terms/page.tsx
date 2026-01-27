import Link from "next/link"
import { Logo } from "@/components/logo"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/" className="inline-block mb-8">
          <Logo className="h-7" />
        </Link>

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: January 23, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using the mogrank service, website, and any other features or content offered by mogrank (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
            <p className="text-muted-foreground">
              mogrank provides digital in-game leveling services for Phasmophobia, including prestige leveling, ID card unlocks, and achievement completion (the &ldquo;Digital Services&rdquo;). These are NOT instant services. Delivery times vary based on service complexity, customer availability, and current service queue. Estimated delivery timeframes are not guarantees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Eligibility</h2>
            <p className="text-muted-foreground">
              You must be at least 18 years of age or have reached the age of majority in your jurisdiction to purchase services from mogrank. By making a purchase, you represent that you are authorized to use the payment method provided and have the legal capacity to enter into this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Account Registration</h2>
            <p className="text-muted-foreground">
              To access certain features of the Service, you are required to sign in with Discord. You are responsible for maintaining the security of your Discord account. You must provide accurate contact information. Creating multiple accounts to circumvent policies or abuse promotions is strictly prohibited and will result in termination of all accounts without refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Payment and Billing</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>5.1. All prices are listed in USD.</p>
              <p>5.2. Payment is required in full before any Digital Services are rendered.</p>
              <p>5.3. We use a secure payment processor to handle all transactions. Payments are made via credit/debit card, Apple Pay, Google Pay, or bank transfer.</p>
              <p>5.4. By providing payment information, you represent that you are authorized to use the payment method and agree to be charged for the service selected.</p>
              <p>5.5. Before filing a chargeback or payment dispute, customers must contact mogrank via Discord to resolve the issue. We are committed to working with customers to address legitimate concerns. Filing a chargeback without prior contact may result in service termination and account suspension.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Refund Policy</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>6.1. All Digital Services are virtual and delivered within the Phasmophobia game environment.</p>
              <p>6.2. Digital Services are eligible for refund only if the service has not been initiated. This includes contact from our team, scheduling arrangements, or any work begun on your order.</p>
              <p>6.3. Once a Digital Service has been started, no refunds will be issued regardless of completion percentage.</p>
              <p>6.4. Refund requests must be submitted via Discord before service has been initiated.</p>
              <p>6.5. Refunds are issued minus payment processing fees (approximately 2.9% + $0.30) unless otherwise determined at our discretion.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Service Delivery</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>7.1. We aim to respond to all orders within 24 hours of purchase via Discord DM.</p>
              <p>7.2. Service delivery requires you to join a private Phasmophobia lobby. We will provide a room code via Discord.</p>
              <p>7.3. We are not responsible for delays due to game server maintenance, game updates, or customer unavailability.</p>
              <p>7.4. Customers must respond to Discord DMs within 48 hours. Failure to respond after multiple contact attempts may result in order cancellation.</p>
              <p>7.5. For services requiring multiple sessions, scheduling will be coordinated via Discord.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. User Conduct</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>You agree not to:</p>
              <p>8.1. Use the Service for any illegal purpose.</p>
              <p>8.2. Harass, abuse, or harm another person through the use of our Service.</p>
              <p>8.3. Attempt to decompile, reverse engineer, or disassemble any portion of our Service.</p>
              <p>8.4. Provide false or misleading information.</p>
              <p>8.5. Block mogrank communication channels after placing an order.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Risk Acknowledgment</h2>
            <p className="text-muted-foreground">
              By using our services, you acknowledge that the use of third-party leveling services may carry risks including potential account action by game publishers. mogrank is not responsible for any account penalties imposed by game publishers. You use our services at your own discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Limitation of Liability</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>10.1. mogrank shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.</p>
              <p>10.2. We are not responsible for any changes to game mechanics, rules, or terms of service imposed by game publishers that may affect our ability to deliver services.</p>
              <p>10.3. Our total liability for any claims related to the Service is limited to the amount paid for the specific service in question.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>11.1. We reserve the right to terminate or suspend your access to the Service immediately, without prior notice, for any reason including breach of these Terms or fraudulent activity.</p>
              <p>11.2. Upon termination, your right to use the Service will immediately cease and any pending orders may be cancelled.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. Changes will be indicated by an updated &ldquo;Last Updated&rdquo; date. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us via Discord DM.
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
