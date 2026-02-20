import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Zap, TrendingUp, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Partnerships() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.target);
    
    try {
      await base44.entities.FestivalPartnership.create({
        company_name: formData.get('company'),
        contact_name: formData.get('name'),
        contact_email: formData.get('email'),
        contact_phone: formData.get('phone'),
        event_type: formData.get('event_type'),
        expected_attendees: parseInt(formData.get('attendees')),
        event_dates: formData.get('dates'),
        budget_range: formData.get('budget'),
        requirements: formData.get('requirements'),
        status: 'inquiry'
      });

      toast.success('Inquiry submitted! Our team will contact you within 24 hours.');
      e.target.reset();
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    { icon: Building2, title: 'White-Label Platform', desc: 'Fully branded experience for your event' },
    { icon: Users, title: 'Unlimited Team Access', desc: 'Collaborate with your entire production team' },
    { icon: Zap, title: 'Priority Support', desc: '24/7 dedicated support during your event' },
    { icon: TrendingUp, title: 'Custom Features', desc: 'Tailored solutions for your specific needs' }
  ];

  return (
    <div className="min-h-screen bg-[#050510]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Enterprise VFX Solutions for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5a623] to-[#e91e8c]">Festivals & Venues</span>
          </h1>
          <p className="text-white/80 text-xl mb-8">
            Power your events with professional-grade visual effects. Trusted by leading festivals worldwide.
          </p>
          <div className="flex items-center justify-center gap-4 text-white/70">
            <CheckCircle className="w-5 h-5 text-[#f5a623]" />
            <span>Custom Branding</span>
            <CheckCircle className="w-5 h-5 text-[#f5a623]" />
            <span>Unlimited Users</span>
            <CheckCircle className="w-5 h-5 text-[#f5a623]" />
            <span>Priority Support</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-white/10 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f5a623]/20 to-[#e91e8c]/20 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-[#f5a623]" />
              </div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/5 border-white/10 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Starter</h3>
            <div className="text-4xl font-bold text-white mb-6">$499<span className="text-lg text-white/60">/month</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Up to 5 team members
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Basic branding
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Email support
              </li>
            </ul>
          </Card>

          <Card className="bg-gradient-to-br from-[#f5a623]/10 to-[#e91e8c]/10 border-[#f5a623]/30 p-8 scale-105">
            <div className="text-center mb-4">
              <span className="bg-[#f5a623] text-white px-3 py-1 rounded-full text-sm">Most Popular</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Professional</h3>
            <div className="text-4xl font-bold text-white mb-6">$999<span className="text-lg text-white/60">/month</span></div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Up to 20 team members
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Full white-label
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Priority support
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Custom domain
              </li>
            </ul>
          </Card>

          <Card className="bg-white/5 border-white/10 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Enterprise</h3>
            <div className="text-4xl font-bold text-white mb-6">Custom</div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Unlimited team members
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                Dedicated infrastructure
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                24/7 phone support
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <CheckCircle className="w-5 h-5 text-[#f5a623]" />
                SLA guarantee
              </li>
            </ul>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="bg-white/5 border-white/10 p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Get Started Today</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white/70">Company Name *</Label>
                <Input name="company" required className="mt-2 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70">Contact Name *</Label>
                <Input name="name" required className="mt-2 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70">Email *</Label>
                <Input name="email" type="email" required className="mt-2 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70">Phone</Label>
                <Input name="phone" type="tel" className="mt-2 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70">Event Type *</Label>
                <Select name="event_type" required>
                  <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0a3e] border-white/10">
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="production_company">Production Company</SelectItem>
                    <SelectItem value="corporate_event">Corporate Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70">Expected Attendees</Label>
                <Input name="attendees" type="number" className="mt-2 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70">Event Dates</Label>
                <Input name="dates" placeholder="e.g., July 15-17, 2026" className="mt-2 bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-white/70">Budget Range *</Label>
                <Select name="budget" required>
                  <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a0a3e] border-white/10">
                    <SelectItem value="under_2k">Under $2,000</SelectItem>
                    <SelectItem value="2k_5k">$2,000 - $5,000</SelectItem>
                    <SelectItem value="5k_10k">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10k_plus">$10,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/70">Requirements / Questions</Label>
              <Textarea name="requirements" rows={4} className="mt-2 bg-white/5 border-white/10 text-white" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c]">
              {submitting ? 'Submitting...' : 'Request Partnership Consultation'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}