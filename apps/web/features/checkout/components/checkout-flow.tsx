"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentForm } from "./payment-form";
import type { ShippingAddressSnapshot } from "@/types/api";
import { addressSchema } from "../schema/address.schema";

type Step = "contact" | "shipping" | "payment";

export function CheckoutFlow() {
  const { user } = useUser();
  const [activeStep, setActiveStep] = useState<Step>("contact");
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);

  const [email, setEmail] = useState(
    user?.primaryEmailAddress?.emailAddress || ""
  );
  const [shippingData, setShippingData] = useState<ShippingAddressSnapshot>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const handleCompleteStep = (step: Step, nextStep: Step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    setActiveStep(nextStep);
  };

  const isShippingValid = addressSchema.safeParse(shippingData).success;

  return (
    <div className="space-y-6">
      {/* Step 1: Contact Information */}
      <StepContainer
        title="1. Contact Information"
        status={activeStep === "contact" ? "active" : completedSteps.includes("contact") ? "completed" : "pending"}
        onEdit={() => setActiveStep("contact")}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl h-12 bg-background border-border/60"
            />
          </div>
          <Button
            onClick={() => handleCompleteStep("contact", "shipping")}
            className="rounded-full px-8 h-12 font-semibold"
          >
            Continue to Shipping
          </Button>
        </div>
      </StepContainer>

      {/* Step 2: Shipping Address */}
      <StepContainer
        title="2. Shipping Address"
        status={activeStep === "shipping" ? "active" : completedSteps.includes("shipping") ? "completed" : "pending"}
        onEdit={() => setActiveStep("shipping")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">First Name</label>
            <Input
              value={shippingData.firstName}
              onChange={(e) => setShippingData({ ...shippingData, firstName: e.target.value })}
              className="rounded-xl h-12 bg-background border-border/60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Last Name</label>
            <Input
              value={shippingData.lastName}
              onChange={(e) => setShippingData({ ...shippingData, lastName: e.target.value })}
              className="rounded-xl h-12 bg-background border-border/60"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Address</label>
            <Input
              value={shippingData.address}
              onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
              className="rounded-xl h-12 bg-background border-border/60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">City</label>
            <Input
              value={shippingData.city}
              onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
              className="rounded-xl h-12 bg-background border-border/60"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">State</label>
              <Input
                value={shippingData.state}
                onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
                className="rounded-xl h-12 bg-background border-border/60"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">ZIP</label>
              <Input
                value={shippingData.zip}
                onChange={(e) => setShippingData({ ...shippingData, zip: e.target.value })}
                className="rounded-xl h-12 bg-background border-border/60"
              />
            </div>
          </div>
          <div className="md:col-span-2 pt-4">
            <Button
              onClick={() => handleCompleteStep("shipping", "payment")}
              disabled={!isShippingValid}
              className="rounded-full px-8 h-12 font-semibold disabled:opacity-50"
            >
              Continue to Payment
            </Button>
          </div>
        </div>
      </StepContainer>

      {/* Step 3: Payment */}
      <StepContainer
        title="3. Payment"
        status={activeStep === "payment" ? "active" : completedSteps.includes("payment") ? "completed" : "pending"}
        onEdit={() => setActiveStep("payment")}
      >
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            All transactions are secure and encrypted.
          </p>
          {/* Pass the collected shipping snapshot to PaymentForm */}
          <PaymentForm shippingAddressSnapshot={shippingData} />
        </div>
      </StepContainer>
    </div>
  );
}

interface StepContainerProps {
  title: string;
  status: "active" | "completed" | "pending";
  onEdit: () => void;
  children: React.ReactNode;
}

function StepContainer({ title, status, onEdit, children }: StepContainerProps) {
  return (
    <div className={cn(
      "overflow-hidden rounded-3xl border transition-all duration-300",
      status === "active" ? "border-primary bg-muted/30 shadow-sm" : "border-border/40 bg-muted/5 shadow-none",
      status === "pending" && "opacity-50 grayscale pointer-events-none"
    )}>
      <div className="px-8 py-6 flex items-center justify-between">
        <h3 className={cn(
          "text-lg font-bold tracking-tight transition-colors",
          status === "active" ? "text-foreground" : "text-muted-foreground"
        )}>
          {title}
        </h3>

        {status === "completed" && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            Edit <Check className="w-4 h-4" />
          </button>
        )}
      </div>

      {status === "active" && (
        <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}