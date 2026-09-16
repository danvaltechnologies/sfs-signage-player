import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, HelpCircle, LockKeyhole, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import logoAsset from "@/assets/sundry-foods-logo.png.asset.json";
import nowPlaying from "@/assets/now-playing.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · Sundry Digital Signage" },
      {
        name: "description",
        content:
          "Sign in to manage digital signage across Sundry Foods locations.",
      },
      { property: "og:title", content: "Sign in · Sundry Digital Signage" },
      {
        property: "og:description",
        content:
          "Sign in to manage digital signage across Sundry Foods locations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate({ from: "/" });
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="min-h-screen bg-panel text-foreground">
      <header className="flex h-20 items-center justify-between border-b border-line/10 px-5 sm:px-8 lg:px-12">
        <img src={logoAsset.url} alt="Sundry Foods" className="h-9 w-16 object-contain" />
        <Button variant="outline" size="sm" className="text-[11px] text-mut">
          <HelpCircle className="size-3.5" /> Need help?
        </Button>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 px-5 pb-12 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
        <div className="mx-auto w-full max-w-sm anim-fadeup">
          <p className="text-2xl font-semibold text-frost">Welcome to</p>
          <h1 className="mt-1 text-3xl font-semibold text-accent">Sundry Digital Signage</h1>
          <p className="mt-3 text-sm text-mut">Power every screen across Sundry Foods locations.</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-3">
            <label className="relative block">
              <span className="sr-only">Work email</span>
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mut" strokeWidth={1.5} />
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@work-email.com"
                className="h-11 pl-10 text-[12px]"
              />
            </label>
            <label className="relative block">
              <span className="sr-only">Password</span>
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mut" strokeWidth={1.5} />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-11 px-10 text-[12px]"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-mut hover:bg-panel2 hover:text-frost"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </label>
            <Button type="submit" className="h-11 w-full" disabled={!email || !password}>
              Sign in
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-1 text-[11px] text-mut">
            <Button type="button" variant="link" className="h-auto p-0 text-[11px] font-normal text-mut hover:text-accent">Forgot password?</Button>
            <span>·</span>
            <Button type="button" variant="link" className="h-auto p-0 text-[11px] text-accent hover:text-accent/80">Recover account</Button>
          </div>
          <Link to="/dashboard" className="mt-7 block text-center text-[11px] text-mut underline-offset-4 hover:text-accent hover:underline">
            Continue with prototype access
          </Link>
        </div>

        <div className="relative hidden aspect-[1.12] overflow-hidden rounded-lg bg-panel2 lg:block">
          <img src={nowPlaying} alt="Sundry Foods digital menu preview" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 border-t border-panel/20 bg-frost/85 px-5 py-4 text-accent-foreground backdrop-blur-sm">
            <p className="text-sm font-medium">Campaign-ready content</p>
            <p className="mt-1 text-[11px] opacity-75">Preview, schedule and publish across every location.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
