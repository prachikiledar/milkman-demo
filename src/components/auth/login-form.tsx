"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Loader2, Phone, KeyRound, ArrowRight } from "lucide-react";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useParams();
  const intendedRole = searchParams.get("role");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Clear any old session when reaching the login page
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, intendedRole }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on role
        if (data.user.role === "ADMIN") {
          router.push(`/${locale}/admin/dashboard`);
        } else {
          router.push(`/${locale}/customer/dashboard`);
        }
      } else {
        setError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-8 bg-white rounded-[28px] shadow-md border border-white/50">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t("title")}</h1>
        <p className="text-sm text-gray-500 font-medium">{t("description")}</p>
      </div>

      <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp} className="space-y-6">
        {step === 1 ? (
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              {t("mobile")}
            </label>
            <div className="search">
              <Phone
                className="h-5 w-5"
                style={{ color: "var(--ink-400)" }}
                aria-hidden="true"
              />
              <input
                id="phone"
                type="tel"
                required
                placeholder={t("mobilePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              {t("otp")}
            </label>
            <div className="search">
              <KeyRound
                className="h-5 w-5"
                style={{ color: "var(--ink-400)" }}
                aria-hidden="true"
              />
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                placeholder={t("otpPlaceholder")}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="flex-1 text-center text-2xl font-mono tracking-[0.5em]"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-brand btn-block text-lg font-bold disabled:opacity-50 transition-all mt-4"
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <>
              {step === 1 ? t("sendOtp") : t("verifyOtp")}
              <ArrowRight className="ml-2" size={20} />
            </>
          )}
        </button>

        {step === 2 && (
          <div className="space-y-4 text-center">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              {t("resendOtp")}
            </button>

            {process.env.NODE_ENV === "development" && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setOtp("123456");
                    // We need to trigger the login with the fixed OTP
                    // Since state update is async, we can't just call handleVerifyOtp(e)
                    // but we can simulate the verify call directly
                    const demoEvent = { preventDefault: () => { } } as React.FormEvent;
                    setTimeout(() => {
                      const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                      submitBtn?.click();
                    }, 0);
                  }}
                  className="w-full py-3 px-4 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 font-semibold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🚀</span> Quick Demo Login (123456)
                </button>
                <p className="mt-2 text-xs text-gray-400">Dev Only: Bypasses OTP check</p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
