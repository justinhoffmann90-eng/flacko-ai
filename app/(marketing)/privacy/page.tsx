export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 1, 2025</p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-muted-foreground mb-4">
            Flacko AI ("we," "us," or "our") respects your privacy and is committed to protecting your personal 
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-medium mb-2 mt-4">Information You Provide</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Account information (email address, name)</li>
            <li>Payment information (processed securely by Stripe; we do not store card details)</li>
            <li>Optional social media handles (e.g., X/Twitter username)</li>
            <li>Communications you send to us</li>
          </ul>

          <h3 className="text-lg font-medium mb-2 mt-4">Information Collected Automatically</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Device information (browser type, operating system)</li>
            <li>Usage data (pages visited, features used, time spent)</li>
            <li>IP address and approximate location</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Provide, maintain, and improve the Service</li>
            <li>Process transactions and send related information</li>
            <li>Send you alerts, reports, and other Service communications</li>
            <li>Respond to your comments, questions, and support requests</li>
            <li>Monitor and analyze usage patterns and trends</li>
            <li>Detect, investigate, and prevent fraudulent or unauthorized activity</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Information Sharing</h2>
          <p className="text-muted-foreground mb-4">
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong className="text-foreground">Service Providers:</strong> With third parties who perform services on our behalf (e.g., payment processing, email delivery, analytics)</li>
            <li><strong className="text-foreground">Legal Requirements:</strong> When required by law, subpoena, or other legal process</li>
            <li><strong className="text-foreground">Protection of Rights:</strong> To protect our rights, privacy, safety, or property</li>
            <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong className="text-foreground">With Your Consent:</strong> When you have given us permission to share</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Third-Party Services</h2>
          <p className="text-muted-foreground mb-4">
            We use the following third-party services that may collect information:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong className="text-foreground">Stripe:</strong> For payment processing</li>
            <li><strong className="text-foreground">Vercel:</strong> For hosting and analytics</li>
            <li><strong className="text-foreground">Supabase:</strong> For database and authentication</li>
            <li><strong className="text-foreground">Resend:</strong> For email delivery</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            These services have their own privacy policies governing their use of your information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
          <p className="text-muted-foreground mb-4">
            We implement appropriate technical and organizational measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
            over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
          <p className="text-muted-foreground mb-4">
            We retain your personal information for as long as necessary to provide the Service and fulfill the 
            purposes described in this Privacy Policy, unless a longer retention period is required or permitted 
            by law. When you cancel your subscription, we may retain certain information as required for legal 
            or business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Your Rights</h2>
          <p className="text-muted-foreground mb-4">Depending on your location, you may have the right to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to or restrict certain processing</li>
            <li>Data portability</li>
            <li>Withdraw consent (where processing is based on consent)</li>
          </ul>
          <p className="text-muted-foreground mt-4">
            To exercise these rights, please contact us at{" "}
            <a href="mailto:support@flacko.ai" className="text-primary hover:underline">support@flacko.ai</a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Cookies</h2>
          <p className="text-muted-foreground mb-4">
            We use cookies and similar tracking technologies to enhance your experience, analyze usage, and 
            deliver personalized content. You can control cookies through your browser settings, but disabling 
            cookies may affect the functionality of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Children's Privacy</h2>
          <p className="text-muted-foreground mb-4">
            The Service is not intended for individuals under the age of 18. We do not knowingly collect personal 
            information from children. If you believe we have collected information from a child, please contact us 
            immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. International Data Transfers</h2>
          <p className="text-muted-foreground mb-4">
            Your information may be transferred to and processed in countries other than your country of residence. 
            These countries may have data protection laws that are different from the laws of your country. By using 
            the Service, you consent to the transfer of your information to the United States and other jurisdictions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Changes to This Policy</h2>
          <p className="text-muted-foreground mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
            new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the Service 
            after any changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">13. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:support@flacko.ai" className="text-primary hover:underline">support@flacko.ai</a>
          </p>
        </section>
      </div>
    </div>
  );
}
