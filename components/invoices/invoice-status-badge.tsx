type InvoiceStatusBadgeProps = {
  status?: unknown;
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const normalized = normalizeStatus(status);

  const className =
    normalized.includes("PAID") || normalized.includes("APPROVED")
      ? "badge badge-success"
      : normalized.includes("DRAFT") || normalized.includes("PENDING")
        ? "badge badge-warning"
        : normalized.includes("DUE")
          ? "badge badge-warning"
        : normalized.includes("VOID") || normalized.includes("REJECT")
          ? "badge badge-danger"
          : "badge badge-muted";

  return <span className={className}>{normalized}</span>;
}

function normalizeStatus(status: unknown) {
  if (Array.isArray(status)) {
    const activeStatus = status.find((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const record = item as Record<string, unknown>;
      return record.value === true && typeof record.key === "string" && record.key.trim();
    });

    if (activeStatus && typeof activeStatus === "object") {
      const key = (activeStatus as Record<string, unknown>).key;
      if (typeof key === "string") {
        return key.toUpperCase();
      }
    }

    const firstStatus = status.find((item) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const key = (item as Record<string, unknown>).key;
      return typeof key === "string" && key.trim();
    });

    if (firstStatus && typeof firstStatus === "object") {
      const key = (firstStatus as Record<string, unknown>).key;
      if (typeof key === "string") {
        return key.toUpperCase();
      }
    }
  }

  if (typeof status === "string" && status.trim()) {
    return status.toUpperCase();
  }

  if (typeof status === "number" || typeof status === "boolean") {
    return String(status).toUpperCase();
  }

  if (status && typeof status === "object") {
    const record = status as Record<string, unknown>;
    const value = record.name ?? record.label ?? record.value ?? record.status;

    if (typeof value === "string" && value.trim()) {
      return value.toUpperCase();
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value).toUpperCase();
    }
  }

  return "NOT PROVIDED";
}
