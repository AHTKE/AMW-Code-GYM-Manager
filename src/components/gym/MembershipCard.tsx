// Printable membership card with QR + barcode (admin-customizable fields).

import { useEffect, useState } from 'react';
import { Member } from '@/types/gym';
import { generateQRDataUrl, generateBarcodeDataUrl } from '@/lib/qr';
import { getStoreInfo, getActiveSubscription, getSettings, getPlans } from '@/lib/gymStore';
import { fmtDate, fmtCurrency } from '@/lib/format';
import { Printer, X, Download } from 'lucide-react';
import gymLogo from '@/assets/gym-logo.png';

const DAY_SHORT = ['ح','ن','ث','ر','خ','ج','س'];
const DAY_FULL = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

interface MembershipCardProps {
  member: Member;
  onClose: () => void;
}

const MembershipCard = ({ member, onClose }: MembershipCardProps) => {
  const [qr, setQr] = useState('');
  const [barcode, setBarcode] = useState('');
  const store = getStoreInfo();
  const sub = getActiveSubscription(member.id);
  const opts = getSettings().cardOptions;
  const plan = sub ? getPlans().find(p => p.id === sub.planId) : null;

  useEffect(() => {
    generateQRDataUrl(member.code, 320).then(setQr);
    setBarcode(generateBarcodeDataUrl(member.code));
  }, [member.code]);

  const allowedDaysText = sub?.allowedDays && sub.allowedDays.length
    ? sub.allowedDays.map(d => DAY_FULL[d]).join('، ')
    : 'كل الأيام';

  const sessionsText = sub?.sessionsTotal && sub.sessionsTotal > 0
    ? `${(sub.sessionsUsed||0)} / ${sub.sessionsTotal} حصة`
    : 'غير محدود';

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=520,height=820');
    if (!w) return;
    const features: string[] = [];
    if (plan?.includesPersonalTraining) features.push('تدريب شخصي');
    if (plan?.classesPerWeek) features.push(`${plan.classesPerWeek} حصة/أسبوع`);

    w.document.write(`
      <html dir="rtl"><head><title>بطاقة عضوية ${member.name}</title>
      <style>
        @media print { @page { size: 86mm 54mm; margin: 0; } body { margin: 0; } }
        body { font-family: 'Cairo', Arial, sans-serif; padding: 0; margin: 0; background: #fff; color: #000; }
        .card { width: 86mm; min-height: 54mm; background: linear-gradient(135deg,#0a0a0a,#1a0a0a); color: #fff; border-radius: 4mm; padding: 3mm; display: grid; grid-template-columns: 1fr auto; gap: 2mm; box-sizing: border-box; }
        .card h2 { margin: 0; font-size: 13pt; color: #ff3b30; }
        .row { font-size: 7.5pt; margin: 0.4mm 0; line-height: 1.25; }
        .label { color: #aaa; font-size: 6.5pt; }
        .qr { background: #fff; padding: 1mm; border-radius: 2mm; }
        .qr img { width: 22mm; height: 22mm; display: block; }
        .code { font-family: 'Courier New', monospace; font-size: 9pt; color: #ff3b30; font-weight: 900; letter-spacing: 1px; }
        .barcode { background: #fff; padding: 1mm; border-radius: 1mm; margin-top: 1mm; }
        .barcode img { width: 100%; height: 8mm; display: block; }
        .feat { display: inline-block; background: #ff3b3025; color: #ff8a80; padding: 0.5mm 1.5mm; border-radius: 1mm; font-size: 6.5pt; margin: 0.3mm; }
        .photo { width: 14mm; height: 14mm; border-radius: 50%; object-fit: cover; border: 1.5px solid #ff3b30; margin-bottom: 1mm; }
      </style>
      </head><body>
        <div class="card">
          <div>
            <h2>${store.name || 'GYM'}</h2>
            ${opts.showPhoto && member.photo ? `<img class="photo" src="${member.photo}" />` : ''}
            <div class="label">العضو</div>
            <div class="row" style="font-weight:900;font-size:10pt;">${member.name}</div>
            <div class="row code">${member.code}</div>
            ${opts.showPhone && member.phone ? `<div class="row"><span class="label">هاتف:</span> ${member.phone}</div>` : ''}
            ${opts.showJoinedDate ? `<div class="row"><span class="label">تاريخ الانضمام:</span> ${fmtDate(new Date(member.joinedAt).toISOString().slice(0,10))}</div>` : ''}
            ${sub ? `
              ${opts.showSubscription ? `<div class="row"><span class="label">الباقة:</span> ${sub.planName}</div>` : ''}
              ${opts.showPrice ? `<div class="row"><span class="label">السعر:</span> ${fmtCurrency(sub.price)}</div>` : ''}
              ${opts.showStartDate ? `<div class="row"><span class="label">من:</span> ${fmtDate(sub.startDate)}</div>` : ''}
              ${opts.showEndDate ? `<div class="row"><span class="label">ينتهي:</span> ${fmtDate(sub.endDate)}</div>` : ''}
              ${opts.showSessions ? `<div class="row"><span class="label">الحصص:</span> ${sessionsText}</div>` : ''}
              ${opts.showAllowedDays ? `<div class="row"><span class="label">الأيام:</span> ${allowedDaysText}</div>` : ''}
              ${opts.showFeatures && features.length ? `<div class="row">${features.map(f=>`<span class="feat">${f}</span>`).join('')}</div>` : ''}
            ` : '<div class="row label">لا يوجد اشتراك نشط</div>'}
            ${opts.showBarcode && barcode ? `<div class="barcode"><img src="${barcode}" /></div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
            ${opts.showQR && qr ? `<div class="qr"><img src="${qr}" /></div>` : ''}
          </div>
        </div>
        <script>setTimeout(()=>window.print(),300);</script>
      </body></html>`);
    w.document.close();
  };

  const handleDownload = () => {
    if (!qr) return;
    const a = document.createElement('a');
    a.href = qr;
    a.download = `${member.code}-${member.name}.png`;
    a.click();
  };

  const features: string[] = [];
  if (plan?.includesPersonalTraining) features.push('تدريب شخصي');
  if (plan?.classesPerWeek) features.push(`${plan.classesPerWeek} حصة/أسبوع`);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full space-y-4 shadow-glow my-8">
        <div className="flex items-center justify-between">
          <h2 className="font-cairo font-black text-xl">بطاقة العضوية</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual card preview */}
        <div className="rounded-xl overflow-hidden bg-gradient-to-br from-black to-[hsl(0,40%,10%)] p-4 text-white shadow-glow">
          <div className="flex items-center gap-3 mb-3">
            <img src={gymLogo} alt="" className="w-10 h-10" />
            <div>
              <div className="font-cairo font-black text-primary-glow text-lg leading-none">{store.name || 'GYM'}</div>
              <div className="text-[10px] opacity-70 font-cairo">بطاقة العضوية الرسمية</div>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
            <div className="space-y-1">
              {opts.showPhoto && member.photo && (
                <img src={member.photo} alt={member.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary mb-2" />
              )}
              <div className="text-[10px] opacity-70 font-cairo">العضو</div>
              <div className="font-cairo font-black text-base">{member.name}</div>
              <div className="font-mono text-primary text-sm tracking-wider font-black">{member.code}</div>
              {opts.showPhone && member.phone && (
                <div className="text-[10px] opacity-70 font-cairo">📱 {member.phone}</div>
              )}
              {sub ? (
                <>
                  {opts.showSubscription && (
                    <div className="text-[11px] opacity-70 font-cairo mt-1">الباقة: <span className="text-white font-bold">{sub.planName}</span></div>
                  )}
                  {opts.showPrice && (
                    <div className="text-[11px] opacity-70 font-cairo">السعر: <span className="text-white">{fmtCurrency(sub.price)}</span></div>
                  )}
                  {opts.showStartDate && (
                    <div className="text-[11px] opacity-70 font-cairo">من: <span className="text-white">{fmtDate(sub.startDate)}</span></div>
                  )}
                  {opts.showEndDate && (
                    <div className="text-[11px] opacity-70 font-cairo">ينتهي: <span className="text-white">{fmtDate(sub.endDate)}</span></div>
                  )}
                  {opts.showSessions && (
                    <div className="text-[11px] opacity-70 font-cairo">الحصص: <span className="text-white">{sessionsText}</span></div>
                  )}
                  {opts.showAllowedDays && (
                    <div className="text-[11px] opacity-70 font-cairo flex items-center gap-1 flex-wrap">
                      الأيام:
                      {sub.allowedDays && sub.allowedDays.length ? (
                        <span className="flex gap-0.5">
                          {[0,1,2,3,4,5,6].map(d => (
                            <span key={d} className={`w-4 h-4 inline-flex items-center justify-center rounded text-[9px] font-bold ${sub.allowedDays!.includes(d) ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white/30'}`}>{DAY_SHORT[d]}</span>
                          ))}
                        </span>
                      ) : <span className="text-white">كل الأيام</span>}
                    </div>
                  )}
                  {opts.showFeatures && features.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {features.map(f => <span key={f} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary-glow">{f}</span>)}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[11px] text-warning font-cairo">لا يوجد اشتراك نشط</div>
              )}
            </div>
            {opts.showQR && (
              <div className="bg-white p-1.5 rounded">
                {qr && <img src={qr} alt="QR" className="w-24 h-24" />}
              </div>
            )}
          </div>
          {opts.showBarcode && barcode && (
            <div className="mt-3 bg-white rounded p-1">
              <img src={barcode} alt="barcode" className="w-full h-12 object-contain" />
            </div>
          )}
        </div>

        <div className="text-[10px] text-muted-foreground font-cairo text-center">
          💡 يمكن للمدير تخصيص الحقول من الإعدادات → "تخصيص بطاقة العضوية"
        </div>

        <div className="flex gap-2">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground font-cairo font-bold hover:opacity-90">
            <Printer className="w-4 h-4" /> طباعة البطاقة
          </button>
          <button onClick={handleDownload} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary text-foreground font-cairo font-bold hover:bg-accent">
            <Download className="w-4 h-4" /> تنزيل QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;
