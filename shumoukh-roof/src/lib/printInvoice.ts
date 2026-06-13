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

export function printInvoice(invoice: any) {
  const statusMap: Record<string, string> = { paid: "مدفوعة", pending: "قيد الانتظار", draft: "مسودة" };
  const items: Array<{ desc?: string; qty?: number; price?: number }> = Array.isArray(invoice.items) ? invoice.items : [];
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const grandTotal = items.length ? subtotal : Number(invoice.amount) || 0;
  const itemsHtml = items.length
    ? `<table>
        <thead><tr><th>#</th><th>البند</th><th>الكمية</th><th>السعر</th><th>المجموع</th></tr></thead>
        <tbody>
          ${items.map((it, i) => `<tr><td>${i + 1}</td><td>${it.desc || "—"}</td><td>${it.qty ?? 0}</td><td>${(Number(it.price) || 0).toFixed(2)}</td><td>${((Number(it.qty) || 0) * (Number(it.price) || 0)).toFixed(2)}</td></tr>`).join("")}
        </tbody>
      </table>`
    : "";
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>فاتورة</title>
    <style>
      @page { margin: 15mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
      body { padding: 20px; color: #1e293b; }
      .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
      .header h1 { font-size: 22px; color: #1e293b; margin-bottom: 4px; }
      .header p { font-size: 12px; color: #64748b; }
      .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
      .box div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
      .box span { color: #64748b; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 8px; }
      th { background: #1e293b; color: white; padding: 8px 12px; text-align: right; }
      td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; }
      tr:nth-child(even) td { background: #f8fafc; }
      .total { background: #3b82f6; color: white; padding: 12px 20px; border-radius: 8px; margin-top: 16px; display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; }
      .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <div class="header">
        <h1>شموخ ERP</h1>
        <p>فاتورة - ${new Date().toLocaleDateString("ar")}</p>
      </div>
      <div class="box">
        <div><span>العميل</span>${invoice.client || "غير محدد"}</div>
        <div><span>المشروع</span>${invoice.project || "—"}</div>
        <div><span>الحالة</span>${statusMap[invoice.status] || invoice.status}</div>
      </div>
      ${itemsHtml}
      <div class="total"><span>المبلغ الإجمالي</span><span>${grandTotal.toFixed(2)} د.أ</span></div>
      <div class="footer">www.shumoukh.com</div>
      <script>window.print();window.close();</script>
    </body></html>
  `);
  win.document.close();
}
