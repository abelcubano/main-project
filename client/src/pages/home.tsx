import { Link } from "wouter";
import {
  AlarmClock,
  ArrowRight,
  BadgeCheck,
  Cable,
  CircuitBoard,
  HardHat,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Server,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
            <HardHat className="h-4.5 w-4.5 text-white/80" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight" data-testid="text-brand">
              South Florida Smart Hands
            </div>
            <div className="text-xs text-white/55" data-testid="text-tagline">
              On-site engineers • Hands & eyes • Emergency response
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#locations"
            className="hidden text-sm text-white/70 hover:text-white md:block"
            data-testid="link-nav-locations"
          >
            Locations
          </a>
          <a
            href="#services"
            className="hidden text-sm text-white/70 hover:text-white md:block"
            data-testid="link-nav-services"
          >
            Services
          </a>

          <Button size="sm" className="h-9" data-testid="button-nav-request-help">
            Request Smart Hands
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
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
        <div className="absolute inset-0 bg-[radial-gradient(650px_circle_at_50%_-20%,rgba(59,130,246,0.28),transparent_60%)]" />
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

function LocationCard({
  name,
  desc,
  testId,
}: {
  name: string;
  desc: string;
  testId: string;
}) {
  return (
    <Card className="border-white/10 bg-white/5 p-5" data-testid={testId}>
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5">
          <MapPin className="h-4.5 w-4.5 text-white/75" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-semibold" data-testid={`${testId}-name`}>
            {name}
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
            <motion.div variants={item} className="grid gap-8 md:grid-cols-12 md:items-end">
              <div className="md:col-span-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="border-white/10 bg-white/5 text-white/80"
                    data-testid="badge-service-first"
                  >
                    Service provider • Not SaaS
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="border-white/10 bg-white/5 text-white/80"
                    data-testid="badge-region"
                  >
                    South Florida coverage
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="border-white/10 bg-white/5 text-white/80"
                    data-testid="badge-availability"
                  >
                    24/7 emergency available
                  </Badge>
                </div>

                <h1
                  className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl"
                  data-testid="text-hero-title"
                >
                  Smart Hands that feel like your on-site engineering team.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-white/65 md:text-lg" data-testid="text-hero-subtitle">
                  We provide reliable, fast-response engineers inside South Florida data centers for deployments, troubleshooting,
                  hands & eyes, and overnight emergency work.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button size="lg" className="h-11" data-testid="button-hero-request-smarthands">
                    Request Smart Hands
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                    data-testid="button-hero-call"
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Call for urgent response
                  </Button>
                </div>

                <div className="mt-6 grid gap-2 text-sm text-white/60 md:grid-cols-3" data-testid="list-hero-proof">
                  <div className="flex items-center gap-2" data-testid="proof-fast-response">
                    <Zap className="h-4 w-4 text-white/70" /> Fast local dispatch
                  </div>
                  <div className="flex items-center gap-2" data-testid="proof-multi-dc">
                    <MapPin className="h-4 w-4 text-white/70" /> Multi-DC presence
                  </div>
                  <div className="flex items-center gap-2" data-testid="proof-overnight">
                    <AlarmClock className="h-4 w-4 text-white/70" /> Overnight emergencies
                  </div>
                </div>
              </div>

              <Card className="border-white/10 bg-white/5 p-5 md:col-span-4" data-testid="card-hero-smarthands">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-sm font-semibold" data-testid="text-smarthands-card-title">
                      Primary service
                    </div>
                    <div className="mt-1 text-sm text-white/60" data-testid="text-smarthands-card-subtitle">
                      Smart Hands & DC Operations
                    </div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5" aria-hidden>
                    <CircuitBoard className="h-4.5 w-4.5 text-white/75" strokeWidth={1.75} />
                  </div>
                </div>

                <Separator className="my-4 bg-white/10" />

                <div className="grid gap-2 text-sm text-white/65" data-testid="list-smarthands-includes">
                  <div className="flex items-start gap-2" data-testid="item-smarthands-rack-stack">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" aria-hidden />
                    Rack & stack, cable management, decommissions
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-deployments">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" aria-hidden />
                    Server/network deployments + coordination
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-fiber">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" aria-hidden />
                    Fiber testing, power checks, troubleshooting
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-emergency">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" aria-hidden />
                    24/7 overnight emergency response
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge className="border-white/10 bg-white/5 text-white/80" data-testid="badge-sla">
                    SLA-friendly
                  </Badge>
                  <Badge className="border-white/10 bg-white/5 text-white/80" data-testid="badge-docs">
                    Photo + notes
                  </Badge>
                  <Badge className="border-white/10 bg-white/5 text-white/80" data-testid="badge-remote">
                    Hands & eyes
                  </Badge>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={item} className="grid gap-3 md:grid-cols-3" id="services">
              <FeatureCard
                icon={HardHat}
                title="Smart Hands (Primary)"
                desc="Rack & stack, installs/replacements, decommissions, hands & eyes, overnight response."
                testId="card-feature-smarthands"
              />
              <FeatureCard
                icon={Cable}
                title="Deployments + troubleshooting"
                desc="New server/network deployments, coordination/follow-up, fiber testing, power checks, rapid triage."
                testId="card-feature-deploy"
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Reliability first"
                desc="Operational discipline like established providers—clear updates, repeatable process, emergency-ready."
                testId="card-feature-reliability"
              />
            </motion.div>

            <motion.div variants={item} className="grid gap-4" id="locations">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div
                    className="font-display text-2xl font-semibold tracking-tight"
                    data-testid="text-locations-title"
                  >
                    South Florida data centers we support
                  </div>
                  <div className="mt-1 text-sm text-white/60" data-testid="text-locations-subtitle">
                    Fast local response with presence in multiple facilities.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-10 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                  data-testid="button-location-ask"
                >
                  Don’t see your location? Ask here!
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <LocationCard
                  name="Equinix MI1"
                  desc="Downtown Miami — deployments, hands & eyes, emergency response"
                  testId="card-location-mi1"
                />
                <LocationCard
                  name="Digital Realty Miami"
                  desc="Local dispatch — installs, troubleshooting, coordinated rollouts"
                  testId="card-location-dlr"
                />
                <LocationCard
                  name="EdgeConneX Miami"
                  desc="Hands-on support — fiber testing, cable work, power checks"
                  testId="card-location-edx-miami"
                />
                <LocationCard
                  name="EdgeConneX Miami Gardens"
                  desc="Overnight availability — emergency work and ongoing operations"
                  testId="card-location-edx-gardens"
                />
                <LocationCard
                  name="CoreSite Miami"
                  desc="Rack & stack — upgrades, replacements, decommissions"
                  testId="card-location-coresite"
                />
              </div>
            </motion.div>

            <motion.div
              variants={item}
              className="grid gap-4 md:grid-cols-3"
              data-testid="section-secondary-services"
            >
              <Card className="border-white/10 bg-white/5 p-5" data-testid="card-secondary-colo">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold" data-testid="text-secondary-colo-title">
                    Colocation Services
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/60" data-testid="text-secondary-colo-desc">
                  Cabinets, U-space, power planning, cross-connect coordination.
                </p>
              </Card>

              <Card className="border-white/10 bg-white/5 p-5" data-testid="card-secondary-pbx">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold" data-testid="text-secondary-pbx-title">
                    PBX & SIP Trunk
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/60" data-testid="text-secondary-pbx-desc">
                  Voice deployments, SIP trunk provisioning, troubleshooting and monitoring.
                </p>
              </Card>

              <Card className="border-white/10 bg-white/5 p-5" data-testid="card-secondary-dev">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold" data-testid="text-secondary-dev-title">
                    Monitoring + Programming + Web
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/60" data-testid="text-secondary-dev-desc">
                  Network monitoring, software programming, and web design as supporting services.
                </p>
              </Card>
            </motion.div>

            <motion.div variants={item} className="grid gap-3 md:grid-cols-2" data-testid="section-internal-tools">
              <Card className="border-white/10 bg-white/5 p-5" data-testid="card-internal-portal">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-display text-sm font-semibold" data-testid="text-internal-portal-title">
                      Existing customers
                    </div>
                    <div className="mt-1 text-sm text-white/60" data-testid="text-internal-portal-desc">
                      Access service history, invoices, and tickets.
                    </div>
                  </div>
                  <Link href="/portal">
                    <Button
                      variant="outline"
                      className="h-10 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                      data-testid="button-open-portal"
                    >
                      Customer Portal
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="border-white/10 bg-white/5 p-5" data-testid="card-internal-admin">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-display text-sm font-semibold" data-testid="text-internal-admin-title">
                      Internal operations
                    </div>
                    <div className="mt-1 text-sm text-white/60" data-testid="text-internal-admin-desc">
                      Dispatch, tickets, billing, and inventory tooling.
                    </div>
                  </div>
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      className="h-10 border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
                      data-testid="button-open-admin"
                    >
                      Admin Console
                      <ArrowRight className="ml-2 h-4 w-4" />
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
            South Florida Smart Hands • On-site engineering support
          </div>
          <div className="text-sm text-white/55" data-testid="text-footer-right">
            Customer portal + admin console remain available for internal operations.
          </div>
        </div>
      </div>
    </div>
  );
}
