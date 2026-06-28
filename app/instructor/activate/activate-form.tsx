"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { createClient } from "@/utils/supabase/client";

export default function InstructorActivateForm() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/instructor/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        // CRITICAL: Refresh session to get new JWT with updated roles
        const supabase = createClient();
        await supabase.auth.refreshSession();

        // Now redirect with fresh token
        router.push("/instructor/profile");
      } else {
        setError("Invalid activation code. Please try again.");
      }
    } catch (err) {
      setError("Activation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-pink-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-light text-gray-900 mb-2">
            Activate Instructor Status
          </h1>
          <p className="text-gray-600">Enter your activation code to enable instructor features</p>
        </div>

        <form onSubmit={handleActivation} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Activation Code
            </label>
            <Input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your instructor activation code"
              className="w-full"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          <Button
            type="submit"
            variant="brand"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Activating..." : "Activate Instructor Status"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            This is a secure instructor-only area. If you don't have an activation
            code, please contact the administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
