/* -----------------------------------------------------------------------
 * CreateRideModal — form to create a new departure group.
 * Renders as a full-screen overlay on mobile, centered modal on desktop.
 * ----------------------------------------------------------------------- */

import { useState, type FormEvent } from "react";
import { X, Loader2, PlusCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type {
  Destination,
  MeetupPoint,
  LuggageType,
  GenderPreference,
} from "@/types";
import { toInputDate } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DESTINATIONS: Destination[] = [
  "Durg Junction",
  "Raipur Station",
  "Swami Vivekananda Airport",
];

const MEETUP_POINTS: MeetupPoint[] = [
  "Gate 1",
  "Gate 2",
  "Kanhar Parking",
  "Mess Parking",
  "Other",
];

const LUGGAGE_OPTIONS: LuggageType[] = [
  "Light (Backpacks)",
  "Heavy (Trolleys)",
];

const GENDER_OPTIONS: GenderPreference[] = ["Any", "Same Gender Only"];

export default function CreateRideModal({ open, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [destination, setDestination] = useState<Destination>("Durg Junction");
  const [trainNumber, setTrainNumber] = useState("");
  const [departureDate, setDepartureDate] = useState(toInputDate(new Date()));
  const [timeStart, setTimeStart] = useState("16:00");
  const [timeEnd, setTimeEnd] = useState("17:00");
  const [luggage, setLuggage] = useState<LuggageType>("Light (Backpacks)");
  const [genderPreference, setGenderPreference] =
    useState<GenderPreference>("Any");
  const [meetupPoint, setMeetupPoint] = useState<MeetupPoint>("Gate 2");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine date + time into ISO strings
      const timeWindowStart = new Date(
        `${departureDate}T${timeStart}:00`,
      ).toISOString();
      const timeWindowEnd = new Date(
        `${departureDate}T${timeEnd}:00`,
      ).toISOString();

      await api.post("/groups", {
        destination,
        trainNumber: trainNumber || undefined,
        departureDate: new Date(departureDate).toISOString(),
        timeWindowStart,
        timeWindowEnd,
        luggage,
        genderPreference,
        meetupPoint,
      });

      toast({ title: "Ride created! 🎉", variant: "success" });
      onCreated();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast({
        title: axiosErr.response?.data?.message || "Failed to create ride.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <PlusCircle size={20} className="text-brand" />
            Create a Ride
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Destination */}
          <FieldLabel label="Destination">
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value as Destination)}
              className="input-field"
              required
            >
              {DESTINATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </FieldLabel>

          {/* Train Number */}
          <FieldLabel label="Train Number (optional)">
            <input
              type="text"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
              placeholder="e.g. 12410"
              className="input-field"
            />
          </FieldLabel>

          {/* Date */}
          <FieldLabel label="Departure Date">
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={toInputDate(new Date())}
              className="input-field"
              required
            />
          </FieldLabel>

          {/* Time window */}
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="From">
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="input-field"
                required
              />
            </FieldLabel>
            <FieldLabel label="To">
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="input-field"
                required
              />
            </FieldLabel>
          </div>

          {/* Luggage */}
          <FieldLabel label="Luggage">
            <select
              value={luggage}
              onChange={(e) => setLuggage(e.target.value as LuggageType)}
              className="input-field"
            >
              {LUGGAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </FieldLabel>

          {/* Gender Preference */}
          <FieldLabel label="Gender Preference">
            <select
              value={genderPreference}
              onChange={(e) =>
                setGenderPreference(e.target.value as GenderPreference)
              }
              className="input-field"
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </FieldLabel>

          {/* Meetup Point */}
          <FieldLabel label="Meetup Point">
            <select
              value={meetupPoint}
              onChange={(e) => setMeetupPoint(e.target.value as MeetupPoint)}
              className="input-field"
            >
              {MEETUP_POINTS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={18} className="mx-auto animate-spin" />
          ) : (
            "Post Ride"
          )}
        </button>
      </form>
    </div>
  );
}

/* Tiny helper for consistent field labels */
function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}
