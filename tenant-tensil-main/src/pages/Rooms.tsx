import { useState } from "react";
import { usePG } from "@/context/PGContext";
import { PageHeader } from "@/components/PageHeader";
import { Plus, BedDouble, Eye, Pencil, Trash2, Users, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type RoomFilter = "all" | "available" | "full";

const Rooms = () => {
  const { rooms, members, addRoom, updateRoom, deleteRoom, getMembersByRoomId } = usePG();
  const [open, setOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [totalBeds, setTotalBeds] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<RoomFilter>("all");

  const [viewRoom, setViewRoom] = useState<string | null>(null);
  const [editRoom, setEditRoom] = useState<string | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editTotalBeds, setEditTotalBeds] = useState("");
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!roomNumber || !totalBeds) return;
    addRoom({ roomNumber, totalBeds: parseInt(totalBeds) });
    setRoomNumber("");
    setTotalBeds("");
    setOpen(false);
  };

  const handleEdit = () => {
    if (!editRoom || !editRoomNumber || !editTotalBeds) return;
    updateRoom(editRoom, { roomNumber: editRoomNumber, totalBeds: parseInt(editTotalBeds) });
    setEditRoom(null);
  };

  const openEdit = (room: typeof rooms[0]) => {
    setEditRoomNumber(room.roomNumber);
    setEditTotalBeds(String(room.totalBeds));
    setEditRoom(room.id);
  };

  const handleDelete = () => {
    if (!deleteRoomId) return;
    deleteRoom(deleteRoomId);
    setDeleteRoomId(null);
  };

  const filteredRooms = rooms.filter(r => {
    const matchesSearch = r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const available = r.totalBeds - r.occupiedBeds;
    const matchesFilter = filter === "all" || (filter === "available" && available > 0) || (filter === "full" && available === 0);
    return matchesSearch && matchesFilter;
  });

  const filterTabs: { key: RoomFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: rooms.length },
    { key: "available", label: "Available", count: rooms.filter(r => r.totalBeds - r.occupiedBeds > 0).length },
    { key: "full", label: "Full", count: rooms.filter(r => r.totalBeds - r.occupiedBeds === 0).length },
  ];

  const viewingRoom = rooms.find(r => r.id === viewRoom);
  const viewRoomMembers = viewRoom ? getMembersByRoomId(viewRoom) : [];
  const deletingRoom = rooms.find(r => r.id === deleteRoomId);
  const deletingRoomMembers = deleteRoomId ? getMembersByRoomId(deleteRoomId) : [];

  return (
    <div className="p-4 pb-24 max-w-4xl mx-auto">
      <PageHeader title="Rooms" subtitle={`${rooms.length} rooms total`} />

      {/* Search */}
      <div className="relative mb-3">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by room number..."
          className="pl-10 h-11"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {filterTabs.map(tab => (
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

      {/* Add Room Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4 h-12 text-base font-semibold gap-2">
            <Plus size={20} /> Add Room
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Enter room details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Room Number</Label>
              <Input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 103" className="mt-1 h-11" />
            </div>
            <div>
              <Label>Total Beds</Label>
              <Input type="number" value={totalBeds} onChange={e => setTotalBeds(e.target.value)} placeholder="e.g. 4" className="mt-1 h-11" />
            </div>
            <Button onClick={handleAdd} className="w-full h-11 font-semibold">Add Room</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Room Dialog */}
      <Dialog open={!!viewRoom} onOpenChange={(o) => !o && setViewRoom(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Room {viewingRoom?.roomNumber}</DialogTitle>
            <DialogDescription>Room details and assigned members.</DialogDescription>
          </DialogHeader>
          {viewingRoom && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-md py-3">
                  <p className="text-lg font-bold text-card-foreground">{viewingRoom.totalBeds}</p>
                  <p className="text-[10px] text-muted-foreground">Total Beds</p>
                </div>
                <div className="bg-muted rounded-md py-3">
                  <p className="text-lg font-bold text-card-foreground">{viewingRoom.occupiedBeds}</p>
                  <p className="text-[10px] text-muted-foreground">Occupied</p>
                </div>
                <div className="bg-muted rounded-md py-3">
                  <p className={`text-lg font-bold ${viewingRoom.totalBeds - viewingRoom.occupiedBeds > 0 ? "text-success" : "text-destructive"}`}>
                    {viewingRoom.totalBeds - viewingRoom.occupiedBeds}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-card-foreground mb-2 flex items-center gap-1.5">
                  <Users size={14} /> Members in this room
                </h4>
                {viewRoomMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No members assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {viewRoomMembers.map(m => (
                      <div key={m.id} className="bg-muted rounded-md px-3 py-2 flex items-center justify-between">
                        <span className="font-medium text-sm text-card-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground">₹{m.rentAmount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={!!editRoom} onOpenChange={(o) => !o && setEditRoom(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Room Number</Label>
              <Input value={editRoomNumber} onChange={e => setEditRoomNumber(e.target.value)} className="mt-1 h-11" />
            </div>
            <div>
              <Label>Total Beds</Label>
              <Input type="number" value={editTotalBeds} onChange={e => setEditTotalBeds(e.target.value)} className="mt-1 h-11" />
            </div>
            <Button onClick={handleEdit} className="w-full h-11 font-semibold">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Room Confirmation */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={(o) => !o && setDeleteRoomId(null)}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room {deletingRoom?.roomNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingRoomMembers.length > 0
                ? `⚠️ This room has ${deletingRoomMembers.length} member(s) assigned. Deleting will remove them and their payment records.`
                : "This action cannot be undone. The room will be permanently removed."}
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
        {filteredRooms.map((room, i) => {
          const available = room.totalBeds - room.occupiedBeds;
          const isFull = available === 0;
          return (
            <div
              key={room.id}
              className="bg-card rounded-lg p-4 border border-border shadow-sm animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BedDouble size={18} className="text-primary" />
                  <span className="font-bold text-card-foreground">Room {room.roomNumber}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isFull ? "status-full" : "status-available"}`}>
                  {isFull ? "Full" : "Available"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-md py-2">
                  <p className="text-lg font-bold text-card-foreground">{room.totalBeds}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="bg-muted rounded-md py-2">
                  <p className="text-lg font-bold text-card-foreground">{room.occupiedBeds}</p>
                  <p className="text-[10px] text-muted-foreground">Occupied</p>
                </div>
                <div className="bg-muted rounded-md py-2">
                  <p className={`text-lg font-bold ${available > 0 ? "text-success" : "text-destructive"}`}>{available}</p>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setViewRoom(room.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-secondary text-secondary-foreground rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform">
                  <Eye size={15} /> View
                </button>
                <button onClick={() => openEdit(room)} className="flex-1 flex items-center justify-center gap-1.5 bg-primary/10 text-primary rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform">
                  <Pencil size={15} /> Edit
                </button>
                <button onClick={() => setDeleteRoomId(room.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform">
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {filteredRooms.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">No rooms found.</p>
      )}
    </div>
  );
};

export default Rooms;
