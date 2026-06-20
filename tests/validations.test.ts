import { describe, expect, it } from "vitest";
import { getTokenUrl } from "@/lib/env";
import { buildCreateInvoicePayload, createInvoiceInputSchema, loginSchema } from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts Postman sandbox username shape", () => {
    expect(
      loginSchema.safeParse({
        username: "94756921275",
        password: "secret"
      }).success
    ).toBe(true);
  });

  it("rejects blank username", () => {
    expect(
      loginSchema.safeParse({
        username: "",
        password: "secret"
      }).success
    ).toBe(false);
  });
});

describe("getTokenUrl", () => {
  it("matches the Postman token URL when auth base is the host root", () => {
    process.env.AUTH_BASE_URL = "https://is-wso2-dev.101digital.io";

    expect(getTokenUrl()).toBe("https://is-wso2-dev.101digital.io/t/101digital.core/oauth2/token");
  });
});

describe("createInvoiceInputSchema", () => {
  const validInput = {
    invoiceNumber: "IV1649318870503",
    invoiceReference: "REF-001",
    currency: "GBP",
    invoiceDate: "2026-06-20",
    dueDate: "2026-06-27",
    description: "Invoice is issued to Akila Jayasinghe",
    customerFirstName: "Nguyen",
    customerLastName: "Dung 2",
    customerEmail: "nguyendung2@101digital.io",
    customerMobileNumber: "+6597594971",
    premise: "CT11",
    countryCode: "VN",
    postcode: "1000",
    county: "hoangmai",
    city: "hanoi",
    documentName: "Bill",
    documentUrl: "http://url.com/#123",
    itemReference: "itemRef",
    itemName: "Honda Motor",
    itemDescription: "Honda RC150",
    itemUOM: "KG",
    quantity: 1,
    rate: 1000,
    invoiceTaxPercent: 10,
    invoiceDiscountAmount: 10,
    itemTaxAmount: 10,
    itemDiscountPercent: 10,
    bankId: "",
    sortCode: "09-01-01",
    accountName: "John Terry",
    accountNumber: "12345678"
  };

  it("accepts a single-line-item invoice based on the Postman body", () => {
    expect(createInvoiceInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects due date before invoice date", () => {
    expect(
      createInvoiceInputSchema.safeParse({
        ...validInput,
        dueDate: "2026-06-19"
      }).success
    ).toBe(false);
  });

  it("builds the API payload shape used by the Postman collection", () => {
    const parsed = createInvoiceInputSchema.parse(validInput);
    const payload = buildCreateInvoicePayload(parsed);
    const invoice = payload.invoices[0];

    expect(payload.invoices).toHaveLength(1);
    expect(invoice.bankAccount.sortCode).toBe("09-01-01");
    expect(invoice.customer.firstName).toBe("Nguyen");
    expect(invoice.customer.contact.email).toBe("nguyendung2@101digital.io");
    expect(invoice.customer.addresses[0].addressType).toBe("BILLING");
    expect(invoice.documents[0].documentName).toBe("Bill");
    expect(invoice.extensions[0]).toMatchObject({
      addDeduct: "ADD",
      type: "PERCENTAGE",
      name: "tax"
    });
    expect(invoice.items).toHaveLength(1);
    expect(invoice.items[0]).toMatchObject({
      itemReference: "itemRef",
      rate: 1000,
      itemName: "Honda Motor",
      itemUOM: "KG"
    });
  });
});
