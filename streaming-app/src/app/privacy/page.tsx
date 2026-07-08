import { SITE_NAME } from '@/lib/constants';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p>We collect minimal information: your chat display name (if you choose to chat) and basic analytics (page views, device type). No personal data is stored in a database.</p>
        <h2 className="text-xl font-semibold">2. Chat Messages</h2>
        <p>Chat messages are broadcast in real-time and are not permanently stored. They exist only during the live session.</p>
        <h2 className="text-xl font-semibold">3. Cookies</h2>
        <p>We use essential cookies for authentication and theme preferences only.</p>
        <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
        <p>We embed content from YouTube and Twitch. These services have their own privacy policies.</p>
        <h2 className="text-xl font-semibold">5. Data Security</h2>
        <p>We implement standard security measures. No sensitive personal data is collected or stored.</p>
        <h2 className="text-xl font-semibold">6. Contact</h2>
        <p>For questions, use our <a href="/contact">contact page</a>.</p>
      </div>
    </div>
  );
}
