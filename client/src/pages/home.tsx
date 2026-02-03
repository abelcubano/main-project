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
import { motion } from "framer-motion";
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

// Import local assets
import techRack from "../assets/images/technician-rack.jpg";
import dcHero from "../assets/images/datacenter-hero.jpg";
import cableMgmt from "../assets/images/cable-management.jpg";

const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

const container = {
  hidden: { opacity: 0, y: 5 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05, duration: 0.3, ease: easeOut },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
};

const sites = [
  {
    name: "iM Critical Datacenter",
    address: "100 NE 80th Terrace, Miami, FL 33138",
    lat: 80,
    lng: 50,
    services: ["Primary Hub", "Rack & Stack", "24/7 Remote Hands"],
  },
  {
    name: "Equinix MI1",
    address: "50 NE 9th Street, Miami, FL 33132",
    lat: 70,
    lng: 48,
    services: ["Deployments", "Hands & eyes", "Emergency response"],
  },
  {
    name: "Digital Realty Miami",
    address: "36 NE 2nd Street, Miami, FL 33132",
    lat: 68,
    lng: 47,
    services: ["Installs", "Troubleshooting", "Rollouts"],
  },
  {
    name: "EdgeConneX Miami",
    address: "2132 NW 114th Avenue, Miami, FL 33172",
    lat: 55,
    lng: 30,
    services: ["Fiber testing", "Cable work", "Power checks"],
  },
  {
    name: "EdgeConneX Miami Gardens",
    address: "475 NE 185th Street, Miami Gardens, FL 33179",
    lat: 25,
    lng: 55,
    services: ["Emergency work", "24/7 Support"],
  },
  {
    name: "CoreSite Miami",
    address: "2115 NW 22nd Street, Miami, FL 33142",
    lat: 60,
    lng: 40,
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
        title: "Request Sent",
        description: "A dispatch engineer will contact you shortly.",
      });
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] border-blue-100 p-0 overflow-hidden bg-white shadow-xl">
        <div className="bg-blue-600 px-5 py-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-white backdrop-blur-sm border border-white/20">
              <HardHat className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-display font-bold">Request Smart Hands</DialogTitle>
              <DialogDescription className="text-blue-100 text-xs font-medium">
                Professional engineering for South Florida facilities.
              </DialogDescription>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3 bg-gradient-to-b from-white to-blue-50/20">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-blue-900 text-xs font-bold">Full Name</Label>
              <Input id="name" placeholder="John Doe" required className="border-blue-100 focus-visible:ring-blue-600 h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-blue-900 text-xs font-bold">Company</Label>
              <Input id="company" placeholder="Acme Corp" required className="border-blue-100 focus-visible:ring-blue-600 h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-blue-900 text-xs font-bold">Work Email</Label>
            <Input id="email" type="email" placeholder="john@company.com" required className="border-blue-100 focus-visible:ring-blue-600 h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-blue-900 text-xs font-bold">Facility</Label>
              <Select required>
                <SelectTrigger className="border-blue-100 focus:ring-blue-600 h-9 text-sm">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map(site => (
                    <SelectItem key={site.name} value={site.name} className="text-sm">{site.name}</SelectItem>
                  ))}
                  <SelectItem value="other" className="text-sm">Other Facility</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="urgency" className="text-blue-900 text-xs font-bold">Urgency</Label>
              <Select defaultValue="standard">
                <SelectTrigger className="border-blue-100 focus:ring-blue-600 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="text-sm">Standard (Next Day)</SelectItem>
                  <SelectItem value="priority" className="text-sm">Priority (4-8 Hours)</SelectItem>
                  <SelectItem value="emergency" className="text-sm">Emergency (Under 2 Hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-blue-900 text-xs font-bold">Task Details</Label>
            <Textarea 
              id="notes" 
              placeholder="Describe work needed..." 
              required 
              className="min-h-[80px] border-blue-100 focus-visible:ring-blue-600 resize-none text-sm"
            />
          </div>
          <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md shadow-blue-100 transition-all text-sm" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Dispatch Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TopNav({ onRequest }: { onRequest: () => void }) {
  return (
    <div className="sticky top-0 z-40 border-b border-blue-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md shadow-blue-100">
            <HardHat className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-black tracking-tight text-blue-900 uppercase italic">
              SF Smart Hands
            </div>
            <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
              Live Dispatch
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <nav className="hidden md:flex items-center gap-6">
            <a href="#locations" className="text-[11px] font-bold uppercase tracking-widest text-blue-900/60 hover:text-blue-600 transition-colors">Locations</a>
            <a href="#services" className="text-[11px] font-bold uppercase tracking-widest text-blue-900/60 hover:text-blue-600 transition-colors">Services</a>
          </nav>
          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-bold text-[11px]" onClick={onRequest}>
            Request Dispatch
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-dvh bg-blue-50/20 selection:bg-blue-600 selection:text-white" data-testid="page-home">
      <TopNav onRequest={() => setShowContact(true)} />
      <ContactModal open={showContact} onOpenChange={setShowContact} />

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 overflow-hidden bg-gradient-to-b from-white to-blue-50/30">
        <div className="absolute inset-0 bg-hero-grid opacity-15" />
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
              <div className="inline-flex items-center gap-2 mb-4 bg-blue-100/40 border border-blue-200 px-3 py-1 rounded-full">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[9px] font-black text-blue-700 uppercase tracking-widest">Active Dispatch Coverage</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-black text-blue-950 leading-[1.05] mb-5 uppercase italic tracking-tighter">
                Physical <span className="text-blue-600 not-italic">Presence</span> <br />
                <span className="text-blue-900">Virtual</span> Control.
              </h1>
              <p className="text-base text-blue-900/70 leading-normal mb-8 max-w-md font-medium">
                Professional Smart Hands for sub-60 minute dispatch to every major South Florida data center facility.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95" onClick={() => setShowContact(true)}>
                  Request Smart Hands
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 border-blue-200 bg-white text-blue-900 text-sm font-bold rounded-xl hover:bg-blue-50 transition-all active:scale-95">
                  <PhoneCall className="mr-2 h-4 w-4 text-blue-600" />
                  Live Dispatch
                </Button>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="relative">
              <div className="relative rounded-[2rem] overflow-hidden shadow-xl border-[8px] border-white bg-white">
                <img src={techRack} alt="Technician" className="w-full aspect-[16/10] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/40 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/95 backdrop-blur rounded-2xl p-4 border border-white/20 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-blue-950 text-lg font-black italic uppercase tracking-tighter leading-none mb-0.5">Sub-60 Dispatch</div>
                        <div className="text-blue-600 text-[10px] font-bold uppercase tracking-widest">Guaranteed Arrival</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-16 relative bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="max-w-xl">
              <h2 className="text-3xl font-display font-black text-blue-950 uppercase italic tracking-tighter mb-2">Expert Dispatch.</h2>
              <p className="text-sm text-blue-900/60 font-medium leading-relaxed">
                Our engineers are vetted, experienced, and equipped with the tools needed to resolve physical issues on the first trip.
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Rack & Stack", img: dcHero, icon: Server, desc: "Professional installation, mapping, and documentation." },
              { title: "Cable Management", img: cableMgmt, icon: Cable, desc: "Structured cabling, fiber routing, and certified signal testing." },
              { title: "Emergency Triage", img: techRack, icon: Zap, desc: "Sub-60 minute arrival for hardware failures and power issues." }
            ].map((svc, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Card className="group overflow-hidden border-blue-50 bg-white shadow-lg shadow-blue-900/5 rounded-2xl p-3 h-full flex flex-col">
                  <div className="relative rounded-xl overflow-hidden h-40 mb-4">
                    <img src={svc.img} alt={svc.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-blue-900/10 mix-blend-multiply" />
                    <div className="absolute top-3 right-3 h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <svc.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="px-2 pb-2">
                    <h3 className="text-xl font-display font-black text-blue-950 uppercase italic tracking-tighter mb-2">{svc.title}</h3>
                    <p className="text-xs text-blue-900/60 font-medium leading-relaxed">
                      {svc.desc}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section with Map */}
      <section id="locations" className="py-16 bg-blue-50/40 border-y border-blue-100">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-display font-black text-blue-950 uppercase italic tracking-tighter mb-6">Supported Facilities.</h2>
              <div className="space-y-3 mb-8">
                {sites.map((site, idx) => (
                  <Card key={idx} className="p-4 border-blue-100 bg-white shadow-md rounded-2xl hover:border-blue-400 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-blue-950 font-black uppercase italic tracking-tight text-lg mb-0.5 truncate">{site.name}</div>
                        <div className="text-blue-600/70 text-[11px] font-bold tracking-tight mb-2 truncate">{site.address}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {site.services.slice(0, 2).map((svc, sIdx) => (
                            <span key={sIdx} className="text-[9px] font-black text-blue-900/30 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded-md">{svc}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                <Button size="lg" className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-xl text-xs shadow-md shadow-blue-100" onClick={() => setShowContact(true)}>
                  Don’t see your location? Ask here!
                </Button>
                <div className="p-6 bg-blue-950 rounded-2xl text-white">
                  <div className="text-blue-400 text-[9px] font-black uppercase tracking-widest mb-2">Central Dispatch Hub</div>
                  <div className="text-lg font-display font-bold uppercase italic tracking-tighter leading-none mb-1">iM Critical Datacenter</div>
                  <div className="text-blue-200/50 text-xs font-medium">100 NE 80th Terrace, Miami, FL 33138</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 h-[500px] relative">
              <div className="h-full w-full rounded-[2.5rem] overflow-hidden border-[12px] border-white shadow-xl bg-white relative">
                <div className="absolute inset-0 bg-[#f1f5f9]">
                  <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                  
                  {sites.map((site, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * idx }}
                      className="absolute group z-10"
                      style={{ top: `${site.lat}%`, left: `${site.lng}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white px-3 py-1.5 rounded-lg shadow-xl border border-blue-50 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none scale-90">
                        <div className="font-black uppercase italic tracking-tighter text-blue-950 text-xs">{site.name}</div>
                      </div>
                      <div className="relative">
                        <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl transform hover:scale-110 transition-transform cursor-pointer border-2 border-white">
                          <HardHat className="h-4 w-4" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="absolute bottom-6 left-6 p-4 bg-blue-900/95 backdrop-blur-sm rounded-2xl text-white shadow-lg border border-white/10 max-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Live Response</span>
                    </div>
                    <div className="text-sm font-display font-bold uppercase italic tracking-tighter leading-tight">
                      Sub-60 min arrival guaranteed in all zones.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-blue-950 text-white border-t border-white/5">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                  <HardHat className="h-5 w-5" />
                </div>
                <div className="font-display text-2xl font-black uppercase tracking-tighter italic">SF Smart Hands</div>
              </div>
              <p className="text-lg text-blue-200/40 max-w-sm font-medium leading-relaxed italic">
                Professional engineering dispatch for the South Florida market. Built for uptime.
              </p>
            </div>
            <div>
              <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Operations</div>
              <ul className="space-y-3">
                <li><a href="#" className="text-sm font-bold hover:text-blue-400 transition-colors">Emergency Dispatch</a></li>
                <li><a href="#" className="text-sm font-bold hover:text-blue-400 transition-colors">Rack & Stack</a></li>
                <li><a href="#" className="text-sm font-bold hover:text-blue-400 transition-colors">Audit & Inventory</a></li>
              </ul>
            </div>
            <div>
              <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">HQ</div>
              <p className="text-base font-bold leading-relaxed italic">
                iM Critical Datacenter<br />
                100 NE 80th Terrace<br />
                Miami, FL 33138
              </p>
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="text-3xl font-display font-black tracking-tighter text-blue-200 leading-none">(305) 555-0123</div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-blue-200/20 text-[8px] font-black uppercase tracking-[0.4em]">© 2026 South Florida Smart Hands</div>
            <div className="flex gap-8">
              <a href="#" className="text-blue-200/20 hover:text-blue-400 text-[9px] font-black uppercase tracking-widest transition-colors">Privacy</a>
              <a href="#" className="text-blue-200/20 hover:text-blue-400 text-[9px] font-black uppercase tracking-widest transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
