import Image from "next/image";

// Split-screen wrapper for /login and /signup. Dark editorial left panel
// (background image + headline) sets the tone; the form sits on white in
// the right panel — the contrast is intentional per DESIGN.md.

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left — editorial. Stays dark; auth-bg.jpg + soft black overlay. */}
      <div className="relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden bg-cover bg-center px-12 py-10 lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: "url(/brand/auth-bg.jpg)" }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/20" />

        <Image
          src="/brand/glydepath-white.svg"
          alt="GlydePath"
          width={180}
          height={34}
          unoptimized
          priority
          className="h-[34px] w-auto"
        />

        <div className="max-w-md">
          <h1 className="text-stat font-medium leading-[1.25] text-white">
            The conversation your business owner clients have been waiting
            for.
          </h1>
          <p className="mt-5 text-body text-white/70">
            Glyde helps wealth advisors go deeper with their business owner
            clients — with the language, structure, and tools to unlock
            conversations that matter.
          </p>
        </div>

        <p className="text-eyebrow uppercase text-white/40">
          Built for advisors · Distributed through firms
        </p>
      </div>

      {/* Right — form. White panel per DESIGN.md. */}
      <div className="flex flex-1 items-center justify-center bg-bg-card px-6 py-12">
        <div className="w-full max-w-[360px]">{children}</div>
      </div>
    </div>
  );
}
