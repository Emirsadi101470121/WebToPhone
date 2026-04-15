import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Information We Collect",
    content:
      "We collect information you provide directly: account details (email, name), uploaded source code and files, GitHub repository data when authorized, design preferences and survey responses, and usage data (conversions, AI queries, builder sessions). We also collect technical data automatically: IP address, browser type, device information, and interaction logs for service improvement.",
  },
  {
    title: "2. How We Use Your Data",
    content:
      "Your data is used to: (a) provide and operate the Morphic platform; (b) analyze uploaded codebases using Claude AI for conversion; (c) generate UI/UX improvement suggestions; (d) convert web applications to React Native mobile apps; (e) process payments and manage subscriptions; (f) communicate service updates and support responses. We do not use your uploaded code or generated output to train AI models.",
  },
  {
    title: "3. AI Processing",
    content:
      "Morphic uses Claude AI (by Anthropic) for code analysis, UI evaluation, and conversion. Your code is sent to the AI service for processing and is not retained by the AI provider beyond the processing session. AI-generated suggestions and code are stored in your project within our database. You retain full ownership of both your original and generated code.",
  },
  {
    title: "4. Data Storage & Security",
    content:
      "All data is stored in Supabase (PostgreSQL) with encryption at rest and in transit. We implement Row Level Security (RLS) ensuring users can only access their own data. API keys and tokens are encrypted and never exposed client-side. Sessions expire after periods of inactivity. We employ rate limiting, input sanitization, and parameterized queries to prevent SQL injection and XSS attacks.",
  },
  {
    title: "5. Data Sharing",
    content:
      "We do not sell your personal data or uploaded code. We share data only with: (a) Anthropic (Claude AI) for code processing, subject to their data processing agreement; (b) Stripe for payment processing; (c) GitHub for repository access when you authorize the integration. We may disclose data if required by law or to protect our legal rights.",
  },
  {
    title: "6. Data Retention",
    content:
      "Your account data and projects are retained as long as your account is active. Upon account deletion, all personal data and uploaded code is permanently deleted within 30 days. Anonymized usage analytics may be retained for service improvement. Transaction records are retained as required by applicable financial regulations.",
  },
  {
    title: "7. Your Rights",
    content:
      "You have the right to: (a) access and download your data; (b) correct inaccurate information; (c) delete your account and all associated data; (d) export your generated code at any time; (e) revoke third-party integrations (GitHub); (f) opt out of non-essential communications. To exercise these rights, contact us at privacy@morphic.app.",
  },
  {
    title: "8. Cookies & Tracking",
    content:
      "We use essential cookies for authentication and session management only. We do not use third-party tracking cookies or advertising pixels. No sensitive data is stored in cookies. Session tokens are httpOnly and secure-flagged.",
  },
  {
    title: "9. Children's Privacy",
    content:
      "Morphic is not intended for users under the age of 16. We do not knowingly collect personal information from children. If we become aware of data collected from a child, we will delete it promptly.",
  },
  {
    title: "10. Changes to This Policy",
    content:
      "We may update this Privacy Policy periodically. Significant changes will be communicated via email to active users. Continued use of the platform after changes constitutes acceptance of the updated policy.",
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-2 text-sm text-violet-400">Legal</div>
        <h1 className="text-3xl font-bold sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-white/5 bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Questions about your privacy? Contact us at{" "}
            <a href="mailto:privacy@morphic.app" className="text-violet-400 hover:underline">
              privacy@morphic.app
            </a>
            . Also see our{" "}
            <Link to="/terms" className="text-violet-400 hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
