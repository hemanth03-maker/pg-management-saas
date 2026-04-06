import { useState } from "react";
import { usePG } from "@/context/PGContext";
import { PageHeader } from "@/components/PageHeader";
import { Check, X, MessageCircle, Search, CalendarPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Filter = "all" | "paid" | "unpaid";

const generateMonthList = () => {
  const months: string[] = [];
  const start = new Date(2026, 0, 1);
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 6, 1);
  let d = new Date(start);
  while (d <= end) {
    months.push(d.toLocaleString("en-US", { month: "long", year: "numeric" }));
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return months;
};
const MONTHS = generateMonthList();

const parseMonthString = (monthStr: string): Date => {
  const parts = monthStr.split(" ");
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const monthIndex = monthNames.indexOf(parts[0]);
  return new Date(parseInt(parts[1]), monthIndex, 1);
};

const isMemberJoinedByMonth = (joinDate: string, monthStr: string): boolean => {
  const monthStart = parseMonthString(monthStr);
  const lastDayOfMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const joined = new Date(joinDate);
  return joined <= lastDayOfMonth;
};

const Payments = () => {
  const { payments, members, togglePaymentStatus, generateMonthPayments } = usePG();
  const [filter, setFilter] = useState<Filter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.toLocaleString("en-US", { month: "long", year: "numeric" });
  });
  const [generating, setGenerating] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState<{ id: string; name: string; newStatus: boolean } | null>(null);

  const eligibleMemberIds = new Set(
    members.filter(m => isMemberJoinedByMonth(m.joinDate, selectedMonth)).map(m => m.id)
  );
  const monthPayments = payments.filter(p => p.month === selectedMonth && eligibleMemberIds.has(p.memberId));

  const filtered = monthPayments.filter(p => {
    const member = members.find(m => m.id === p.memberId);
    const matchesSearch = member?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const matchesFilter = filter === "all" || (filter === "paid" && p.paid) || (filter === "unpaid" && !p.paid);
    return matchesSearch && matchesFilter;
  });

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: monthPayments.length },
    { key: "paid", label: "Paid", count: monthPayments.filter(p => p.paid).length },
    { key: "unpaid", label: "Unpaid", count: monthPayments.filter(p => !p.paid).length },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generateMonthPayments(selectedMonth);
    setGenerating(false);
    if (result.skipped) {
      toast.warning(`Payments for ${selectedMonth} already exist.`);
    } else if (result.generated > 0) {
      toast.success(`Generated ${result.generated} payment(s) for ${selectedMonth}.`);
    } else {
      toast.info("No members found to generate payments for.");
    }
  };

  const handleToggleConfirm = async () => {
    if (!confirmPayment) return;
    await togglePaymentStatus(confirmPayment.id, confirmPayment.newStatus);
    toast.success(confirmPayment.newStatus ? "Payment marked as paid." : "Payment marked as unpaid.");
    setConfirmPayment(null);
  };

  const sendWhatsApp = (name: string, phone: string) => {
    const msg = encodeURIComponent(`Hi ${name}, your PG rent for ${selectedMonth} is pending. Please pay as soon as possible. Thank you.`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <PageHeader title="Payments" subtitle={selectedMonth} />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="h-11 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
        >
          <CalendarPlus size={18} />
          {generating ? "Generating..." : "Generate Month Payments"}
        </button>
      </div>

      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by member name..." className="pl-10 h-11" />
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors active:scale-95 ${
              filter === tab.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((payment, i) => {
          const member = members.find(m => m.id === payment.memberId);
          if (!member) return null;

          return (
            <div
              key={payment.id}
              className={`bg-card rounded-lg p-4 border shadow-sm animate-fade-in ${!payment.paid ? "border-2 border-destructive/50 bg-destructive/5" : "border-border"}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-card-foreground">{member.name}</h3>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${payment.paid ? "status-paid" : "status-unpaid"}`}>
                  {payment.paid ? "Paid" : "Not Paid"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{payment.month} • ₹{payment.amount.toLocaleString("en-IN")}</p>

              <div className="flex items-center gap-2">
                {payment.paid ? (
                  <button
                    onClick={() => setConfirmPayment({ id: payment.id, name: member.name, newStatus: false })}
                    className="inline-flex items-center gap-1 border border-destructive/50 text-destructive rounded-md px-3 py-1.5 text-xs font-medium hover:bg-destructive/10 active:scale-95 transition-all"
                  >
                    <X size={14} /> Undo Payment
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmPayment({ id: payment.id, name: member.name, newStatus: true })}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-success text-success-foreground rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform"
                    >
                      <Check size={16} /> Mark Paid
                    </button>
                    <button onClick={() => sendWhatsApp(member.name, member.phone)} className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform">
                      <MessageCircle size={16} /> Remind
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-3">No payments found for {selectedMonth}.</p>
          {monthPayments.length === 0 && members.length > 0 && (
            <p className="text-muted-foreground text-xs">Click "Generate Month Payments" to create entries for this month.</p>
          )}
        </div>
      )}

      <AlertDialog open={!!confirmPayment} onOpenChange={(open) => !open && setConfirmPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment Status</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPayment?.newStatus
                ? `Are you sure you want to mark ${confirmPayment?.name}'s payment as paid?`
                : `Are you sure you want to mark ${confirmPayment?.name}'s payment as unpaid?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Payments;
