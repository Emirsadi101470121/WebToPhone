import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

export default function Placeholder() {
  const location = useLocation();
  const pageName = location.pathname
    .replace("/", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
        <Construction className="h-7 w-7 text-violet-400" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{pageName || "Page"}</h1>
      <p className="mt-2 max-w-sm text-center text-muted-foreground">
        This page is under construction. Continue prompting to build out this section.
      </p>
    </div>
  );
}
