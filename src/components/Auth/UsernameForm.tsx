import React, { useState } from "react";
import { AuthFormData } from "@/lib/types/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
export const UsernameForm = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      // Set username in context
      setUsername(username);

      // Redirect to Board List Page
      router.push("/boards");
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
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
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                  disabled={isLoading || !username.trim()}
                  className="flex w-full justify-center rounded-md bg-orange-500 
                           px-3 py-1.5 text-sm font-semibold text-white 
                           shadow-sm hover:bg-orange-600
                           focus-visible:outline focus-visible:outline-2 
                           focus-visible:outline-offset-2 
                           focus-visible:outline-orange-600
                           disabled:bg-orange-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Loading..." : "Continue"}
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
