import { useState } from "react";
import { usePG } from "@/context/PGContext";
import { PageHeader } from "@/components/PageHeader";
import { Plus, Phone, Eye, Pencil, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const Members = () => {
  const { members, rooms, addMember, updateMember, deleteMember, getPaymentsByMemberId } = usePG();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", roomId: "", rentAmount: "", joinDate: "", foodEnabled: false, foodCharges: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const [viewMemberId, setViewMemberId] = useState<string | null>(null);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", roomId: "", rentAmount: "", foodEnabled: false, foodCharges: "" });
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);

  const [roomError, setRoomError] = useState("");

  const availableRooms = rooms.filter(r => r.occupiedBeds < r.totalBeds);

  const handleAdd = () => {
    if (!form.name || !form.phone || !form.roomId || !form.rentAmount) return;
    const selectedRoom = rooms.find(r => r.id === form.roomId);
    if (!selectedRoom || selectedRoom.occupiedBeds >= selectedRoom.totalBeds) {
      setRoomError("Room is full. Please select another room.");
      return;
    }
    setRoomError("");
    addMember({
      ...form,
      rentAmount: parseInt(form.rentAmount),
      foodEnabled: form.foodEnabled,
      foodCharges: form.foodEnabled ? parseInt(form.foodCharges) || 0 : 0,
    });
    setForm({ name: "", phone: "", roomId: "", rentAmount: "", joinDate: "", foodEnabled: false, foodCharges: "" });
    setOpen(false);
  };

  const openEdit = (member: typeof members[0]) => {
    setEditForm({
      name: member.name, phone: member.phone, roomId: member.roomId,
      rentAmount: String(member.rentAmount), foodEnabled: member.foodEnabled || false,
      foodCharges: String(member.foodCharges || ""),
    });
    setEditMemberId(member.id);
  };

  const handleEdit = () => {
    if (!editMemberId || !editForm.name || !editForm.phone || !editForm.roomId || !editForm.rentAmount) return;
    updateMember(editMemberId, {
      name: editForm.name, phone: editForm.phone, roomId: editForm.roomId,
      rentAmount: parseInt(editForm.rentAmount), foodEnabled: editForm.foodEnabled,
      foodCharges: editForm.foodEnabled ? parseInt(editForm.foodCharges) || 0 : 0,
    });
    setEditMemberId(null);
  };

  const handleDelete = () => {
    if (!deleteMemberId) return;
    deleteMember(deleteMemberId);
    setDeleteMemberId(null);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery)
  );

  const viewingMember = members.find(m => m.id === viewMemberId);
  const viewingRoom = viewingMember ? rooms.find(r => r.id === viewingMember.roomId) : undefined;
  const viewingPayments = viewMemberId ? getPaymentsByMemberId(viewMemberId) : [];
  const deletingMember = members.find(m => m.id === deleteMemberId);

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <PageHeader title="Members" subtitle={`${members.length} members`} />

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or phone..." className="pl-10 h-11" />
      </div>

      {/* Add Member Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4 h-12 text-base font-semibold gap-2"><Plus size={20} /> Add Member</Button>
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>Enter member details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="mt-1 h-11" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit number" className="mt-1 h-11" /></div>
            <div>
              <Label>Room</Label>
              {availableRooms.length === 0 ? (
                <p className="mt-1 text-sm font-semibold text-destructive">No rooms available. Please add a room first.</p>
              ) : (
                <Select value={form.roomId} onValueChange={v => { setForm(f => ({ ...f, roomId: v })); setRoomError(""); }}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {availableRooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>Room {r.roomNumber} ({r.totalBeds - r.occupiedBeds} beds free)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {roomError && <p className="mt-1 text-sm font-semibold text-destructive">{roomError}</p>}
            </div>
            <div><Label>Rent Amount (₹)</Label><Input type="number" value={form.rentAmount} onChange={e => setForm(f => ({ ...f, rentAmount: e.target.value }))} placeholder="e.g. 6000" className="mt-1 h-11" /></div>
            <div><Label>Join Date</Label><Input type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} className="mt-1 h-11" /></div>
            <div className="flex items-center justify-between py-1"><Label>Food Charges</Label><Switch checked={form.foodEnabled} onCheckedChange={v => setForm(f => ({ ...f, foodEnabled: v }))} /></div>
            {form.foodEnabled && <div><Label>Food Amount (₹)</Label><Input type="number" value={form.foodCharges} onChange={e => setForm(f => ({ ...f, foodCharges: e.target.value }))} placeholder="e.g. 2000" className="mt-1 h-11" /></div>}
            <Button onClick={handleAdd} className="w-full h-11 font-semibold">Add Member</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Member Dialog */}
      <Dialog open={!!viewMemberId} onOpenChange={(o) => !o && setViewMemberId(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewingMember?.name}</DialogTitle><DialogDescription>Member details and payment history.</DialogDescription></DialogHeader>
          {viewingMember && (
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                {[
                  ["Phone", viewingMember.phone],
                  ["Room", `Room ${viewingRoom?.roomNumber}`],
                  ["Rent", `₹${viewingMember.rentAmount.toLocaleString("en-IN")}`],
                  ...(viewingMember.foodEnabled ? [["Food Charges", `₹${(viewingMember.foodCharges || 0).toLocaleString("en-IN")}`]] : []),
                  ["Total Rent", `₹${(viewingMember.rentAmount + (viewingMember.foodCharges || 0)).toLocaleString("en-IN")}`],
                  ["Join Date", viewingMember.joinDate],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-medium text-card-foreground ${label === "Total Rent" ? "font-bold" : ""}`}>{val}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-card-foreground mb-2">Payment History</h4>
                {viewingPayments.length === 0 ? <p className="text-sm text-muted-foreground">No payment records.</p> : (
                  <div className="space-y-2">
                    {viewingPayments.map(p => (
                      <div key={p.id} className="bg-muted rounded-md px-3 py-2 flex items-center justify-between">
                        <div><span className="text-sm font-medium text-card-foreground">{p.month}</span><span className="text-xs text-muted-foreground ml-2">₹{p.amount.toLocaleString("en-IN")}</span></div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${p.paid ? "status-paid" : "status-unpaid"}`}>{p.paid ? "Paid" : "Unpaid"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={!!editMemberId} onOpenChange={(o) => !o && setEditMemberId(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Member</DialogTitle><DialogDescription>Update member details.</DialogDescription></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label>Name</Label><Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1 h-11" /></div>
            <div><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 h-11" /></div>
            <div>
              <Label>Room</Label>
              <Select value={editForm.roomId} onValueChange={v => setEditForm(f => ({ ...f, roomId: v }))}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>Room {r.roomNumber} ({r.totalBeds - r.occupiedBeds} beds free)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Rent Amount (₹)</Label><Input type="number" value={editForm.rentAmount} onChange={e => setEditForm(f => ({ ...f, rentAmount: e.target.value }))} className="mt-1 h-11" /></div>
            <div className="flex items-center justify-between py-1"><Label>Food Charges</Label><Switch checked={editForm.foodEnabled} onCheckedChange={v => setEditForm(f => ({ ...f, foodEnabled: v }))} /></div>
            {editForm.foodEnabled && <div><Label>Food Amount (₹)</Label><Input type="number" value={editForm.foodCharges} onChange={e => setEditForm(f => ({ ...f, foodCharges: e.target.value }))} className="mt-1 h-11" /></div>}
            <Button onClick={handleEdit} className="w-full h-11 font-semibold">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation */}
      <AlertDialog open={!!deleteMemberId} onOpenChange={(o) => !o && setDeleteMemberId(null)}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingMember?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the member from their room and delete all their payment records. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredMembers.map((member, i) => {
          const room = rooms.find(r => r.id === member.roomId);

          return (
            <div key={member.id} className="bg-card rounded-lg p-4 border border-border shadow-sm animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-3">
                <h3 className="font-bold text-card-foreground">{member.name}</h3>
                <p className="text-xs text-muted-foreground">Room {room?.roomNumber} • ₹{member.rentAmount.toLocaleString("en-IN")}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setViewMemberId(member.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform"><Eye size={15} /> View</button>
                <button onClick={() => openEdit(member)} className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform"><Pencil size={15} /> Edit</button>
                <button onClick={() => setDeleteMemberId(member.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform"><Trash2 size={15} /> Delete</button>
              </div>
              <div className="flex gap-2 mt-2">
                <a href={`tel:${member.phone}`} className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform"><Phone size={16} /> Call</a>
              </div>
            </div>
          );
        })}
      </div>
      {filteredMembers.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No members found.</p>}
    </div>
  );
};

export default Members;
