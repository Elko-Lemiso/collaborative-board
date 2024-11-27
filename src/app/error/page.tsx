import Link from "next/link";

export default function Error() {
  return (
    <>
      <main className="relative isolate min-h-full">
        <img
          alt=""
          src="https://images.pexels.com/photos/65435/pexels-photo-65435.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          className="absolute inset-0 -z-10 size-full object-cover object-top"
        />
        <div className="mx-auto max-w-7xl px-6 py-32 text-center sm:py-40 lg:px-8">
          <p className="text-base/8 font-semibold text-white">404</p>
          <h1 className="mt-4 text-balance text-5xl font-semibold tracking-tight text-white sm:text-7xl">
            Not Allowed
          </h1>
          <p className="mt-6 text-pretty text-lg font-medium text-white/70 sm:text-xl/8">
            Sorry!
          </p>
          <div className="mt-10 flex justify-center">
            <Link href="/boards" className="text-sm/7 font-semibold text-white">
              <span aria-hidden="true">&larr;</span> Back to boards
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
