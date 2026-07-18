import type { StaticSearchableSelectOption } from "@/components/ui/StaticSearchableSelect";

export const PROVIDER_FILTER_OPTIONS: StaticSearchableSelectOption[] = [
  { value: "", label: "All" },
  { value: "YAS", label: "YAS" },
  { value: "VODACOM", label: "VODACOM" },
  { value: "HALOTEL", label: "HALOTEL" },
  { value: "AIRTEL", label: "AIRTEL" },
];

export const STATUS_FILTER_OPTIONS: StaticSearchableSelectOption[] = [
  { value: "", label: "All" },
  { value: "SUCCESS", label: "SUCCESS" },
  { value: "FAILED", label: "FAILED" },
  { value: "PENDING_FINAL", label: "PENDING_FINAL" },
  { value: "ACKNOWLEDGED", label: "ACKNOWLEDGED" },
];

export const OPERATION_FILTER_OPTIONS: StaticSearchableSelectOption[] = [
  { value: "", label: "All" },
  { value: "C2B_USSD_PUSH", label: "Collection (C2B)" },
  { value: "B2C_DISBURSEMENT", label: "Disbursement (B2C)" },
];

export const ENVIRONMENT_OPTIONS: StaticSearchableSelectOption[] = [
  { value: "uat", label: "UAT" },
  { value: "production", label: "Production" },
];

export const COMMISSION_TYPE_OPTIONS: StaticSearchableSelectOption[] = [
  { value: "PERCENT", label: "Percent" },
  { value: "FIXED", label: "Fixed amount" },
];
