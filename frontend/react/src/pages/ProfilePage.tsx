/* -----------------------------------------------------------------------
 * ProfilePage — full account view + edit all profile fields + travel plans.
 * ----------------------------------------------------------------------- */

import { useState, useEffect, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import api from "@/lib/api";
import type { Destination, MeetupPoint, TravelPlan, TransportType } from "@/types";
import { formatDate, toInputDate } from "@/lib/utils";
import Spinner from "@/components/Spinner";
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  BookOpen,
  Save,
  Loader2,
  MapPin,
  Calendar,
  Train,
  Globe,
  Lock,
} from "lucide-react";

const HOSTELS = [
  "Kanhar (BH1)",
  "Gopad (BH2)",
  "Indravati (GH1)",
  "Shivnath (MSH)",
  "Day Scholar",
] as const;

const GENDERS = ["Male", "Female", "Other"] as const;

const DESTINATIONS: Destination[] = [
  "Durg Junction",
  "Raipur Station",
  "Swami Vivekananda Airport",
];

const MEETUP: MeetupPoint[] = [
  "Gate 1",
  "Gate 2",
  "Kanhar Parking",
  "Mess Parking",
  "Other",
];

export default function ProfilePage() {
  const { user, loading: authLoading, fetchUser } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [hostel, setHostel] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");

  const [tpLabel, setTpLabel] = useState("");
  const [tpDestination, setTpDestination] = useState<Destination>("Durg Junction");
  const [tpTransport, setTpTransport] = useState<TransportType>("Train");
  const [tpDate, setTpDate] = useState(toInputDate(new Date()));
  const [tpTime, setTpTime] = useState("10:00");
  const [tpTrain, setTpTrain] = useState("");
  const [tpTrainName, setTpTrainName] = useState("");
  const [tpMeetup, setTpMeetup] = useState<MeetupPoint>("Gate 2");
  const [tpPublic, setTpPublic] = useState(false);
  const [tpSaving, setTpSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setPhone(user.phone ?? "");
    setGender(user.gender ?? "");
    setHostel(user.hostel ?? "");
    setYear(user.year ?? "");
    setBranch(user.branch ?? "");
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPlansLoading(true);
      try {
        const { data } = await api.get("/users/travel-plans");
        if (!cancelled) setPlans(data.plans ?? []);
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone || !gender || !hostel || !year.trim() || !branch.trim()) {
      toast({ title: "Fill all required fields.", variant: "error" });
      return;
    }
    const cleanPhone = phone.replace(/\s|-/g, "");
    if (!/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      toast({ title: "Enter a valid Indian mobile number.", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await api.patch("/auth/profile", {
        phone: cleanPhone,
        gender,
        hostel,
        year: year.trim(),
        branch: branch.trim(),
      });
      toast({ title: "Profile saved.", variant: "success" });
      await fetchUser();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({
        title: ax.response?.data?.message || "Save failed.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlan = async (e: FormEvent) => {
    e.preventDefault();
    const when = new Date(`${tpDate}T${tpTime}:00`).toISOString();
    const depDay = new Date(`${tpDate}T12:00:00`).toISOString();
    setTpSaving(true);
    try {
      await api.post("/users/travel-plans", {
        label: tpLabel.trim() || "My plan",
        destination: tpDestination,
        transportType: tpTransport,
        trainNumber: tpTrain.trim() || undefined,
        trainName: tpTrainName.trim() || undefined,
        departureDate: depDay,
        departureTime: when,
        campusLeaveTime: when,
        meetupPoint: tpMeetup,
        isTemplate: true,
        visibility: tpPublic ? "public" : "private",
      });
      toast({ title: "Travel plan saved.", variant: "success" });
      const { data } = await api.get("/users/travel-plans");
      setPlans(data.plans ?? []);
      setTpLabel("");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast({
        title: ax.response?.data?.message || "Could not save plan.",
        variant: "error",
      });
    } finally {
      setTpSaving(false);
    }
  };

  if (authLoading && !user) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="text-brand" size={26} />
          My profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Everything stored on your account. Update details anytime.
        </p>
      </div>

      {/* Identity (read-mostly) */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Identity
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt=""
              className="h-20 w-20 rounded-2xl ring-2 ring-brand/20"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-brand/10 flex items-center justify-center text-2xl font-bold text-brand">
              {user.name?.charAt(0) ?? "?"}
            </div>
          )}
          <div className="flex-1 space-y-2 min-w-0">
            <p className="text-xl font-semibold text-gray-900">{user.name}</p>
            <p className="flex items-center gap-2 text-sm text-gray-600 break-all">
              <Mail size={16} className="shrink-0 text-brand" />
              {user.email}
            </p>
            <p className="text-xs text-gray-400">
              Signed in with Google · Member since{" "}
              {user.createdAt ? formatDate(user.createdAt) : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Editable profile */}
      <form
        onSubmit={handleProfileSave}
        className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Contact & campus
        </h2>

        <label className="block">
          <span className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
            <Phone size={12} /> Phone
          </span>
          <input
            className="input-field"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 block">
              Gender
            </span>
            <select
              className="input-field"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="" disabled>
                Select
              </option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <Building2 size={12} /> Hostel
            </span>
            <select
              className="input-field"
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              required
            >
              <option value="" disabled>
                Select
              </option>
              {HOSTELS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <GraduationCap size={12} /> Year of study
            </span>
            <input
              className="input-field"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2nd year"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
              <BookOpen size={12} /> Branch / programme
            </span>
            <input
              className="input-field"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. CSE"
              required
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          Save profile
        </button>
      </form>

      {/* Travel plans */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Train size={16} className="text-brand" />
          Saved travel plans
        </h2>

        {plansLoading ? (
          <Spinner />
        ) : plans.length === 0 ? (
          <p className="text-sm text-gray-500">No plans yet. Add one below.</p>
        ) : (
          <ul className="space-y-2">
            {plans.map((p) => (
              <li
                key={p._id}
                className="rounded-xl border border-border bg-gray-50/80 px-3 py-2 text-sm"
              >
                <span className="font-medium text-gray-900">
                  {p.label || "Plan"}
                </span>
                <span className="text-gray-500"> · {p.destination}</span>
                <span className="text-gray-500">
                  {" "}
                  · {formatDate(p.departureDate)}
                </span>
                <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-gray-400">
                  {p.visibility === "public" ? (
                    <Globe size={12} />
                  ) : (
                    <Lock size={12} />
                  )}
                  {p.visibility}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={handleAddPlan}
          className="border-t border-border pt-4 space-y-3 mt-2"
        >
          <p className="text-xs font-semibold text-gray-600">Add a template</p>
          <input
            className="input-field"
            placeholder="Label (e.g. Weekend home)"
            value={tpLabel}
            onChange={(e) => setTpLabel(e.target.value)}
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">Destination</span>
              <select
                className="input-field"
                value={tpDestination}
                onChange={(e) =>
                  setTpDestination(e.target.value as Destination)
                }
              >
                {DESTINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">Transport</span>
              <select
                className="input-field"
                value={tpTransport}
                onChange={(e) =>
                  setTpTransport(e.target.value as TransportType)
                }
              >
                <option value="Train">Train</option>
                <option value="Flight">Flight</option>
              </select>
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar size={12} /> Date
              </span>
              <input
                type="date"
                className="input-field"
                value={tpDate}
                onChange={(e) => setTpDate(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">
                Leave / depart time
              </span>
              <input
                type="time"
                className="input-field"
                value={tpTime}
                onChange={(e) => setTpTime(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <MapPin size={12} /> Meetup
              </span>
              <select
                className="input-field"
                value={tpMeetup}
                onChange={(e) => setTpMeetup(e.target.value as MeetupPoint)}
              >
                {MEETUP.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="input-field"
              placeholder="Train number (optional)"
              value={tpTrain}
              onChange={(e) => setTpTrain(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Train name (optional)"
              value={tpTrainName}
              onChange={(e) => setTpTrainName(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={tpPublic}
              onChange={(e) => setTpPublic(e.target.checked)}
            />
            Visible in public travel-plan search
          </label>
          <button
            type="submit"
            disabled={tpSaving}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {tpSaving ? (
              <Loader2 className="animate-spin inline" size={16} />
            ) : (
              "Add plan"
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
