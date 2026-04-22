import { useState, useMemo } from 'react';
import { getAttendance, getMembers } from '@/lib/gymStore';
import { fmtDate } from '@/lib/format';
import { Search } from 'lucide-react';

const AttendanceLog = () => {
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const all = getAttendance();
  const members = getMembers();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter(a => {
        if (date && a.date !== date) return false;
        if (q && !`${a.memberName}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 500);
  }, [all, search, date]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث باسم العضو..." className="w-full h-10 pr-10 px-3 bg-secondary rounded-lg font-cairo text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="h-10 px-3 bg-secondary rounded-lg font-cairo text-sm" />
        {date && <button onClick={()=>setDate('')} className="px-3 h-10 rounded bg-secondary text-xs font-cairo">مسح التاريخ</button>}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm font-cairo">
          <thead className="bg-secondary/50 text-xs text-muted-foreground">
            <tr>
              <th className="text-right px-3 py-2">العضو</th>
              <th className="text-right px-3 py-2">النوع</th>
              <th className="text-right px-3 py-2">التاريخ</th>
              <th className="text-right px-3 py-2">الوقت</th>
              <th className="text-right px-3 py-2">بواسطة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => {
              const m = members.find(x => x.id === a.memberId);
              return (
                <tr key={a.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-3 py-2">
                    <div className="font-bold">{a.memberName}</div>
                    {m && <div className="text-xs font-mono text-primary">{m.code}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${a.type==='check-in'?'bg-success/20 text-success':'bg-warning/20 text-warning'}`}>
                      {a.type==='check-in'?'دخول':'خروج'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{fmtDate(a.date)}</td>
                  <td className="px-3 py-2 font-mono text-xs">{a.time}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{a.scannedBy || '—'}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">لا يوجد حضور.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceLog;
