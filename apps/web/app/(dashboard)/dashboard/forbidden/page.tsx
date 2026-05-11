import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-[400px] mb-8">
        You do not have the required permissions to access this workspace. 
        If you believe this is an error, please contact your administrator.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/" 
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "rounded-full px-8")}
        >
          Return to Shop
        </Link>
        <Link 
          href="/dashboard/customer" 
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-8")}
        >
          Go to My Account
        </Link>
      </div>
    </div>
  );
}
