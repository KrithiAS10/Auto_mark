import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import * as XLSX from "xlsx";
import vaishnaviLogo from "../assets/vaishnavi_automark.jpeg";

const COMPANY_DEFAULTS = {
  name: "VK TRADELINKS",
  address: "",
  city: "MANGALORE - 575 001",
  gstin: "29AAXFV0693D1ZJ",
  pan: "AAXFV0693D",
  phone: "",
  email: "",
};

const GST_RATE = 18;

const getSavedCompany = () => {
  try {
    const saved = localStorage.getItem("automark-company");
    return saved
      ? { ...COMPANY_DEFAULTS, ...JSON.parse(saved) }
      : COMPANY_DEFAULTS;
  } catch {
    return COMPANY_DEFAULTS;
  }
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
};

export default function Bill() {
  const location = useLocation();

  const cart = Array.isArray(location.state?.cart)
    ? location.state.cart
    : [];

  const [company, setCompany] = useState(getSavedCompany);

  const [customer, setCustomer] = useState({
    name: "",
    place: "",
    address: "",
    gstin: "",
    phone: "",
    serviceRequestNo: "",
    invoiceNo: `VK-${new Date().getFullYear()}-${Date.now()
      .toString()
      .slice(-6)}`,
    date: today(),
    salesRep: "",
    transport: "",
  });

  const [taxMode, setTaxMode] = useState("CGST_SGST");
  const [invoiceType, setInvoiceType] = useState(
    "TAX INVOICE - CREDIT"
  );

  const updateCompany = (event) => {
    const { name, value } = event.target;

    setCompany((previous) => {
      const updated = { ...previous, [name]: value };

      try {
        localStorage.setItem(
          "automark-company",
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error("Could not save company details:", error);
      }

      return updated;
    });
  };

  const updateCustomer = (event) => {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const inputClass =
    "invoice-input w-full min-w-0 rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-black outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

  const companyInputClass =
    "invoice-input min-w-0 flex-1 border-b border-gray-400 bg-transparent px-1 py-1 text-sm text-black outline-none focus:border-blue-600";

  const lines = cart.map((item) => {
    const product = item.product || {};
    const qty = Math.max(0, Number(item.quantity) || 0);
    const mrp = Number(product.mrp) || 0;
    const originalRate = Number(product.sellPrice) || 0;
    const discount = Math.min(
      100,
      Math.max(0, Number(product.discount) || 0)
    );

    const rate = originalRate * (1 - discount / 100);
    const taxable = rate * qty;

    const cgst =
      taxMode === "CGST_SGST"
        ? taxable * (GST_RATE / 200)
        : 0;

    const sgst =
      taxMode === "CGST_SGST"
        ? taxable * (GST_RATE / 200)
        : 0;

    const igst =
      taxMode === "IGST"
        ? taxable * (GST_RATE / 100)
        : 0;

    return {
      product,
      qty,
      mrp,
      rate,
      discount,
      taxable,
      cgst,
      sgst,
      igst,
      total: taxable + cgst + sgst + igst,
    };
  });

  const totalQty = lines.reduce(
    (sum, line) => sum + line.qty,
    0
  );

  const taxableTotal = lines.reduce(
    (sum, line) => sum + line.taxable,
    0
  );

  const totalCGST = lines.reduce(
    (sum, line) => sum + line.cgst,
    0
  );

  const totalSGST = lines.reduce(
    (sum, line) => sum + line.sgst,
    0
  );

  const totalIGST = lines.reduce(
    (sum, line) => sum + line.igst,
    0
  );

  const totalTax = totalCGST + totalSGST + totalIGST;
  const rawTotal = taxableTotal + totalTax;
  const grandTotal = Math.round(rawTotal);
  const roundOff = grandTotal - rawTotal;

  const downloadExcel = () => {
    if (!lines.length) {
      alert("Add products before downloading the invoice.");
      return;
    }

    const rows = [
      [company.name],
      [company.address || company.city],
      [`GSTIN: 29AAXFV0693D1ZJ`, `PAN: AAXFV0693D`],
      [`Phone: ${company.phone}`, `Email: ${company.email}`],
      [],
      [invoiceType],
      [],
      ["Customer", customer.name],
      ["Place", customer.place],
      ["Address", customer.address],
      ["Customer GSTIN", customer.gstin],
      ["Customer Phone", customer.phone],
      ["Invoice Number", customer.invoiceNo],
      ["Date", customer.date],
      ["PO Reference", customer.serviceRequestNo],
      ["Sales Representative", customer.salesRep],
      ["Transport", customer.transport],
      [],
      [
        "Sl.",
        "Part No./Code",
        "HSN Code",
        "Description",
        "MRP",
        "Qty",
        "Rate",
        "Discount %",
        "Taxable Amount",
        "CGST",
        "SGST",
        "IGST",
        "Line Total",
      ],
      ...lines.map((line, index) => [
        index + 1,
        line.product.partNo || "",
        line.product.hsnCode || "",
        line.product.description || "",
        line.mrp,
        line.qty,
        line.rate,
        line.discount,
        line.taxable,
        line.cgst,
        line.sgst,
        line.igst,
        line.total,
      ]),
      [],
      ["Total Quantity", totalQty],
      ["Taxable Value", taxableTotal],
      ["CGST", totalCGST],
      ["SGST", totalSGST],
      ["IGST", totalIGST],
      ["Total GST", totalTax],
      ["Round Off", roundOff],
      ["Grand Total", grandTotal],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 7 },
      { wch: 18 },
      { wch: 13 },
      { wch: 36 },
      { wch: 12 },
      { wch: 9 },
      { wch: 13 },
      { wch: 12 },
      { wch: 19 },
      { wch: 13 },
      { wch: 13 },
      { wch: 13 },
      { wch: 17 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Tax Invoice"
    );

    const safeName = customer.invoiceNo.replace(
      /[<>:"/\\|?*]/g,
      "_"
    );

    XLSX.writeFile(
      workbook,
      `AutoMark_${safeName || "Invoice"}.xlsx`
    );
  };

  return (
    <div className="bill-page min-h-screen bg-gray-200 p-3 text-black md:p-6">
      {/* Navigation */}
      <nav className="no-print mx-auto mb-4 flex max-w-6xl items-center justify-between rounded-md bg-slate-900 px-4 py-3 text-white">
        <Link to="/order" className="font-semibold hover:underline">
          ← Back to Orders
        </Link>
        <span className="font-semibold">Auto-Mark | Invoice</span>
      </nav>

      {/* Invoice paper */}
      <main className="invoice-paper mx-auto w-full max-w-6xl border border-black bg-white p-3 md:p-6">
        {/* Company header */}
        <header className="invoice-company grid grid-cols-1 gap-4 rounded-xl border-2 border-black p-4 md:grid-cols-2 md:p-5">
          <div className="flex min-w-0 flex-col justify-between gap-5">
            <img
              src={vaishnaviLogo}
              alt="Vaishnavi logo"
              className="h-auto max-h-24 w-full max-w-[270px] object-contain object-left"
            />

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold">
                <span className="shrink-0">GSTIN:</span>
                <input
                  name="gstin"
                  value={company.gstin}
                  onChange={updateCompany}
                  placeholder="Enter company GSTIN"
                  className={companyInputClass}
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-bold">
                <span className="shrink-0">PAN:</span>
                <input
                  name="pan"
                  value={company.pan}
                  onChange={updateCompany}
                  placeholder="Enter company PAN"
                  className={companyInputClass}
                />
              </label>
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-start text-left md:items-end md:text-right">
            <h1 className="break-words text-2xl font-bold md:text-3xl">
              {company.name}
            </h1>

            <input
              name="address"
              value={company.address}
              onChange={updateCompany}
              placeholder="Enter registered business address"
              className={`${companyInputClass} mt-4 w-full text-left md:text-right`}
            />

            <p className="mt-1 text-sm font-bold">
              {company.city}
            </p>

            <label className="mt-2 flex w-full items-center justify-start gap-1 text-sm md:justify-end">
              <strong>Phone:</strong>
              <input
                name="phone"
                value={company.phone}
                onChange={updateCompany}
                placeholder="Enter phone"
                className={`${companyInputClass} max-w-48 text-left md:text-right`}
              />
            </label>

            <label className="flex w-full items-center justify-start gap-1 text-sm md:justify-end">
              <strong>Email:</strong>
              <input
                type="email"
                name="email"
                value={company.email}
                onChange={updateCompany}
                placeholder="Enter email"
                className={`${companyInputClass} max-w-48 text-left md:text-right`}
              />
            </label>
          </div>

          <div className="col-span-1 border-t-2 border-black pt-3 text-center md:col-span-2">
            <h2 className="text-xl font-bold md:text-2xl">
              {invoiceType}
            </h2>
          </div>
        </header>

        {/* Customer and invoice information */}
        <section className="invoice-info mt-3 grid grid-cols-1 md:grid-cols-3">
          <div className="invoice-info-cell flex min-w-0 flex-col justify-between gap-5 border border-black p-3">
            <div className="space-y-3">
              <input
                name="name"
                value={customer.name}
                onChange={updateCustomer}
                placeholder="CUSTOMER / COMPANY NAME"
                className={`${inputClass} font-bold`}
              />

              <input
                name="place"
                value={customer.place}
                onChange={updateCustomer}
                placeholder="PLACE"
                className={inputClass}
              />

              <textarea
                name="address"
                value={customer.address}
                onChange={updateCustomer}
                placeholder="Customer address"
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold">
                GSTIN:
                <input
                  name="gstin"
                  value={customer.gstin}
                  onChange={updateCustomer}
                  placeholder="Customer GSTIN"
                  className={`${inputClass} mt-1 font-normal`}
                />
              </label>

              <label className="block text-sm font-bold">
                Phone:
                <input
                  name="phone"
                  value={customer.phone}
                  onChange={updateCustomer}
                  placeholder="Customer phone"
                  className={`${inputClass} mt-1 font-normal`}
                />
              </label>
            </div>
          </div>

          <div className="invoice-info-cell min-w-0 border-x border-b border-black p-3 text-sm">
            <label className="block">
              <strong>PO Ref #:</strong>
              <input
                name="serviceRequestNo"
                value={customer.serviceRequestNo}
                onChange={updateCustomer}
                placeholder="Enter PO reference"
                className={`${inputClass} mt-1`}
              />
            </label>

            <p className="mt-4 break-words">
              <strong>Order #:</strong> {customer.invoiceNo}
            </p>

            <p className="mt-4">
              <strong>State Code:</strong> 29
            </p>
          </div>

          <div className="invoice-info-cell min-w-0 border border-black p-3 text-sm">
            <label className="invoice-detail-row">
              <strong>Number:</strong>
              <input
                name="invoiceNo"
                value={customer.invoiceNo}
                onChange={updateCustomer}
                className={`${inputClass} font-bold`}
              />
            </label>

            <label className="invoice-detail-row mt-3">
              <strong>Date:</strong>
              <input
                type="date"
                name="date"
                value={customer.date}
                onChange={updateCustomer}
                className={`${inputClass} font-bold`}
              />
            </label>

            <label className="invoice-detail-row mt-3">
              <strong>Sales Rep.:</strong>
              <input
                name="salesRep"
                value={customer.salesRep}
                onChange={updateCustomer}
                placeholder="Sales representative"
                className={inputClass}
              />
            </label>

            <p className="mt-3">
              <strong>Page #:</strong> 1
            </p>

            <label className="invoice-detail-row mt-3">
              <strong>Transport:</strong>
              <input
                name="transport"
                value={customer.transport}
                onChange={updateCustomer}
                placeholder="Transport details"
                className={inputClass}
              />
            </label>
          </div>
        </section>

        {/* Products table */}
        <section className="invoice-table-wrap mt-3 w-full m-0">
          
<table className="invoice-table w-full border-collapse table-fixed">

            <thead>
              <tr>
                {[
                  "Sl.",
                  "Part No./Code",
                  "HSN Code",
                  "Description",
                  "MRP",
                  "Qty.",
                  "Rate",
                  "Disc%",
                  taxMode === "IGST" ? "IGST" : "CGST + SGST",
                  "Amount (₹)",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="border border-black p-2 text-center font-bold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {lines.map((line, index) => (
                <tr
                  key={
                    line.product._id ||
                    line.product.partNo ||
                    index
                  }
                >
                  <td className="border border-black p-1 text-center">
                    {index + 1}
                  </td>
                  <td className="break-words border border-black p-1">
                    {line.product.partNo || "-"}
                  </td>
                  <td className="break-words border border-black p-1">
                    {line.product.hsnCode || "-"}
                  </td>
                  <td className="break-words border border-black p-1">
                    {line.product.description || "-"}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatMoney(line.mrp)}
                  </td>
                  <td className="border border-black p-1 text-center">
                    {line.qty}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatMoney(line.rate)}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {line.discount}%
                  </td>
                  <td className="border border-black p-1 text-center">
                    {taxMode === "NONE"
                      ? "0%"
                      : taxMode === "IGST"
                        ? `${GST_RATE}%`
                        : `${GST_RATE / 2}% + ${GST_RATE / 2}%`}
                  </td>
                  <td className="border border-black p-1 text-right">
                    {formatMoney(line.total)}
                  </td>
                </tr>
              ))}

              {!lines.length && (
                <tr>
                  <td
                    colSpan={10}
                    className="border border-black p-8 text-center"
                  >
                    No products in this invoice.{" "}
                    <Link
                      to="/order"
                      className="font-semibold text-blue-700 underline"
                    >
                      Return to Orders
                    </Link>
                  </td>
                </tr>
              )}

              {lines.length > 0 && (
                <>
                  {taxMode === "CGST_SGST" && (
                    <>
                      <tr>
                        <td
                          colSpan={8}
                          className="border border-black p-1"
                        />
                        <td className="border border-black p-1 font-bold">
                          CGST
                        </td>
                        <td className="border border-black p-1 text-right">
                          {formatMoney(totalCGST)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          colSpan={8}
                          className="border border-black p-1"
                        />
                        <td className="border border-black p-1 font-bold">
                          SGST
                        </td>
                        <td className="border border-black p-1 text-right">
                          {formatMoney(totalSGST)}
                        </td>
                      </tr>
                    </>
                  )}

                  {taxMode === "IGST" && (
                    <tr>
                      <td
                        colSpan={8}
                        className="border border-black p-1"
                      />
                      <td className="border border-black p-1 font-bold">
                        IGST
                      </td>
                      <td className="border border-black p-1 text-right">
                        {formatMoney(totalIGST)}
                      </td>
                    </tr>
                  )}

                  <tr className="font-bold">
                    <td
                      colSpan={5}
                      className="border border-black p-2"
                    >
                      Total Qty: {totalQty}
                    </td>
                    <td
                      colSpan={4}
                      className="border border-black p-2 text-right"
                    >
                      GRAND TOTAL
                    </td>
                    <td className="border border-black p-2 text-right">
                      {formatMoney(grandTotal)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </section>

        {/* Totals and footer */}
        <footer className="invoice-footer mt-6 grid grid-cols-1 gap-5 border-t border-black pt-4 text-sm md:grid-cols-2">
          <div>
            <p>
              <strong>Taxable Value:</strong> ₹
              {formatMoney(taxableTotal)}
            </p>
            <p className="mt-1">
              <strong>Total GST:</strong> ₹{formatMoney(totalTax)}
            </p>
            <p className="mt-1">
              <strong>Round Off:</strong> ₹{formatMoney(roundOff)}
            </p>

            <p className="mt-4 font-bold">Amount in words:</p>
            <p className="mt-1 text-gray-500">
              Amount in words can be added here.
            </p>

            <p className="mt-4 font-bold">Terms & Conditions</p>
            <p className="mt-1">
              Subject to applicable business terms and conditions.
            </p>
          </div>

          <div className="flex flex-col items-start justify-between text-left md:items-end md:text-right">
            <p className="font-bold">For {company.name}</p>
            <p className="mt-12 border-t border-black px-3 pt-2">
              Authorized Signatory
            </p>
          </div>
        </footer>
      </main>

      {/* Invoice settings and actions */}
      <section className="no-print mx-auto mt-5 flex max-w-6xl flex-col justify-between gap-4 rounded-lg bg-white p-4 shadow md:flex-row md:items-center">
        <div className="flex flex-wrap gap-4 text-sm">
          <label>
            Invoice Type
            <select
              value={invoiceType}
              onChange={(event) =>
                setInvoiceType(event.target.value)
              }
              className="ml-2 rounded border border-gray-300 bg-white p-2 text-black"
            >
              <option>TAX INVOICE - CREDIT</option>
              <option>TAX INVOICE</option>
              <option>CASH BILL</option>
            </select>
          </label>

          <label>
            Tax
            <select
              value={taxMode}
              onChange={(event) => setTaxMode(event.target.value)}
              className="ml-2 rounded border border-gray-300 bg-white p-2 text-black"
            >
              <option value="CGST_SGST">CGST + SGST</option>
              <option value="IGST">IGST</option>
              <option value="NONE">No Tax</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadExcel}
            disabled={!lines.length}
            className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download Excel
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            disabled={!lines.length}
            className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print / Save PDF
          </button>
        </div>
      </section>

      <style>{`
        .bill-page,
        .bill-page * {
          box-sizing: border-box;
        }

        .invoice-paper {
          overflow-x: auto;
        }

        .invoice-detail-row {
          display: grid;
          grid-template-columns: minmax(70px, auto) minmax(0, 1fr);
          align-items: center;
          gap: 8px;
        }

        .invoice-table {
          width: 100%;
          table-layout: fixed;
        }

        .invoice-table th,
        .invoice-table td {
          overflow-wrap: anywhere;
          vertical-align: top;
        }

        @media (max-width: 767px) {
          .invoice-info-cell {
            border: 1px solid black;
          }

          .invoice-table-wrap {
            overflow-x: auto;
          }

          .invoice-table {
            min-width: 850px;
          }
        }

        
@page {
  size: A4 landscape;
  margin: 5mm;
}

@media print {
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    background: white !important;
  }

  .bill-page {
    min-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    background: white !important;
  }

  .invoice-paper {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 5mm !important;
    border: 1px solid black !important;
    box-shadow: none !important;
    overflow: visible !important;
  }

  .invoice-company {
    padding: 8px !important;
    gap: 8px !important;
  }

  .invoice-info {
    margin-top: 6px !important;
  }

  .invoice-info-cell {
    padding: 6px !important;
  }

  .invoice-table-wrap {
    width: 100% !important;
    margin-top: 6px !important;
    overflow: visible !important;
  }

  .invoice-table {
    width: 100% !important;
    max-width: 100% !important;
    table-layout: fixed !important;
    border-collapse: collapse !important;
    font-size: 9px !important;
  }

  .invoice-table th,
  .invoice-table td {
    padding: 3px 2px !important;
    overflow-wrap: anywhere;
    word-break: normal;
    vertical-align: top;
  }

  .invoice-footer {
    margin-top: 6px !important;
    padding-top: 5px !important;
    gap: 8px !important;
    font-size: 9px !important;
  }

  input,
  textarea,
  select {
    min-width: 0 !important;
    color: black !important;
    background: transparent !important;
    box-shadow: none !important;
  }

  button,
  .no-print {
    display: none !important;
  }

  tr {
    break-inside: avoid;
  }
}

      `}</style>
    </div>
  );
}