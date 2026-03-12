/* -----------------------------------------------------------------------
 * OnboardingModal — forces first-time users to complete their profile.
 *
 * Shown when user.phone / user.gender / user.hostel are missing.
 * Cannot be dismissed — the user MUST complete this step.
 * ----------------------------------------------------------------------- */

import { useState, type FormEvent } from "react";
import { Loader2, UserCheck } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";

const HOSTELS = [
  "Kanhar (BH1)",
  "Gopad (BH2)",
  "Indravati (GH1)",
  "Shivnath (MSH)",
  "Day Scholar",
] as const;

const GENDERS = ["Male", "Female", "Other"] as const;

export default function OnboardingModal() {
  const { fetchUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [hostel, setHostel] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!phone || !gender || !hostel) {
      toast({ title: "Please fill in all fields.", variant: "error" });
      return;
    }

    // Basic phone validation for Indian numbers
    const cleanPhone = phone.replace(/\s|-/g, "");
    if (!/^(\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      toast({
        title: "Please enter a valid Indian phone number.",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    try {
      await api.patch("/auth/profile", { phone: cleanPhone, gender, hostel });
      toast({
        title: "Profile completed! Welcome aboard 🎉",
        variant: "success",
      });
      await fetchUser(); // Refresh user → needsOnboarding becomes false
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast({
        title: axiosErr.response?.data?.message || "Failed to update profile.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Non-dismissible backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md mx-4 bg-surface rounded-2xl p-6 shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
            <UserCheck size={24} className="text-brand" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            We need a few details before you can start sharing rides.
          </p>
        </div>

        <div className="space-y-4">
          {/* Phone */}
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 block">
              Phone Number
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="input-field"
              required
            />
          </label>

          {/* Gender */}
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 block">
              Gender
            </span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="input-field"
              required
            >
              <option value="" disabled>
                Select gender
              </option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          {/* Hostel */}
          <label className="block">
            <span className="text-xs font-medium text-gray-500 mb-1 block">
              Hostel
            </span>
            <select
              value={hostel}
              onChange={(e) => setHostel(e.target.value)}
              className="input-field"
              required
            >
              <option value="" disabled>
                Select hostel
              </option>
              {HOSTELS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={18} className="mx-auto animate-spin" />
          ) : (
            "Save & Continue"
          )}
        </button>
      </form>
    </div>
  );
}
