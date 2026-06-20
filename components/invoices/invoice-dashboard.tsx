"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { Copy, Eye, RefreshCcw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InvoiceDetailModal } from "@/components/invoices/invoice-detail-modal";
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge";
import type { InvoiceListResult, InvoiceRecord } from "@/types/invoice";

type QueryState = {
  keyword: string;
  status: string;
  fromDate: string;
  toDate: string;
  sortBy: string;
  ordering: "ASCENDING" | "DESCENDING";
  pageNum: number;
  pageSize: number;
};

const DEFAULT_QUERY: QueryState = {
  keyword: "",
  status: "",
  fromDate: "",
  toDate: "",
  sortBy: "CREATED_DATE",
  ordering: "DESCENDING",
  pageNum: 1,
  pageSize: 10
};

export function InvoiceDashboard() {
  const [query, setQuery] = useState<QueryState>(DEFAULT_QUERY);
  const [result, setResult] = useState<InvoiceListResult>({
    invoices: [],
    total: 0,
    pageNum: 1,
    pageSize: 10
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  const totalPages = Math.max(1, Math.ceil(result.total / query.pageSize));

  const columns = useMemo<ColumnDef<InvoiceRecord>[]>(
    () => [
      {
        header: "Invoice",
        cell: ({ row }) => {
          const invoice = row.original;
          const label = toDisplayText(invoice.invoiceNumber ?? invoice.invoiceReference ?? invoice.id, "Unknown");
          return <strong>{label}</strong>;
        }
      },
      {
        header: "Customer",
        cell: ({ row }) => formatCustomer(row.original)
      },
      {
        header: "Status",
        cell: ({ row }) => <InvoiceStatusBadge status={getInvoiceStatus(row.original)} />
      },
      {
        header: "Amount",
        cell: ({ row }) => formatMoney(row.original.totalAmount ?? row.original.amount, row.original.currency)
      },
      {
        header: "Created",
        cell: ({ row }) =>
          formatDate(row.original.createdDate ?? row.original.createdAt ?? row.original.invoiceDate)
      },
      {
        header: "Due",
        cell: ({ row }) => formatDate(row.original.dueDate)
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => {
          const invoice = row.original;
          const id = toDisplayText(invoice.id ?? invoice.invoiceId, "");
          const copyValue = toDisplayText(invoice.invoiceNumber ?? invoice.invoiceReference ?? id, "");

          return (
            <div className="nav-actions">
              <button
                className="button button-secondary button-icon"
                type="button"
                title="Copy invoice reference"
                onClick={() => copyValue && navigator.clipboard.writeText(copyValue)}
              >
                <Copy size={16} aria-hidden="true" />
              </button>
              <button
                className="button button-secondary button-icon"
                type="button"
                title="View invoice detail"
                onClick={() => openInvoiceDetail(invoice)}
              >
                <Eye size={16} aria-hidden="true" />
              </button>
            </div>
          );
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data: result.invoices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages
  });

  const loadInvoices = useCallback(
    async (ignoreResult?: () => boolean) => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== "") {
          params.set(key, String(value));
        }
      });

      try {
        const response = await fetch(`/api/invoices?${params.toString()}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          if (response.status === 401) {
            window.location.href = "/login?next=/";
            return;
          }
          throw new Error(payload?.message ?? "Unable to load invoices");
        }

        const payload = await response.json();
        if (ignoreResult?.()) {
          return;
        }
        setResult(normalizeInvoiceList(payload, query.pageNum, query.pageSize));
      } catch (err) {
        if (!ignoreResult?.()) {
          setError((err as Error).message);
        }
      } finally {
        if (!ignoreResult?.()) {
          setIsLoading(false);
        }
      }
    },
    [query]
  );

  useEffect(() => {
    let ignore = false;
    loadInvoices(() => ignore);
    return () => {
      ignore = true;
    };
  }, [loadInvoices, reloadKey]);

  function updateQuery(partial: Partial<QueryState>) {
    setQuery((current) => ({ ...current, pageNum: 1, ...partial }));
  }

  async function openInvoiceDetail(invoice: InvoiceRecord) {
    setSelectedInvoice(invoice);
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Search, filter, sort and page through invoices securely via BFF APIs.</p>
        </div>
        <button className="button button-secondary" type="button" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCcw size={17} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <section className="panel">
        <div className="panel-body toolbar">
          <label className="field">
            <span className="label">Search</span>
            <span style={{ position: "relative" }}>
              <Search
                size={16}
                aria-hidden="true"
                style={{ left: 12, position: "absolute", top: 13, color: "var(--muted)" }}
              />
              <input
                className="input"
                value={query.keyword}
                onChange={(event) => updateQuery({ keyword: event.target.value })}
                placeholder="Keyword"
                style={{ paddingLeft: 36 }}
              />
            </span>
          </label>

          <label className="field">
            <span className="label">Status</span>
            <input
              className="input"
              value={query.status}
              onChange={(event) => updateQuery({ status: event.target.value })}
              placeholder="Paid"
            />
          </label>

          <label className="field">
            <span className="label">From</span>
            <input
              className="input"
              type="date"
              value={query.fromDate}
              onChange={(event) => updateQuery({ fromDate: event.target.value })}
            />
          </label>

          <label className="field">
            <span className="label">To</span>
            <input
              className="input"
              type="date"
              value={query.toDate}
              onChange={(event) => updateQuery({ toDate: event.target.value })}
            />
          </label>

          <label className="field">
            <span className="label">Sort</span>
            <select
              className="select"
              value={query.sortBy}
              onChange={(event) => updateQuery({ sortBy: event.target.value })}
            >
              <option value="CREATED_DATE">Created date</option>
              <option value="INVOICE_DATE">Invoice date</option>
              <option value="DUE_DATE">Due date</option>
              <option value="INVOICE_NUMBER">Invoice number</option>
            </select>
          </label>

          <label className="field">
            <span className="label">Order</span>
            <select
              className="select"
              value={query.ordering}
              onChange={(event) => updateQuery({ ordering: event.target.value as QueryState["ordering"] })}
            >
              <option value="DESCENDING">Desc</option>
              <option value="ASCENDING">Asc</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        {error ? <div className="status-message status-error">{error}</div> : null}
        {isLoading ? <div className="status-message">Loading invoices...</div> : null}
        {!isLoading && !error ? (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length}>
                        <div className="empty-state">No invoices found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Page {query.pageNum} of {totalPages} ({result.total} total)
              </span>
              <div className="nav-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={query.pageNum <= 1}
                  onClick={() => setQuery((current) => ({ ...current, pageNum: current.pageNum - 1 }))}
                >
                  Previous
                </button>
                <select
                  className="select"
                  value={query.pageSize}
                  onChange={(event) => updateQuery({ pageSize: Number(event.target.value) })}
                  aria-label="Rows per page"
                >
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                </select>
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={query.pageNum >= totalPages}
                  onClick={() => setQuery((current) => ({ ...current, pageNum: current.pageNum + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>

      {selectedInvoice ? (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => {
            setSelectedInvoice(null);
          }}
        />
      ) : null}
    </div>
  );
}

function normalizeInvoiceList(payload: unknown, pageNum: number, pageSize: number): InvoiceListResult {
  if (Array.isArray(payload)) {
    return { invoices: payload as InvoiceRecord[], total: payload.length, pageNum, pageSize };
  }

  if (!payload || typeof payload !== "object") {
    return { invoices: [], total: 0, pageNum, pageSize };
  }

  const record = payload as Record<string, unknown>;
  const invoices = firstArray(record, ["invoices", "data", "items", "content", "results", "records"]);
  const total = firstNumber(record, ["total", "totalItems", "totalElements", "count", "totalRecords"]);

  return {
    invoices: invoices as InvoiceRecord[],
    total: total ?? invoices.length,
    pageNum,
    pageSize
  };
}

function firstArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  return [];
}

function firstNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number") {
      return value;
    }
  }

  return undefined;
}

function getInvoiceStatus(invoice: InvoiceRecord) {
  return (
    invoice.status ??
    invoice.invoiceStatus ??
    invoice.paymentStatus ??
    invoice.state ??
    invoice.workflowStatus ??
    getNestedValue(invoice, ["status", "name"]) ??
    getNestedValue(invoice, ["payment", "status"]) ??
    getNestedValue(invoice, ["invoice", "status"])
  );
}

function formatCustomer(invoice: InvoiceRecord) {
  if (invoice.customerName) {
    return invoice.customerName;
  }

  const customer = invoice.customer;

  if (!customer || typeof customer !== "object") {
    return "-";
  }

  const record = customer as Record<string, unknown>;
  const fullName = [record.firstName, record.lastName]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .join(" ");

  if (fullName) {
    return fullName;
  }

  if (typeof record.name === "string") {
    return record.name;
  }

  const contact = record.contact;
  if (contact && typeof contact === "object") {
    const email = (contact as Record<string, unknown>).email;
    if (typeof email === "string") {
      return email;
    }
  }

  return "-";
}

function getNestedValue(value: unknown, path: string[]) {
  let current = value;

  for (const key of path) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function formatMoney(value?: unknown, currency: unknown = "SGD") {
  if (typeof value !== "number") {
    return "-";
  }

  const currencyCode = typeof currency === "string" && currency.length === 3 ? currency : "SGD";

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: currencyCode
  }).format(value);
}

function formatDate(value?: unknown) {
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

function toDisplayText(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}
