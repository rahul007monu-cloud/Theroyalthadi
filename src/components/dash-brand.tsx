import { Crown } from "lucide-react";

export function DashBrand({ label }: { label: string }) {
  return (
    <div className="dash-brand">
      <span className="dash-brand__crest">
        <Crown size={18} strokeWidth={1.8} />
      </span>
      <div>
        <strong>The Royal Thadi</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}
