"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import type { InvoiceRecord } from "@/types/invoice";

type InvoiceDetailModalProps = {
  invoice: InvoiceRecord;
  detail?: unknown;
  onClose: () => void;
};

export function InvoiceDetailModal({
  invoice,
  detail,
  onClose
}: InvoiceDetailModalProps) {
  const source = normalizeDetail(detail) ?? invoice;
  const items = getArray(source, "items");
  const customer = getObject(source, "customer");
  const bankAccount = getObject(source, "bankAccount");
  const documents = getArray(source, "documents");
  const customFields = getArray(source, "customFields");
  const extensions = getArray(source, "extensions");
  const additionalFields = getAdditionalFields(source);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="invoice-detail-title" className="modal-title">
              {toText(getValue(source, "invoiceNumber") ?? getValue(source, "invoiceReference"), "Invoice detail")}
            </h2>
            <p className="modal-subtitle">{toText(getValue(source, "invoiceReference"), "No reference")}</p>
          </div>
          <button className="button button-secondary button-icon" type="button" onClick={onClose} title="Close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="detail-grid">
          <DetailItem label="Status">
            <InvoiceStatusBadge status={getStatus(source)} />
          </DetailItem>
          <DetailItem label="Amount">{formatMoney(getValue(source, "totalAmount") ?? getValue(source, "amount"), getValue(source, "currency"))}</DetailItem>
          <DetailItem label="Invoice date">{formatDate(getValue(source, "invoiceDate") ?? getValue(source, "createdDate"))}</DetailItem>
          <DetailItem label="Due date">{formatDate(getValue(source, "dueDate"))}</DetailItem>
        </div>

        <div className="detail-section">
          <h3 className="detail-section-title">Customer</h3>
          <div className="detail-grid">
            <DetailItem label="Name">{formatCustomer(customer, invoice)}</DetailItem>
            <DetailItem label="Email">{toText(getNested(customer, ["contact", "email"]) ?? getValue(customer, "email"), "-")}</DetailItem>
            <DetailItem label="Mobile">{toText(getNested(customer, ["contact", "mobileNumber"]), "-")}</DetailItem>
            <DetailItem label="Address">{formatAddress(getArray(customer, "addresses")[0])}</DetailItem>
          </div>
        </div>

        {items.length ? (
          <div className="detail-section">
            <h3 className="detail-section-title">Line item</h3>
            <div className="table-wrap">
              <table className="table compact-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>UOM</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{toText(getValue(item, "itemName") ?? getValue(item, "name"), "-")}</td>
                      <td>{toText(getValue(item, "description"), "-")}</td>
                      <td>{toText(getValue(item, "quantity"), "-")}</td>
                      <td>{formatMoney(getValue(item, "rate") ?? getValue(item, "unitPrice"), getValue(source, "currency"))}</td>
                      <td>{toText(getValue(item, "itemUOM"), "-")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        <div className="detail-section">
          <h3 className="detail-section-title">Payment</h3>
          <div className="detail-grid">
            <DetailItem label="Account name">{toText(getValue(bankAccount, "accountName"), "-")}</DetailItem>
            <DetailItem label="Account number">{toText(getValue(bankAccount, "accountNumber"), "-")}</DetailItem>
            <DetailItem label="Sort code">{toText(getValue(bankAccount, "sortCode"), "-")}</DetailItem>
            <DetailItem label="Bank ID">{toText(getValue(bankAccount, "bankId"), "-")}</DetailItem>
          </div>
        </div>

        {documents.length ? (
          <div className="detail-section">
            <h3 className="detail-section-title">Documents</h3>
            <div className="detail-list">
              {documents.map((document, index) => (
                <div className="detail-list-row" key={index}>
                  <strong>{toText(getValue(document, "documentName"), "Document")}</strong>
                  <span>{toText(getValue(document, "documentUrl"), "-")}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {customFields.length ? (
          <div className="detail-section">
            <h3 className="detail-section-title">Custom fields</h3>
            <KeyValueList rows={customFields} />
          </div>
        ) : null}

        {extensions.length ? (
          <div className="detail-section">
            <h3 className="detail-section-title">Extensions</h3>
            <KeyValueList rows={extensions} />
          </div>
        ) : null}

        {additionalFields.length ? (
          <div className="detail-section">
            <h3 className="detail-section-title">Additional data from list response</h3>
            <div className="detail-grid">
              {additionalFields.map(([key, value]) => (
                <DetailItem key={key} label={formatLabel(key)}>
                  {formatUnknown(value)}
                </DetailItem>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{children}</span>
    </div>
  );
}

function KeyValueList({ rows }: { rows: unknown[] }) {
  return (
    <div className="detail-list">
      {rows.map((row, index) => {
        const record = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        const title = toText(record.key ?? record.name ?? record.type ?? record.documentName, `Item ${index + 1}`);

        return (
          <div className="detail-list-row" key={index}>
            <strong>{title}</strong>
            <span>{formatUnknown(record.value ?? record.addDeduct ?? row)}</span>
          </div>
        );
      })}
    </div>
  );
}

function normalizeDetail(detail: unknown) {
  if (!detail || typeof detail !== "object") {
    return undefined;
  }

  const record = detail as Record<string, unknown>;
  const data = record.data;

  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }

  const invoice = record.invoice;
  if (invoice && typeof invoice === "object") {
    return invoice as Record<string, unknown>;
  }

  return record;
}

function getValue(source: unknown, key: string) {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  return (source as Record<string, unknown>)[key];
}

function getObject(source: unknown, key: string) {
  const value = getValue(source, key);
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getArray(source: unknown, key: string) {
  const value = getValue(source, key);
  return Array.isArray(value) ? value : [];
}

function getNested(source: unknown, path: string[]) {
  let current = source;

  for (const key of path) {
    current = getValue(current, key);
    if (current === undefined || current === null) {
      return undefined;
    }
  }

  return current;
}

function getStatus(source: unknown) {
  return (
    getValue(source, "status") ??
    getValue(source, "invoiceStatus") ??
    getValue(source, "paymentStatus") ??
    getValue(source, "state") ??
    getValue(source, "workflowStatus") ??
    getNested(source, ["payment", "status"])
  );
}

function formatCustomer(customer: Record<string, unknown>, fallback: InvoiceRecord) {
  const firstName = toText(customer.firstName, "");
  const lastName = toText(customer.lastName, "");
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    toText(customer.name, "") ||
    toText(fallback.customerName, "") ||
    toText(getNested(customer, ["contact", "email"]), "-")
  );
}

function formatAddress(address: unknown) {
  if (!address || typeof address !== "object") {
    return "-";
  }

  const record = address as Record<string, unknown>;
  return [record.premise, record.city, record.county, record.postcode, record.countryCode]
    .map((value) => toText(value, ""))
    .filter(Boolean)
    .join(", ") || "-";
}

function toText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function formatMoney(value: unknown, currency: unknown = "SGD") {
  if (typeof value !== "number") {
    return "-";
  }

  const currencyCode = typeof currency === "string" && currency.length === 3 ? currency : "SGD";

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currencyCode
  }).format(value);
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-SG", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);
}

const DISPLAYED_KEYS = new Set([
  "id",
  "invoiceId",
  "invoiceNumber",
  "invoiceReference",
  "reference",
  "status",
  "invoiceStatus",
  "paymentStatus",
  "state",
  "workflowStatus",
  "totalAmount",
  "amount",
  "currency",
  "invoiceDate",
  "createdDate",
  "createdAt",
  "dueDate",
  "customer",
  "customerName",
  "bankAccount",
  "items",
  "documents",
  "customFields",
  "extensions"
]);

function getAdditionalFields(source: unknown) {
  if (!source || typeof source !== "object") {
    return [];
  }

  return Object.entries(source as Record<string, unknown>)
    .filter(([key, value]) => !DISPLAYED_KEYS.has(key) && value !== undefined && value !== null && value !== "")
    .slice(0, 24);
}

function formatUnknown(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatUnknown(item))
      .filter(Boolean)
      .join(", ");
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const compact: string = Object.entries(record)
      .filter(([, nestedValue]) => nestedValue !== undefined && nestedValue !== null && nestedValue !== "")
      .slice(0, 6)
      .map(([key, nestedValue]) => `${formatLabel(key)}: ${formatUnknown(nestedValue)}`)
      .join("; ");

    return compact || "-";
  }

  return "-";
}

function formatLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
