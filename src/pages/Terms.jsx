import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('Auth')}>
          <Button variant="ghost" className="mb-8 text-white/60">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-[#f5a623]" />
            <h1 className="text-3xl font-light text-white">VFX Studios - Terms of Service</h1>
          </div>

          <div className="space-y-6 text-white/70 leading-relaxed">
            <section>
              <h2 className="text-xl text-white font-medium mb-3">1. Acceptance of Terms</h2>
              <p>By creating an account and using VFX Studios, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">2. User Accounts</h2>
              <p>You must provide accurate and complete registration information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">3. Subscription & Billing</h2>
              <p>• Free trials last 3 days and require payment information</p>
              <p>• Subscriptions auto-renew unless cancelled</p>
              <p>• Pricing: Weekly ($9.99), Monthly ($25), Annual ($299, launch sale $200)</p>
              <p>• No refunds for partial subscription periods</p>
              <p>• We reserve the right to change pricing with 30 days notice</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">4. Prohibited Activities</h2>
              <p>You may NOT:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Attempt to inject malicious code or exploit vulnerabilities</li>
                <li>Reverse engineer or decompile the platform</li>
                <li>Use the service for illegal purposes</li>
                <li>Share account credentials with others</li>
                <li>Scrape or data mine platform content</li>
                <li>Impersonate other users or administrators</li>
                <li>Upload copyrighted content without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">5. Account Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that violate these terms without refund. Banned users cannot create new accounts.</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">6. Content Ownership</h2>
              <p>You retain ownership of content you upload. By uploading, you grant us a license to host, store, and display your content as necessary to provide the service.</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">7. AI-Generated Content</h2>
              <p>AI-generated visual effects and suggestions are provided as-is. We are not responsible for the artistic quality or commercial viability of AI-generated content.</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">8. Data Privacy & Security</h2>
              <p>We store payment data securely using industry-standard encryption and PCI-DSS compliant payment processors. Passwords are hashed using SHA-256. We comply with Washington State, Federal, and Seattle local data protection laws.</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">9. Limitation of Liability</h2>
              <p>The service is provided "as is" without warranties. We are not liable for any damages arising from use of the platform, including lost revenue from live performances.</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">10. Governing Law</h2>
              <p>These terms are governed by the laws of Washington State and the United States. Any disputes shall be resolved in Seattle, Washington.</p>
            </section>

            <section>
              <h2 className="text-xl text-white font-medium mb-3">11. Changes to Terms</h2>
              <p>We may modify these terms at any time. Continued use after changes constitutes acceptance of new terms.</p>
            </section>

            <div className="pt-6 border-t border-white/10 text-sm text-white/40">
              Last Updated: February 11, 2026<br />
              Contact: legal@vfxstudios.com
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}