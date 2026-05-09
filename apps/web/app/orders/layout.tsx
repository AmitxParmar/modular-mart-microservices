import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Orders | ModularMart',
  description: 'View and track your orders.',
};

export default function OrdersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
