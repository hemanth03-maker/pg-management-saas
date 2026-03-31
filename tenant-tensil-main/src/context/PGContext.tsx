import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Room {
  id: string;
  roomNumber: string;
  totalBeds: number;
  occupiedBeds: number;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  roomId: string;
  rentAmount: number;
  joinDate: string;
  foodEnabled?: boolean;
  foodCharges?: number;
}

interface Payment {
  id: string;
  memberId: string;
  month: string;
  amount: number;
  paid: boolean;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
}

interface PGContextType {
  rooms: Room[];
  members: Member[];
  payments: Payment[];
  expenses: Expense[];
  loading: boolean;
  addRoom: (room: Omit<Room, "id" | "occupiedBeds">) => Promise<void>;
  updateRoom: (id: string, data: Partial<Pick<Room, "roomNumber" | "totalBeds">>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addMember: (member: Omit<Member, "id">) => Promise<void>;
  updateMember: (id: string, data: Partial<Omit<Member, "id">>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, "id">) => Promise<void>;
  generateMonthPayments: (month: string) => Promise<{ generated: number; skipped: boolean }>;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, data: Partial<Omit<Expense, "id">>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  markAsPaid: (paymentId: string) => Promise<void>;
  getRoomByMemberId: (memberId: string) => Room | undefined;
  getMemberById: (memberId: string) => Member | undefined;
  getPaymentByMemberId: (memberId: string) => Payment | undefined;
  getMembersByRoomId: (roomId: string) => Member[];
  getPaymentsByMemberId: (memberId: string) => Payment[];
}

const PGContext = createContext<PGContextType | undefined>(undefined);

export const PGProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const [roomsRes, membersRes, paymentsRes, expensesRes] = await Promise.all([
      supabase.from("rooms").select("*").eq("user_id", user.id),
      supabase.from("members").select("*").eq("user_id", user.id),
      supabase.from("payments").select("*").eq("user_id", user.id),
      supabase.from("expenses").select("*").eq("user_id", user.id),
    ]);

    setRooms((roomsRes.data || []).map(r => ({ id: r.id, roomNumber: r.room_number, totalBeds: r.total_beds, occupiedBeds: r.occupied_beds })));
    setMembers((membersRes.data || []).map(m => ({ id: m.id, name: m.name, phone: m.phone, roomId: m.room_id, rentAmount: m.rent_amount, joinDate: m.join_date, foodEnabled: m.food_enabled, foodCharges: m.food_charges })));
    setPayments((paymentsRes.data || []).map(p => ({ id: p.id, memberId: p.member_id, month: p.month, amount: p.amount, paid: p.paid })));
    setExpenses((expensesRes.data || []).map(e => ({ id: e.id, title: e.title, amount: e.amount, date: e.date, category: e.category })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-generate payments for current month on app load
  const [autoGenDone, setAutoGenDone] = useState(false);
  useEffect(() => {
    if (!user || loading || autoGenDone || members.length === 0) return;
    const now = new Date();
    const currentMonth = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    const hasCurrentMonth = payments.some(p => p.month === currentMonth);
    if (!hasCurrentMonth) {
      generateMonthPayments(currentMonth).then(() => setAutoGenDone(true));
    } else {
      setAutoGenDone(true);
    }
  }, [user, loading, members, payments, autoGenDone]);

  const addRoom = async (room: Omit<Room, "id" | "occupiedBeds">) => {
    if (!user) return;
    const { data } = await supabase.from("rooms").insert({ user_id: user.id, room_number: room.roomNumber, total_beds: room.totalBeds, occupied_beds: 0 }).select().single();
    if (data) setRooms(prev => [...prev, { id: data.id, roomNumber: data.room_number, totalBeds: data.total_beds, occupiedBeds: data.occupied_beds }]);
  };

  const updateRoom = async (id: string, data: Partial<Pick<Room, "roomNumber" | "totalBeds">>) => {
    const updates: any = {};
    if (data.roomNumber !== undefined) updates.room_number = data.roomNumber;
    if (data.totalBeds !== undefined) updates.total_beds = data.totalBeds;
    await supabase.from("rooms").update(updates).eq("id", id);
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const deleteRoom = async (id: string) => {
    await supabase.from("rooms").delete().eq("id", id);
    setRooms(prev => prev.filter(r => r.id !== id));
    // Members cascade-deleted in DB, refresh
    await fetchData();
  };

  const addMember = async (member: Omit<Member, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("members").insert({
      user_id: user.id, name: member.name, phone: member.phone, room_id: member.roomId,
      rent_amount: member.rentAmount, join_date: member.joinDate,
      food_enabled: member.foodEnabled || false, food_charges: member.foodCharges || 0,
    }).select().single();
    if (!data) return;

    const newMember = { id: data.id, name: data.name, phone: data.phone, roomId: data.room_id, rentAmount: data.rent_amount, joinDate: data.join_date, foodEnabled: data.food_enabled, foodCharges: data.food_charges };
    setMembers(prev => [...prev, newMember]);

    // Update room occupied beds
    await supabase.from("rooms").update({ occupied_beds: (rooms.find(r => r.id === member.roomId)?.occupiedBeds || 0) + 1 }).eq("id", member.roomId);
    setRooms(prev => prev.map(r => r.id === member.roomId ? { ...r, occupiedBeds: r.occupiedBeds + 1 } : r));

    // Auto-create payment for current month
    const totalAmount = member.rentAmount + (member.foodCharges || 0);
    const currentMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
    const { data: payData } = await supabase.from("payments").insert({
      user_id: user.id, member_id: data.id, month: currentMonth, amount: totalAmount, paid: false,
    }).select().single();
    if (payData) setPayments(prev => [...prev, { id: payData.id, memberId: payData.member_id, month: payData.month, amount: payData.amount, paid: payData.paid }]);
  };

  const updateMember = async (id: string, data: Partial<Omit<Member, "id">>) => {
    const oldMember = members.find(m => m.id === id);
    if (!oldMember) return;

    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.roomId !== undefined) updates.room_id = data.roomId;
    if (data.rentAmount !== undefined) updates.rent_amount = data.rentAmount;
    if (data.foodEnabled !== undefined) updates.food_enabled = data.foodEnabled;
    if (data.foodCharges !== undefined) updates.food_charges = data.foodCharges;

    await supabase.from("members").update(updates).eq("id", id);
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));

    if (data.roomId && data.roomId !== oldMember.roomId) {
      const oldRoom = rooms.find(r => r.id === oldMember.roomId);
      const newRoom = rooms.find(r => r.id === data.roomId);
      if (oldRoom) await supabase.from("rooms").update({ occupied_beds: Math.max(0, oldRoom.occupiedBeds - 1) }).eq("id", oldRoom.id);
      if (newRoom) await supabase.from("rooms").update({ occupied_beds: newRoom.occupiedBeds + 1 }).eq("id", newRoom.id);
      setRooms(prev => prev.map(r => {
        if (r.id === oldMember.roomId) return { ...r, occupiedBeds: Math.max(0, r.occupiedBeds - 1) };
        if (r.id === data.roomId) return { ...r, occupiedBeds: r.occupiedBeds + 1 };
        return r;
      }));
    }
  };

  const deleteMember = async (id: string) => {
    const member = members.find(m => m.id === id);
    if (!member) return;
    await supabase.from("members").delete().eq("id", id);
    setMembers(prev => prev.filter(m => m.id !== id));
    setPayments(prev => prev.filter(p => p.memberId !== id));

    const room = rooms.find(r => r.id === member.roomId);
    if (room) {
      await supabase.from("rooms").update({ occupied_beds: Math.max(0, room.occupiedBeds - 1) }).eq("id", room.id);
      setRooms(prev => prev.map(r => r.id === member.roomId ? { ...r, occupiedBeds: Math.max(0, r.occupiedBeds - 1) } : r));
    }
  };

  const addPayment = async (payment: Omit<Payment, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("payments").insert({ user_id: user.id, member_id: payment.memberId, month: payment.month, amount: payment.amount, paid: payment.paid }).select().single();
    if (data) setPayments(prev => [...prev, { id: data.id, memberId: data.member_id, month: data.month, amount: data.amount, paid: data.paid }]);
  };

  const generateMonthPayments = async (month: string): Promise<{ generated: number; skipped: boolean }> => {
    if (!user) return { generated: 0, skipped: false };
    const existing = payments.filter(p => p.month === month);
    if (existing.length > 0) return { generated: 0, skipped: true };
    const newPayments = members.map(m => ({
      user_id: user.id,
      member_id: m.id,
      month,
      amount: m.rentAmount + (m.foodEnabled ? (m.foodCharges || 0) : 0),
      paid: false,
    }));
    if (newPayments.length === 0) return { generated: 0, skipped: false };
    const { data } = await supabase.from("payments").insert(newPayments).select();
    if (data) {
      const mapped = data.map(p => ({ id: p.id, memberId: p.member_id, month: p.month, amount: p.amount, paid: p.paid }));
      setPayments(prev => [...prev, ...mapped]);
    }
    return { generated: newPayments.length, skipped: false };
  };

  const addExpense = async (expense: Omit<Expense, "id">) => {
    if (!user) return;
    const { data } = await supabase.from("expenses").insert({ user_id: user.id, title: expense.title, amount: expense.amount, date: expense.date, category: expense.category }).select().single();
    if (data) setExpenses(prev => [...prev, { id: data.id, title: data.title, amount: data.amount, date: data.date, category: data.category }]);
  };

  const updateExpense = async (id: string, data: Partial<Omit<Expense, "id">>) => {
    const updates: any = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.date !== undefined) updates.date = data.date;
    if (data.category !== undefined) updates.category = data.category;
    await supabase.from("expenses").update(updates).eq("id", id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteExpense = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const markAsPaid = async (paymentId: string) => {
    await supabase.from("payments").update({ paid: true }).eq("id", paymentId);
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, paid: true } : p));
  };

  const getRoomByMemberId = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    return member ? rooms.find(r => r.id === member.roomId) : undefined;
  };
  const getMemberById = (memberId: string) => members.find(m => m.id === memberId);
  const getPaymentByMemberId = (memberId: string) => payments.find(p => p.memberId === memberId);
  const getMembersByRoomId = (roomId: string) => members.filter(m => m.roomId === roomId);
  const getPaymentsByMemberId = (memberId: string) => payments.filter(p => p.memberId === memberId);

  return (
    <PGContext.Provider value={{
      rooms, members, payments, expenses, loading,
      addRoom, updateRoom, deleteRoom,
      addMember, updateMember, deleteMember,
      addPayment, generateMonthPayments, addExpense, updateExpense, deleteExpense, markAsPaid,
      getRoomByMemberId, getMemberById, getPaymentByMemberId,
      getMembersByRoomId, getPaymentsByMemberId,
    }}>
      {children}
    </PGContext.Provider>
  );
};

export const usePG = () => {
  const context = useContext(PGContext);
  if (!context) throw new Error("usePG must be used within PGProvider");
  return context;
};
