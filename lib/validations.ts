import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export const invoiceQuerySchema = z.object({
  sortBy: z.string().default("CREATED_DATE"),
  ordering: z.enum(["ASCENDING", "DESCENDING"]).default("DESCENDING"),
  pageNum: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  keyword: z.string().trim().optional(),
  status: z.string().trim().optional(),
  fromDate: z.string().trim().optional(),
  toDate: z.string().trim().optional()
});

export const createInvoiceInputSchema = z
  .object({
    invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
    invoiceReference: z.string().trim().min(1, "Reference is required"),
    currency: z
      .preprocess(
        (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
        z.enum(["GBP", "SGD", "USD", "EUR"], {
          errorMap: () => ({ message: "Select a supported currency" })
        })
      )
      .default("GBP"),
    invoiceDate: z.string().min(1, "Invoice date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    description: z.string().trim().min(1, "Description is required"),
    customerFirstName: z.string().trim().min(1, "Customer first name is required"),
    customerLastName: z.string().trim().min(1, "Customer last name is required"),
    customerEmail: z.string().email("Enter a valid customer email"),
    customerMobileNumber: z.string().trim().min(1, "Customer mobile number is required"),
    premise: z.string().trim().min(1, "Premise is required"),
    countryCode: z
      .preprocess(
        (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
        z.enum(["VN", "SG", "GB", "US", "AU", "MY", "ID", "TH", "PH"], {
          errorMap: () => ({ message: "Select a valid ISO2 country code" })
        })
      ),
    postcode: z.string().trim().min(1, "Postcode is required"),
    county: z.string().trim().min(1, "County is required"),
    city: z.string().trim().min(1, "City is required"),
    documentName: z.string().trim().min(1, "Document name is required"),
    documentUrl: z.string().url("Enter a valid document URL"),
    itemReference: z.string().trim().min(1, "Item reference is required"),
    itemName: z.string().trim().min(1, "Item name is required"),
    itemDescription: z.string().trim().min(1, "Item description is required"),
    itemUOM: z.string().trim().min(1, "Unit of measure is required"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    rate: z.coerce.number().positive("Rate must be greater than 0"),
    invoiceTaxPercent: z.coerce.number().min(0).max(100).default(0),
    invoiceDiscountAmount: z.coerce.number().min(0).default(0),
    itemTaxAmount: z.coerce.number().min(0).default(0),
    itemDiscountPercent: z.coerce.number().min(0).max(100).default(0),
    bankId: z.string().trim().optional(),
    sortCode: z.string().trim().min(1, "Sort code is required"),
    accountName: z.string().trim().min(1, "Account name is required"),
    accountNumber: z.string().trim().min(1, "Account number is required")
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.invoiceDate), {
    message: "Due date must be on or after invoice date",
    path: ["dueDate"]
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;
export type CreateInvoiceFormInput = z.input<typeof createInvoiceInputSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

export function buildCreateInvoicePayload(input: CreateInvoiceInput) {
  return {
    invoices: [
      {
        bankAccount: {
          bankId: input.bankId ?? "",
          sortCode: input.sortCode,
          accountNumber: input.accountNumber,
          accountName: input.accountName
        },
        customer: {
          firstName: input.customerFirstName,
          lastName: input.customerLastName,
          contact: {
            email: input.customerEmail,
            mobileNumber: input.customerMobileNumber
          },
          addresses: [
            {
              premise: input.premise,
              countryCode: input.countryCode.toUpperCase(),
              postcode: input.postcode,
              county: input.county,
              city: input.city,
              addressType: "BILLING"
            }
          ]
        },
        documents: [
          {
            documentId: createDocumentId(),
            documentName: input.documentName,
            documentUrl: input.documentUrl
          }
        ],
        invoiceReference: input.invoiceReference,
        invoiceNumber: input.invoiceNumber,
        currency: input.currency.toUpperCase(),
        invoiceDate: input.invoiceDate,
        dueDate: input.dueDate,
        description: input.description,
        customFields: [
          {
            key: "invoiceCustomField",
            value: "value"
          }
        ],
        extensions: [
          {
            addDeduct: "ADD",
            value: input.invoiceTaxPercent,
            type: "PERCENTAGE",
            name: "tax"
          },
          {
            addDeduct: "DEDUCT",
            type: "FIXED_VALUE",
            value: input.invoiceDiscountAmount,
            name: "discount"
          }
        ],
        items: [
          {
            itemReference: input.itemReference,
            description: input.itemDescription,
            quantity: input.quantity,
            rate: input.rate,
            itemName: input.itemName,
            itemUOM: input.itemUOM,
            customFields: [
              {
                key: "taxiationAndDiscounts_Name",
                value: "VAT"
              }
            ],
            extensions: [
              {
                addDeduct: "ADD",
                value: input.itemTaxAmount,
                type: "FIXED_VALUE",
                name: "tax"
              },
              {
                addDeduct: "DEDUCT",
                value: input.itemDiscountPercent,
                type: "PERCENTAGE",
                name: "tax"
              }
            ]
          }
        ]
      }
    ]
  };
}

function createDocumentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `document-${Date.now()}`;
}
