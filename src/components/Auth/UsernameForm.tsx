"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export const UsernameForm = () => {
  const [error, setError] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formUsername, setFormUsername] = useState("");

  // Check for existing username in localStorage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      router.push("/boards");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formUsername.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setIsLoading(false);
        return;
      }

      // Save username to localStorage
      localStorage.setItem("username", formUsername.trim());

      // Redirect to Board List Page
      router.push("/boards");
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Image
              src="/logo.svg"
              alt="Next.js logo"
              width={400}
              height={38}
              priority
              className=""
            />
          </div>

          <div className="mt-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-900"
                >
                  Username
                </label>
                <div className="mt-2">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 shadow-sm 
                             ring-1 ring-inset ring-gray-300 
                             placeholder:text-gray-400 
                             focus:ring-2 focus:ring-inset focus:ring-orange-600 
                             sm:text-sm sm:leading-6 px-3"
                    placeholder="Enter your username"
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || !formUsername.trim()}
                  className="flex w-full justify-center rounded-md bg-orange-500 
                           px-3 py-1.5 text-sm font-semibold text-white 
                           shadow-sm hover:bg-orange-600
                           focus-visible:outline focus-visible:outline-2 
                           focus-visible:outline-offset-2 
                           focus-visible:outline-orange-600
                           disabled:bg-orange-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          alt="Collaboration background"
          src="https://images.pexels.com/photos/9311627/pexels-photo-9311627.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default UsernameForm;
