"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrelloCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    const token = hash.replace("#token=", "");

    if (!token) {
      setError("No token received from Trello. Please try again.");
      return;
    }

    fetch("/api/trello/oauth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (res.ok) {
          router.replace("/settings?trello_connected=true");
        } else {
          return res.json().then((data) => {
            setError(data.error || "Failed to save Trello token");
          });
        }
      })
      .catch(() => {
        setError("Failed to connect to Trello. Please try again.");
      });
  }, [router]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => router.push("/settings")}
            className="text-sm text-primary hover:underline"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-muted-foreground">Connecting Trello...</p>
    </div>
  );
}
