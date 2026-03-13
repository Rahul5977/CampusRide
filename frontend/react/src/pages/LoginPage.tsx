/* -----------------------------------------------------------------------
 * LoginPage — the landing / login page.
 *
 * Clean hero with value prop + a single CTA to start Google OAuth.
 * Also reads ?error= from the URL to display auth failure messages.
 * ----------------------------------------------------------------------- */

import { useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Car, ArrowRight, ShieldCheck, Clock, Users } from "lucide-react";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read error from URL (set by the backend redirect on auth failure)
  // Use useMemo to avoid setState in effect pattern
  const error = useMemo(() => searchParams.get("error"), [searchParams]);

  // If there's already a valid session, bounce to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  const features = [
    {
      icon: Clock,
      title: "Instant Matching",
      desc: "Find co-travellers heading your way in seconds.",
    },
    {
      icon: Users,
      title: "4-Person Groups",
      desc: "Optimal cab sharing — split the fare four ways.",
    },
    {
      icon: ShieldCheck,
      title: "Institute Only",
      desc: "Verified @iitbhilai.ac.in accounts only.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center max-w-md">
          {/* Logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
            <Car size={32} className="text-brand" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Campus Transit
          </h1>
          <p className="mt-3 text-base text-gray-500 leading-relaxed">
            Stop spamming WhatsApp.
            <br />
            <span className="font-semibold text-gray-700">
              Find your cab group instantly.
            </span>
          </p>

          {/* Error alert */}
          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={login}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 hover:bg-brand-dark active:scale-[0.98] transition-all sm:w-auto sm:px-8"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Login with Institute Google Account
            <ArrowRight size={16} />
          </button>

          <p className="mt-4 text-xs text-gray-400">
            Only <span className="font-medium">@iitbhilai.ac.in</span> accounts
            are allowed.
          </p>
        </div>

        {/* Features */}
        <div className="mt-16 grid w-full max-w-lg grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-surface p-4 text-center"
            >
              <f.icon size={22} className="mx-auto mb-2 text-brand" />
              <p className="text-sm font-semibold text-gray-800">{f.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        Built with ❤️ for IIT Bhilai
      </footer>
    </div>
  );
}
