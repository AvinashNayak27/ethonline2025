"use client";

import { useState } from "react";

interface VerifyOffchainPaymentButtonProps {
  className?: string;
}

interface Step2TransactionData {
  paymentStatusTitle: string;
  paymentTotalAmount: number;
  receiverUpiId: string;
  upiTransactionId: string;
}

interface Step2Response {
  success: boolean;
  transaction?: Step2TransactionData;
  signature?: string;
  message?: string;
  error?: string;
  sessionId?: string;
}

export default function VerifyOffchainPaymentButton({
  className = "px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed",
}: VerifyOffchainPaymentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<Step2Response | null>(null);

  function resetState() {
    setUsername("");
    setPassword("");
    setOtp("");
    setLoading(false);
    setError(null);
    setStep(1);
    setSessionId(null);
    setResult(null);
  }

  function closeModal() {
    setIsOpen(false);
    // small delay to allow modal close animation before reset
    setTimeout(() => resetState(), 150);
  }

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://tee.buildweekends.com/api/login/step1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as Step2Response;
      if (data && (data as any).success) {
        setSessionId((data as any).sessionId || null);
        setStep(2);
      } else {
        setError((data && data.error) || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to server");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://tee.buildweekends.com/api/login/step2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, otp }),
      });
      const data = (await response.json()) as Step2Response;
      if (data && data.success) {
        setResult(data);
        setStep(3);
      } else {
        setError((data && data.error) || "OTP verification failed");
      }
    } catch (err) {
      setError("Failed to connect to server");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={className}>
        Verify Offchain Payment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          <div className="relative z-10 w-full max-w-md mx-4">
            <div className="overflow-hidden rounded-2xl shadow-2xl bg-white text-gray-900 dark:bg-neutral-900 dark:text-white">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                    {/* stylized A as Amazon mark */}
                    <span className="font-black">A</span>
                  </span>
                  <div>
                    <h3 className="text-base font-semibold leading-none">Amazon Pay via TEE</h3>
                    <p className="text-xs text-gray-500 dark:text-neutral-400">Verify offchain payment securely</p>
                  </div>
                </div>
                <button onClick={closeModal} className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-neutral-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-5">
                {step === 1 && (
                  <form onSubmit={handleStep1Submit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Enter your Amazon username"
                        className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Enter your password"
                        className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5">
                          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.198 0l6.72 11.634c1.155 2-.289 4.5-2.6 4.5H5.28c-2.311 0-3.755-2.5-2.6-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 12 8.25Zm0 7.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? "Processing…" : "Continue"}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleStep2Submit} className="space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
                      Enter the OTP sent to your registered contact.
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">One-Time Password (OTP)</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Enter OTP"
                        autoFocus
                        className="w-full rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5">
                          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.198 0l6.72 11.634c1.155 2-.289 4.5-2.6 4.5H5.28c-2.311 0-3.755-2.5-2.6-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 12 8.25Zm0 7.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 rounded-lg border border-gray-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loading ? "Verifying…" : "Verify OTP"}
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-5 w-5">
                        <path fillRule="evenodd" d="M2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Zm13.36-2.59a.75.75 0 1 0-1.06-1.06L10.5 12.34l-1.53-1.53a.75.75 0 0 0-1.06 1.06l2.06 2.06a.75.75 0 0 0 1.06 0l4.62-4.62Z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="font-medium">Payment Verified</div>
                        <div className="text-xs text-gray-600 dark:text-neutral-400">Transaction data retrieved successfully</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                      <div className="bg-gray-50 dark:bg-neutral-900/50 px-4 py-2 text-sm font-medium">Transaction</div>
                      <div className="p-4 space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Status</span>
                          <span className="font-medium">{result?.transaction?.paymentStatusTitle || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-medium">{result?.transaction?.paymentTotalAmount ?? "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Receiver UPI</span>
                          <span className="font-medium">{result?.transaction?.receiverUpiId || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">UPI Txn ID</span>
                          <span className="font-medium">{result?.transaction?.upiTransactionId || "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                      <div className="bg-gray-50 dark:bg-neutral-900/50 px-4 py-2 text-sm font-medium">Signature</div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <code className="block w-full overflow-x-auto rounded-md bg-gray-100 dark:bg-neutral-900/60 px-3 py-2 text-xs">
                            {result?.signature || "-"}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          resetState();
                          setStep(1);
                        }}
                        className="flex-1 rounded-lg border border-gray-200 dark:border-neutral-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800"
                      >
                        Verify Another
                      </button>
                      <button
                        onClick={closeModal}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


