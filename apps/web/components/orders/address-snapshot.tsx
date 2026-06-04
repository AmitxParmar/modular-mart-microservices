import { ShippingAddressSnapshot } from "@/types/api";
import { cn } from "@/lib/utils";

interface AddressSnapshotProps {
  address: ShippingAddressSnapshot;
  className?: string;
  children?: React.ReactNode;
}

export function AddressSnapshot({ address, className, children }: AddressSnapshotProps) {
  return (
    <div className={cn("text-sm text-slate-600", className)}>
      <p className="font-semibold text-slate-900 mb-1">{address.fullName}</p>
      <p>{address.addressLine1}</p>
      {address.addressLine2 && <p>{address.addressLine2}</p>}
      <p>
        {address.city}, {address.state} {address.postalCode}
      </p>
      <p>{address.country}</p>
      {children}
    </div>
  );
}
