import { useState } from "react";
import { usePG } from "@/context/PGContext";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Utensils, Zap, Wrench, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categoryIcons: Record<string, any> = {
  Food: Utensils,
  Electricity: Zap,
  Maintenance: Wrench,
};

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

const getMonthFromDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
};

const Expenses = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = usePG();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", date: "", category: "Food" });

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", amount: "", date: "", category: "Food" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  });

  const filteredExpenses = expenses.filter(e => getMonthFromDate(e.date) === selectedMonth);
  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    if (!form.title || !form.amount) return;
    addExpense({ ...form, amount: parseInt(form.amount) });
    setForm({ title: "", amount: "", date: "", category: "Food" });
    setOpen(false);
  };

  const openEdit = (expense: typeof expenses[0]) => {
    setEditForm({ title: expense.title, amount: String(expense.amount), date: expense.date, category: expense.category });
    setEditId(expense.id);
  };

  const handleEdit = () => {
    if (!editId || !editForm.title || !editForm.amount) return;
    updateExpense(editId, { title: editForm.title, amount: parseInt(editForm.amount), date: editForm.date, category: editForm.category });
    setEditId(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteExpense(deleteId);
    setDeleteId(null);
  };

  const deletingExpense = expenses.find(e => e.id === deleteId);

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <PageHeader title="Expenses" subtitle={selectedMonth} />

      {/* Month Selector */}
      <div className="mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-lg p-4 border border-border shadow-sm mb-4 animate-fade-in">
        <p className="text-xs text-muted-foreground">{selectedMonth} — Total Expense</p>
        <p className="text-2xl font-bold text-destructive">₹{totalExpense.toLocaleString("en-IN")}</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4 h-12 text-base font-semibold gap-2"><Plus size={20} /> Add Expense</Button>
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Enter expense details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Grocery" className="mt-1 h-11" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Electricity">Electricity</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="e.g. 5000" className="mt-1 h-11" /></div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mt-1 h-11" /></div>
            <Button onClick={handleAdd} className="w-full h-11 font-semibold">Add Expense</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editId} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Title</Label><Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className="mt-1 h-11" /></div>
            <div>
              <Label>Category</Label>
              <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Electricity">Electricity</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₹)</Label><Input type="number" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} className="mt-1 h-11" /></div>
            <div><Label>Date</Label><Input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="mt-1 h-11" /></div>
            <Button onClick={handleEdit} className="w-full h-11 font-semibold">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingExpense?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The expense of ₹{deletingExpense?.amount.toLocaleString("en-IN")} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredExpenses.map((expense, i) => {
          const Icon = categoryIcons[expense.category] || Wrench;
          return (
            <div key={expense.id} className="bg-card rounded-lg p-4 border border-border shadow-sm animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive"><Icon size={20} /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground">{expense.title}</h3>
                  <p className="text-xs text-muted-foreground">{expense.category} • {expense.date}</p>
                </div>
                <span className="font-bold text-card-foreground">₹{expense.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(expense)} className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform">
                  <Pencil size={15} /> Edit
                </button>
                <button onClick={() => setDeleteId(expense.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform">
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {filteredExpenses.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">No expenses found for {selectedMonth}.</p>
      )}
    </div>
  );
};

export default Expenses;
