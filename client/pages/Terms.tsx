import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using Morphic, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform. We reserve the right to update these terms at any time, and continued use constitutes acceptance of any changes.",
  },
  {
    title: "2. Description of Service",
    content:
      "Morphic is an AI-powered SaaS platform that converts web applications into mobile applications using artificial intelligence. The platform provides codebase analysis, UI/UX evaluation and improvement, web-to-mobile conversion, visual editing, and export of production-ready React Native applications.",
  },
  {
    title: "3. User Responsibilities",
    content:
      "You are responsible for maintaining the confidentiality of your account credentials. You must not upload malicious code, violate intellectual property rights, or use the platform for illegal activities. You are solely responsible for the code and content you upload, and you warrant that you have the right to use and convert any uploaded material.",
  },
  {
    title: "4. Acceptable Use",
    content:
      "You agree not to: (a) reverse-engineer, decompile, or disassemble the platform; (b) use automated tools to scrape or overload the service; (c) attempt to bypass security measures or rate limits; (d) upload content that contains malware, viruses, or harmful code; (e) use the service to generate apps that violate any applicable laws.",
  },
  {
    title: "5. AI-Generated Content Disclaimer",
    content:
      "Morphic uses Claude AI to analyze, suggest, and generate code. AI-generated output is provided as-is and may contain errors, inefficiencies, or inaccuracies. You are responsible for reviewing, testing, and validating all generated code before deploying it to production. Morphic does not guarantee that AI-generated output will be free of bugs, security vulnerabilities, or intellectual property issues.",
  },
  {
    title: "6. Subscription & Billing",
    content:
      "Morphic offers Free, Pro, and Premium subscription plans. Paid plans are billed monthly or annually. Credits for AI processing are consumed per operation and may be purchased separately. Refunds are handled on a case-by-case basis. We reserve the right to modify pricing with 30 days advance notice to active subscribers.",
  },
  {
    title: "7. Credits & Usage",
    content:
      "AI analysis, UI suggestions, and conversion operations consume credits. Credit costs vary by operation complexity. Unused credits do not expire for active subscribers. Free plan credits reset monthly. Excessive or abusive usage may result in temporary rate limiting or account suspension.",
  },
  {
    title: "8. Intellectual Property",
    content:
      "You retain all rights to the code you upload. Morphic does not claim ownership of your source code or generated output. The platform, its design, branding, and underlying technology are the intellectual property of Morphic and are protected by applicable intellectual property laws.",
  },
  {
    title: "9. Data Handling",
    content:
      "Uploaded code is processed for analysis and conversion purposes only. We do not sell, share, or use your code for training AI models. Data is stored securely using Supabase with encryption at rest and in transit. You may request deletion of your data at any time by contacting support.",
  },
  {
    title: "10. Limitation of Liability",
    content:
      "Morphic is provided on an 'as-is' and 'as-available' basis. We do not warrant uninterrupted or error-free service. In no event shall Morphic be liable for indirect, incidental, consequential, or punitive damages arising from your use of the platform. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.",
  },
  {
    title: "11. Termination",
    content:
      "We may suspend or terminate your account if you violate these terms. You may cancel your subscription at any time through your dashboard. Upon termination, your data will be retained for 30 days before permanent deletion, unless you request immediate deletion.",
  },
  {
    title: "12. Governing Law",
    content:
      "These terms are governed by the laws of the jurisdiction in which Morphic operates. Any disputes shall be resolved through binding arbitration, except where prohibited by law.",
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-2 text-sm text-violet-400">Legal</div>
        <h1 className="text-3xl font-bold sm:text-4xl">Terms of Service</h1>
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
            Questions about our terms? Contact us at{" "}
            <a href="mailto:legal@morphic.app" className="text-violet-400 hover:underline">
              legal@morphic.app
            </a>
            . Also see our{" "}
            <Link to="/privacy" className="text-violet-400 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
