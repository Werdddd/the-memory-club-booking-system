export type EquipmentCategory =
  | "camera"
  | "lens"
  | "lighting"
  | "audio"
  | "accessory"
  | "other";

export type EquipmentCondition =
  | "new"
  | "excellent"
  | "good"
  | "fair"
  | "needs_repair";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "ongoing"
  | "completed"
  | "cancelled";

export type Equipment = {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  description: string | null;
  daily_rate: number;
  extended_daily_rate: number;
  deposit_amount: number;
  condition: EquipmentCondition;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  customer_id: string;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  total_amount: number;
  deposit_paid: boolean;
  notes: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "customer";
  created_at: string;
};
