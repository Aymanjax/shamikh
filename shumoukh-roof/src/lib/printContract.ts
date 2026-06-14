import type { PrintCompany } from "./printInvoice";

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface PrintableContract {
  partyAName: string;
  partyANationalId?: string;
  partyAPhone?: string;
  partyBName: string;
  partyBNationalId?: string;
  partyBPhone?: string;
  partyBAddress?: string;
  subject: string;
  location: string;
  totalAmount: number;
  durationDays: number;
  startDate: string;
  warrantyYears: number;
  city: string;
  paymentTerms: string;
  clauses: string[];
}

const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/**
 * طباعة اتفاقية عمل رسمية (توريد وتركيب قرميد) بالصيغة الأردنية:
 * ترويسة الشركة، تعريف الفريقين، البنود المرقمة، جدول الدفعات، والتوقيعات.
 */
export function printContract(c: PrintableContract, company?: PrintCompany) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("ar-JO");
  const dayName = DAYS[today.getDay()];

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html><html dir="rtl" lang="ar">
    <head><meta charset="UTF-8"><title>اتفاقية عمل — ${esc(c.partyBName)}</title>
    <style>
      @page { margin: 14mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
      body { padding: 24px; color: #2d2418; font-size: 13px; line-height: 1.9; }
      .top { display: flex; justify-content: space-between; align-items: center; gap: 16px;
             border-bottom: 3px double #2d2418; padding-bottom: 12px; margin-bottom: 14px; }
      .co { display: flex; gap: 12px; align-items: center; }
      .co img { width: 56px; height: 56px; object-fit: contain; }
      .co h2 { font-size: 16px; }
      .co p { font-size: 10.5px; color: #7a6a55; }
      .meta { text-align: left; font-size: 11px; color: #5a4a38; font-variant-numeric: tabular-nums; }
      h1 { text-align: center; font-size: 19px; margin: 10px 0 2px; }
      .sub { text-align: center; font-size: 11.5px; color: #7a6a55; margin-bottom: 14px; }
      .intro { text-align: justify; margin-bottom: 10px; }
      .party { background: #faf7f4; border: 1px solid #e8ddd2; border-radius: 6px;
               padding: 8px 14px; margin-bottom: 8px; }
      .party b.tag { color: #b0632e; }
      .party span { color: #5a4a38; }
      ol.clauses { margin: 12px 22px 0 0; }
      ol.clauses li { margin-bottom: 8px; text-align: justify; padding-right: 4px; }
      .pay { background: #faf7f4; border-right: 3px solid #b0632e; border-radius: 4px;
             padding: 10px 14px; margin: 12px 0; white-space: pre-wrap; font-variant-numeric: tabular-nums; }
      .pay b { display: block; font-size: 11px; color: #9a8670; margin-bottom: 4px; }
      .closing { margin-top: 14px; text-align: justify; }
      .sigs { display: flex; gap: 16px; margin-top: 38px; text-align: center; }
      .sigs > div { flex: 1; }
      .sigs .role { font-weight: 900; font-size: 12.5px; }
      .sigs .name { font-size: 11.5px; color: #5a4a38; margin-top: 2px; }
      .sigs .line { margin-top: 42px; border-top: 1.5px dotted #9a8670; padding-top: 4px;
                    font-size: 10px; color: #9a8670; }
      .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e8ddd2;
                display: flex; justify-content: space-between; font-size: 9.5px; color: #9a8670; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <div class="top">
        <div class="co">
          ${company?.logoURL ? `<img src="${esc(company.logoURL)}" alt="" />` : ""}
          <div>
            <h2>${esc(company?.name || c.partyAName || "")}</h2>
            ${company?.address ? `<p>${esc(company.address)}</p>` : ""}
            ${company?.phone ? `<p dir="ltr" style="text-align:right">${esc(company.phone)}</p>` : ""}
          </div>
        </div>
        <div class="meta">
          <div>التاريخ: ${dateStr}</div>
          <div>اليوم: ${dayName}</div>
        </div>
      </div>

      <h1>اتفاقية عمل — توريد وتركيب قرميد</h1>
      <p class="sub">حُررت هذه الاتفاقية وفقًا للقوانين النافذة في المملكة الأردنية الهاشمية</p>

      <p class="intro">إنه في يوم ${dayName} الموافق ${dateStr} تم الاتفاق والتراضي بين كل من:</p>

      <div class="party">
        <b class="tag">الفريق الأول (المقاول):</b> <b>${esc(c.partyAName)}</b>
        ${c.partyANationalId ? ` — <span>رقم وطني/سجل: ${esc(c.partyANationalId)}</span>` : ""}
        ${c.partyAPhone ? ` — <span dir="ltr">${esc(c.partyAPhone)}</span>` : ""}
      </div>
      <div class="party">
        <b class="tag">الفريق الثاني (صاحب العمل):</b> <b>${esc(c.partyBName)}</b>
        ${c.partyBNationalId ? ` — <span>رقم وطني: ${esc(c.partyBNationalId)}</span>` : ""}
        ${c.partyBPhone ? ` — <span dir="ltr">${esc(c.partyBPhone)}</span>` : ""}
        ${c.partyBAddress ? `<br/><span>العنوان: ${esc(c.partyBAddress)}</span>` : ""}
      </div>

      <p class="intro">
        وبما أن الفريق الثاني يرغب بتنفيذ أعمال <b>${esc(c.subject)}</b>${c.location ? ` في <b>${esc(c.location)}</b>` : ""}،
        وبما أن الفريق الأول يملك الخبرة والقدرة على تنفيذ هذه الأعمال، فقد اتفق الفريقان وهما بكامل
        الأهلية المعتبرة شرعًا وقانونًا على البنود التالية:
      </p>

      <ol class="clauses">
        ${c.clauses.map((cl) => `<li>${esc(cl)}</li>`).join("")}
      </ol>

      <div class="pay"><b>جدول الدفعات المتفق عليه</b>${esc(c.paymentTerms)}</div>

      <p class="closing">
        تاريخ المباشرة المتفق عليه: <b>${esc(c.startDate)}</b>،
        ومدة التنفيذ: <b>(${c.durationDays})</b> يوم عمل،
        والقيمة الإجمالية: <b>(${c.totalAmount})</b> دينار أردني.
        وعليه تم التوقيع:
      </p>

      <div class="sigs">
        <div>
          <div class="role">الفريق الأول (المقاول)</div>
          <div class="name">${esc(c.partyAName)}</div>
          <div class="line">التوقيع</div>
        </div>
        <div>
          <div class="role">الفريق الثاني (صاحب العمل)</div>
          <div class="name">${esc(c.partyBName)}</div>
          <div class="line">التوقيع</div>
        </div>
        <div>
          <div class="role">شاهد</div>
          <div class="name">&nbsp;</div>
          <div class="line">الاسم والتوقيع</div>
        </div>
      </div>

      <div class="footer">
        <span>${esc(company?.name || c.partyAName || "")}${company?.phone ? " · " + esc(company.phone) : ""}</span>
        <span>اتفاقية من نسختين — لكل فريق نسخة</span>
      </div>
      <script>window.print();</script>
    </body></html>
  `);
  win.document.close();
}
