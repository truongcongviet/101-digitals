"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import {
  createInvoiceInputSchema,
  type CreateInvoiceFormInput,
  type CreateInvoiceInput
} from "@/lib/validations";

const today = new Date().toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function InvoiceForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateInvoiceFormInput, unknown, CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceInputSchema),
    defaultValues: {
      invoiceNumber: `INV${Date.now()}`,
      invoiceReference: `#${Date.now()}`,
      currency: "GBP",
      invoiceDate: today,
      dueDate: nextWeek,
      description: "Invoice is issued to customer",
      customerFirstName: "",
      customerLastName: "",
      customerEmail: "",
      customerMobileNumber: "",
      premise: "",
      countryCode: "VN",
      postcode: "",
      county: "",
      city: "",
      documentName: "Bill",
      documentUrl: "http://url.com/#123",
      itemReference: "itemRef",
      itemName: "",
      itemDescription: "",
      itemUOM: "KG",
      quantity: 1,
      rate: 1000,
      invoiceTaxPercent: 10,
      invoiceDiscountAmount: 10,
      itemTaxAmount: 10,
      itemDiscountPercent: 10,
      bankId: "",
      sortCode: "09-01-01",
      accountName: "",
      accountNumber: ""
    }
  });

  const quantity = Number(watch("quantity") || 0);
  const rate = Number(watch("rate") || 0);
  const taxPercent = Number(watch("invoiceTaxPercent") || 0);
  const discountAmount = Number(watch("invoiceDiscountAmount") || 0);
  const subtotal = quantity * rate;
  const total = subtotal + subtotal * (taxPercent / 100) - discountAmount;

  async function onSubmit(input: CreateInvoiceInput) {
    setServerError(null);
    setSuccessMessage(null);

    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.assign("/login?next=/invoices/new");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { message?: string; details?: unknown }
        | null;
      setServerError(formatCreateInvoiceError(payload));
      return;
    }

    setSuccessMessage("Invoice created successfully.");
    reset({
      ...input,
      invoiceNumber: `INV${Date.now()}`,
      invoiceReference: `#${Date.now()}`
    });
  }

  return (
    <form className="stack" onSubmit={handleSubmit(onSubmit)}>
      <div className="page-header">
        <div>
          <h1 className="page-title">New invoice</h1>
          <p className="page-subtitle">Create a single-line-item invoice through the secure BFF route.</p>
        </div>
        <div className="nav-actions">
          <Link className="button button-secondary" href="/">
            <ArrowLeft size={17} aria-hidden="true" />
            Back
          </Link>
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            <Save size={17} aria-hidden="true" />
            {isSubmitting ? "Creating..." : "Create invoice"}
          </button>
        </div>
      </div>

      {successMessage ? <div className="toast">{successMessage}</div> : null}
      {serverError ? <div className="status-message status-error">{serverError}</div> : null}

      <section className="panel">
        <div className="panel-body stack">
          <h2 className="form-section-title">Invoice details</h2>
          <div className="grid-3">
            <FormField label="Invoice number" error={errors.invoiceNumber?.message}>
              <input className="input" {...register("invoiceNumber")} />
            </FormField>
            <FormField label="Reference" error={errors.invoiceReference?.message}>
              <input className="input" {...register("invoiceReference")} />
            </FormField>
            <FormField label="Currency" error={errors.currency?.message}>
              <select className="select" {...register("currency")}>
                <option value="GBP">GBP</option>
                <option value="SGD">SGD</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </FormField>
          </div>
          <div className="grid-3">
            <FormField label="Invoice date" error={errors.invoiceDate?.message}>
              <input className="input" type="date" {...register("invoiceDate")} />
            </FormField>
            <FormField label="Due date" error={errors.dueDate?.message}>
              <input className="input" type="date" {...register("dueDate")} />
            </FormField>
            <FormField label="Description" error={errors.description?.message}>
              <input className="input" {...register("description")} />
            </FormField>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-body stack">
          <h2 className="form-section-title">Customer</h2>
          <div className="grid-4">
            <FormField label="First name" error={errors.customerFirstName?.message}>
              <input className="input" {...register("customerFirstName")} />
            </FormField>
            <FormField label="Last name" error={errors.customerLastName?.message}>
              <input className="input" {...register("customerLastName")} />
            </FormField>
            <FormField label="Email" error={errors.customerEmail?.message}>
              <input className="input" type="email" {...register("customerEmail")} />
            </FormField>
            <FormField label="Mobile number" error={errors.customerMobileNumber?.message}>
              <input className="input" {...register("customerMobileNumber")} />
            </FormField>
          </div>
          <div className="grid-3">
            <FormField label="Premise" error={errors.premise?.message}>
              <input className="input" {...register("premise")} />
            </FormField>
            <FormField label="Country code" error={errors.countryCode?.message}>
              <select className="select" {...register("countryCode")}>
                <option value="VN">VN - Vietnam</option>
                <option value="SG">SG - Singapore</option>
                <option value="GB">GB - United Kingdom</option>
                <option value="US">US - United States</option>
                <option value="AU">AU - Australia</option>
                <option value="MY">MY - Malaysia</option>
                <option value="ID">ID - Indonesia</option>
                <option value="TH">TH - Thailand</option>
                <option value="PH">PH - Philippines</option>
              </select>
            </FormField>
            <FormField label="Postcode" error={errors.postcode?.message}>
              <input className="input" {...register("postcode")} />
            </FormField>
          </div>
          <div className="grid-2">
            <FormField label="County" error={errors.county?.message}>
              <input className="input" {...register("county")} />
            </FormField>
            <FormField label="City" error={errors.city?.message}>
              <input className="input" {...register("city")} />
            </FormField>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-body stack">
          <h2 className="form-section-title">Document</h2>
          <div className="grid-2">
            <FormField label="Document name" error={errors.documentName?.message}>
              <input className="input" {...register("documentName")} />
            </FormField>
            <FormField label="Document URL" error={errors.documentUrl?.message}>
              <input className="input" type="url" {...register("documentUrl")} />
            </FormField>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-body stack">
          <h2 className="form-section-title">Line item</h2>
          <div className="grid-4">
            <FormField label="Item reference" error={errors.itemReference?.message}>
              <input className="input" {...register("itemReference")} />
            </FormField>
            <FormField label="Item name" error={errors.itemName?.message}>
              <input className="input" {...register("itemName")} />
            </FormField>
            <FormField label="Unit of measure" error={errors.itemUOM?.message}>
              <input className="input" {...register("itemUOM")} />
            </FormField>
            <FormField label="Quantity" error={errors.quantity?.message}>
              <input className="input" type="number" step="0.01" {...register("quantity")} />
            </FormField>
          </div>
          <div className="grid-3">
            <FormField label="Rate" error={errors.rate?.message}>
              <input className="input" type="number" step="0.01" {...register("rate")} />
            </FormField>
            <FormField label="Item tax amount" error={errors.itemTaxAmount?.message}>
              <input className="input" type="number" step="0.01" {...register("itemTaxAmount")} />
            </FormField>
            <FormField label="Item discount (%)" error={errors.itemDiscountPercent?.message}>
              <input className="input" type="number" step="0.01" {...register("itemDiscountPercent")} />
            </FormField>
          </div>
          <FormField label="Item description" error={errors.itemDescription?.message}>
            <textarea className="textarea" {...register("itemDescription")} />
          </FormField>
          <div className="total-strip grid-3" aria-live="polite">
            <strong>Subtotal: {formatMoney(subtotal)}</strong>
            <strong>Invoice tax: {formatMoney(subtotal * (taxPercent / 100))}</strong>
            <strong>Estimated total: {formatMoney(total)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-body stack">
          <h2 className="form-section-title">Invoice extensions</h2>
          <div className="grid-2">
            <FormField label="Invoice tax (%)" error={errors.invoiceTaxPercent?.message}>
              <input className="input" type="number" step="0.01" {...register("invoiceTaxPercent")} />
            </FormField>
            <FormField label="Invoice discount amount" error={errors.invoiceDiscountAmount?.message}>
              <input className="input" type="number" step="0.01" {...register("invoiceDiscountAmount")} />
            </FormField>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-body stack">
          <h2 className="form-section-title">Bank account</h2>
          <div className="grid-4">
            <FormField label="Bank ID" error={errors.bankId?.message}>
              <input className="input" {...register("bankId")} />
            </FormField>
            <FormField label="Sort code" error={errors.sortCode?.message}>
              <input className="input" {...register("sortCode")} />
            </FormField>
            <FormField label="Account name" error={errors.accountName?.message}>
              <input className="input" {...register("accountName")} />
            </FormField>
            <FormField label="Account number" error={errors.accountNumber?.message}>
              <input className="input" {...register("accountNumber")} />
            </FormField>
          </div>
        </div>
      </section>
    </form>
  );
}

function formatCreateInvoiceError(payload: { message?: string; details?: unknown } | null) {
  const message = payload?.message ?? "Unable to create invoice";
  const details = payload?.details;

  if (!details) {
    return message;
  }

  if (typeof details === "string") {
    return `${message}: ${details}`;
  }

  if (typeof details === "object") {
    const record = details as Record<string, unknown>;
    const errors = record.errors;

    if (Array.isArray(errors) && errors.length > 0) {
      return `${message}: ${errors
        .map((error) => {
          if (error && typeof error === "object") {
            const item = error as Record<string, unknown>;
            return [item.code, item.message].filter(Boolean).join(" - ");
          }

          return String(error);
        })
        .join("; ")}`;
    }

    if (typeof record.message === "string") {
      return `${message}: ${record.message}`;
    }
  }

  return message;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(Number.isFinite(value) ? value : 0);
}
