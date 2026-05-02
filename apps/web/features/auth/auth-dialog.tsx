"use client";

import { useAuthDialog } from "./auth-dialog-context";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SignIn, SignUp } from "@clerk/nextjs";

export function AuthDialog() {
  const { isOpen, closeDialog, view } = useAuthDialog();

  return (
    <Dialog open={isOpen} onOpenChange={closeDialog}>
      {/* We make the content transparent and remove borders so Clerk renders beautifully barebone inside */}
      <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none w-auto flex flex-col items-center justify-center">
        {/* Hidden headers to satisfy Dialog accessibility constraints without ruining Clerk styles */}
        <div className="sr-only">
          <DialogTitle>{view === "signIn" ? "Sign In" : "Sign Up"}</DialogTitle>
          <DialogDescription>
            Sign in or create a new account.
          </DialogDescription>
        </div>

        {view === "signIn" ? (
          <SignIn routing="hash" />
        ) : (
          <SignUp routing="hash" />
        )}
      </DialogContent>
    </Dialog>
  );
}
