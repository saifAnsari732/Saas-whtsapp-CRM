"use client";

import { useState } from "react";
import { MessageSquare, Phone, Mail, MapPin, Clock, Send, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "WhatsApp Business API",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setSuccessMsg(data.message || "Thank you! We will get back to you shortly.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "WhatsApp Business API",
        message: "",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-white via-emerald-50/20 to-white relative overflow-hidden">
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#00A884]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-[#00A884] text-xs font-bold uppercase tracking-wider mb-4 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Get In Touch</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight mb-4">
            Let&apos;s Build Your <span className="text-[#00A884]">WhatsApp API</span> & Growth Solutions
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium">
            Have questions about WhatsApp Business API, AI Chatbots, Custom CRM, or Mobile App development? Our expert team is ready to help 24/7.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Contact Cards & Direct WhatsApp CTA */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick WhatsApp Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#00A884] to-[#007A55] text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md shrink-0">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-heading">Need Instant Support?</h3>
                  <p className="text-xs sm:text-sm text-emerald-50 mt-1 font-medium">
                    Chat directly with our tech team on WhatsApp. Response time: &lt; 5 minutes.
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/919511450914?text=Hi%20ChatFlyr%20Team%2C%20I%20am%20interested%20in%20WhatsApp%20API%20solutions."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-3 px-5 rounded-2xl bg-white text-[#00A884] font-bold text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Chat on WhatsApp (+91 9511450914)</span>
              </a>
            </div>

            {/* Contact Details List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {/* Card 1: Phone */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-[#00A884] shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Support</h4>
                  <a href="tel:+919511450914" className="text-sm font-bold text-slate-900 hover:text-[#00A884] transition-colors block mt-0.5">
                    +91 9511450914
                  </a>
                  <span className="text-xs text-slate-500 block mt-0.5">Mon - Sat (9:00 AM - 6:00 PM IST)</span>
                </div>
              </div>

              {/* Card 2: Email */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-[#00A884] shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</h4>
                  <a href="mailto:support@chatflyr.kisandigital.org" className="text-sm font-bold text-slate-900 hover:text-[#00A884] transition-colors block mt-0.5">
                    support@chatflyr.kisandigital.org
                  </a>
                  <span className="text-xs text-slate-500 block mt-0.5">Guaranteed reply within 2 hours</span>
                </div>
              </div>

              {/* Card 3: Office Location */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-[#00A884] shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Corporate HQ</h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    Alambagh, In front of Apollo Hospital, Lucknow, UP
                  </p>
                  <span className="text-xs text-slate-500 block mt-0.5 font-medium">Official Head Office</span>
                </div>
              </div>

              {/* Card 4: Operating Hours */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-[#00A884] shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">System Availability</h4>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    99.9% Uptime Guarantee
                  </p>
                  <span className="text-xs text-emerald-600 font-semibold block mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                    All Systems Operational
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xl relative">
              <h3 className="text-2xl font-bold text-slate-900 font-heading mb-2">
                Send Us a Message
              </h3>
              <p className="text-sm font-medium text-slate-500 mb-8">
                Fill out the form below and our WhatsApp solutions specialist will connect with you.
              </p>

              {successMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#00A884] shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20 outline-none transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Phone / WhatsApp */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20 outline-none transition-all"
                    />
                  </div>

                  {/* Service Selection */}
                  <div className="space-y-1.5">
                    <label htmlFor="contact-service" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Interested Solution
                    </label>
                    <select
                      id="contact-service"
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-900 focus:bg-white focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20 outline-none transition-all cursor-pointer"
                    >
                      <option value="WhatsApp Business API">WhatsApp Business API</option>
                      <option value="AI Chatbot & Automation">AI Chatbot & Automation</option>
                      <option value="Custom WhatsApp CRM">Custom WhatsApp CRM</option>
                      <option value="Website Development">Website Development</option>
                      <option value="Mobile App Development">Mobile App Development</option>
                      <option value="Digital Marketing & Meta Ads">Digital Marketing & Meta Ads</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Your Requirement / Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="Tell us about your business goals, expected WhatsApp message volume, or custom tech needs..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#00A884] focus:ring-2 focus:ring-[#00A884]/20 outline-none transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-13 rounded-2xl bg-[#00A884] hover:bg-[#008f70] text-white font-bold text-sm transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.99]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Sending Inquiry...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 font-medium pt-2">
                  🔒 We respect your privacy. No spam. Your contact details are 100% secure.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
