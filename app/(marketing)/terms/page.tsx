export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: February 1, 2025</p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground mb-4">
            By accessing or using Flacko AI ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
            If you do not agree to these Terms, do not use the Service. We reserve the right to modify these Terms 
            at any time, and your continued use of the Service constitutes acceptance of any modifications.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">2. NOT FINANCIAL ADVICE — IMPORTANT DISCLAIMER</h2>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">THE SERVICE IS FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY.</strong> Nothing 
              contained in the Service constitutes financial advice, investment advice, trading advice, or any other 
              type of advice. You should not treat any of the Service's content as such.
            </p>
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">FLACKO AI DOES NOT RECOMMEND</strong> that any security, portfolio of securities, 
              transaction, or investment strategy is suitable for any specific person. You understand that the Service 
              does not provide legal, tax, or investment advice. You acknowledge that you are solely responsible for 
              your own investment research and decisions.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">TRADING AND INVESTING INVOLVES SUBSTANTIAL RISK OF LOSS</strong> and is not suitable 
              for every person. Past performance is not indicative of future results. You should consult with a qualified 
              financial advisor before making any investment decisions.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">3. No Guarantees</h2>
          <p className="text-muted-foreground mb-4">
            The Service provides market analysis, reports, alerts, and other trading-related information. 
            <strong className="text-foreground"> WE MAKE NO GUARANTEES, REPRESENTATIONS, OR WARRANTIES</strong> of any kind, 
            express or implied, regarding:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>The accuracy, completeness, reliability, or timeliness of any information provided</li>
            <li>The performance of any securities, strategies, or recommendations mentioned</li>
            <li>The suitability of any information for your particular financial situation</li>
            <li>Any specific results or outcomes from using the Service</li>
            <li>The continuous, uninterrupted, or error-free operation of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">4. Assumption of Risk</h2>
          <p className="text-muted-foreground mb-4">
            You expressly acknowledge and agree that:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>You use the Service entirely at your own risk</li>
            <li>Trading securities involves substantial risk of loss, including the potential loss of your entire investment</li>
            <li>You are solely responsible for all investment decisions you make</li>
            <li>Any reliance on information from the Service is at your sole risk</li>
            <li>You have the financial resources, investment experience, and risk tolerance to use the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">5. Limitation of Liability</h2>
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW</strong>, Flacko AI, its owners, 
              operators, affiliates, employees, agents, and licensors shall not be liable for any direct, indirect, 
              incidental, special, consequential, punitive, or exemplary damages, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Trading losses or investment losses of any kind</li>
              <li>Cost of substitute services</li>
              <li>Any other intangible losses</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              This limitation applies regardless of the theory of liability (contract, tort, negligence, strict liability, 
              or otherwise), even if we have been advised of the possibility of such damages.
            </p>
            <p className="text-muted-foreground mt-4">
              <strong className="text-foreground">IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE 
              TWELVE (12) MONTHS PRECEDING THE CLAIM.</strong>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">6. Indemnification</h2>
          <p className="text-muted-foreground mb-4">
            You agree to indemnify, defend, and hold harmless Flacko AI, its owners, operators, affiliates, employees, 
            agents, and licensors from and against any and all claims, damages, losses, liabilities, costs, and expenses 
            (including reasonable attorneys' fees) arising from or related to:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Any trading or investment decisions you make</li>
            <li>Any claims by third parties related to your use of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">7. Subscription and Billing</h2>
          <p className="text-muted-foreground mb-4">
            Access to the Service requires a paid subscription. By subscribing, you agree that:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>You will be billed on a recurring basis (monthly or annually, as selected)</li>
            <li>Your subscription will automatically renew unless cancelled</li>
            <li>You may cancel at any time through your account settings</li>
            <li>Refunds are provided at our sole discretion</li>
            <li>We may change pricing with notice to existing subscribers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">8. Intellectual Property</h2>
          <p className="text-muted-foreground mb-4">
            All content, features, and functionality of the Service, including but not limited to text, graphics, 
            logos, reports, analysis, alerts, and software, are the exclusive property of Flacko AI and are protected 
            by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, 
            or create derivative works without our express written permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">9. Prohibited Uses</h2>
          <p className="text-muted-foreground mb-4">You agree not to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Share, resell, or redistribute Service content without authorization</li>
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Interfere with the proper functioning of the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">10. Termination</h2>
          <p className="text-muted-foreground mb-4">
            We reserve the right to suspend or terminate your access to the Service at any time, for any reason, 
            without notice or liability. Upon termination, your right to use the Service immediately ceases. 
            Provisions that by their nature should survive termination shall survive, including but not limited to 
            disclaimers, limitations of liability, and indemnification.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">11. Governing Law and Dispute Resolution</h2>
          <p className="text-muted-foreground mb-4">
            These Terms shall be governed by and construed in accordance with the laws of the State of Texas, 
            without regard to its conflict of law provisions. Any dispute arising from these Terms or the Service 
            shall be resolved through binding arbitration in accordance with the American Arbitration Association's 
            rules. You agree to waive any right to a jury trial or to participate in a class action.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">12. Severability</h2>
          <p className="text-muted-foreground mb-4">
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited 
            or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force 
            and effect and enforceable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">13. Entire Agreement</h2>
          <p className="text-muted-foreground mb-4">
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Flacko AI 
            regarding the Service and supersede all prior agreements and understandings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">14. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these Terms, please contact us at{" "}
            <a href="mailto:support@flacko.ai" className="text-primary hover:underline">support@flacko.ai</a>
          </p>
        </section>
      </div>
    </div>
  );
}
