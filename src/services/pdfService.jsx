import { pdf } from "@react-pdf/renderer";
import MaterialListPDF from "../components/pdf/MaterialListPDF";
import QuotationPDF from "../components/pdf/QuotationPDF";

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

export async function downloadMaterialList(result, tile, project) {
  const blob = await generateBlob(<MaterialListPDF result={result} tile={tile} project={project} />);
  downloadBlob(blob, `كشف_مواد_${project?.client?.name || "ورشة"}.pdf`);
}

export async function downloadQuotation(result, costResult, tile, prices, project) {
  const blob = await generateBlob(
    <QuotationPDF result={result} costResult={costResult} tile={tile} prices={prices} project={project} />
  );
  downloadBlob(blob, `عرض_سعر_${project?.client?.name || "ورشة"}.pdf`);
}
