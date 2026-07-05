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

export type TripType = "local" | "international";

export type SignatureMethod = "typed" | "drawn";

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
  customer_id: string | null;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  pickup_time: string | null;
  return_time: string | null;
  total_amount: number;
  deposit_paid: boolean;
  notes: string | null;
  full_name: string | null;
  address: string | null;
  contact_number_1: string | null;
  contact_number_2: string | null;
  email: string | null;
  facebook_link: string | null;
  trip_type: TripType;
  id_document_1_path: string | null;
  id_document_2_path: string | null;
  proof_of_billing_path: string | null;
  selfie_with_id_path: string | null;
  proof_of_payment_path: string | null;
  terms_accepted: boolean;
  signature_method: SignatureMethod | null;
  signature_text: string | null;
  signature_path: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

export type BookingItem = {
  id: string;
  booking_id: string;
  equipment_id: string;
  quantity: number;
  rate_at_booking: number;
  equipment: Pick<Equipment, "id" | "name" | "category"> | null;
};

export type EquipmentAddon = {
  equipment_id: string;
  addon_id: string;
};

export type BookingWithItems = Booking & { booking_items: BookingItem[] };

export type PaymentSettings = {
  id: number;
  qr_code_url: string | null;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: "admin" | "customer";
  created_at: string;
};
