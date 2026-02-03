import { Link } from "wouter";
import { useState } from "react";
import {
  AlarmClock,
  ArrowRight,
  BadgeCheck,
  Cable,
  CircuitBoard,
  HardHat,
  Loader2,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Server,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

function ContactModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onOpenChange(false);
      toast({
        title: "Request Sent Successfully",
        description: "A dispatch engineer will contact you shortly.",
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-black/5 p-0 overflow-hidden bg-white">
        <div className="bg-primary/5 px-6 py-8 border-b border-black/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
              <HardHat className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-display">Request Smart Hands</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Fast-response on-site engineering for South Florida data centers.
          </DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" required className="border-black/10 focus-visible:ring-primary/20" data-testid="input-contact-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" required className="border-black/10 focus-visible:ring-primary/20" data-testid="input-contact-company" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" type="email" placeholder="john@company.com" required className="border-black/10 focus-visible:ring-primary/20" data-testid="input-contact-email" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Facility</Label>
              <Select required>
                <SelectTrigger className="border-black/10 focus:ring-primary/20" data-testid="select-contact-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.name} value={site.name}>{site.name}</SelectItem>
                  ))}
                  <SelectItem value="other">Other Facility</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select defaultValue="standard">
                <SelectTrigger className="border-black/10 focus:ring-primary/20" data-testid="select-contact-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (Next Day)</SelectItem>
                  <SelectItem value="priority">Priority (4-8 Hours)</SelectItem>
                  <SelectItem value="emergency">Emergency (Under 2 Hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Task Details</Label>
            <Textarea 
              id="notes" 
              placeholder="Describe the work needed (e.g. Rack & Stack, Fiber troubleshooting, Cross-connect verification)" 
              required 
              className="min-h-[100px] border-black/10 focus-visible:ring-primary/20 resize-none"
              data-testid="textarea-contact-notes"
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={loading} data-testid="button-contact-submit">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-semibold">
            24/7 Dispatch • South Florida Only
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TopNav({ onRequest }: { onRequest: () => void }) {
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
          <Button size="sm" className="h-9" onClick={onRequest} data-testid="button-nav-request-help">
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
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-black/5 bg-primary/5">
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
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
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-dvh bg-background" data-testid="page-home">
      <TopNav onRequest={() => setShowContact(true)} />
      <ContactModal open={showContact} onOpenChange={setShowContact} />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-hero-grid opacity-30" />
          <div className="absolute inset-0 bg-hero-glow" />
          <div className="absolute inset-0 bg-hero-noise opacity-[0.2]" />
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-10">
            <motion.div variants={item} className="grid gap-8 md:grid-cols-12 md:items-end">
              <div className="md:col-span-8">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="border-primary/10 bg-primary/5 text-primary font-medium"
                    data-testid="badge-service-first"
                  >
                    Service provider • Not SaaS
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="border-black/5 bg-black/5 text-black/60 font-medium"
                    data-testid="badge-region"
                  >
                    South Florida coverage
                  </Badge>
                </div>

                <h1
                  className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl"
                  data-testid="text-hero-title"
                >
                  On-site engineering, <span className="text-primary italic">dispatched in minutes.</span>
                </h1>
                <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg" data-testid="text-hero-subtitle">
                  Reliable, fast-response Smart Hands inside South Florida data centers for deployments, troubleshooting,
                  and 24/7 emergency response.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20" onClick={() => setShowContact(true)} data-testid="button-hero-request-smarthands">
                    Request Smart Hands
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 border-black/10 bg-white shadow-sm hover:bg-black/[0.02]"
                    data-testid="button-hero-call"
                  >
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Call 24/7 Dispatch
                  </Button>
                </div>
              </div>

              <Card className="border-black/10 bg-white p-5 shadow-xl md:col-span-4" data-testid="card-hero-smarthands">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-sm font-semibold text-foreground" data-testid="text-smarthands-card-title">
                      Primary service
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground font-medium" data-testid="text-smarthands-card-subtitle">
                      Smart Hands & DC Operations
                    </div>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10" aria-hidden>
                    <CircuitBoard className="h-4.5 w-4.5 text-primary" strokeWidth={1.75} />
                  </div>
                </div>

                <Separator className="my-4 bg-black/5" />

                <div className="grid gap-2 text-sm text-muted-foreground" data-testid="list-smarthands-includes">
                  <div className="flex items-start gap-2" data-testid="item-smarthands-rack-stack">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    Rack & stack, cable management
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-deployments">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    Server & network deployments
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-fiber">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    Fiber testing & power audits
                  </div>
                  <div className="flex items-start gap-2" data-testid="item-smarthands-emergency">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    24/7 emergency response
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-primary/20 bg-primary/[0.02] text-primary text-[10px] font-bold" data-testid="badge-sla">
                    SLA-GUARANTEED
                  </Badge>
                  <Badge variant="outline" className="border-black/10 bg-transparent text-foreground/70 text-[10px]" data-testid="badge-docs">
                    PHOTO LOGS
                  </Badge>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={item} className="grid gap-3 md:grid-cols-3" id="services">
              <FeatureCard
                icon={HardHat}
                title="Smart Hands (Primary)"
                desc="Physical operational support, rack & stack, and rapid hands-on troubleshooting."
                testId="card-feature-smarthands"
              />
              <FeatureCard
                icon={Cable}
                title="Rapid Deployments"
                desc="Server/network builds, coordination, fiber testing, and power audits."
                testId="card-feature-deploy"
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Managed Operations"
                desc="Operational discipline with clear updates, repeatable process, and 24/7 readiness."
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
                    South Florida footprint
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground" data-testid="text-locations-subtitle">
                    Engineers stationed locally for rapid dispatch to key facilities.
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-10 border-black/10 bg-white shadow-sm"
                  onClick={() => setShowContact(true)}
                  data-testid="button-location-ask"
                >
                  Request site access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-7">
                  <div className="relative aspect-video overflow-hidden rounded-2xl border border-black/10 bg-primary/[0.01] shadow-inner" data-testid="map-container">
                    {/* Simulated Map Background */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3b82f6 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
                    
                    {/* Map Pins */}
                    {sites.map((site, idx) => (
                      <div
                        key={idx}
                        className="absolute flex flex-col items-center group cursor-pointer transition-transform hover:scale-110"
                        style={{
                          top: `${25 + (idx * 14)}%`,
                          left: `${35 + (idx * 10)}%`
                        }}
                        data-testid={`map-pin-${idx}`}
                      >
                        <div className="mb-1 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold shadow-md border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {site.name}
                        </div>
                        <div className="relative h-6 w-6">
                           <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                           <MapPin className="relative h-6 w-6 text-primary fill-primary/20 shadow-sm" />
                        </div>
                      </div>
                    ))}
                    
                    <div className="absolute bottom-4 left-4 rounded-lg bg-white/90 p-3 text-[10px] font-bold tracking-tight backdrop-blur-sm border border-black/5 shadow-sm text-primary uppercase">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" /> 
                        24/7 Live Dispatch Coverage
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:col-span-5">
                  {sites.map((site, idx) => (
                    <Card key={idx} className="group border-black/5 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-md cursor-pointer" data-testid={`site-list-item-${idx}`} onClick={() => setShowContact(true)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-display text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{site.name}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {site.services.map((svc, sIdx) => (
                              <Badge key={sIdx} variant="secondary" className="bg-primary/5 text-[10px] text-primary/70 font-semibold border-none">
                                {svc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-black/5 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <ArrowRight className="h-4 w-4" />
                        </div>
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
              <Card className="border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition-shadow" data-testid="card-secondary-colo">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/5">
                    <Server className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="font-display text-sm font-semibold text-foreground">
                    Colocation Services
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Private cabinets, partial racks, and power planning for multi-facility footprints.
                </p>
              </Card>

              <Card className="border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition-shadow" data-testid="card-secondary-pbx">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/5">
                    <BadgeCheck className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="font-display text-sm font-semibold text-foreground">
                    Connectivity & Voice
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  SIP Trunks, PBX deployments, and cross-connect coordination services.
                </p>
              </Card>

              <Card className="border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition-shadow" data-testid="card-secondary-dev">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/5">
                    <CircuitBoard className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="font-display text-sm font-semibold text-foreground">
                    Specialized Dev
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Network monitoring systems, software programming, and custom operational tools.
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6" data-testid="section-footer">
        <div className="flex flex-col gap-3 border-t border-black/5 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground font-medium" data-testid="text-footer-left">
            South Florida Smart Hands • Built for Uptime
          </div>
          <div className="text-sm text-muted-foreground" data-testid="text-footer-right">
            Dispatched to MI1, DLR, CoreSite and EdgeConneX.
          </div>
        </div>
      </div>
    </div>
  );
}
