import { useSettings } from "@/contexts/SettingsContext";

interface Props {
  amount: number;
  className?: string;
  showCurrency?: boolean;
  decimals?: number;
}

export default function CurrencyDisplay({ amount, className = "", showCurrency = true, decimals = 0 }: Props) {
  const { formatAmount, currencySymbol } = useSettings();
  
  if (!showCurrency) {
    return <span className={className}>{amount.toLocaleString("fr-FR", { maximumFractionDigits: decimals })}</span>;
  }
  
  return <span className={className}>{formatAmount(amount)}</span>;
}
