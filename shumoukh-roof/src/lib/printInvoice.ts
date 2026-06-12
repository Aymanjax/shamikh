export function printCalculatorResult(result: any, input: any, tileName: string, costResult: any) {
  const rows: Array<{ label: string; value: string }> = [];
  if (result.totalTiles) rows.push({ label: "القرميد", value: `${result.totalTiles} حبة` });
  if (result.tarabeesh > 0) rows.push({ label: "طرابيش", value: `${result.tarabeesh} م` });
  if (result.iron4x8) rows.push({ label: "حديد 4×8 (تسقيف)", value: `${result.iron4x8} تيوب` });
  if (result.iron10x10?.total) rows.push({ label: "فريم 10×10", value: `${result.iron10x10.total} تيوب` });
  if (result.decor?.bundles) rows.push({ label: "ديكور", value: `${result.decor.bundles} ربطة` });
  if (result.beshQty) rows.push({ label: "البيش", value: `${result.beshQty} وحدة` });
  if (result.woodBases) rows.push({ label: "أسس خشب", value: `${result.woodBases} قطعة` });
  if (result.tarpaulin?.text) rows.push({ label: "مشمع", value: result.tarpaulin.text });

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>كشف حساب البضاعة</title>
    <style>
      @page { margin: 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
      body { padding: 20px; color: #1e293b; }
      .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
      .header h1 { font-size: 22px; color: #1e293b; margin-bottom: 4px; }
      .header p { font-size: 12px; color: #64748b; }
      .info { display: flex; gap: 40px; margin-bottom: 20px; font-size: 13px; }
      .info div { flex: 1; }
      .info span { color: #64748b; font-size: 11px; display: block; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #1e293b; color: white; padding: 8px 12px; text-align: right; }
      td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) td { background: #f8fafc; }
      .total { margin-top: 20px; background: #3b82f6; color: white; padding: 12px 20px; border-radius: 8px; display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; }
      .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <div class="header">
        <h1>شموخ ERP</h1>
        <p>كشف حساب البضاعة - ${new Date().toLocaleDateString("ar")}</p>
      </div>
      <div class="info">
        <div><span>نوع القرميد</span>${tileName}</div>
        <div><span>نسبة الميل</span>${input.slope}%</div>
        <div><span>عدد الأرجل</span>${input.numLegs}</div>
        <div><span>المساحة</span>${result.flatArea?.toFixed(1) || 0} م²</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>المادة</th><th>الكمية</th></tr></thead>
        <tbody>
          ${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${r.label}</td><td>${r.value}</td></tr>`).join("")}
        </tbody>
      </table>
      ${costResult ? `<div class="total"><span>المجموع التقديري</span><span>${costResult.totalWithNathrayat.toFixed(1)} د.أ</span></div>` : ""}
      <div class="footer">www.shumoukh.com</div>
      <script>window.print();window.close();</script>
    </body></html>
  `);
  win.document.close();
}

export interface PrintCompany {
  name?: string;
  logoURL?: string;
  phone?: string;
  address?: string;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface PrintableInvoice {
  id?: string;
  invoiceNo?: string;
  client?: string;
  project?: string;
  phone?: string;
  status?: string;
  amount?: number;
  discount?: number;
  taxRate?: number;
  notes?: string;
  items?: Array<{ desc?: string; qty?: number; price?: number }>;
}

/**
 * طباعة فاتورة احترافية: ترويسة باسم الشركة/المقاول وشعاره (إن وُجد)،
 * جدول بنود (وصف × كمية × سعر)، ثم المجموع والخصم والضريبة والإجمالي.
 * الفواتير القديمة (مبلغ واحد بلا بنود) تُطبع كبند وحيد.
 */
export function printInvoice(invoice: PrintableInvoice, company?: PrintCompany) {
  const statusMap: Record<string, string> = { paid: "مدفوعة", pending: "قيد الانتظار", draft: "عرض سعر" };
  const items: Array<{ desc?: string; qty?: number; price?: number }> =
    Array.isArray(invoice.items) && invoice.items.length > 0
      ? invoice.items
      : [{ desc: invoice.project || "أعمال قرميد وأسطح", qty: 1, price: invoice.amount || 0 }];

  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const discount = Number(invoice.discount) || 0;
  const taxRate = Number(invoice.taxRate) || 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = +(afterDiscount * (taxRate / 100)).toFixed(2);
  const total = +(afterDiscount + tax).toFixed(2);

  const invNo = invoice.invoiceNo || `INV-${String(invoice.id || "").slice(0, 6).toUpperCase() || "0001"}`;
  const dateStr = new Date().toLocaleDateString("ar-JO");
  const title = invoice.status === "draft" ? "عرض سعر" : "فاتورة";

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>${title} ${esc(invNo)}</title>
    <style>
      @page { margin: 12mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      body { padding: 24px; color: #2d2418; font-size: 13px; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
             border-bottom: 3px solid #b0632e; padding-bottom: 16px; margin-bottom: 18px; }
      .co { display: flex; gap: 12px; align-items: center; }
      .co img { width: 64px; height: 64px; object-fit: contain; border-radius: 6px; }
      .co h1 { font-size: 20px; color: #2d2418; }
      .co p { font-size: 11px; color: #7a6a55; margin-top: 2px; }
      .meta { text-align: left; }
      .meta .t { font-size: 24px; font-weight: 900; color: #b0632e; }
      .meta p { font-size: 11px; color: #7a6a55; margin-top: 3px; font-variant-numeric: tabular-nums; }
      .client { background: #faf7f4; border: 1px solid #e8ddd2; border-radius: 6px; padding: 12px 16px;
                margin-bottom: 16px; display: flex; gap: 32px; flex-wrap: wrap; }
      .client div span { display: block; font-size: 10px; color: #9a8670; margin-bottom: 2px; }
      .client div b { font-size: 13px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #2d2418; color: #faf7f4; padding: 9px 12px; text-align: right; font-size: 11.5px; }
      th.n, td.n { text-align: center; width: 70px; font-variant-numeric: tabular-nums; }
      th.p, td.p { text-align: left; width: 110px; font-variant-numeric: tabular-nums; }
      td { padding: 9px 12px; border-bottom: 1px solid #e8ddd2; }
      tr:nth-child(even) td { background: #faf7f4; }
      .sums { margin-top: 14px; margin-right: auto; width: 280px; }
      .sums div { display: flex; justify-content: space-between; padding: 5px 12px; font-size: 12.5px;
                  font-variant-numeric: tabular-nums; }
      .sums .muted { color: #7a6a55; }
      .sums .grand { background: #b0632e; color: #fff; border-radius: 6px; font-weight: 900;
                     font-size: 15px; padding: 10px 14px; margin-top: 6px; }
      .notes { margin-top: 18px; background: #faf7f4; border-right: 3px solid #b0632e;
               padding: 10px 14px; border-radius: 4px; font-size: 12px; color: #5a4a38; white-space: pre-wrap; }
      .notes b { display: block; font-size: 10px; color: #9a8670; margin-bottom: 3px; }
      .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e8ddd2; display: flex;
                justify-content: space-between; font-size: 10px; color: #9a8670; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <div class="top">
        <div class="co">
          ${company?.logoURL ? `<img src="${esc(company.logoURL)}" alt="" />` : ""}
          <div>
            <h1>${esc(company?.name || "شموخ ERP")}</h1>
            ${company?.address ? `<p>${esc(company.address)}</p>` : ""}
            ${company?.phone ? `<p dir="ltr" style="text-align:right">${esc(company.phone)}</p>` : ""}
          </div>
        </div>
        <div class="meta">
          <div class="t">${title}</div>
          <p>رقم: ${esc(invNo)}</p>
          <p>التاريخ: ${dateStr}</p>
          <p>الحالة: ${esc(statusMap[invoice.status || ""] || invoice.status || "")}</p>
        </div>
      </div>

      <div class="client">
        <div><span>العميل</span><b>${esc(invoice.client || "غير محدد")}</b></div>
        ${invoice.project ? `<div><span>المشروع</span><b>${esc(invoice.project)}</b></div>` : ""}
        ${invoice.phone ? `<div><span>الهاتف</span><b dir="ltr">${esc(invoice.phone)}</b></div>` : ""}
      </div>

      <table>
        <thead><tr><th class="n">#</th><th>البيان</th><th class="n">الكمية</th><th class="p">السعر</th><th class="p">المجموع</th></tr></thead>
        <tbody>
          ${items.map((it, i) => `
            <tr>
              <td class="n">${i + 1}</td>
              <td>${esc(it.desc || "")}</td>
              <td class="n">${Number(it.qty) || 0}</td>
              <td class="p">${(Number(it.price) || 0).toFixed(2)}</td>
              <td class="p">${(((Number(it.qty) || 0) * (Number(it.price) || 0))).toFixed(2)}</td>
            </tr>`).join("")}
        </tbody>
      </table>

      <div class="sums">
        <div><span class="muted">المجموع الفرعي</span><span>${subtotal.toFixed(2)} د.أ</span></div>
        ${discount > 0 ? `<div><span class="muted">الخصم</span><span>− ${discount.toFixed(2)} د.أ</span></div>` : ""}
        ${taxRate > 0 ? `<div><span class="muted">الضريبة (${taxRate}%)</span><span>${tax.toFixed(2)} د.أ</span></div>` : ""}
        <div class="grand"><span>الإجمالي</span><span>${total.toFixed(2)} د.أ</span></div>
      </div>

      ${invoice.notes ? `<div class="notes"><b>ملاحظات</b>${esc(invoice.notes)}</div>` : ""}

      <div class="footer">
        <span>${esc(company?.name || "شموخ ERP")}${company?.phone ? " · " + esc(company.phone) : ""}</span>
        <span>شكرًا لتعاملكم معنا</span>
      </div>
      <script>window.print();</script>
    </body></html>
  `);
  win.document.close();
}
