import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pt-20">
      <h1 className="text-6xl font-bold text-violet-400">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">Page not found</p>
      <Link to="/" className="mt-6">
        <Button variant="outline">Return Home</Button>
      </Link>
    </div>
  );
}
