import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

const NAV = [
  { to: "/planner", label: "Route planner" },
  { to: "/air-quality", label: "Air quality" },
  { to: "/learn", label: "How it works" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/" });
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/70 backdrop-blur-xl shadow-soft"
          : "border-b border-transparent bg-background/40 backdrop-blur-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="EcoPath home" className="transition-transform duration-300 hover:scale-[1.02]">
            <Logo />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground xl:inline-flex">
            <span className="relative grid place-items-center">
              <span className="absolute size-2 rounded-full bg-aqi-good/50 motion-safe:animate-ping" />
              <span className="size-1.5 rounded-full bg-aqi-good" />
            </span>
            Live air-quality intelligence
          </span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="relative rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-primary transition-transform duration-300",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </>
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="max-w-[12rem] truncate text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Log in</Link>
              </Button>
              <Button size="sm" asChild className="transition-transform duration-300 hover:-translate-y-0.5">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Get started
                </Link>
              </Button>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border bg-background/95 px-6 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <Button variant="outline" size="sm" className="mt-2" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            ) : (
              <Button size="sm" className="mt-2" asChild>
                <Link to="/auth" onClick={() => setOpen(false)}>
                  Log in or sign up
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
