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
    lat: "25.8485",
    lng: "-80.1915",
    services: ["Primary Hub", "Rack & Stack", "24/7 Remote Hands"],
  },
  {
    name: "Equinix MI1",
    address: "Downtown Miami, FL",
    lat: "25.7743",
    lng: "-80.1937",
    services: ["Deployments", "Hands & eyes", "Emergency response"],
  },
  {
    name: "Digital Realty Miami",
    address: "Miami, FL",
    lat: "25.7825",
    lng: "-80.1918",
    services: ["Installs", "Troubleshooting", "Rollouts"],
  },
  {
    name: "EdgeConneX Miami",
    address: "Miami, FL",
    lat: "25.8242",
    lng: "-80.2831",
    services: ["Fiber testing", "Cable work", "Power checks"],
  },
  {
    name: "CoreSite Miami",
    address: "Miami, FL",
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
        <div className="bg-blue-600 px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 text-white">
              <HardHat className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-display">Request Smart Hands</DialogTitle>
          </div>
          <DialogDescription className="text-blue-100">
            Professional on-site engineering for South Florida data centers.
          </DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" required className="border-blue-100 focus-visible:ring-blue-600" data-testid="input-contact-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="Acme Corp" required className="border-blue-100 focus-visible:ring-blue-600" data-testid="input-contact-company" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" type="email" placeholder="john@company.com" required className="border-blue-100 focus-visible:ring-blue-600" data-testid="input-contact-email" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Facility</Label>
              <Select required>
                <SelectTrigger className="border-blue-100 focus:ring-blue-600" data-testid="select-contact-location">
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
                <SelectTrigger className="border-blue-100 focus:ring-blue-600" data-testid="select-contact-urgency">
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
              placeholder="Describe the work needed..." 
              required 
              className="min-h-[100px] border-blue-100 focus-visible:ring-blue-600 resize-none"
              data-testid="textarea-contact-notes"
            />
          </div>
          <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading} data-testid="button-contact-submit">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TopNav({ onRequest }: { onRequest: () => void }) {
  return (
    <div className="sticky top-0 z-40 border-b border-blue-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-200">
            <HardHat className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight text-blue-900">
              South Florida Smart Hands
            </div>
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              On-site DC Operations
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <a href="#locations" className="text-sm font-semibold text-blue-900/70 hover:text-blue-600 transition-colors">Locations</a>
            <a href="#services" className="text-sm font-semibold text-blue-900/70 hover:text-blue-600 transition-colors">Services</a>
            <a href="#about" className="text-sm font-semibold text-blue-900/70 hover:text-blue-600 transition-colors">About</a>
          </nav>
          <Button size="sm" className="h-10 bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-full" onClick={onRequest}>
            Request Dispatch
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-dvh bg-white selection:bg-blue-100 selection:text-blue-900" data-testid="page-home">
      <TopNav onRequest={() => setShowContact(true)} />
      <ContactModal open={showContact} onOpenChange={setShowContact} />

      {/* Hero Section */}
      <section className="relative pt-10 pb-20 lg:pt-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(59,130,246,0.05)_0%,transparent_100%)]" />
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                24/7 South Florida Operations
              </Badge>
              <h1 className="text-5xl md:text-7xl font-display font-extrabold text-blue-900 leading-[1.1] mb-6">
                Your Hands & Eyes <span className="text-blue-600">Inside the Data Center.</span>
              </h1>
              <p className="text-xl text-blue-900/60 leading-relaxed mb-10 max-w-xl">
                Professional engineering dispatch for rack & stack, cable management, and critical troubleshooting across all South Florida facilities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-blue-200" onClick={() => setShowContact(true)}>
                  Request Smart Hands
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 border-blue-200 text-blue-900 text-lg font-bold rounded-xl hover:bg-blue-50 transition-all">
                  <PhoneCall className="mr-2 h-5 w-5 text-blue-600" />
                  Direct Dispatch
                </Button>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-100 border-8 border-white">
                <img src={techRack} alt="Technician working on server rack" className="w-full aspect-[4/3] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-blue-900 font-bold">Guaranteed Response</div>
                        <div className="text-blue-600 text-sm font-medium">SLA-backed emergency dispatch</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-24 bg-blue-50/50 relative">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-blue-900 mb-4">Operational Services</h2>
            <p className="text-blue-900/60 max-w-2xl mx-auto text-lg font-medium">
              Physical, on-site support by experienced engineers who understand the importance of uptime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-white bg-white shadow-xl shadow-blue-100/50 rounded-3xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-200">
                <Server className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Rack & Stack</h3>
              <p className="text-blue-900/60 leading-relaxed mb-6">
                Professional hardware installation, cabinet layout optimization, and precise labeling for all deployments.
              </p>
              <img src={dcHero} alt="Datacenter rows" className="rounded-2xl h-40 w-full object-cover mb-2" />
            </Card>

            <Card className="p-8 border-white bg-white shadow-xl shadow-blue-100/50 rounded-3xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-200">
                <Cable className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Cable Management</h3>
              <p className="text-blue-900/60 leading-relaxed mb-6">
                Expert fiber and copper routing, structured cabling, and certified testing to ensure maximum signal integrity.
              </p>
              <img src={cableMgmt} alt="Cable management" className="rounded-2xl h-40 w-full object-cover mb-2" />
            </Card>

            <Card className="p-8 border-white bg-white shadow-xl shadow-blue-100/50 rounded-3xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-8 shadow-lg shadow-blue-200">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-4">Urgent Triage</h3>
              <p className="text-blue-900/60 leading-relaxed mb-6">
                Rapid diagnosis of hardware failures, power cycles, component replacements, and connectivity troubleshooting.
              </p>
              <div className="bg-blue-900 rounded-2xl p-6 h-40 flex flex-col justify-end">
                <div className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Average Response</div>
                <div className="text-white text-4xl font-black italic">Under 60min</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Locations Section with Map */}
      <section id="locations" className="py-24 bg-white overflow-hidden">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <Badge className="mb-4 bg-blue-600 text-white border-transparent px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                Coverage Area
              </Badge>
              <h2 className="text-4xl font-display font-bold text-blue-900 mb-6">South Florida Presence</h2>
              <p className="text-lg text-blue-900/60 mb-10 font-medium">
                Strategically positioned engineers across Miami and Broward to provide sub-60 minute dispatch to major facilities.
              </p>
              
              <div className="space-y-4">
                {sites.map((site, idx) => (
                  <Card key={idx} className="p-5 border-blue-50 bg-white shadow-md shadow-blue-50 rounded-2xl hover:border-blue-200 transition-all cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-blue-900 font-bold text-lg mb-1">{site.name}</div>
                        <div className="text-blue-600/70 text-sm font-medium mb-3">{site.address}</div>
                        <div className="flex flex-wrap gap-2">
                          {site.services.map((svc, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-bold text-blue-900/40 uppercase tracking-wider">{svc}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 h-[650px] sticky top-32">
              <div className="relative h-full w-full rounded-[3rem] overflow-hidden border-8 border-blue-50 shadow-2xl bg-blue-50/30">
                {/* Visual Map Representation */}
                <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                  
                  {/* Miami Coastline Abstract */}
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M70,0 Q65,20 68,40 T65,70 T72,100 L100,100 L100,0 Z" fill="#eff6ff" />
                  </svg>
                  
                  {/* Map Points */}
                  {sites.map((site, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 + (idx * 0.1) }}
                      className="absolute cursor-pointer group z-10"
                      style={{
                        top: `${20 + (idx * 15)}%`,
                        left: `${50 - (idx * 5)}%`
                      }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 whitespace-nowrap bg-white px-4 py-2 rounded-xl shadow-xl border border-blue-100 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-none">
                        <div className="font-bold text-blue-900">{site.name}</div>
                        <div className="text-xs text-blue-600">{site.address}</div>
                      </div>
                      <div className="relative">
                        <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-300 transform rotate-45 group-hover:rotate-0 transition-transform">
                          <HardHat className="h-5 w-5 -rotate-45 group-hover:rotate-0 transition-transform" />
                        </div>
                        <div className="absolute -inset-2 bg-blue-600/20 rounded-full blur-lg animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="absolute bottom-8 right-8 left-8 p-6 bg-blue-900/90 backdrop-blur-md rounded-3xl text-white border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                      <Zap className="h-8 w-8 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xl font-bold mb-1 italic tracking-tight underline decoration-blue-500 underline-offset-4">Dispatch Center Active</div>
                      <div className="text-blue-200/70 text-sm font-medium">Real-time tracking available for all active operational tickets.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-blue-900 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <HardHat className="h-5 w-5" />
                </div>
                <div className="font-display text-2xl font-black uppercase tracking-tighter">SF Smart Hands</div>
              </div>
              <p className="text-blue-100/60 max-w-sm text-lg font-medium leading-relaxed">
                South Florida's premier data center operations team. Providing reliable, physical presence when you can't be there.
              </p>
            </div>
            <div>
              <div className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-6">Operations</div>
              <ul className="space-y-4">
                <li><a href="#" className="text-blue-100/80 hover:text-white font-bold transition-colors">Emergency Dispatch</a></li>
                <li><a href="#" className="text-blue-100/80 hover:text-white font-bold transition-colors">Rack & Stack</a></li>
                <li><a href="#" className="text-blue-100/80 hover:text-white font-bold transition-colors">Audit Services</a></li>
              </ul>
            </div>
            <div>
              <div className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-6">Dispatch Office</div>
              <p className="text-blue-100/80 font-bold leading-relaxed">
                iM Critical Datacenter<br />
                100 NE 80th Terrace<br />
                Miami, FL 33138
              </p>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-blue-200/40 text-sm font-bold uppercase tracking-widest">© 2026 South Florida Smart Hands</div>
            <div className="flex gap-8">
              <a href="#" className="text-blue-200/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Terms of Service</a>
              <a href="#" className="text-blue-200/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">SLA Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
