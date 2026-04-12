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
  TransportType,
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

const TRANSPORT: TransportType[] = ["Train", "Flight"];

export default function CreateRideModal({ open, onClose, onCreated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [destination, setDestination] = useState<Destination>("Durg Junction");
  const [transportType, setTransportType] = useState<TransportType>("Train");
  const [trainNumber, setTrainNumber] = useState("");
  const [trainName, setTrainName] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
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
      const timeWindowStart = new Date(
        `${departureDate}T${timeStart}:00`,
      ).toISOString();
      const timeWindowEnd = new Date(
        `${departureDate}T${timeEnd}:00`,
      ).toISOString();

      const campusLeaveTime = timeWindowStart;
      const transportDepartureTime = timeWindowEnd;

      const payload: Record<string, unknown> = {
        destination,
        transportType,
        departureDate: new Date(departureDate).toISOString(),
        timeWindowStart,
        timeWindowEnd,
        campusLeaveTime,
        transportDepartureTime,
        luggage,
        genderPreference,
        meetupPoint,
      };

      if (trainNumber.trim()) payload.trainNumber = trainNumber.trim();
      if (trainName.trim()) payload.trainName = trainName.trim();
      if (transportType === "Flight" && flightNumber.trim()) {
        payload.flightNumber = flightNumber.trim();
      }

      await api.post("/groups", payload);

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
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
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

          <FieldLabel label="Transport">
            <select
              value={transportType}
              onChange={(e) =>
                setTransportType(e.target.value as TransportType)
              }
              className="input-field"
              required
            >
              {TRANSPORT.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Train Number (optional)">
            <input
              type="text"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
              placeholder="e.g. 12410"
              className="input-field"
            />
          </FieldLabel>

          <FieldLabel label="Train Name (optional)">
            <input
              type="text"
              value={trainName}
              onChange={(e) => setTrainName(e.target.value)}
              placeholder="e.g. Gondwana Express"
              className="input-field"
            />
          </FieldLabel>

          {transportType === "Flight" && (
            <FieldLabel label="Flight Number (optional)">
              <input
                type="text"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                placeholder="e.g. 6E 123"
                className="input-field"
              />
            </FieldLabel>
          )}

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

          <p className="text-xs text-gray-500 -mt-2">
            Meet-up window on campus. Leave campus by the start time; train or
            flight is expected around the end time.
          </p>

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
