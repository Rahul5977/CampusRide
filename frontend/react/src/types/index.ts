/* -----------------------------------------------------------------------
 * Shared TypeScript types — mirrors the backend Mongoose schemas.
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
  year?: string;
  branch?: string;
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

export type TransportType = "Train" | "Flight";

export type GroupStatus =
  | "Created"
  | "Open"
  | "Full"
  | "Locked"
  | "Booking"
  | "Departed"
  | "Completed"
  | "Cancelled";

export type MemberRef =
  | string
  | Pick<
      User,
      | "_id"
      | "name"
      | "avatar"
      | "email"
      | "phone"
      | "gender"
      | "hostel"
      | "year"
      | "branch"
    >;

export interface PendingRequest {
  userId: MemberRef;
  message?: string;
  requestedAt?: string;
}

export interface Group {
  _id: string;
  creator:
    | Pick<
        User,
        | "_id"
        | "name"
        | "avatar"
        | "email"
        | "phone"
        | "gender"
        | "hostel"
        | "year"
        | "branch"
      >
    | string;
  travelPlanId?: string;
  destination: Destination;
  /** Present on groups created with the new API; optional for older documents. */
  transportType?: TransportType;
  meetupPoint: MeetupPoint;
  trainNumber?: string;
  trainName?: string;
  flightNumber?: string;
  departureDate: string;
  transportDepartureTime?: string;
  campusLeaveTime?: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  genderPreference: GenderPreference;
  luggage: LuggageType;
  capacity: number;
  currentMembers: number;
  members: MemberRef[];
  pendingRequests?: PendingRequest[];
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

export interface TravelPlan {
  _id: string;
  userId: string;
  label?: string;
  destination: Destination;
  transportType: TransportType;
  trainNumber?: string;
  trainName?: string;
  flightNumber?: string;
  departureDate: string;
  departureTime: string;
  campusLeaveTime: string;
  meetupPoint: MeetupPoint;
  status: "Upcoming" | "Completed" | "Cancelled";
  isTemplate?: boolean;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
}
