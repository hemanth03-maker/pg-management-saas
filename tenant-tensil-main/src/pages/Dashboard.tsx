import { usePG } from "@/context/PGContext";
import { useSettings } from "@/context/SettingsContext";
import { PageHeader } from "@/components/PageHeader";
import { useNavigate } from "react-router-dom";
import { UserPlus, CreditCard, Receipt, BedDouble, Users, TrendingUp, TrendingDown, Wallet, FileText, BedSingle, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const StatCard = ({ label, value, icon: Icon, variant, onClick }: { label: string; value: string | number; icon: any; variant?: "success" | "destructive" | "primary" | "warning"; onClick?: () => void }) => {
  const colors = {
    success: "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
  };
  const iconColor = variant ? colors[variant] : "bg-primary/10 text-primary";

  return (
    <div
      className={`bg-card rounded-lg p-4 border border-border shadow-sm animate-fade-in ${onClick ? "cursor-pointer hover:border-primary/40 active:scale-[0.98] transition-all" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${iconColor}`}>
          <Icon size={22} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-bold text-card-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { rooms, members, payments, expenses } = usePG();
  const { pgName } = useSettings();
  const navigate = useNavigate();
  const [reportOpen, setReportOpen] = useState(false);
  const [unpaidOpen, setUnpaidOpen] = useState(false);

  const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const currentMonthPayments = payments.filter(p => p.month === currentMonth);

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.occupiedBeds < r.totalBeds).length;
  const totalBeds = rooms.reduce((s, r) => s + r.totalBeds, 0);
  const occupiedBeds = rooms.reduce((s, r) => s + r.occupiedBeds, 0);
  const availableBeds = totalBeds - occupiedBeds;
  const totalMembers = members.length;
  const unpaidPayments = currentMonthPayments.filter(p => !p.paid);
  const totalEarnings = currentMonthPayments.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);

  // Filter expenses by current month (match YYYY-MM from date field)
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentYM));
  const totalExpenses = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalEarnings - totalExpenses;

  const unpaidMembers = unpaidPayments.map(p => {
    const member = members.find(m => m.id === p.memberId);
    const room = member ? rooms.find(r => r.id === member.roomId) : undefined;
    return member ? { ...member, roomNumber: room?.roomNumber || "—", pendingAmount: p.amount } : null;
  }).filter(Boolean) as (typeof members[0] & { roomNumber: string; pendingAmount: number })[];

  const sendWhatsApp = (name: string, phone: string) => {
    const msg = encodeURIComponent(`Hi ${name}, your PG rent for ${currentMonth} is pending. Please pay as soon as possible. Thank you.`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
  };

  const quickActions = [
    { label: "Add Member", icon: UserPlus, path: "/members", color: "bg-primary text-primary-foreground" },
    { label: "Add Payment", icon: CreditCard, path: "/payments", color: "bg-success text-success-foreground" },
    { label: "Add Expense", icon: Receipt, path: "/expenses", color: "bg-warning text-warning-foreground" },
  ];

  return (
    <div className="p-4 pb-28 max-w-4xl mx-auto">
      <PageHeader title={`${pgName} Dashboard`} subtitle="Overview of your PG" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Rooms" value={totalRooms} icon={BedDouble} variant="primary" />
        <StatCard label="Available Rooms" value={availableRooms} icon={BedDouble} variant="success" />
        <StatCard label="Available Beds" value={availableBeds} icon={BedSingle} variant="success" />
        <StatCard label="Total Members" value={totalMembers} icon={Users} variant="primary" />
        <StatCard
          label="Unpaid Members"
          value={unpaidPayments.length}
          icon={Users}
          variant="destructive"
          onClick={() => setUnpaidOpen(true)}
        />
        <StatCard label="Monthly Earnings" value={`₹${totalEarnings.toLocaleString("en-IN")}`} icon={TrendingUp} variant="success" />
        <StatCard label="Total Expenses" value={`₹${totalExpenses.toLocaleString("en-IN")}`} icon={TrendingDown} variant="warning" />
      </div>

      <div className="bg-card rounded-lg p-4 border border-border shadow-sm mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${netProfit >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
            <Wallet size={22} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Net Profit</p>
            <p className="text-2xl font-bold text-card-foreground">₹{netProfit.toLocaleString("en-IN")}</p>
          </div>
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-3 text-sm font-semibold active:scale-95 transition-transform"
          >
            <FileText size={18} /> Report
          </button>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={`${action.color} rounded-lg p-4 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform`}
          >
            <action.icon size={26} />
            <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Report Modal */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>Monthly Report</DialogTitle>
            <DialogDescription>Financial summary for {currentMonth}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Month</span>
                <span className="font-semibold text-card-foreground">{currentMonth}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Earnings</span>
                <span className="font-semibold text-success">₹{totalEarnings.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="font-semibold text-destructive">₹{totalExpenses.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-sm">
                <span className="font-semibold text-card-foreground">{netProfit >= 0 ? "Profit" : "Loss"}</span>
                <span className={`font-bold text-lg ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                  ₹{Math.abs(netProfit).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <h4 className="text-sm font-semibold text-card-foreground mb-2">Collection Summary</h4>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Paid Members</span>
                <span className="font-medium text-success">{currentMonthPayments.filter(p => p.paid).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unpaid Members</span>
                <span className="font-medium text-destructive">{unpaidPayments.length}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unpaid Members Modal */}
      <Dialog open={unpaidOpen} onOpenChange={setUnpaidOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-lg rounded-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Unpaid Members</DialogTitle>
            <DialogDescription>{unpaidMembers.length} members with pending payments</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {unpaidMembers.map(m => (
              <div key={m.id} className="bg-card rounded-lg p-4 border-2 border-destructive/40 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-card-foreground">{m.name}</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border status-unpaid">Unpaid</span>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground mb-3">
                  <p>Room {m.roomNumber} • {m.phone}</p>
                  <p className="font-semibold text-destructive text-base">Pending: ₹{m.pendingAmount.toLocaleString("en-IN")}</p>
                </div>
                <button
                  onClick={() => sendWhatsApp(m.name, m.phone)}
                  className="w-full flex items-center justify-center gap-2 bg-success text-success-foreground rounded-lg py-2.5 text-sm font-semibold active:scale-95 transition-transform"
                >
                  <MessageCircle size={16} /> Send WhatsApp Reminder
                </button>
              </div>
            ))}
            {unpaidMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">All members are paid! 🎉</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
