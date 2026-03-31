export interface Room {
  id: string;
  roomNumber: string;
  totalBeds: number;
  occupiedBeds: number;
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  roomId: string;
  rentAmount: number;
  joinDate: string;
  foodEnabled?: boolean;
  foodCharges?: number;
}

export interface Payment {
  id: string;
  memberId: string;
  month: string;
  amount: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
}
