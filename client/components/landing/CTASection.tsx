import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 via-violet-500/5 to-transparent p-12 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-violet-600/10 blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-[200px] w-[200px] rounded-full bg-violet-500/10 blur-[80px]" />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Go Mobile?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Join thousands of developers who have already converted their web apps into
              production-ready mobile experiences with Morphic.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/dashboard">
                <Button size="lg" className="gap-2 bg-primary px-8 hover:bg-primary/90">
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/#pricing">
                <Button variant="outline" size="lg" className="px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
