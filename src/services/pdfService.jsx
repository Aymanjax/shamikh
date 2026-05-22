import { pdf } from "@react-pdf/renderer";
import MaterialListPDF from "../components/pdf/MaterialListPDF";
import QuotationPDF from "../components/pdf/QuotationPDF";
import InvoicePDF from "../components/pdf/InvoicePDF";

async function generateBlob(element) {
  const instance = pdf(element);
  const blob = await instance.toBlob();
  return blob;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadMaterialList(result, tile, project, customFields = [], companyName = "") {
  try {
    const blob = await generateBlob(<MaterialListPDF result={result} tile={tile} project={project} customFields={customFields} companyName={companyName} />);
    downloadBlob(blob, `كشف_مواد_${project?.client?.name || "ورشة"}.pdf`);
  } catch (e) {
    alert("حدث خطأ أثناء إنشاء PDF: " + e.message);
  }
}

export async function downloadQuotation(result, costResult, tile, prices, project, companyName = "") {
  try {
    const blob = await generateBlob(
      <QuotationPDF result={result} costResult={costResult} tile={tile} prices={prices} project={project} companyName={companyName} />
    );
    downloadBlob(blob, `عرض_سعر_${project?.client?.name || "ورشة"}.pdf`);
  } catch (e) {
    alert("حدث خطأ أثناء إنشاء PDF: " + e.message);
  }
}

export async function downloadInvoice(invoice) {
  try {
    const blob = await generateBlob(<InvoicePDF invoice={invoice} />);
    downloadBlob(blob, `فاتورة_${invoice?.invoiceNumber || "غير_محددة"}.pdf`);
  } catch (e) {
    alert("حدث خطأ أثناء إنشاء PDF: " + e.message);
  }
}
