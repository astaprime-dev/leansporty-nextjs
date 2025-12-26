"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500"
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
