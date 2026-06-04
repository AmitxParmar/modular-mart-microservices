import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Track Order #${id.slice(0, 8)} | ModularMart`,
    description: `Track the delivery status and live updates for order #${id.slice(0, 8)} on ModularMart.`,
  };
}

export default function OrderTrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
