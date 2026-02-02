import { Link } from "wouter";
import { ArrowRight, BadgeCheck, Bolt, Boxes, Cable, HardHat, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, duration: 0.45, ease: easeOut },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } },
};

function TopNav() {
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 shadow-sm"
            data-testid="img-logo"
            aria-hidden
          >
            <Boxes className="h-4.5 w-4.5 text-white/80" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight" data-testid="text-brand">
              Colocation Ops
            </div>
            <div className="text-xs text-white/55" data-testid="text-tagline">
              Billing • Tickets • Inventory
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/portal">
            <Button
              variant="ghost"
              className="h-9 text-white/80 hover:text-white"
              data-testid="button-open-portal"
            >
              Customer Portal
            </Button>
          </Link>
          <Link href="/admin">
            <Button className="h-9" data-testid="button-open-admin">
              Admin
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  testId,
}: {
  icon: typeof ShieldCheck;
  title: string;
  desc: string;
  testId: string;
}) {
  return (
    <Card
      className="group relative overflow-hidden border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] transition hover:bg-white/[0.07]"
      data-testid={testId}
    >
      <div className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(650px_circle_at_50%_-20%,rgba(59,130,246,0.35),transparent_60%)]" />
      </div>
      <div className="relative flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5">
          <Icon className="h-5 w-5 text-white/80" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-semibold tracking-tight" data-testid={`${testId}-title`}>
            {title}
          </div>
          <div className="mt-1 text-sm text-white/60" data-testid={`${testId}-desc`}>
            {desc}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-dvh" data-testid="page-home">
      <TopNav />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-hero-grid opacity-70" />
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="absolute inset-0 bg-hero-noise opacity-[0.35]" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-10">
            <motion.div variants={item} className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="border-white/10 bg-white/5 text-white/80"
                  data-testid="badge-mvp"
                >
                  MVP shell
                </Badge>
                <Badge
                  variant="secondary"
                  className="border-white/10 bg-white/5 text-white/80"
                  data-testid="badge-colo-only"
                >
                  Colocation + Managed DC services
                </Badge>
              </div>

              <h1
                className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
                data-testid="text-hero-title"
              >
                A datacenter operations platform built for real-world workflows.
              </h1>
              <p className="max-w-2xl text-base text-white/65 md:text-lg" data-testid="text-hero-subtitle">
                Unified customers, services, billing, tickets, and physical inventory—plus a public-facing entry point for Remote
                Hands and Smart Hands.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/portal">
                  <Button size="lg" className="h-11" data-testid="button-hero-open-portal">
                    Enter Customer Portal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                    data-testid="button-hero-open-admin"
                  >
                    Open Admin Console
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div variants={item} className="grid gap-3 md:grid-cols-3">
              <FeatureCard
                icon={ShieldCheck}
                title="Role-based workspaces"
                desc="Customer portal, technician views, billing tools, and admin controls in one system."
                testId="card-feature-rbac"
              />
              <FeatureCard
                icon={Bolt}
                title="Service + billing lifecycle"
                desc="Recurring + one-time charges, status tracking, allocations, and invoice history." 
                testId="card-feature-billing"
              />
              <FeatureCard
                icon={Boxes}
                title="Inventory you can trust"
                desc="Devices, racks, power, network associations, and links to tickets/services."
                testId="card-feature-inventory"
              />
            </motion.div>

            <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
              <Card className="border-white/10 bg-white/5 p-5" data-testid="card-cta-remotehands">
                <div className="flex items-center gap-3">
                  <HardHat className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold" data-testid="text-cta-remotehands-title">
                    Remote Hands
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/60" data-testid="text-cta-remotehands-desc">
                  Rack & stack, fiber testing, cross-connects, replacements, and project work.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge className="bg-white/10 text-white/80" data-testid="badge-remotehands-sla">
                    SLA-ready
                  </Badge>
                  <Button variant="ghost" className="h-9 px-2 text-white/80 hover:text-white" data-testid="button-remotehands-learn">
                    Learn more
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="border-white/10 bg-white/5 p-5" data-testid="card-cta-smarthands">
                <div className="flex items-center gap-3">
                  <Cable className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold" data-testid="text-cta-smarthands-title">
                    Smart Hands
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/60" data-testid="text-cta-smarthands-desc">
                  Troubleshooting, diagnostics, guided installs, and hands-on work with expert feedback.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge className="bg-white/10 text-white/80" data-testid="badge-smarthands-priority">
                    Priority queues
                  </Badge>
                  <Button variant="ghost" className="h-9 px-2 text-white/80 hover:text-white" data-testid="button-smarthands-learn">
                    Learn more
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              <Card className="border-white/10 bg-white/5 p-5" data-testid="card-cta-trust">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold" data-testid="text-cta-trust-title">
                    Designed for clarity
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/60" data-testid="text-cta-trust-desc">
                  Clean information hierarchy and operational context—no shared hosting clutter.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Badge className="bg-white/10 text-white/80" data-testid="badge-trust-modular">
                    Modular
                  </Badge>
                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      className="h-9 px-2 text-white/80 hover:text-white"
                      data-testid="button-trust-open-admin"
                    >
                      View console
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6" data-testid="section-footer">
        <div className="flex flex-col gap-3 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-white/55" data-testid="text-footer-left">
            Prototype shell • Frontend-only
          </div>
          <div className="text-sm text-white/55" data-testid="text-footer-right">
            Next: marketing page + deeper modules (tickets, billing, inventory)
          </div>
        </div>
      </div>
    </div>
  );
}
