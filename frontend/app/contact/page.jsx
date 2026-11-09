'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Arrow from '../../components/ui/Arrow';
import PageHero from '../../components/ui/PageHero';
import Captcha from '../../components/Captcha';
import { submitContact, submitInstitutionalEnquiry } from '../../lib/api';

const INTEREST_OPTIONS = [
  "Individual Mentoring", "Small-Group Conversations", 
  "Student Leadership", "Career/Higher-Ed Exposure", 
  "Parent Engagement", "School-to-Life Transition", 
  "Professional Exposure", "Student Development Insights"
];

export default function Contact() {
  const [activeTab, setActiveTab] = useState('general');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const generalCaptchaRef = useRef(null);
  const instCaptchaRef = useRef(null);

  // General Form State
  const [generalForm, setGeneralForm] = useState({
    name: '', email: '', phone: '', subject: '', message: ''
  });

  // Institutional Form State
  const [instForm, setInstForm] = useState({
    institutionName: '', institutionType: 'School', contactPerson: '',
    designation: '', email: '', phone: '', city: '', state: '',
    studentStrength: '', enquiryNature: '', interestedIn: []
  });

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      setStatus({ type: 'error', message: 'Please complete the "I am not a robot" verification before sending.' });
      return;
    }
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await submitContact({ ...generalForm, captchaToken });
      setStatus({ type: 'success', message: 'Thank you. Your message has been received. We will get back to you shortly.' });
      setGeneralForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setCaptchaToken('');
      generalCaptchaRef.current?.reset();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Failed to send message. Please contact us directly via WhatsApp or phone.' });
      generalCaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleInstitutionalSubmit = async (e) => {
    e.preventDefault();
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      setStatus({ type: 'error', message: 'Please complete the "I am not a robot" verification before submitting.' });
      return;
    }
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await submitInstitutionalEnquiry({ ...instForm, captchaToken });
      setStatus({ type: 'success', message: 'Institutional enquiry submitted successfully. Mr. Deepak Sogani will reach out for a discovery conversation.' });
      setInstForm({
        institutionName: '', institutionType: 'School', contactPerson: '',
        designation: '', email: '', phone: '', city: '', state: '',
        studentStrength: '', enquiryNature: '', interestedIn: []
      });
      setCaptchaToken('');
      instCaptchaRef.current?.reset();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'Failed to submit enquiry. Please email or message us directly.' });
      instCaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (item) => {
    const slug = item.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setInstForm(prev => {
      const exists = prev.interestedIn.includes(slug);
      return {
        ...prev,
        interestedIn: exists ? prev.interestedIn.filter(s => s !== slug) : [...prev.interestedIn, slug]
      };
    });
  };

  return (
    <div className="w-full">
      <PageHero
        breadcrumbs={[{ name: 'Contact', href: '/contact' }]}
        meta={['Get in Touch', 'Direct Channels', 'Jaipur, India']}
        title="Direct, human perspective."
        lede="Whether you are a student exploring next steps, a parent looking to support your child, or an institution evaluating our student development layer, we are here to talk."
      />

      {/* S2: Contact Channels (Hairline Grid) */}
      <section className="page-x py-8 sm:py-12 md:py-20">
        <div className="hairline-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-6 sm:p-8 flex flex-col justify-between min-h-[12rem] sm:min-h-[14rem]">
            <span className="meta">Email</span>
            <div>
              <a href="mailto:unfoldinn26@gmail.com" className="font-serif text-[1.125rem] sm:text-[1.25rem] text-ink hover:text-signal transition-colors block leading-snug break-all py-1">
                unfoldinn26@gmail.com
              </a>
              <Link href="/support" className="text-xs text-coral mt-2 block hover:underline font-mono py-0.5">
                Website Issues &amp; Support →
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between min-h-[12rem] sm:min-h-[14rem]">
            <span className="meta">WhatsApp</span>
            <div>
              <a href="https://wa.me/917737220724" target="_blank" rel="noopener noreferrer" className="font-serif text-[1.125rem] sm:text-[1.25rem] text-ink hover:text-signal transition-colors block py-1">
                +91 77372 20724 ↗
              </a>
              <p className="text-xs text-muted mt-2">Direct messaging</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between min-h-[12rem] sm:min-h-[14rem]">
            <span className="meta">Phone</span>
            <div>
              <a href="tel:+917737220724" className="font-serif text-[1.125rem] sm:text-[1.25rem] text-ink hover:text-signal transition-colors block font-mono text-base py-1">
                +91 77372 20724
              </a>
              <p className="text-xs text-muted mt-2">Mon–Sat, 10 AM – 6 PM IST</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between min-h-[12rem] sm:min-h-[14rem]">
            <span className="meta">LinkedIn</span>
            <div>
              <a href="https://www.linkedin.com/in/deepak-sogani/" target="_blank" rel="noopener noreferrer" className="font-serif text-[1.125rem] sm:text-[1.25rem] text-ink hover:text-signal transition-colors block py-1">
                Deepak Sogani ↗
              </a>
              <p className="text-xs text-muted mt-2">Professional reflections &amp; alumni voices</p>
            </div>
          </div>
        </div>
      </section>

      {/* S3: Form Area */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-14 sm:py-20 md:py-32 max-w-4xl">
          {/* Tab Switcher */}
          <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
            <button
              type="button"
              onClick={() => { setActiveTab('general'); setCaptchaToken(''); generalCaptchaRef.current?.reset(); }}
              className={`rounded-full px-5 py-2.5 min-h-[44px] text-xs font-mono uppercase tracking-wider transition-colors duration-300 inline-flex items-center justify-center ${
                activeTab === 'general'
                  ? 'bg-ink text-paper'
                  : 'border border-line bg-paper text-ink hover:border-ink'
              }`}
            >
              General Message
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('institutional'); setCaptchaToken(''); instCaptchaRef.current?.reset(); }}
              className={`rounded-full px-5 py-2.5 min-h-[44px] text-xs font-mono uppercase tracking-wider transition-colors duration-300 inline-flex items-center justify-center ${
                activeTab === 'institutional'
                  ? 'bg-ink text-paper'
                  : 'border border-line bg-paper text-ink hover:border-ink'
              }`}
            >
              Institutional Partnership
            </button>
          </div>

          {/* Form Card */}
          <div className="rounded-[1.5rem] sm:rounded-[1.75rem] border border-line bg-paper p-5 sm:p-8 md:p-14">
            {status.message && (
              <div className={`mb-6 sm:mb-8 p-4 rounded-xl text-sm ${
                status.type === 'success' 
                  ? 'bg-paper-2 border border-line text-ink' 
                  : 'bg-signal-soft border border-signal/30 text-signal'
              }`}>
                {status.message}
              </div>
            )}

            {/* General Form */}
            {activeTab === 'general' && (
              <form onSubmit={handleGeneralSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="field-label">Name <span className="text-signal">*</span></label>
                    <input 
                      type="text" 
                      required 
                      value={generalForm.name}
                      onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                      placeholder="Your full name"
                      className="field" 
                    />
                  </div>
                  <div>
                    <label className="field-label">Email <span className="text-signal">*</span></label>
                    <input 
                      type="email" 
                      required 
                      value={generalForm.email}
                      onChange={(e) => setGeneralForm({ ...generalForm, email: e.target.value })}
                      placeholder="name@example.com"
                      className="field" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="field-label">Phone <span className="text-muted font-normal">(Optional)</span></label>
                    <input 
                      type="tel" 
                      value={generalForm.phone}
                      onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="field" 
                    />
                  </div>
                  <div>
                    <label className="field-label">Subject</label>
                    <input 
                      type="text" 
                      value={generalForm.subject}
                      onChange={(e) => setGeneralForm({ ...generalForm, subject: e.target.value })}
                      placeholder="e.g. Conversation inquiry"
                      className="field" 
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Message <span className="text-signal">*</span></label>
                  <textarea 
                    rows="4" 
                    required 
                    value={generalForm.message}
                    onChange={(e) => setGeneralForm({ ...generalForm, message: e.target.value })}
                    placeholder="How can we help you?"
                    className="field resize-none"
                  />
                </div>

                <Captcha
                  ref={generalCaptchaRef}
                  onVerify={setCaptchaToken}
                  onExpired={() => setCaptchaToken('')}
                />

                <div className="pt-2">
                  <button type="submit" disabled={loading} className="btn-editorial w-full sm:w-auto">
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}

            {/* Institutional Form */}
            {activeTab === 'institutional' && (
              <form onSubmit={handleInstitutionalSubmit} className="space-y-5 sm:space-y-6">
                <div className="mb-6 sm:mb-8 border-b border-line pb-5 sm:pb-6">
                  <h2 className="font-serif text-[1.5rem] sm:text-[1.75rem] text-ink mb-2">Institutional Partnership Enquiry</h2>
                  <p className="text-xs sm:text-sm text-muted">For schools, colleges and universities interested in our 90-day pilot framework.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="field-label">Institution Name <span className="text-signal">*</span></label>
                    <input 
                      type="text" 
                      required 
                      value={instForm.institutionName}
                      onChange={(e) => setInstForm({ ...instForm, institutionName: e.target.value })}
                      placeholder="e.g. DPS International / Modern College"
                      className="field" 
                    />
                  </div>
                  <div>
                    <label className="field-label">Institution Type</label>
                    <select 
                      value={instForm.institutionType}
                      onChange={(e) => setInstForm({ ...instForm, institutionType: e.target.value })}
                      className="field bg-paper"
                    >
                      <option value="school">School (Senior Secondary)</option>
                      <option value="college">Undergraduate College</option>
                      <option value="university">University</option>
                      <option value="other">Other Educational Organization</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="field-label">Contact Person <span className="text-signal">*</span></label>
                    <input 
                      type="text" 
                      required 
                      value={instForm.contactPerson}
                      onChange={(e) => setInstForm({ ...instForm, contactPerson: e.target.value })}
                      placeholder="Name of Principal, Dean, or Coordinator"
                      className="field" 
                    />
                  </div>
                  <div>
                    <label className="field-label">Designation</label>
                    <input 
                      type="text" 
                      value={instForm.designation}
                      onChange={(e) => setInstForm({ ...instForm, designation: e.target.value })}
                      placeholder="e.g. Dean of Student Welfare / Principal"
                      className="field" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="field-label">Email <span className="text-signal">*</span></label>
                    <input 
                      type="email" 
                      required 
                      value={instForm.email}
                      onChange={(e) => setInstForm({ ...instForm, email: e.target.value })}
                      placeholder="official.email@institution.edu"
                      className="field" 
                    />
                  </div>
                  <div>
                    <label className="field-label">Phone <span className="text-signal">*</span></label>
                    <input 
                      type="tel" 
                      required 
                      value={instForm.phone}
                      onChange={(e) => setInstForm({ ...instForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="field" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                  <div>
                    <label className="field-label">City, State</label>
                    <input 
                      type="text" 
                      value={instForm.city}
                      onChange={(e) => setInstForm({ ...instForm, city: e.target.value })}
                      placeholder="e.g. Jaipur, Rajasthan"
                      className="field" 
                    />
                  </div>
                  <div>
                    <label className="field-label">Approximate Student Strength</label>
                    <input 
                      type="text" 
                      value={instForm.studentStrength}
                      onChange={(e) => setInstForm({ ...instForm, studentStrength: e.target.value })}
                      placeholder="e.g. 500+ senior students"
                      className="field" 
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label mb-3">Interested In (Select all that apply)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {INTEREST_OPTIONS.map((item, i) => (
                      <label key={i} className="flex items-center gap-3 text-xs md:text-sm text-ink-2 bg-paper-2 p-3 rounded-xl border border-line cursor-pointer hover:border-ink">
                        <input 
                          type="checkbox" 
                          onChange={() => toggleInterest(item)}
                          className="accent-[#5B4632] h-4 w-4" 
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label">Nature of Enquiry <span className="text-signal">*</span></label>
                  <textarea 
                    rows="4" 
                    required 
                    value={instForm.enquiryNature}
                    onChange={(e) => setInstForm({ ...instForm, enquiryNature: e.target.value })}
                    placeholder="Briefly describe what your institution is looking to achieve for your students."
                    className="field resize-none"
                  />
                </div>

                <Captcha
                  ref={instCaptchaRef}
                  onVerify={setCaptchaToken}
                  onExpired={() => setCaptchaToken('')}
                />

                <div className="pt-2">
                  <button type="submit" disabled={loading} className="btn-editorial w-full sm:w-auto">
                    {loading ? 'Submitting...' : 'Submit Institutional Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-12 sm:mt-16 text-center">
            <span className="meta">Jaipur, Rajasthan, India</span>
          </div>
        </div>
      </section>
    </div>
  );
}
