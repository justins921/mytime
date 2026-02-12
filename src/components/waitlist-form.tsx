"use client";

import { useState, useRef } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

/* ─── Waitlist Form with CRO best practices ───
   form-cro: Minimal fields (email only), inline validation,
   typo detection, clear success state, trust signals near submit.
   signup-flow-cro: Progressive commitment, value before ask.
─── */

const COMMON_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "outlok.com": "outlook.com",
  "outllook.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "hotmal.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
};

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [typoSuggestion, setTypoSuggestion] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const checkTypo = (value: string) => {
    const domain = value.split("@")[1]?.toLowerCase();
    if (domain && COMMON_TYPOS[domain]) {
      const corrected = value.split("@")[0] + "@" + COMMON_TYPOS[domain];
      setTypoSuggestion(corrected);
    } else {
      setTypoSuggestion(null);
    }
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your email address");
      inputRef.current?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMsg("Please enter a valid email (e.g., name@company.com)");
      inputRef.current?.focus();
      return;
    }

    setStatus("loading");

    // Simulate API call (replace with actual endpoint)
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setStatus("success");
  };

  const acceptSuggestion = () => {
    if (typoSuggestion) {
      setEmail(typoSuggestion);
      setTypoSuggestion(null);
    }
  };

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto text-center" style={{ animation: "fadeIn 0.4s ease-out" }}>
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">You&apos;re on the list!</h3>
        <p className="text-sm text-gray-500 mb-4">
          We&apos;ll email you at <strong>{email}</strong> when your invite is ready.
          Early members get launch pricing locked in.
        </p>
        <p className="text-xs text-gray-400">
          Share your referral link to skip the line and earn free months.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg("");
                checkTypo(e.target.value);
              }}
              onBlur={() => checkTypo(email)}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full h-11 px-4 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white ${
                errorMsg ? "border-red-300 focus:ring-red-500" : ""
              }`}
              disabled={status === "loading"}
            />
            {/* Typo suggestion */}
            {typoSuggestion && (
              <button
                type="button"
                onClick={acceptSuggestion}
                className="absolute top-full left-0 mt-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                Did you mean <strong>{typoSuggestion}</strong>?
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white font-medium px-6 h-11 rounded-md hover:bg-gray-800 transition-colors text-sm shrink-0 disabled:opacity-60"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join the Waitlist
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
        {/* Error message */}
        {errorMsg && (
          <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
        )}
      </form>
      {/* Trust signals — form-cro: place near submit */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> 14-day free trial
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> No credit card
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Cancel anytime
        </span>
      </div>
      {/* Privacy — form-cro: reduce friction */}
      <p className="text-center text-[10px] text-gray-300 mt-2">
        We&apos;ll never share your email. Unsubscribe anytime.
      </p>
    </div>
  );
}
