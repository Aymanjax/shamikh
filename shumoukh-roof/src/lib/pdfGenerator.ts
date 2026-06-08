// @ts-nocheck
import jsPDF from "jspdf";

export function exportCalculatorPdf(result: any, input: any, tiles: any[], prices: any, costResult: any) {
  const doc = new jsPDF("p", "mm", "a4");
  const R = doc.internal.pageSize; // RTL support
  const pw = R.getWidth();
  const cx = pw / 2;

  // Title
  doc.setFontSize(18);
  doc.text("شموخ ERP - كشف حساب البضاعة", cx, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text(`تاريخ: ${new Date().toLocaleDateString("ar")}`, cx, 28, { align: "center" });

  // Project info
  doc.setFontSize(11);
  doc.text(`المساحة: ${result.flatArea?.toFixed(1) || 0} م²`, 20, 40);
  doc.text(`الميل: ${input.slope}%`, pw - 20, 40, { align: "left" });
  doc.text(`القرميد: ${tiles[input.tileIndex]?.name || ""}`, 20, 48);
  doc.text(`عدد الأرجل: ${input.numLegs}`, pw - 20, 48, { align: "left" });

  // Materials table
  const rows: Array<[string, string]> = [];
  if (result.totalTiles) rows.push(["القرميد", `${result.totalTiles} حبة`]);
  if (result.tarabeesh > 0) rows.push(["طرابيش", `${result.tarabeesh} م`]);
  if (result.iron4x8) rows.push(["حديد 4×8 (تسقيف)", `${result.iron4x8} تيوب`]);
  if (result.iron10x10?.total) rows.push(["فريم 10×10", `${result.iron10x10.total} تيوب`]);
  if (result.ironFrame?.totalPieces) rows.push(["حديد 10×10 (فريم)", `${result.ironFrame.totalPieces} قطعة`]);
  if (result.beshQty) rows.push(["البيش", `${result.beshQty} وحدة`]);
  if (result.woodBases) rows.push(["أسس خشب", `${result.woodBases} قطعة`]);
  if (result.tarpaulin?.text) rows.push(["مشمع", result.tarpaulin.text]);

  let y = 60;
  if (rows.length > 0) {
    doc.setFontSize(9);
    doc.setFillColor(30, 41, 59);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, y, pw - 40, 7, "F");
    doc.text("المادة", 25, y + 5);
    doc.text("الكمية", pw - 25, y + 5, { align: "left" });
    y += 9;
    doc.setTextColor(0, 0, 0);
    rows.forEach(([name, qty], i) => {
      if (i % 2 === 0) doc.setFillColor(248, 250, 252);
      else doc.setFillColor(255, 255, 255);
      doc.rect(20, y, pw - 40, 6, "F");
      doc.text(name, 25, y + 4);
      doc.text(qty, pw - 25, y + 4, { align: "left" });
      y += 7;
    });
  }

  // Cost
  if (costResult) {
    y += 5;
    doc.setFillColor(59, 130, 246);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.rect(20, y, pw - 40, 10, "F");
    doc.text(`المجموع التقديري: ${costResult.totalWithNathrayat.toFixed(1)} د.أ`, cx, y + 7, { align: "center" });
  }

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text("www.shumoukh.com", cx, R.getHeight() - 10, { align: "center" });

  doc.save("كشف_حساب_البضاعة.pdf");
}

export function exportInvoicePdf(invoice: any) {
  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();
  const cx = pw / 2;

  doc.setFontSize(18);
  doc.text("فاتورة", cx, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text(`تاريخ: ${new Date().toLocaleDateString("ar")}`, cx, 28, { align: "center" });

  doc.setFontSize(11);
  doc.text(`العميل: ${invoice.client || "غير محدد"}`, 20, 40);
  doc.text(`المشروع: ${invoice.project || "—"}`, 20, 48);
  doc.text(`المبلغ: ${invoice.amount || 0} د.أ`, 20, 56);

  const statusMap: Record<string, string> = { paid: "مدفوعة", pending: "قيد الانتظار", draft: "مسودة" };
  doc.text(`الحالة: ${statusMap[invoice.status] || invoice.status}`, 20, 64);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text("www.shumoukh.com", cx, doc.internal.pageSize.getHeight() - 10, { align: "center" });

  doc.save(`فاتورة_${invoice.client || "غير_محدد"}.pdf`);
}
