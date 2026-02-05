import { Link } from "wouter";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Code,
  Globe,
  HardHat,
  Loader2,
  MapPin,
  Phone,
  Server,
  Shield,
  Wifi,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const services = [
  {
    icon: HardHat,
    title: "SmartHands",
    desc: "On-site datacenter technicians for installations, troubleshooting, and emergency response.",
  },
  {
    icon: Server,
    title: "Colocation",
    desc: "Secure rack space with redundant power and cooling at our main hub facility.",
  },
  {
    icon: Globe,
    title: "DIA Internet",
    desc: "Dedicated Internet Access with guaranteed bandwidth and low latency connectivity.",
  },
  {
    icon: Shield,
    title: "DDoS Protection",
    desc: "Enterprise-grade mitigation to protect your infrastructure from volumetric attacks.",
  },
  {
    icon: Phone,
    title: "SIP Trunk & PBX",
    desc: "Voice over IP solutions with reliable trunk services and hosted PBX systems.",
  },
  {
    icon: Code,
    title: "Custom Development",
    desc: "Software programming and infrastructure automation tailored to your operations.",
  },
];

const locations = [
  {
    name: "iM Critical Miami",
    address: "100 NE 2nd St, Miami, FL 33138",
    isHub: true,
    smartHandsOnly: false,
    services: {
      smartHands: true,
      colocation: true,
      diaInternet: true,
      ddosProtection: true,
      darkFiber: false,
    },
  },
  {
    name: "Equinix Miami",
    address: "50 NE 9th St, Miami, FL",
    isHub: false,
    smartHandsOnly: true,
    services: { smartHands: true, colocation: false, diaInternet: false, ddosProtection: false, darkFiber: false },
  },
  {
    name: "Digital Realty Miami",
    address: "36 NE 2nd St, Miami, FL 33132",
    isHub: false,
    smartHandsOnly: true,
    services: { smartHands: true, colocation: false, diaInternet: false, ddosProtection: false, darkFiber: false },
  },
  {
    name: "South Reach Networks",
    address: "36 NE 2nd St, Miami, FL 33132",
    isHub: false,
    smartHandsOnly: false,
    services: { smartHands: true, colocation: false, diaInternet: false, ddosProtection: false, darkFiber: true },
  },
  {
    name: "365 Data Centers FLL",
    address: "Fort Lauderdale, FL",
    isHub: false,
    smartHandsOnly: true,
    services: { smartHands: true, colocation: false, diaInternet: false, ddosProtection: false, darkFiber: false },
  },
  {
    name: "EdgeConneX EDCMIA01",
    address: "2132 NW 114th Ave, Miami, FL 33172",
    isHub: false,
    smartHandsOnly: true,
    services: { smartHands: true, colocation: false, diaInternet: false, ddosProtection: false, darkFiber: false },
  },
  {
    name: "QTS Data Centers MIA1",
    address: "11234 NW 20th St, Doral, FL",
    isHub: false,
    smartHandsOnly: true,
    services: { smartHands: true, colocation: false, diaInternet: false, ddosProtection: false, darkFiber: false },
  },
  {
    name: "CoreSite Miami MI1",
    address: "2100 NW 84th Ave, Doral, FL",
    isHub: false,
    smartHandsOnly: true,
    services: { smartHands: true, colocation: false, diaInternet: false, ddosProtection: false, darkFiber: false },
  },
];

function ContactModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    facility: "",
    urgency: "standard",
    details: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ name: "", company: "", email: "", phone: "", facility: "", urgency: "standard", details: "" });
        onOpenChange(false);
        toast({
          title: "Request Submitted",
          description: "Our team will contact you shortly.",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Please try again or contact us directly.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Connection Error",
        description: "Unable to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-slate-200 p-0 overflow-hidden bg-white">
        <div className="bg-slate-900 px-6 py-5 text-white">
          <DialogTitle className="text-base font-semibold">Request Service</DialogTitle>
          <DialogDescription className="text-slate-400 text-xs mt-1">
            Submit a dispatch request or service inquiry.
          </DialogDescription>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-xs font-medium">Name</Label>
              <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required className="h-9 text-sm border-slate-200" data-testid="input-dispatch-name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-xs font-medium">Company</Label>
              <Input value={formData.company} onChange={(e) => handleChange("company", e.target.value)} required className="h-9 text-sm border-slate-200" data-testid="input-dispatch-company" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-xs font-medium">Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} required className="h-9 text-sm border-slate-200" data-testid="input-dispatch-email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-xs font-medium">Phone</Label>
              <Input type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} className="h-9 text-sm border-slate-200" data-testid="input-dispatch-phone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-xs font-medium">Location</Label>
              <Select value={formData.facility} onValueChange={(v) => handleChange("facility", v)} required>
                <SelectTrigger className="h-9 text-sm border-slate-200" data-testid="select-dispatch-facility">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.name} value={loc.name} className="text-sm">{loc.name}</SelectItem>
                  ))}
                  <SelectItem value="Other" className="text-sm">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-700 text-xs font-medium">Urgency</Label>
              <Select value={formData.urgency} onValueChange={(v) => handleChange("urgency", v)}>
                <SelectTrigger className="h-9 text-sm border-slate-200" data-testid="select-dispatch-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="text-sm">Standard</SelectItem>
                  <SelectItem value="priority" className="text-sm">Priority (4-8h)</SelectItem>
                  <SelectItem value="emergency" className="text-sm">Emergency (&lt;2h)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-700 text-xs font-medium">Details</Label>
            <Textarea value={formData.details} onChange={(e) => handleChange("details", e.target.value)} required className="min-h-[80px] text-sm border-slate-200 resize-none" data-testid="textarea-dispatch-details" />
          </div>
          <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium" disabled={loading} data-testid="button-dispatch-submit">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ServiceAvailability({ available }: { available: boolean }) {
  return available ? (
    <Check className="h-3.5 w-3.5 text-emerald-600" />
  ) : (
    <X className="h-3.5 w-3.5 text-slate-300" />
  );
}

export default function HomePage() {
  const [showContact, setShowContact] = useState(false);

  return (
    <div className="min-h-dvh bg-slate-50" data-testid="page-home">
      <ContactModal open={showContact} onOpenChange={setShowContact} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <span className="text-lg font-bold text-slate-900 tracking-tight">911-DC</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#services" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">Services</a>
              <a href="#locations" className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">Locations</a>
              <Link href="/portal/login">
                <span className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors">Portal</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/login">
              <Button variant="ghost" size="sm" className="text-xs text-slate-600 h-8">Admin</Button>
            </Link>
            <Button size="sm" onClick={() => setShowContact(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-medium px-4" data-testid="button-request-service">
              Request Service
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <motion.div variants={fadeIn} initial="hidden" animate="show" className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">South Florida Coverage</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
              Datacenter Operations<br />
              <span className="text-blue-400">You Can Rely On</span>
            </h1>
            
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-lg">
              911-DC provides SmartHands services, colocation, connectivity, and infrastructure solutions across major South Florida datacenters. Professional support when uptime matters most.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button onClick={() => setShowContact(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 text-sm font-medium">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <a href="#services">
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-10 px-6 text-sm font-medium">
                  View Services
                </Button>
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-8 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <HardHat className="h-4 w-4 text-blue-400" />
                </div>
                <span>24/7 Response</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                <span>8+ Facilities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-400" />
                </div>
                <span>Enterprise Grade</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">What We Offer</span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">Our Services</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Comprehensive datacenter and infrastructure solutions for enterprise operations.
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-3 gap-4">
            {services.map((svc, i) => (
              <motion.div key={i} variants={fadeIn}>
                <Card className="p-5 border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all h-full">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                    <svc.icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{svc.title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{svc.desc}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Locations */}
      <section id="locations" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-12">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest">Coverage</span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">Datacenter Locations</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              Service availability varies by facility. Our main hub offers full infrastructure services.
            </p>
          </motion.div>

          {/* Main Hub */}
          <motion.div variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-8">
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">iM Critical Miami</h3>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white uppercase">Main Hub</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">100 NE 2nd St, Miami, FL 33138</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                        <HardHat className="h-3 w-3 text-blue-600" /> SmartHands
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                        <Server className="h-3 w-3 text-blue-600" /> Colocation
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                        <Globe className="h-3 w-3 text-blue-600" /> DIA Internet
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-700">
                        <Shield className="h-3 w-3 text-blue-600" /> DDoS Protection
                      </span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => setShowContact(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-5 text-xs font-medium shrink-0">
                  Request Service
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Location Grid */}
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {locations.filter((loc) => !loc.isHub).map((loc, i) => (
              <motion.div key={i} variants={fadeIn}>
                <Card className="p-4 border-slate-100 bg-white h-full">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-slate-900 leading-tight">{loc.name}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{loc.address}</p>
                    </div>
                  </div>
                  <Separator className="my-3 bg-slate-100" />
                  {loc.smartHandsOnly ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-slate-700 font-medium">SmartHands</span>
                      </div>
                      <p className="text-[9px] text-slate-400">No Colocation · No DIA Internet</p>
                    </div>
                  ) : loc.services.darkFiber ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-slate-700 font-medium">SmartHands</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-slate-700 font-medium">Dark Fiber Access</span>
                      </div>
                      <p className="text-[9px] text-slate-400">No Colocation · No DIA Internet</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <ServiceAvailability available={loc.services.smartHands} />
                        <span>SmartHands</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ServiceAvailability available={loc.services.colocation} />
                        <span>Colo</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ServiceAvailability available={loc.services.diaInternet} />
                        <span>DIA</span>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Not Listed */}
          <motion.div variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-8 text-center">
            <Card className="inline-flex items-center gap-3 px-5 py-3 border-dashed border-slate-200 bg-white">
              <span className="text-xs text-slate-500">Don't see your site listed?</span>
              <Button variant="link" onClick={() => setShowContact(true)} className="h-auto p-0 text-xs font-medium text-blue-600">
                Contact us about availability
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div variants={fadeIn} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <h2 className="text-xl font-bold text-white">Ready to work with us?</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              Get reliable datacenter operations support from our professional team.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button onClick={() => setShowContact(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 text-sm font-medium">
                Request Service
              </Button>
              <a href="tel:+13055550123">
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 h-10 px-6 text-sm font-medium">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Us
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 text-slate-400">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <span className="text-base font-bold text-white">911-DC</span>
              <Separator orientation="vertical" className="h-4 bg-slate-800" />
              <span className="text-xs">Datacenter Operations</span>
            </div>
            <div className="flex items-center gap-6 text-xs">
              <a href="#services" className="hover:text-white transition-colors">Services</a>
              <a href="#locations" className="hover:text-white transition-colors">Locations</a>
              <Link href="/portal/login"><span className="hover:text-white transition-colors">Portal</span></Link>
              <Link href="/admin/login"><span className="hover:text-white transition-colors">Admin</span></Link>
            </div>
          </div>
          <Separator className="my-8 bg-slate-800" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500">
            <span>© 2026 911-DC. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
