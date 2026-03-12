/* -----------------------------------------------------------------------
 * Shared TypeScript types — mirrors the backend Mongoose schemas exactly.
 * Any change to the backend enums MUST be reflected here.
 * ----------------------------------------------------------------------- */

export interface User {
  _id: string;
  name: string;
  email: string;
  googleId: string;
  avatar?: string;
  phone?: string;
  gender?: "Male" | "Female" | "Other";
  hostel?:
    | "Kanhar (BH1)"
    | "Gopad (BH2)"
    | "Indravati (GH1)"
    | "Shivnath (MSH)"
    | "Day Scholar";
  createdAt: string;
  updatedAt: string;
}

export type Destination =
  | "Durg Junction"
  | "Raipur Station"
  | "Swami Vivekananda Airport";

export type MeetupPoint =
  | "Gate 1"
  | "Gate 2"
  | "Kanhar Parking"
  | "Mess Parking"
  | "Other";

export type LuggageType = "Light (Backpacks)" | "Heavy (Trolleys)";

export type GenderPreference = "Any" | "Same Gender Only";

export type GroupStatus = "Open" | "Full" | "Departed" | "Cancelled";

export interface Group {
  _id: string;
  creator: Pick<User, "_id" | "name" | "avatar"> | string;
  destination: Destination;
  meetupPoint: MeetupPoint;
  trainNumber?: string;
  departureDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  genderPreference: GenderPreference;
  luggage: LuggageType;
  capacity: number;
  currentMembers: number;
  members: string[];
  status: GroupStatus;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by the backend for list endpoints */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  groups?: T[];
  group?: T;
  user?: User;
}
