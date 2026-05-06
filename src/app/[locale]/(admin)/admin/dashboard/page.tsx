import {
  Activity,
  BadgeIndianRupee,
  CircleAlert,
  Droplets,
  Gauge,
  MoveRight,
  ShoppingCart,
  Users,
  Plus,
  Play,
  Square,
  ArrowUpRight,
} from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminBadge, AdminCard, AdminStatCard } from "@/components/layout/admin-ui";

import { cn, formatCurrencyINR } from "@/lib/utils";
import { getAdminCalendarData, getDashboardData, getPurchaseLedgerData } from "@/lib/data-service";
import { formatCurrencyINR } from "@/lib/utils";
import { LiveClock } from "@/components/layout/live-clock";

type AdminDashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboardPage({
  params,
}: AdminDashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "admin.dashboard" });
  const tStatus = await getTranslations({ locale, namespace: "status" });

  const [{ kpis, routeSnapshot, attentionCustomers }, purchaseLedger, adminCalendar] =
    await Promise.all([getDashboardData(), getPurchaseLedgerData(), getAdminCalendarData()]);

  // Calculations
  const routeCoverage = kpis.activeCustomers
    ? Math.round((kpis.todayDelivered / kpis.activeCustomers) * 100)
    : 0;
  const collectionRate = kpis.monthlySales
    ? Math.round(((kpis.monthlySales - kpis.monthlyDue) / kpis.monthlySales) * 100)
    : 0;
  const inwardCoverage = adminCalendar.summary.totalLiters
    ? Math.min(
      Math.round(
        (purchaseLedger.summary.totalMilkInward / Math.max(adminCalendar.summary.totalLiters, 1)) * 100
      ), 100
    ) : 0;

  const followUpCount = attentionCustomers.filter((entry) => entry.issue === "Payment overdue").length;

  return (
    <AdminShell locale={locale} title={t("title")} subtitle={t("subtitle")}>
      <style>{customStyles}</style>

      <div className="content-wrapper max-w-[1600px] mx-auto p-4 space-y-6">

        {/* STAT CARDS ROW */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="blob bg-green-500/10"></div>
            <div className="stat-lbl">{t("stats.activeCustomers")}</div>
            <div className="stat-val">{kpis.activeCustomers}</div>
            <span className="stat-pill pill-green">
              ↑ {t("stats.activeCustomersHint", { count: kpis.todayPending })}
            </span>
          </div>

          <div className="stat-card">
            <div className="blob bg-blue-500/10"></div>
            <div className="stat-lbl">{t("stats.todaysDeliveries")}</div>
            <div className="stat-val">{kpis.todayDelivered}</div>
            <span className="stat-pill pill-blue">
              {t("stats.todaysDeliveriesHint", { count: kpis.todayPending })}
            </span>
          </div>

          <div className="stat-card">
            <div className="blob bg-amber-500/10"></div>
            <div className="stat-lbl">{t("stats.monthlySales")}</div>
            <div className="stat-val">{formatCurrencyINR(kpis.monthlySales)}</div>
            <span className="stat-pill pill-amber">{t("stats.monthlySalesHint")}</span>
          </div>

          <div className="stat-card border-red-100">
            <div className="blob bg-red-500/10"></div>
            <div className="stat-lbl">{t("stats.outstandingDues")}</div>
            <div className="stat-val">{formatCurrencyINR(kpis.monthlyDue)}</div>
            <span className="stat-pill pill-red">
              {t("stats.outstandingDuesHint", { count: followUpCount })}
            </span>
          </div>
        </div>

        {/* MID ROW */}
        <div className="mid-row">
          {/* Route Analytics Card */}
          <div className="analytics-card bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6 gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-800 tracking-tight leading-snug">{t("hero.title")}</h3>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  {purchaseLedger.summary.totalMilkInward.toFixed(0)}L total
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  today
                </span>
              </div>
            </div>

            {/* THE BARS SECTION - Use flex items-end to make them grow upwards */}
            <div className="flex items-end gap-3 h-[120px] mb-6">
              {routeSnapshot.slice(0, 5).map((area, idx) => (
                <div key={area.areaCode} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full rounded-2xl relative overflow-hidden transition-all duration-500 hover:opacity-80"
                    style={{
                      height: `${Math.max(20, (area.deliveredCount / area.customerCount) * 100)}%`,
                      backgroundColor: idx % 2 === 0 ? '#064e3b' : '#22c55e'
                    }}
                  >
                    {/* Subtle shine effect like Screenshot 2 */}
                    <div className="absolute inset-0 bg-white/10" />
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase">
                    {area.areaCode.replace('_', ' ').split(' ')[0]} {/* Shortens name if needed */}
                  </span>
                </div>
              ))}
            </div>

            {/* LEGEND */}
            <div className="flex gap-4 text-[10px] font-bold text-gray-400 border-t border-gray-50 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#064e3b]" />
                {t("performance.delivered")}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                {t("performance.pending")}
              </div>
            </div>
          </div>

          {/* Quick Actions (The Dark Green Card) */}
          <div className="reminders-card bg-[#064e3b] rounded-[24px] p-8 text-white relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400/80 mb-2 block">
                {tStatus("onTrack")}
              </span>
              <h3 className="text-2xl font-bold leading-tight mb-2 max-w-[200px]">
                Manage today's milk delivery easily.
              </h3>
              <p className="text-green-100/60 text-xs mb-8">Make quick entries here</p>
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <Link href="/admin/deliveries?start=1" className="bg-[#22c55e] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-400 transition-colors shadow-lg shadow-green-900/20">
                <Play size={16} fill="white" /> {t("hero.startRun")}
              </Link>
              <button className="text-white/70 text-[11px] font-bold flex items-center gap-2 hover:text-white justify-center py-2 transition-all">
                <Plus size={14} /> {t("quickActions.addCustomer")}
              </button>
            </div>

            {/* The glass-of-milk background icon from Screenshot 2 */}
            <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
              <Droplets size={180} />
            </div>
          </div>

          {/* Today's Progress */}
          <div className="tasks-card bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-800">{t("progress.title")}</h3>
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <Gauge size={16} className="text-green-700" />
              </div>
            </div>
            <div className="space-y-6">
              {[
                { label: t("progress.deliveryCompletion"), val: routeCoverage, color: '#22c55e' },
                { label: t("progress.paymentRecovery"), val: collectionRate, color: '#f59e0b' },
                { label: t("progress.milkInwardCoverage"), val: inwardCoverage, color: '#3b82f6' }
              ].map((p) => (
                <div key={p.label} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>{p.label}</span>
                    <span>{p.val}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.val}%`, background: p.color }}></div>
                  </div>
                  <AdminBadge tone={entry.tone}>
                    {entry.issue}
                  </AdminBadge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="bottom-row">
          {/* Attention List */}
          <div className="team-card bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-gray-800">{t("attention.title")}</h3>
              <Activity size={16} className="text-green-700" />
            </div>
            <div className="space-y-4">
              {attentionCustomers.slice(0, 4).map((entry) => (
                <div key={entry.customerCode} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-green-50 text-[#064e3b] font-bold text-xs flex items-center justify-center transition-colors group-hover:bg-green-100">
                    {entry.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-800 truncate">{entry.name}</div>
                    <div className="text-[10px] text-gray-400 font-medium truncate">{entry.info}</div>
                  </div>
                  <div className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-[9px] font-bold tracking-tight uppercase ${entry.tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                    {entry.issue}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Time Tracker Card */}
          <div className="tracker-card bg-gradient-to-br from-[#064e3b] via-[#053e2f] to-[#021f16] rounded-[32px] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-green-900/30 min-h-[380px] border border-white/10 group">

            {/* Dynamic Animated Background Glows */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-400/10 rounded-full blur-3xl group-hover:bg-green-400/20 transition-all duration-700" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />

            <div className="relative z-10 flex-1 flex flex-col">
              {/* Header with Pulsing Live Dot */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-[#064e3b]"></span>
                  </div>
                  <h3 className="uppercase text-xs font-black tracking-[0.2em] text-green-300">
                    {t("performance.title")}
                  </h3>
                </div>
                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-sm">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Shift 1</span>
                </div>
              </div>

              {/* Live Digital Clock */}
              <LiveClock />

              {/* Premium Control Bar */}
              <div className="flex items-center gap-4 mt-auto mb-10">
                <button className="flex-1 flex justify-center items-center gap-2 py-4 rounded-[18px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 transition-all text-white text-sm font-black shadow-[0_8px_20px_rgba(225,29,72,0.3)] hover:shadow-[0_10px_25px_rgba(225,29,72,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
                  <Square size={16} fill="currentColor" /> Stop Run
                </button>

                <button className="w-[52px] h-[52px] shrink-0 flex items-center justify-center rounded-[18px] bg-white/10 hover:bg-white/20 transition-all text-white backdrop-blur-md border border-white/10 hover:border-white/20 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shadow-lg">
                  <Plus size={24} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Elevated Active Task Glass Container */}
            <div className="relative z-10 bg-black/20 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 shadow-2xl transform transition-transform group-hover:scale-[1.02] duration-500">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1 block drop-shadow-md">Active Task</span>
                    <p className="text-[15px] font-bold text-white tracking-tight">Morning delivery run</p>
                  </div>
                  <div className="px-3 py-1.5 bg-green-500/20 rounded-xl border border-green-500/30 backdrop-blur-sm">
                    <span className="text-xs font-black text-green-300">65%</span>
                  </div>
                </div>

                {/* Thicker Glowing Progress Bar */}
                <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner relative p-[2px]">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                    style={{ width: '65%' }}
                  />
                </div>
              </div>
            </div>

            {/* Decorative Ambient Icon */}
            <div className="absolute right-[-10%] bottom-[-5%] opacity-[0.03] pointer-events-none transform -rotate-12 group-hover:rotate-0 transition-transform duration-1000 ease-out">
              <Gauge size={300} strokeWidth={1} />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
const customStyles = `
  .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  
  @media (max-width: 768px) {
    .stats-row { 
      display: flex;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      gap: 10px;
      padding-bottom: 8px;
      margin: 0 -16px;
      padding-left: 16px;
      padding-right: 16px;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .stats-row::-webkit-scrollbar { display: none; }
    .stat-card {
      min-width: 200px;
      flex-shrink: 0;
      scroll-snap-align: start;

  .stat-card { 
    background: white; 
    border-radius: 20px;
    padding: 16px;
    position: relative; 
    overflow: hidden; 
    border: 1px solid #f3f4f6;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    min-width: 140px;
    scroll-snap-align: start;
    flex-shrink: 0;
  }

  .stat-card .blob { 
    position: absolute; 
    right: -20px; 
    top: -20px; 
    width: 80px; 
    height: 80px; 
    border-radius: 50%; 
    filter: blur(16px);
  }

  .stat-lbl { 
    font-size: 9px; 
    font-weight: 800; 
    color: #9CA3AF; 
    margin-bottom: 6px; 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
  }

  .stat-val { 
    font-size: 22px; 
    font-weight: 900; 
    color: #111827; 
    line-height: 1; 
    margin-bottom: 8px; 
    letter-spacing: -0.02em; 
  }

  .stat-pill { 
    font-size: 9px; 
    font-weight: 700; 
    padding: 3px 8px; 
    border-radius: 20px; 
    display: inline-block; 
  }
  
  .mid-row { display: grid; grid-template-columns: 1.2fr 1fr 0.8fr; gap: 12px; }
  .bottom-row { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }

  .pill-green { background: #f0fdf4; color: #15803d; }
  .pill-blue { background: #eff6ff; color: #1d4ed8; }
  .pill-amber { background: #fffbeb; color: #b45309; }
  .pill-red { background: #fef2f2; color: #b91c1c; }

  @media (max-width: 1200px) {
    .mid-row { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 768px) {
    .mid-row, .bottom-row { grid-template-columns: 1fr; }
  }
`;