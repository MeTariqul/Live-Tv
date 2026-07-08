import { SITE_NAME } from '@/lib/constants';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>We collect information you provide directly, including account credentials for the admin dashboard, and usage data such as page views and stream interactions.</p>
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p>We use collected information to operate the platform, improve user experience, monitor analytics, and ensure security.</p>
        <h2 className="text-xl font-semibold">3. Cookies</h2>
        <p>We use essential cookies for authentication and session management. Analytics cookies may be used to understand site usage patterns.</p>
        <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
        <p>We use third-party services such as YouTube and Twitch for embedded video content. These services have their own privacy policies.</p>
        <h2 className="text-xl font-semibold">5. Data Security</h2>
        <p>We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>
        <h2 className="text-xl font-semibold">6. Your Rights</h2>
        <p>You have the right to access, update, or delete your personal information. Contact us to exercise these rights.</p>
        <h2 className="text-xl font-semibold">7. Children&#39;s Privacy</h2>
        <p>This platform is not directed to children under 13. We do not knowingly collect personal information from children.</p>
        <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
        <p>We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page.</p>
        <h2 className="text-xl font-semibold">9. Contact</h2>
        <p>For questions about this privacy policy, please contact us through our <a href="/contact">contact page</a>.</p>
      </div>
    </div>
  );
}
