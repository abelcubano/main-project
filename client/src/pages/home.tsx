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
        title: "Request Sent Successfully",
        description: "A dispatch engineer will contact you shortly.",
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-blue-100 p-0 overflow-hidden bg-white shadow-2xl">
        <div className="bg-blue-600 px-6 py-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-white backdrop-blur-sm border border-white/20">
                <HardHat className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-display font-bold">Request Smart Hands</DialogTitle>
            </div>
            <DialogDescription className="text-blue-100 font-medium">
              Professional on-site engineering for South Florida data centers.
            </DialogDescription>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4 bg-gradient-to-b from-white to-blue-50/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-blue-900 font-semibold">Full Name</Label>
              <Input id="name" placeholder="John Doe" required className="border-blue-100 focus-visible:ring-blue-600 h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-blue-900 font-semibold">Company</Label>
              <Input id="company" placeholder="Acme Corp" required className="border-blue-100 focus-visible:ring-blue-600 h-11" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-blue-900 font-semibold">Work Email</Label>
            <Input id="email" type="email" placeholder="john@company.com" required className="border-blue-100 focus-visible:ring-blue-600 h-11" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-blue-900 font-semibold">Facility</Label>
              <Select required>
                <SelectTrigger className="border-blue-100 focus:ring-blue-600 h-11">
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
              <Label htmlFor="urgency" className="text-blue-900 font-semibold">Urgency</Label>
              <Select defaultValue="standard">
                <SelectTrigger className="border-blue-100 focus:ring-blue-600 h-11">
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
            <Label htmlFor="notes" className="text-blue-900 font-semibold">Task Details</Label>
            <Textarea 
              id="notes" 
              placeholder="Describe the work needed..." 
              required 
              className="min-h-[100px] border-blue-100 focus-visible:ring-blue-600 resize-none"
            />
          </div>
          <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Dispatch...
              </>
            ) : (
              "Submit Dispatch Request"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TopNav({ onRequest }: { onRequest: () => void }) {
  return (
    <div className="sticky top-0 z-40 border-b border-blue-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-200">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-black tracking-tight text-blue-900 uppercase italic">
              SF Smart Hands
            </div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">
              Dispatch Active
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8">
            <a href="#locations" className="text-xs font-bold uppercase tracking-widest text-blue-900/60 hover:text-blue-600 transition-colors">Locations</a>
            <a href="#services" className="text-xs font-bold uppercase tracking-widest text-blue-900/60 hover:text-blue-600 transition-colors">Services</a>
            <a href="#about" className="text-xs font-bold uppercase tracking-widest text-blue-900/60 hover:text-blue-600 transition-colors">Emergency</a>
          </nav>
          <Button size="sm" className="h-10 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold shadow-md shadow-blue-100" onClick={onRequest}>
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
    <div className="min-h-dvh bg-blue-50/30 selection:bg-blue-600 selection:text-white" data-testid="page-home">
      <TopNav onRequest={() => setShowContact(true)} />
      <ContactModal open={showContact} onOpenChange={setShowContact} />

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden bg-gradient-to-b from-white to-blue-50/50">
        <div className="absolute inset-0 bg-hero-grid opacity-20" />
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 mb-6 bg-blue-100/50 border border-blue-200 px-4 py-2 rounded-full">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Active Dispatch Coverage</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-display font-black text-blue-950 leading-[0.95] mb-8 uppercase italic tracking-tighter">
                Physical <span className="text-blue-600 not-italic">Presence</span> <br />
                <span className="text-blue-900">Virtual</span> Control.
              </h1>
              <p className="text-xl text-blue-900/70 leading-relaxed mb-10 max-w-lg font-medium">
                South Florida's most reliable Smart Hands team. We provide sub-60 minute dispatch to every major Miami data center facility.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white text-lg font-black uppercase rounded-2xl shadow-2xl shadow-blue-200 transition-all active:scale-95" onClick={() => setShowContact(true)}>
                  Request Smart Hands
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-10 border-blue-200 bg-white text-blue-900 text-lg font-bold rounded-2xl hover:bg-blue-50 shadow-sm transition-all active:scale-95">
                  <PhoneCall className="mr-3 h-6 w-6 text-blue-600" />
                  Live Dispatch
                </Button>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative">
              <div className="relative rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(30,58,138,0.2)] border-[12px] border-white bg-white">
                <img src={techRack} alt="Technician" className="w-full aspect-[4/5] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="bg-white/95 backdrop-blur rounded-3xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl">
                        <Zap className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="text-blue-950 text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">Sub-60 Dispatch</div>
                        <div className="text-blue-600 text-sm font-bold uppercase tracking-widest">Guaranteed Arrival Time</div>
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
      <section id="services" className="py-32 relative bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.03)_0%,transparent_50%)]" />
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-display font-black text-blue-950 uppercase italic tracking-tighter mb-6">Expert Dispatch.</h2>
              <p className="text-xl text-blue-900/60 font-medium">
                Our engineers are vetted, experienced, and equipped with the tools needed to resolve physical issues on the first trip.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">24/7</div>
              <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl">SLA</div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { title: "Rack & Stack", img: dcHero, icon: Server, desc: "Professional hardware installation, cabinet mapping, and precise documentation for any scale." },
              { title: "Cable Management", img: cableMgmt, icon: Cable, desc: "Structured cabling, fiber routing, and certified signal testing for critical network paths." },
              { title: "Emergency Triage", img: techRack, icon: Zap, desc: "Sub-60 minute arrival for hardware failures, power issues, and component swaps." }
            ].map((svc, i) => (
              <motion.div key={i} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                <Card className="group overflow-hidden border-blue-50 bg-white shadow-2xl shadow-blue-900/5 rounded-[2.5rem] p-4 h-full flex flex-col">
                  <div className="relative rounded-[2rem] overflow-hidden h-64 mb-8">
                    <img src={svc.img} alt={svc.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply" />
                    <div className="absolute top-6 right-6 h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <svc.icon className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex-grow">
                    <h3 className="text-3xl font-display font-black text-blue-950 uppercase italic tracking-tighter mb-4">{svc.title}</h3>
                    <p className="text-blue-900/60 font-medium leading-relaxed">
                      {svc.desc}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations Section with Modern Map */}
      <section id="locations" className="py-32 bg-blue-50/50 border-y border-blue-100 relative">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-5">
              <h2 className="text-5xl font-display font-black text-blue-950 uppercase italic tracking-tighter mb-8">Supported Facilities.</h2>
              <div className="space-y-4 mb-10">
                {sites.map((site, idx) => (
                  <Card key={idx} className="p-6 border-blue-100 bg-white shadow-xl shadow-blue-900/5 rounded-3xl hover:border-blue-400 transition-all group">
                    <div className="flex items-start gap-5">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-blue-950 font-black uppercase italic tracking-tight text-xl mb-1">{site.name}</div>
                        <div className="text-blue-600/70 text-sm font-bold tracking-tight mb-4">{site.address}</div>
                        <div className="flex flex-wrap gap-2">
                          {site.services.slice(0, 2).map((svc, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-md">{svc}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex flex-col gap-6">
                <Button size="lg" className="h-16 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-2xl shadow-xl shadow-blue-200" onClick={() => setShowContact(true)}>
                  Don’t see your location? Ask here!
                </Button>
                <div className="p-8 bg-blue-950 rounded-[2.5rem] text-white">
                  <div className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Central Dispatch</div>
                  <div className="text-2xl font-display font-bold mb-2 uppercase italic tracking-tighter leading-none">iM Critical Datacenter</div>
                  <div className="text-blue-200/60 font-medium">100 NE 80th Terrace, Miami, FL 33138</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 aspect-square md:aspect-[4/5] lg:aspect-square relative">
              <div className="h-full w-full rounded-[4rem] overflow-hidden border-[16px] border-white shadow-2xl bg-white relative">
                {/* Modern Map UI */}
                <div className="absolute inset-0 bg-[#f1f5f9]">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                  
                  {/* Map Pins with Labels */}
                  {sites.map((site, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 * idx }}
                      className="absolute group z-10"
                      style={{ top: `${site.lat}%`, left: `${site.lng}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white px-4 py-2 rounded-xl shadow-2xl border border-blue-50 opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
                        <div className="font-black uppercase italic tracking-tighter text-blue-950">{site.name}</div>
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Dispatch Zone</div>
                      </div>
                      <div className="relative">
                        <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-400 transform hover:scale-125 transition-transform cursor-pointer border-4 border-white">
                          <HardHat className="h-6 w-6" />
                        </div>
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-0 group-hover:opacity-40 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}

                  {/* Ocean Highlight */}
                  <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-blue-200/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="transform rotate-90 text-[10rem] font-black text-blue-400/10 uppercase select-none tracking-tighter">ATLANTIC</span>
                  </div>
                </div>
                
                {/* Map Controls Mockup */}
                <div className="absolute top-8 right-8 flex flex-col gap-2">
                  <div className="h-10 w-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-900 font-bold border border-blue-50">+</div>
                  <div className="h-10 w-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-900 font-bold border border-blue-50">-</div>
                </div>

                <div className="absolute bottom-10 left-10 p-6 bg-blue-900/95 backdrop-blur-md rounded-3xl text-white shadow-2xl border border-white/10 max-w-xs">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-3 w-3 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">6 Engineers Active</span>
                  </div>
                  <div className="text-xl font-display font-bold uppercase italic tracking-tighter leading-tight">
                    Sub-60 min response guaranteed in all highlighted zones.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-blue-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-20 mb-32">
            <div className="col-span-2">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20">
                  <HardHat className="h-8 w-8" />
                </div>
                <div className="font-display text-4xl font-black uppercase tracking-tighter italic">SF Smart Hands</div>
              </div>
              <p className="text-2xl text-blue-200/50 max-w-md font-medium leading-relaxed italic">
                The extension of your engineering team in the South Florida market. Built for uptime.
              </p>
            </div>
            <div>
              <div className="text-blue-500 text-xs font-black uppercase tracking-[0.3em] mb-8">Operations</div>
              <ul className="space-y-6">
                <li><a href="#" className="text-lg font-bold hover:text-blue-400 transition-colors">Emergency Dispatch</a></li>
                <li><a href="#" className="text-lg font-bold hover:text-blue-400 transition-colors">Rack & Stack</a></li>
                <li><a href="#" className="text-lg font-bold hover:text-blue-400 transition-colors">Audit & Inventory</a></li>
                <li><a href="#" className="text-lg font-bold hover:text-blue-400 transition-colors">Cable Mgmt</a></li>
              </ul>
            </div>
            <div>
              <div className="text-blue-500 text-xs font-black uppercase tracking-[0.3em] mb-8">Headquarters</div>
              <p className="text-xl font-bold leading-relaxed italic">
                iM Critical Datacenter<br />
                100 NE 80th Terrace<br />
                Miami, FL 33138
              </p>
              <div className="mt-10 pt-10 border-t border-white/5">
                <div className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-4">24/7 Dispatch Hotline</div>
                <div className="text-3xl font-display font-black tracking-tighter text-blue-200">(305) 555-0123</div>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-blue-200/20 text-[10px] font-black uppercase tracking-[0.5em]">© 2026 South Florida Smart Hands Operations</div>
            <div className="flex gap-12">
              <a href="#" className="text-blue-200/20 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-colors">Privacy</a>
              <a href="#" className="text-blue-200/20 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-colors">Terms</a>
              <a href="#" className="text-blue-200/20 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest transition-colors">SLA</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
