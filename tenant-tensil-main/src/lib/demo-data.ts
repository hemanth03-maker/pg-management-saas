import { Room, Member, Payment, Expense } from "./types";

export const demoRooms: Room[] = [
  { id: "r1", roomNumber: "101", totalBeds: 4, occupiedBeds: 3 },
  { id: "r2", roomNumber: "102", totalBeds: 3, occupiedBeds: 3 },
];

export const demoMembers: Member[] = [
  { id: "m1", name: "Ravi", phone: "9876543210", roomId: "r1", rentAmount: 6000, joinDate: "2025-01-15" },
  { id: "m2", name: "Ajay", phone: "9876543211", roomId: "r1", rentAmount: 6000, joinDate: "2025-02-01" },
  { id: "m3", name: "Kiran", phone: "9876543212", roomId: "r2", rentAmount: 5500, joinDate: "2025-01-20" },
  { id: "m4", name: "Suresh", phone: "9876543213", roomId: "r1", rentAmount: 6000, joinDate: "2025-03-01" },
  { id: "m5", name: "Priya", phone: "9876543214", roomId: "r2", rentAmount: 5500, joinDate: "2025-02-10" },
  { id: "m6", name: "Deepa", phone: "9876543215", roomId: "r2", rentAmount: 5500, joinDate: "2025-01-05" },
];

export const demoPayments: Payment[] = [
  { id: "p1", memberId: "m1", month: "March 2026", amount: 6000, paid: false },
  { id: "p2", memberId: "m2", month: "March 2026", amount: 6000, paid: true },
  { id: "p3", memberId: "m3", month: "March 2026", amount: 5500, paid: false },
  { id: "p4", memberId: "m4", month: "March 2026", amount: 6000, paid: true },
  { id: "p5", memberId: "m5", month: "March 2026", amount: 5500, paid: true },
  { id: "p6", memberId: "m6", month: "March 2026", amount: 5500, paid: false },
];

export const demoExpenses: Expense[] = [
  { id: "e1", title: "Food", amount: 10000, date: "2026-03-05", category: "Food" },
  { id: "e2", title: "Electricity", amount: 3000, date: "2026-03-10", category: "Electricity" },
  { id: "e3", title: "Water Supply", amount: 1500, date: "2026-03-08", category: "Maintenance" },
  { id: "e4", title: "WiFi Bill", amount: 1200, date: "2026-03-01", category: "Maintenance" },
];
