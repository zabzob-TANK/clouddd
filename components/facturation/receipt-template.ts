/* Gabarit du reçu papier, repris tel quel du prototype (il y était encodé en
   base64). Seule modification : <base href="./"> devient <base href="/"> car le
   document est injecté via l'attribut srcdoc de l'iframe. Les jetons __XXX__
   sont remplacés par buildReceiptHtml(). */

export const RECEIPT_PROTO_TEMPLATE = `<!DOCTYPE html>

<html lang="fr">
<head>
<base href="/">
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1" name="viewport"/>
<title>Reçu Zemzem Asfar — données du site</title>
<style>
  :root {
    --offset-x: 0mm;
    --offset-y: 0mm;
    --page-scale: 1;
    --ink: #171717;
    --line: #cfcfcf;
    --header: #888;
    --row: rgba(222,222,222,.86);
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    font-family: Arial, Tahoma, sans-serif;
    color: var(--ink);
    background: #eef1f4;
  }

  .toolbar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 10px 14px;
    background: rgba(20, 27, 36, .94);
    color: white;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    backdrop-filter: blur(10px);
  }
  .toolbar strong { margin-right: 8px; font-size: 14px; }
  .toolbar button,
  .toolbar input {
    height: 34px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.18);
    font: inherit;
  }
  .toolbar button {
    padding: 0 13px;
    color: white;
    background: #364152;
    cursor: pointer;
  }
  .toolbar button:hover { background: #465369; }
  .toolbar button.primary { background: #c18b2d; }
  .toolbar button.primary:hover { background: #d49a34; }
  .toolbar label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #dbe3eb;
  }
  .toolbar input {
    width: 62px;
    padding: 0 7px;
    background: white;
    color: #111;
  }
  .toolbar .hint {
    margin-left: auto;
    max-width: 420px;
    font-size: 11px;
    line-height: 1.35;
    color: #bac5d1;
  }


  .workspace {
    padding: 28px;
    display: grid;
    place-items: start center;
    overflow: auto;
  }

  /* À l’écran, on montre uniquement le véritable petit papier du reçu.
     Le canevas A4 n’est rétabli qu’au moment de l’impression. */
  .a4-page {
    position: relative;
    width: 143.8mm;
    height: 232mm;
    flex: none;
    overflow: hidden;
    background: white;
    box-shadow: 0 18px 55px rgba(23,31,43,.22);
    transform-origin: top center;
  }

  .paper-bg {
    position: absolute;
    inset: 0;
    width: 143.8mm;
    height: 232mm;
    object-fit: fill;
    pointer-events: none;
    user-select: none;
  }

  body.no-background .paper-bg { visibility: hidden; }

  /* Zone physique approximative du petit papier dans la feuille A4. */
  .receipt-guide {
    position: absolute;
    left: 0;
    top: 0;
    width: 143.8mm;
    height: 232mm;
    border: .35mm solid transparent;
    pointer-events: none;
    z-index: 20;
  }
  .receipt-guide::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 147mm;
    border-top: .3mm dashed transparent;
  }
  body.show-guides .receipt-guide { border-color: rgba(230, 44, 44, .78); }
  body.show-guides .receipt-guide::after { border-top-color: rgba(230, 44, 44, .78); }

  /* Cadre physique du petit reçu dans la feuille A4. Rien ne peut dépasser. */
  .print-layer {
    position: absolute;
    left: 0;
    top: 0;
    width: 143.8mm;
    height: 232mm;
    overflow: hidden;
    z-index: 10;
  }
  .print-content {
    position: absolute;
    inset: 0;
    transform: translate(calc(-1.3mm + var(--offset-x)), var(--offset-y));
    transform-origin: top left;
  }

  .rtl { direction: rtl; unicode-bidi: plaintext; }
  .ltr { direction: ltr; unicode-bidi: plaintext; }

  /* ---------------- Partie supérieure / client ---------------- */
  .upper {
    position: absolute;
    left: 4.3mm;
    top: 23.8mm;
    width: 137.2mm;
    height: 110mm;
    font-size: 3.45mm;
  }

  .top-meta { position: relative; height: 16.2mm; }
  .date-card,
  .receipt-card {
    position: absolute;
    top: 0;
    height: 15mm;
    border: .55mm solid #d2d2d2;
    border-radius: 1.8mm;
    background: rgba(255,255,255,.38);
    display: grid;
    align-content: center;
    justify-items: center;
    line-height: 1.15;
  }
  .date-card { left: 0; width: 31mm; }
  .receipt-card { right: 0; width: 31mm; }
  .date-card .label,
  .receipt-card .label { font-size: 3.2mm; margin-bottom: 1.3mm; }
  .date-card .value { font-size: 4mm; }
  .receipt-card .value { font-size: 7.1mm; line-height: .88; }

  .client-name {
    position: absolute;
    left: 48mm;
    top: .5mm;
    width: 43mm;
    text-align: center;
    line-height: 1.4;
  }
  .client-name .label { font-size: 3.25mm; }
  .client-name .value { font-size: 4.2mm; margin-top: 1mm; }

  .agreement-box {
    direction: ltr;
    height: 14mm;
    border: .55mm solid #d2d2d2;
    border-radius: 1.6mm;
    overflow: hidden;
    display: grid;
    grid-template-columns: 38mm 48mm 1fr;
    background: rgba(255,255,255,.33);
  }
  .agreement-box > div { min-width: 0; }
  .program-info {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    grid-template-rows: 1fr 1fr;
    align-items: center;
    text-align: center;
    font-size: 3.25mm;
    padding: .4mm 1mm;
  }
  .program-info .small { font-size: 2.75mm; }
  .amount-values {
    display: grid;
    grid-template-rows: 1fr 1fr;
    align-items: center;
    justify-items: center;
    font-size: 5.1mm;
    font-weight: 400;
    letter-spacing: .1mm;
  }
  .amount-labels {
    display: grid;
    grid-template-rows: 1fr 1fr;
    align-items: center;
    text-align: right;
    padding: 0 4mm 0 2mm;
    font-size: 3.7mm;
  }

  table { border-collapse: collapse; }
  .upper-payments {
    direction: ltr;
    width: 100%;
    table-layout: fixed;
    margin-top: 2.7mm;
    font-size: 3.05mm;
    text-align: center;
  }
  .upper-payments th {
    direction: rtl;
    height: 6mm;
    background: var(--header);
    color: #111;
    border-right: .2mm solid white;
    font-weight: 700;
  }
  .upper-payments td {
    height: 4.2mm;
    background: var(--row);
    border-right: .2mm solid white;
    border-top: .2mm solid white;
    white-space: nowrap;
  }
  .upper-payments .amount { font-size: 4.05mm; text-align: right; padding-right: 1.5mm; }
  .upper-payments .seq { font-size: 4.05mm; background: rgba(226,226,226,.92); }
  .upper-payments col.bank { width: 15.16%; }
  .upper-payments col.check-date { width: 15.88%; }
  .upper-payments col.check-no { width: 16.61%; }
  .upper-payments col.method { width: 14.44%; }
  .upper-payments col.pay-date { width: 17.33%; }
  .upper-payments col.amount { width: 16.61%; }
  .upper-payments col.seq { width: 3.97%; }

  .upper-bottom {
    position: relative;
    height: 25mm;
    margin-top: 4.8mm;
    transform: translateY(-1.5mm);
  }
  .signature-box {
    position: absolute;
    left: 5.5mm;
    top: 3.8mm;
    width: 39mm;
    height: 20.5mm;
    border: 1mm solid #888;
    border-radius: 4mm;
    display: grid;
    place-items: center;
    color: #777;
    font-size: 3.5mm;
    background: rgba(255,255,255,.22);
  }
  .signature-box::after {
    content: "";
    position: absolute;
    inset: 1.7mm;
    border: .45mm solid #9a9a9a;
    border-radius: 2.8mm;
  }
  .signature-box span { position: relative; z-index: 2; }

  .settlement-lines {
    position: absolute;
    right: 0;
    top: 4.2mm;
    width: 84mm;
    display: grid;
    direction: ltr;
    grid-template-columns: 51mm 33mm;
    grid-template-rows: repeat(3, 7mm);
    align-items: center;
    font-size: 3.4mm;
  }
  .settlement-lines .line {
    height: 0;
    border-bottom: .45mm dashed #bcbcbc;
    margin-right: 5mm;
  }
  .settlement-lines .label {
    text-align: right;
    direction: rtl;
    unicode-bidi: plaintext;
  }

  /* ---------------- Partie inférieure / souche agence ---------------- */
  .stub {
    position: absolute;
    left: 4.3mm;
    top: 159.2mm;
    width: 137.2mm;
    height: 67.5mm;
    overflow: hidden;
    font-size: 2.65mm;
  }
  .stub table { width: 100%; table-layout: fixed; }
  .stub th, .stub td { padding: 0; line-height: 1; overflow: hidden; }
  .stub-main th,
  .stub-main td,
  .stub-details th,
  .stub-details td,
  .stub-payment-head th,
  .stub-contact td {
    border: .35mm solid #111;
  }
  .stub-main th {
    height: 3.7mm;
    font-size: 2.2mm;
    line-height: .95;
    font-weight: 400;
    background: #efefef;
  }
  .stub-main td {
    height: 7.4mm;
    text-align: center;
    font-weight: 700;
    background: rgba(255,255,255,.3);
  }
  .stub-main td.big { font-size: 4.1mm; background: rgba(210,210,210,.82); }
  .stub-main td.date { font-size: 3.8mm; background: white; }
  .stub-main .receiver { font-size: 4.3mm; font-weight: 700; background: white; }

  .stub-details { margin-top: .5mm; }
  .stub-details th { height: 2.8mm; font-size: 2.15mm; font-weight: 400; background: #efefef; }
  .stub-details td { height: 5mm; text-align: center; font-weight: 700; font-size: 3.25mm; }
  .stub-details .program { font-size: 3.15mm; font-weight: 400; }

  .stub-payment-head { margin-top: .15mm; }
  .stub-payment-head th { height: 3.4mm; font-size: 2.15mm; background: #f0f0f0; font-weight: 400; }

  .stub-payment-rows {
    width: 100%;
    table-layout: fixed;
    font-size: 2.9mm;
  }
  .stub-payment-rows td {
    height: 3.8mm;
    font-size: 2.45mm;
    text-align: center;
    white-space: nowrap;
  }
  .stub-payment-rows .amt { font-size: 3.55mm; font-weight: 700; text-align: right; padding-right: 1.4mm; }
  .stub-payment-rows .method { font-weight: 700; }

  .stub-contact {
    position: relative;
    margin-top: .3mm;
  }
  .stub-contact td { height: 5.8mm; text-align: center; background: white; }
  .stub-contact .name-value { font-size: 3.25mm; font-weight: 700; }
  .stub-contact .phone-value { font-size: 3.8mm; direction: ltr; }
  .stub-contact .label-cell { width: 21mm; background: #e8e8e8; }

  /* Largeurs relatives : les tableaux restent strictement dans les repères. */
  .stub-main col:nth-child(1) { width: 16.61% !important; }
  .stub-main col:nth-child(2) { width: 8.30% !important; }
  .stub-main col:nth-child(3) { width: 28.16% !important; }
  .stub-main col:nth-child(4) { width: 23.10% !important; }
  .stub-main col:nth-child(5) { width: 23.83% !important; }

  .stub-details col:nth-child(1) { width: 20.22% !important; }
  .stub-details col:nth-child(2) { width: 9.39% !important; }
  .stub-details col:nth-child(3) { width: 13.72% !important; }
  .stub-details col:nth-child(4) { width: 14.44% !important; }
  .stub-details col:nth-child(5) { width: 42.23% !important; }

  .stub-payment-head col:nth-child(1), .stub-payment-rows col:nth-child(1) { width: 15.88% !important; }
  .stub-payment-head col:nth-child(2), .stub-payment-rows col:nth-child(2) { width: 15.16% !important; }
  .stub-payment-head col:nth-child(3), .stub-payment-rows col:nth-child(3) { width: 15.88% !important; }
  .stub-payment-head col:nth-child(4), .stub-payment-rows col:nth-child(4) { width: 14.44% !important; }
  .stub-payment-head col:nth-child(5), .stub-payment-rows col:nth-child(5) { width: 17.33% !important; }
  .stub-payment-head col:nth-child(6), .stub-payment-rows col:nth-child(6) { width: 21.31% !important; }

  .stub-contact col:nth-child(1) { width: 41.88% !important; }
  .stub-contact col:nth-child(2) { width: 36.10% !important; }
  .stub-contact col:nth-child(3) { width: 22.02% !important; }

  .screen-note {
    display: none;
    position: absolute;
    left: 182mm;
    top: 8mm;
    width: 24mm;
    padding: 3mm;
    border-radius: 2mm;
    background: rgba(255,255,255,.92);
    border: .25mm solid #d8dee5;
    color: #536170;
    font-size: 2.65mm;
    line-height: 1.4;
    box-shadow: 0 3mm 10mm rgba(0,0,0,.08);
  }

  @media (max-width: 950px) {
    .toolbar .hint { display: none; }
    .workspace { padding: 14px; justify-content: start; }
    .a4-page { transform: scale(.78); transform-origin: top left; margin-bottom: -50mm; }
  }

  @page { size: 210mm 297mm; margin: 0; }
  @media print {
    html, body {
      position: relative !important;
      width: 210mm !important;
      height: 297mm !important;
      min-width: 210mm !important;
      min-height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      background: white !important;
    }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .toolbar, .screen-note, .receipt-guide { display: none !important; }
    .workspace {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      display: block !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
    }
    .a4-page {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      transform: none !important;
      overflow: hidden !important;
    }
    .paper-bg { display: none !important; }
    .print-layer {
      position: absolute !important;
      left: 34.7mm !important;
      top: 0 !important;
      width: 143.8mm !important;
      height: 232mm !important;
      overflow: hidden !important;
    }
  }
</style>
</head>
<body data-payment-overflow="__PAYMENT_OVERFLOW__">
<div aria-label="Outils de test" class="toolbar">
<strong>Prototype reçu Zemzem</strong>
<button id="showFull" type="button">Aperçu complet</button>
<button id="showPrint" type="button">Impression seule</button>
<button id="toggleGuides" type="button">Repères</button>
<label>X <input id="offsetX" max="10" min="-10" step="0.1" title="Décalage horizontal temporaire en millimètres" type="number" value="0"/></label>
<label>Y <input id="offsetY" max="10" min="-10" step="0.1" title="Décalage vertical temporaire en millimètres" type="number" value="0"/></label>
<button id="resetOffset" type="button">Réinitialiser</button>
<button class="primary" id="printButton" type="button">Imprimer</button>
<span class="hint">La correction validée de base reste intégrée au design. Les axes X/Y servent uniquement aux tests d’impression. Les données du reçu restent en lecture seule.</span>
<span class="overflow-warning" style="display:__OVERFLOW_DISPLAY__;padding:5px 10px;border-radius:7px;background:#9c3b32;color:#fff;font-size:11px;font-weight:700">__OVERFLOW_MESSAGE__</span></div>
<main class="workspace">
<section aria-label="Aperçu du véritable papier de reçu" class="a4-page">
<img alt="Papier à en-tête Zemzem Asfar" class="paper-bg" src="./fond-facture.png"/>
<div class="print-layer">
<div class="print-content">
<section aria-label="Partie remise au client" class="upper">
<div class="top-meta">
<div class="date-card rtl">
<div class="label">بتاريخ</div>
<div class="value ltr">__DATE__</div>
</div>
<div class="client-name rtl">
<div class="label">الاسم</div>
<div class="value">__FULL_NAME__</div>
</div>
<div class="receipt-card rtl">
<div class="label">إيصال رقم</div>
<div class="value ltr">__RECEIPT_NUMBER__</div>
</div>
</div>
<div class="agreement-box">
<div class="program-info">
<div class="small">__PROGRAM__</div><div>نوع البرنامج</div>
<div class="ltr">__ROOM__</div><div>نوع الغرفة</div>
</div>
<div class="amount-values ltr">
<div>__AGREED_AMOUNT__</div>
<div>__TOTAL_PAID__</div>
</div>
<div class="amount-labels rtl">
<div>المبلغ المتفق عليه  :</div>
<div>المبلغ المدفوع     :</div>
</div>
</div>
<table aria-label="Historique des paiements" class="upper-payments">
<colgroup>
<col class="bank"/><col class="check-date"/><col class="check-no"/><col class="method"/><col class="pay-date"/><col class="amount"/><col class="seq"/>
</colgroup>
<thead>
<tr>
<th>البنك</th>
<th>تاريخه</th>
<th>رقم الشيك</th>
<th>نقد/شيك</th>
<th>بتاريخ</th>
<th colspan="2">الدفعة رقم</th>
</tr>
</thead>
<tbody><!--UPPER_PAYMENT_ROWS--></tbody>
</table>
<div class="upper-bottom">
<div class="signature-box rtl"><span>توقيع</span></div>
<div class="settlement-lines rtl">
<div class="line"></div><div class="label">الاسم:</div>
<div class="line"></div><div class="label">المبلغ المتفق عليه:</div>
<div class="line"></div><div class="label">المبلغ المدفوع:</div>
</div>
</div>
</section>
<section aria-label="Souche conservée par l’agence" class="stub rtl">
<table class="stub-main">
<colgroup><col style="width:23mm"/><col style="width:11.5mm"/><col style="width:39mm"/><col style="width:32mm"/><col style="width:33mm"/></colgroup>
<thead>
<tr><th>بتاريخ</th><th>إيصال رقم</th><th>المبلغ المدفوع</th><th>الاتفاق</th><th>المستلم</th></tr>
</thead>
<tbody>
<tr>
<td class="date ltr">__DATE__</td>
<td class="big ltr">__RECEIPT_NUMBER__</td>
<td class="big ltr">__TOTAL_PAID__</td>
<td class="big ltr">__AGREED_AMOUNT__</td>
<td class="receiver ltr">__RECEIVER__</td>
</tr>
</tbody>
</table>
<table class="stub-details">
<colgroup><col style="width:28mm"/><col style="width:13mm"/><col style="width:19mm"/><col style="width:20mm"/><col style="width:58.5mm"/></colgroup>
<thead><tr><th>نوع البرنامج</th><th>نوع الغرفة</th><th>تخفيض</th><th>الباقي</th><th>ملاحظة</th></tr></thead>
<tbody><tr><td class="program">__PROGRAM__</td><td class="ltr">__ROOM__</td><td class="ltr">__DISCOUNT__</td><td class="ltr">__REMAINING__</td><td>__NOTE__</td></tr></tbody>
</table>
<table class="stub-payment-head">
<colgroup><col style="width:22mm"/><col style="width:21mm"/><col style="width:22mm"/><col style="width:20mm"/><col style="width:24mm"/><col style="width:29.5mm"/></colgroup>
<thead><tr><th>البنك</th><th>تاريخه</th><th>رقم الشيك</th><th>نقد/شيك</th><th>بتاريخ</th><th>الدفعة رقم</th></tr></thead>
</table>
<table class="stub-payment-rows">
<colgroup><col style="width:22mm"/><col style="width:21mm"/><col style="width:22mm"/><col style="width:20mm"/><col style="width:24mm"/><col style="width:29.5mm"/></colgroup>
<tbody><!--STUB_PAYMENT_ROWS--></tbody>
</table>
<table class="stub-contact">
<colgroup><col style="width:58mm"/><col style="width:50mm"/><col style="width:30.5mm"/></colgroup>
<tbody>
<tr><td class="name-value" rowspan="2">__LAST_NAME__</td><td class="name-value">__FIRST_NAME__</td><td class="label-cell">الاسم</td></tr>
<tr><td class="phone-value">__PHONE__</td><td class="label-cell">رقم الهاتف</td></tr>
</tbody>
</table>
</section>
</div>
</div>
<div aria-hidden="true" class="receipt-guide"></div>
</section>
</main>
<script>
  const root = document.documentElement;
  const offsetX = document.getElementById('offsetX');
  const offsetY = document.getElementById('offsetY');

  function applyOffset() {
    root.style.setProperty('--offset-x', \`\${Number(offsetX?.value || 0)}mm\`);
    root.style.setProperty('--offset-y', \`\${Number(offsetY?.value || 0)}mm\`);
  }

  document.getElementById('showFull')?.addEventListener('click', () => {
    document.body.classList.remove('no-background');
  });

  document.getElementById('showPrint')?.addEventListener('click', () => {
    document.body.classList.add('no-background');
  });

  document.getElementById('toggleGuides')?.addEventListener('click', () => {
    document.body.classList.toggle('show-guides');
  });

  document.getElementById('resetOffset')?.addEventListener('click', () => {
    if (offsetX) offsetX.value = 0;
    if (offsetY) offsetY.value = 0;
    applyOffset();
  });

  offsetX?.addEventListener('input', applyOffset);
  offsetY?.addEventListener('input', applyOffset);

  document.getElementById('printButton')?.addEventListener('click', () => {
    if (document.body.dataset.paymentOverflow === 'true') {
      alert('Ce reçu contient plus de six paiements. L’impression est bloquée jusqu’à définition de la règle métier.');
      return;
    }
    try { parent.postMessage({ type: 'zemzem-receipt-print' }, '*'); } catch (e) {}
    window.print();
  });

  applyOffset();
</script>
</body>
</html>
`
