// Print a subscription / payment receipt with gym branding.
import { getStoreInfo } from './gymStore';
import { fmtCurrency as fmtMoney, fmtDate } from './format';

export interface ReceiptData {
  title: string;            // e.g. "إيصال اشتراك"
  number: string;           // receipt or sub id
  memberName: string;
  memberCode: string;
  planName?: string;
  startDate?: string;
  endDate?: string;
  amount: number;
  paid: number;
  paymentMethod?: string;
  cashier?: string;
  notes?: string;
}

export function printReceipt(data: ReceiptData) {
  const store = getStoreInfo();
  const remaining = data.amount - data.paid;
  const win = window.open('', '_blank', 'width=420,height=620');
  if (!win) { alert('قم بالسماح بفتح النوافذ المنبثقة'); return; }
  const html = `
<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8" />
<title>${data.title}</title>
<style>
@page { size: 80mm auto; margin: 4mm; }
* { box-sizing: border-box; }
body { font-family: 'Cairo','Tajawal',sans-serif; font-size: 12px; color:#000; margin:0; padding:8px; }
.center { text-align:center; }
h1 { font-size:18px; margin:4px 0; }
h2 { font-size:14px; margin:4px 0; }
hr { border:none; border-top:1px dashed #999; margin:6px 0; }
table { width:100%; border-collapse:collapse; }
td { padding:2px 0; }
td.l { text-align:right; color:#444; }
td.r { text-align:left; font-weight:700; }
.big { font-size:16px; font-weight:900; }
.muted { color:#666; font-size:10px; }
img.logo { max-width:60px; max-height:60px; object-fit:contain; }
</style>
</head><body>
<div class="center">
  ${store.logo ? `<img class="logo" src="${store.logo}" />` : ''}
  <h1>${escapeHtml(store.name || 'GYM')}</h1>
  ${store.address ? `<div class="muted">${escapeHtml(store.address)}</div>` : ''}
  ${store.phone ? `<div class="muted">${escapeHtml(store.phone)}</div>` : ''}
</div>
<hr/>
<h2 class="center">${escapeHtml(data.title)}</h2>
<div class="muted center">رقم: ${escapeHtml(data.number)} • ${fmtDate(new Date().toISOString().slice(0,10))}</div>
<hr/>
<table>
  <tr><td class="l">العضو:</td><td class="r">${escapeHtml(data.memberName)}</td></tr>
  <tr><td class="l">الكود:</td><td class="r">${escapeHtml(data.memberCode)}</td></tr>
  ${data.planName ? `<tr><td class="l">الباقة:</td><td class="r">${escapeHtml(data.planName)}</td></tr>` : ''}
  ${data.startDate ? `<tr><td class="l">من:</td><td class="r">${fmtDate(data.startDate)}</td></tr>` : ''}
  ${data.endDate ? `<tr><td class="l">إلى:</td><td class="r">${fmtDate(data.endDate)}</td></tr>` : ''}
</table>
<hr/>
<table>
  <tr><td class="l">السعر:</td><td class="r">${fmtMoney(data.amount, store.currency)}</td></tr>
  <tr><td class="l">المدفوع:</td><td class="r">${fmtMoney(data.paid, store.currency)}</td></tr>
  ${remaining > 0 ? `<tr><td class="l">المتبقي:</td><td class="r" style="color:#c00">${fmtMoney(remaining, store.currency)}</td></tr>` : ''}
  ${data.paymentMethod ? `<tr><td class="l">طريقة الدفع:</td><td class="r">${escapeHtml(data.paymentMethod)}</td></tr>` : ''}
</table>
<hr/>
<div class="big center">${fmtMoney(data.paid, store.currency)}</div>
${data.cashier ? `<div class="muted center">بواسطة: ${escapeHtml(data.cashier)}</div>` : ''}
${data.notes ? `<div class="muted">ملاحظات: ${escapeHtml(data.notes)}</div>` : ''}
<hr/>
<div class="center muted">شكراً لاشتراكك معنا 💪</div>
<script>window.onload = () => { setTimeout(() => { window.print(); }, 200); };</script>
</body></html>`;
  win.document.write(html);
  win.document.close();
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
