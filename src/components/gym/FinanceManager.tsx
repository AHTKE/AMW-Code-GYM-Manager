import { useState } from 'react';
import { getExpenses, addExpense, deleteExpense, getIncome, addIncome, deleteIncome, getPayments, getSubscriptions, getMembers } from '@/lib/gymStore';
import { Expense, Income } from '@/types/gym';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { fmtCurrency, fmtDate, todayISO } from '@/lib/format';

const FinanceManager = () => {
  const [tab, setTab] = useState<'overview'|'income'|'expenses'|'payments'>('overview');
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {([
          ['overview','نظرة عامة'],
          ['payments','المدفوعات'],
          ['income','الدخل الإضافي'],
          ['expenses','المصروفات'],
        ] as const).map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-lg font-cairo font-bold text-sm ${tab===k?'bg-primary text-primary-foreground shadow-glow':'bg-secondary text-muted-foreground'}`}>{l}</button>
        ))}
      </div>
      {tab==='overview' && <Overview />}
      {tab==='income' && <IncomeTab />}
      {tab==='expenses' && <ExpensesTab />}
      {tab==='payments' && <PaymentsTab />}
    </div>
  );
};

const Overview = () => {
  const subs = getSubscriptions();
  const payments = getPayments();
  const expenses = getExpenses();
  const income = getIncome();

  const totalSubs = subs.reduce((s,x)=>s+x.price,0);
  const totalPaid = payments.reduce((s,x)=>s+x.amount,0);
  const totalExpenses = expenses.reduce((s,x)=>s+x.amount,0);
  const totalIncome = income.reduce((s,x)=>s+x.amount,0);
  const profit = totalPaid + totalIncome - totalExpenses;

  const today = todayISO();
  const todayPayments = payments.filter(p=>p.date===today).reduce((s,x)=>s+x.amount,0);
  const todayIncome = income.filter(i=>i.date===today).reduce((s,x)=>s+x.amount,0);
  const todayExpenses = expenses.filter(e=>e.date===today).reduce((s,x)=>s+x.amount,0);

  const cards = [
    { label: 'مدفوعات اليوم', value: fmtCurrency(todayPayments), color: 'bg-success/20 text-success', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'دخل إضافي اليوم', value: fmtCurrency(todayIncome), color: 'bg-primary/20 text-primary', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'مصروفات اليوم', value: fmtCurrency(todayExpenses), color: 'bg-destructive/20 text-destructive', icon: <TrendingDown className="w-5 h-5" /> },
    { label: '💰 صافي اليوم', value: fmtCurrency(todayPayments + todayIncome - todayExpenses), color: 'bg-warning/20 text-warning', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'إجمالي الاشتراكات (قيمة)', value: fmtCurrency(totalSubs), color: 'bg-secondary text-foreground', icon: <></> },
    { label: 'إجمالي المحصل', value: fmtCurrency(totalPaid), color: 'bg-success/20 text-success', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'إجمالي المصروفات', value: fmtCurrency(totalExpenses), color: 'bg-destructive/20 text-destructive', icon: <TrendingDown className="w-5 h-5" /> },
    { label: '📊 صافي الأرباح', value: fmtCurrency(profit), color: profit>=0?'bg-success/20 text-success':'bg-destructive/20 text-destructive', icon: <DollarSign className="w-5 h-5" /> },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c,i)=>(
        <div key={i} className={`p-4 rounded-xl ${c.color}`}>
          <div className="flex items-center gap-2 text-xs font-cairo opacity-80">{c.icon}{c.label}</div>
          <div className="font-cairo font-black text-2xl mt-2">{c.value}</div>
        </div>
      ))}
    </div>
  );
};

const PaymentsTab = () => {
  const payments = getPayments().slice().reverse();
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm font-cairo">
        <thead className="bg-secondary/50 text-xs text-muted-foreground">
          <tr>
            <th className="text-right px-3 py-2">العضو</th>
            <th className="text-right px-3 py-2">المبلغ</th>
            <th className="text-right px-3 py-2">طريقة الدفع</th>
            <th className="text-right px-3 py-2">التاريخ</th>
            <th className="text-right px-3 py-2">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(p=>(
            <tr key={p.id} className="border-t border-border">
              <td className="px-3 py-2 font-bold">{p.memberName}</td>
              <td className="px-3 py-2 font-bold text-success">{fmtCurrency(p.amount)}</td>
              <td className="px-3 py-2 text-xs">{p.method}</td>
              <td className="px-3 py-2 text-xs">{fmtDate(p.date)}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{p.note||'—'}</td>
            </tr>
          ))}
          {payments.length===0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد مدفوعات.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

const IncomeTab = () => {
  const [list, setList] = useState<Income[]>(getIncome());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ description: '', amount: 0, category: 'متفرقات' });
  const refresh = () => setList(getIncome());
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || form.amount <= 0) return;
    addIncome({ id: crypto.randomUUID(), description: form.description, amount: form.amount, category: form.category, date: todayISO(), timestamp: Date.now() });
    setForm({ description: '', amount: 0, category: 'متفرقات' });
    setShow(false); refresh();
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={()=>setShow(true)} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> دخل جديد
        </button>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm font-cairo">
          <thead className="bg-secondary/50 text-xs text-muted-foreground">
            <tr><th className="text-right px-3 py-2">الوصف</th><th className="text-right px-3 py-2">التصنيف</th><th className="text-right px-3 py-2">المبلغ</th><th className="text-right px-3 py-2">التاريخ</th><th></th></tr>
          </thead>
          <tbody>
            {list.slice().reverse().map(i=>(
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2">{i.description}</td>
                <td className="px-3 py-2 text-xs">{i.category}</td>
                <td className="px-3 py-2 font-bold text-success">{fmtCurrency(i.amount)}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(i.date)}</td>
                <td className="px-3 py-2"><button onClick={()=>{deleteIncome(i.id); refresh();}} className="p-1.5 rounded bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button></td>
              </tr>
            ))}
            {list.length===0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد دخل إضافي.</td></tr>}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-3">
            <h2 className="font-cairo font-black text-lg">دخل جديد</h2>
            <input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="الوصف" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
            <input type="number" value={form.amount||''} onChange={e=>setForm({...form, amount:Number(e.target.value)||0})} placeholder="المبلغ" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
            <input value={form.category} onChange={e=>setForm({...form, category:e.target.value})} placeholder="التصنيف" className="w-full h-10 px-3 bg-secondary rounded font-cairo" />
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={()=>setShow(false)} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">حفظ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const ExpensesTab = () => {
  const [list, setList] = useState<Expense[]>(getExpenses());
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ description: '', amount: 0, category: 'مصروفات تشغيل' });
  const refresh = () => setList(getExpenses());
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || form.amount <= 0) return;
    addExpense({ id: crypto.randomUUID(), description: form.description, amount: form.amount, category: form.category, date: todayISO(), timestamp: Date.now() });
    setForm({ description: '', amount: 0, category: 'مصروفات تشغيل' });
    setShow(false); refresh();
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={()=>setShow(true)} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-cairo font-bold text-sm shadow-glow">
          <Plus className="w-4 h-4" /> مصروف جديد
        </button>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm font-cairo">
          <thead className="bg-secondary/50 text-xs text-muted-foreground">
            <tr><th className="text-right px-3 py-2">الوصف</th><th className="text-right px-3 py-2">التصنيف</th><th className="text-right px-3 py-2">المبلغ</th><th className="text-right px-3 py-2">التاريخ</th><th></th></tr>
          </thead>
          <tbody>
            {list.slice().reverse().map(i=>(
              <tr key={i.id} className="border-t border-border">
                <td className="px-3 py-2">{i.description}</td>
                <td className="px-3 py-2 text-xs">{i.category}</td>
                <td className="px-3 py-2 font-bold text-destructive">{fmtCurrency(i.amount)}</td>
                <td className="px-3 py-2 text-xs">{fmtDate(i.date)}</td>
                <td className="px-3 py-2"><button onClick={()=>{deleteExpense(i.id); refresh();}} className="p-1.5 rounded bg-destructive/10 text-destructive"><Trash2 className="w-3 h-3" /></button></td>
              </tr>
            ))}
            {list.length===0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد مصروفات.</td></tr>}
          </tbody>
        </table>
      </div>
      {show && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={save} className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-3">
            <h2 className="font-cairo font-black text-lg">مصروف جديد</h2>
            <input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="الوصف" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
            <input type="number" value={form.amount||''} onChange={e=>setForm({...form, amount:Number(e.target.value)||0})} placeholder="المبلغ" className="w-full h-10 px-3 bg-secondary rounded font-cairo" required />
            <input value={form.category} onChange={e=>setForm({...form, category:e.target.value})} placeholder="التصنيف" className="w-full h-10 px-3 bg-secondary rounded font-cairo" />
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={()=>setShow(false)} className="px-5 py-2.5 rounded-lg bg-secondary font-cairo font-bold">إلغاء</button>
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-cairo font-bold shadow-glow">حفظ</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
