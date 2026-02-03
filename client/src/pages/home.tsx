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

const sites = [
  {
    name: "Equinix MI1",
    lat: "25.7743",
    lng: "-80.1937",
    services: ["Deployments", "Hands & eyes", "Emergency response"],
  },
  {
    name: "Digital Realty Miami",
    lat: "25.7825",
    lng: "-80.1918",
    services: ["Installs", "Troubleshooting", "Rollouts"],
  },
  {
    name: "EdgeConneX Miami",
    lat: "25.8242",
    lng: "-80.2831",
    services: ["Fiber testing", "Cable work", "Power checks"],
  },
  {
    name: "EdgeConneX Miami Gardens",
    lat: "25.9421",
    lng: "-80.2434",
    services: ["Emergency work", "24/7 Support"],
  },
  {
    name: "CoreSite Miami",
    lat: "25.7761",
    lng: "-80.1926",
    services: ["Rack & stack", "Upgrades", "Decommissions"],
  },
];

function TopNav() {
  return (
    <div className="sticky top-0 z-40 border-b border-black/5 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl border border-black/10 bg-black/5 shadow-sm"
            data-testid="img-logo"
            aria-hidden
          >
            <HardHat className="h-4.5 w-4.5 text-black/80" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight text-foreground" data-testid="text-brand">
              South Florida Smart Hands
            </div>
            <div className="text-xs text-muted-foreground" data-testid="text-tagline">
              On-site engineers • Hands & eyes • Emergency response
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#locations"
            className="hidden text-sm text-muted-foreground hover:text-foreground md:block"
            data-testid="link-nav-locations"
          >
            Locations
          </a>
          <a
            href="#services"
            className="hidden text-sm text-muted-foreground hover:text-foreground md:block"
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
      className="group relative overflow-hidden border-black/10 bg-white p-5 shadow-sm transition hover:shadow-md"
      data-testid={testId}
    >
      <div className="relative flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/5 bg-black/[0.02]">
          <Icon className="h-5 w-5 text-black/80" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-semibold tracking-tight text-foreground" data-testid={`${testId}-title`}>
            {title}
          </div>
          <div className="mt-1 text-sm text-muted-foreground" data-testid={`${testId}-desc`}>
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
          <div className="absolute inset-0 bg-hero-grid opacity-50" />
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
                    className="border-black/5 bg-black/5 text-black/80"
                    data-testid="badge-service-first"
                  >
                    Service provider • Not SaaS
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="border-black/5 bg-black/5 text-black/80"
                    data-testid="badge-region"
                  >
                    South Florida coverage
                  </Badge>
                </div>

                <h1
                  className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl"
                  data-testid="text-hero-title"
                >
                  Smart Hands that feel like your on-site engineering team.
                </h1>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg" data-testid="text-hero-subtitle">
                  We provide reliable, fast-response engineers inside South Florida data centers for deployments, troubleshooting,
                  hands & eyes, and overnight emergency work.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button size="lg" className="h-11 shadow-sm shadow-primary/20" data-testid="button-hero-request-smarthands">
                    Request Smart Hands
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-11 border-black/10 bg-white shadow-sm hover:bg-black/[0.02]"
                    data-testid="button-hero-call"
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Call for urgent response
                  </Button>
                </div>
              </div>

              <Card className="border-black/10 bg-white p-5 shadow-lg md:col-span-4" data-testid="card-hero-smarthands">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-sm font-semibold text-foreground" data-testid="text-smarthands-card-title">
                      Primary service
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground" data-testid="text-smarthands-card-subtitle">
                      Smart Hands & DC Operations
                    </div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-black/5 bg-black/[0.02]" aria-hidden>
                    <CircuitBoard className="h-4.5 w-4.5 text-black/75" strokeWidth={1.75} />
                  </div>
                </div>

                <Separator className="my-4 bg-black/5" />

                <div className="grid gap-2 text-sm text-muted-foreground" data-testid="list-smarthands-includes">
                  <div className="flex items-start gap-2" data-testid="item-smarthands-rack-stack">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" aria-hidden />
                    Rack & stack, cable management, decommissions
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-deployments">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" aria-hidden />
                    Server/network deployments + coordination
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-fiber">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" aria-hidden />
                    Fiber testing, power checks, troubleshooting
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-emergency">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" aria-hidden />
                    24/7 overnight emergency response
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-black/10 bg-transparent text-foreground/70" data-testid="badge-sla">
                    SLA-friendly
                  </Badge>
                  <Badge variant="outline" className="border-black/10 bg-transparent text-foreground/70" data-testid="badge-docs">
                    Photo + notes
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

            <motion.div variants={item} className="grid gap-6" id="locations">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <div
                    className="font-display text-2xl font-semibold tracking-tight text-foreground"
                    data-testid="text-locations-title"
                  >
                    South Florida coverage
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground" data-testid="text-locations-subtitle">
                    Our engineers are stationed across these key facilities for rapid dispatch.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-10 border-black/10 bg-white shadow-sm"
                  data-testid="button-location-ask"
                >
                  Don’t see your location? Ask here!
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-7">
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-black/10 bg-black/5 shadow-inner" data-testid="map-container">
                    {/* Simulated Map Background */}
                    <div className="absolute inset-0 opacity-40 grayscale" style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
                    
                    {/* Map Pins */}
                    {sites.map((site, idx) => (
                      <div
                        key={idx}
                        className="absolute flex flex-col items-center group cursor-pointer transition-transform hover:scale-110"
                        style={{
                          top: `${30 + (idx * 12)}%`,
                          left: `${40 + (idx * 8)}%`
                        }}
                        data-testid={`map-pin-${idx}`}
                      >
                        <div className="mb-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold shadow-sm border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {site.name}
                        </div>
                        <div className="relative h-6 w-6">
                           <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                           <MapPin className="relative h-6 w-6 text-primary fill-primary/10" />
                        </div>
                      </div>
                    ))}
                    
                    <div className="absolute bottom-4 left-4 rounded-lg bg-white/80 p-3 text-xs font-medium backdrop-blur-sm border border-black/5">
                      <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary" /> Active dispatch zone</div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:col-span-5">
                  {sites.map((site, idx) => (
                    <Card key={idx} className="border-black/5 bg-white p-4 transition hover:border-primary/20 shadow-sm" data-testid={`site-list-item-${idx}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-display text-sm font-semibold text-foreground">{site.name}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {site.services.map((svc, sIdx) => (
                              <Badge key={sIdx} variant="secondary" className="bg-black/[0.03] text-[10px] text-muted-foreground font-normal border-none">
                                {svc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={item}
              className="grid gap-4 md:grid-cols-3"
              data-testid="section-secondary-services"
            >
              <Card className="border-black/5 bg-white p-5 shadow-sm" data-testid="card-secondary-colo">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-foreground/70" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold text-foreground">
                    Colocation Services
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cabinets, U-space, power planning, cross-connect coordination.
                </p>
              </Card>

              <Card className="border-black/5 bg-white p-5 shadow-sm" data-testid="card-secondary-pbx">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-foreground/70" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold text-foreground">
                    PBX & SIP Trunk
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Voice deployments, SIP trunk provisioning, troubleshooting.
                </p>
              </Card>

              <Card className="border-black/5 bg-white p-5 shadow-sm" data-testid="card-secondary-dev">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-foreground/70" strokeWidth={1.75} />
                  <div className="font-display text-sm font-semibold text-foreground">
                    Software & Monitoring
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Network monitoring, software programming, and web design.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6" data-testid="section-footer">
        <div className="flex flex-col gap-3 border-t border-black/5 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground" data-testid="text-footer-left">
            South Florida Smart Hands • On-site engineering support
          </div>
          <div className="text-sm text-muted-foreground" data-testid="text-footer-right">
            Providing physical operational support in MI1, DLR, CoreSite and EdgeConneX.
          </div>
        </div>
      </div>
    </div>
  );
}
