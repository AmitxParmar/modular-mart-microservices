import { User } from "lucide-react";
import Image from "next/image";

interface DashboardHeaderProps {
  user: {
    imageUrl?: string;
    fullName?: string | null;
    firstName?: string | null;
  } | null | undefined;
}

/**
 * Component for the dashboard welcome header.
 * Displays the user's profile image and a personalized welcome message.
 */
export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl border border-border/40 bg-muted/20">
      <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-xl overflow-hidden">
        {user?.imageUrl ? (
          <Image
            width={100}
            height={100}
            src={user.imageUrl}
            alt={user.fullName || "User"}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="size-10 text-primary" />
        )}
      </div>
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.firstName || "Customer"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your orders, addresses, and account settings.
        </p>
      </div>
    </div>
  );
}
