'use client';

import { useEffect, useState } from 'react';
import {
  getBookings,
  updateBooking,
  createBooking,
  generateBookingMeetLink,
  getBookingContinuityBrief,
  generateBookingSessionSummary,
  updateBookingSessionSummary
} from '../../../lib/adminApi';
import DataTable from '../../../components/admin/DataTable';
import StatusBadge from '../../../components/admin/StatusBadge';
import Modal from '../../../components/admin/Modal';
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  MessageCircle, 
  PhoneCall, 
  Mail, 
  MapPin, 
  User, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  Video,
  
  ExternalLink,
  Copy,
  FileText
} from 'lucide-react';

const LIFECYCLE_STEPS = [
  { id: 'intake', label: '1. Intake' },
  { id: 'conversation', label: '2. Conversation' },
  { id: 'action', label: '3. Agreed Next Step' },
  { id: 'followup', label: '4. 7-Day Follow-Up' },
  { id: 'outcome', label: '5. Outcome' }
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Manual booking creation state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    phone: '',
    email: '',
    userType: 'student',
    topic: '',
    preferredDate: '',
    preferredTime: '',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentAmount: 50,
    paymentMode: 'DIRECT_UPI',
    notes: ''
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    status: '', 
    preferredDate: '',
    preferredTime: '',
    notes: '', 
    sharedNotes: '',
    followUpDate: '', 
    actionAgreed: '', 
    actionStatus: '', 
    feedback: '',
    paymentStatus: 'pending',
    paymentAmount: 0,
    paymentMode: 'DIRECT_UPI'
  });

  // Google Meet & Continuity & Summary state inside Booking Modal
  const [generatingMeet, setGeneratingMeet] = useState(false);
  const [meetMessage, setMeetMessage] = useState(null);
  const [continuityData, setContinuityData] = useState(null);
  const [loadingContinuity, setLoadingContinuity] = useState(false);
  const [summarySourceType, setSummarySourceType] = useState('mentor_notes');
  const [summaryRawInput, setSummaryRawInput] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryNotice, setSummaryNotice] = useState('');
  const [summaryDraft, setSummaryDraft] = useState({
    studentGoalsAndConcerns: '',
    keyTopicsAndPerspectives: '',
    importantObservationsFacts: '',
    importantObservationsInterpretations: '',
    agreedStudentActions: '',
    progressFromPreviousSession: '',
    unresolvedQuestionsToRevisit: '',
    suggestedOpeningQuestionsNextSession: '',
    privateMentorPrepBrief: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const populateSummaryDraft = (sum) => {
    if (!sum) {
      setSummaryDraft({
        studentGoalsAndConcerns: '',
        keyTopicsAndPerspectives: '',
        importantObservationsFacts: '',
        importantObservationsInterpretations: '',
        agreedStudentActions: '',
        progressFromPreviousSession: '',
        unresolvedQuestionsToRevisit: '',
        suggestedOpeningQuestionsNextSession: '',
        privateMentorPrepBrief: ''
      });
      return;
    }
    setSummaryDraft({
      studentGoalsAndConcerns: sum.goalsAndConcernsDiscussed || sum.studentGoalsAndConcerns || '',
      keyTopicsAndPerspectives: sum.keyTopicsAndPerspectives || '',
      importantObservationsFacts:
        sum.importantObservations?.factualStatements || sum.importantObservationsFacts || '',
      importantObservationsInterpretations:
        sum.importantObservations?.mentorInterpretations ||
        sum.importantObservationsInterpretations ||
        '',
      agreedStudentActions: sum.agreedActions || sum.agreedStudentActions || '',
      progressFromPreviousSession: sum.progressFromPreviousSession || '',
      unresolvedQuestionsToRevisit: sum.unresolvedQuestions || sum.unresolvedQuestionsToRevisit || '',
      suggestedOpeningQuestionsNextSession: Array.isArray(sum.suggestedOpeningQuestions)
        ? sum.suggestedOpeningQuestions.join('\n')
        : sum.suggestedOpeningQuestionsNextSession || '',
      privateMentorPrepBrief: sum.privateMentorPrepBrief || ''
    });
  };

  const loadContinuityAndSummary = async (bookingId) => {
    setLoadingContinuity(true);
    setSummaryNotice('');
    try {
      const res = await getBookingContinuityBrief(bookingId);
      if (res?.data) {
        setContinuityData(res.data);
        populateSummaryDraft(res.data.currentSummary);
      }
    } catch (err) {
      console.error('Failed to load continuity brief:', err);
    } finally {
      setLoadingContinuity(false);
    }
  };

  const handleRowClick = (row) => {
    setSelectedBooking(row);
    setMeetMessage(null);
    setSummaryRawInput('');
    setSummarySourceType('mentor_notes');
    setEditForm({
      status: row.status || 'pending',
      preferredDate: row.preferredDate ? new Date(row.preferredDate).toISOString().split('T')[0] : '',
      preferredTime: row.preferredTime || '',
      notes: row.notes || '',
      sharedNotes: row.sharedNotes || '',
      followUpDate: row.followUpDate ? new Date(row.followUpDate).toISOString().split('T')[0] : '',
      actionAgreed: row.actionAgreed || '',
      actionStatus: row.actionStatus || 'pending',
      feedback: row.feedback || '',
      paymentStatus: row.paymentStatus || 'pending',
      paymentAmount: row.paymentAmount || 0,
      paymentMode: row.paymentMode || 'DIRECT_UPI'
    });
    loadContinuityAndSummary(row._id);
  };

  const handleGenerateMeetLink = async () => {
    if (!selectedBooking) return;
    setGeneratingMeet(true);
    setMeetMessage(null);
    try {
      const res = await generateBookingMeetLink(selectedBooking._id);
      if (res?.data) {
        setSelectedBooking((prev) => ({
          ...prev,
          ...res.data
        }));
      }
      setMeetMessage({
        type: 'success',
        text: res.message || 'Google Meet link generated and saved!'
      });
      fetchData();
    } catch (err) {
      setMeetMessage({
        type: 'error',
        text: err.message || 'Could not generate Google Meet link. Verify Google Calendar is connected on Dashboard.'
      });
    } finally {
      setGeneratingMeet(false);
    }
  };

  const handleGenerateStructuredSummary = async () => {
    if (!selectedBooking) return;
    setGeneratingSummary(true);
    setSummaryNotice('');
    try {
      const payload = {
        forceRegenerate: true,
        mentorNotesText: editForm.notes || selectedBooking.notes || ''
      };
      if (summarySourceType === 'google_meet_notes' && summaryRawInput.trim()) {
        payload.googleMeetNotesText = summaryRawInput.trim();
      } else if (summarySourceType === 'google_meet_transcript' && summaryRawInput.trim()) {
        payload.googleMeetTranscriptText = summaryRawInput.trim();
      }
      const res = await generateBookingSessionSummary(selectedBooking._id, payload);
      if (res?.data) {
        populateSummaryDraft(res.data);
        setContinuityData((prev) => (prev ? { ...prev, currentSummary: res.data } : prev));
        setSummaryNotice('✓ 9-Part Structured Summary generated! Review and click "Approve Summary" below.');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate structured summary');
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleSaveAndApproveSummary = async (approve = true) => {
    if (!selectedBooking) return;
    setSavingSummary(true);
    setSummaryNotice('');
    try {
      const res = await updateBookingSessionSummary(selectedBooking._id, {
        ...summaryDraft,
        approve
      });
      if (res?.data) {
        populateSummaryDraft(res.data);
        setContinuityData((prev) => (prev ? { ...prev, currentSummary: res.data } : prev));
        setSummaryNotice(approve ? '✓ Summary approved and saved for session continuity!' : '✓ Draft summary saved.');
      }
    } catch (err) {
      alert(err.message || 'Failed to save summary');
    } finally {
      setSavingSummary(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateBooking(selectedBooking._id, editForm);
      setSelectedBooking(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update booking');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenManualModal = () => {
    setManualForm({
      name: '',
      phone: '',
      email: '',
      userType: 'student',
      topic: '',
      preferredDate: '',
      preferredTime: '',
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentAmount: 50,
      paymentMode: 'DIRECT_UPI',
      notes: ''
    });
    setIsManualModalOpen(true);
  };

  const handleCreateManualBooking = async (e) => {
    e?.preventDefault();
    if (!manualForm.name.trim() || !manualForm.phone.trim()) {
      alert('Please enter name and mobile number.');
      return;
    }

    setSavingManual(true);
    try {
      const payload = {
        name: manualForm.name.trim(),
        phone: manualForm.phone.trim(),
        email: manualForm.email ? manualForm.email.trim() : undefined,
        userType: manualForm.userType,
        topic: manualForm.topic,
        preferredDate: manualForm.preferredDate || undefined,
        preferredTime: manualForm.preferredTime || undefined,
        status: manualForm.status,
        paymentStatus: manualForm.paymentStatus,
        paymentAmount: manualForm.paymentStatus === 'not_required' ? 0 : Number(manualForm.paymentAmount || 0),
        paymentMode: manualForm.paymentMode,
        paymentTime: manualForm.paymentStatus === 'paid' ? new Date() : null,
        paymentRequired: manualForm.paymentStatus !== 'not_required',
        notes: manualForm.notes || 'Added manually via Admin Portal',
        source: 'Admin Portal (Manual Session Entry)'
      };

      await createBooking(payload);
      setIsManualModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create booking');
    } finally {
      setSavingManual(false);
    }
  };

  // Determine current active lifecycle stage (0-4)
  const getActiveStageIndex = () => {
    if (editForm.feedback || editForm.actionStatus === 'done' || editForm.actionStatus === 'completed') return 4;
    if (editForm.followUpDate) return 3;
    if (editForm.actionAgreed) return 2;
    if (editForm.status === 'confirmed' || editForm.status === 'completed') return 1;
    return 0; // Intake
  };

  const filteredBookings = filter === 'All' 
    ? bookings 
    : bookings.filter(b => b.status?.toLowerCase() === filter.toLowerCase());

  const columns = [
    { 
      key: 'name', 
      label: 'Name, Ref & Session #',
      render: (val, row) => {
        const bookingRef = row._id ? `#${String(row._id).slice(-6).toUpperCase()}` : '';
        return (
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-gray-900">{val}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                Session #{row.sessionNumber || 1}
              </span>
              {bookingRef && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono font-semibold">
                  Ref: {bookingRef}
                </span>
              )}
              {row.participantTotalSessions > 1 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                  {row.participantTotalSessions} Sessions
                </span>
              )}
            </div>
            {row.isUnder18 ? (
              <span className="inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">Under 18</span>
            ) : (
              <span className="text-[11px] text-gray-500">
                {row.age ? `${row.age} yrs` : ''}
                {row.bookingMode === 'subscription_credit' ? ' • Subscription Credit' : ''}
              </span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'phone', 
      label: 'Phone / WhatsApp',
      render: (val) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-gray-900 font-medium">{val}</span>
          {val && (
            <a 
              href={`https://wa.me/${val.replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-emerald-600 hover:text-emerald-700 p-0.5"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )
    },
    { 
      key: 'whereCurrently', 
      label: 'Where Currently', 
      render: (val, row) => (
        <span className="text-gray-700 text-xs">
          {val || row.currentStage || 'N/A'}
        </span>
      ) 
    },
    { key: 'city', label: 'City', render: (val) => <span className="text-xs text-gray-600">{val || 'N/A'}</span> },
    { 
      key: 'topic', 
      label: 'Topic / What’s on Mind', 
      render: (val, row) => (
        <span className="truncate max-w-[180px] block text-xs text-gray-700" title={val || row.concern}>
          {val || row.concern || 'N/A'}
        </span>
      ) 
    },
    { 
      key: 'status', 
      label: 'Status & Meet', 
      render: (val, row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={val} />
          {row.meetingLink && row.meetingLink.startsWith('https://meet.google.com/') && (
            <a
              href={row.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold hover:bg-emerald-100"
            >
              <Video className="w-3 h-3" />
              <span>Google Meet Ready</span>
            </a>
          )}
        </div>
      )
    },
    { key: 'createdAt', label: 'Submitted Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  const activeStage = selectedBooking ? getActiveStageIndex() : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap
                ${filter === f ? 'bg-[#2E4052] text-white shadow-sm' : 'bg-gray-100 text-[#2E4052] hover:bg-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenManualModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          + Add Manual Booking
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredBookings} 
        isLoading={loading}
        onRowClick={handleRowClick}
        searchPlaceholder="Search by name, phone, city or topic..."
        searchKey="name"
      />

      {/* Edit Booking Modal - Full 11 Intake Questions + 5-Step Lifecycle */}
      <Modal 
        isOpen={!!selectedBooking} 
        onClose={() => setSelectedBooking(null)} 
        title="Participant Record & Conversation Journey"
        actions={
          <>
            <button 
              onClick={() => setSelectedBooking(null)} 
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
            >
              Close
            </button>
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="px-5 py-2 bg-[#FFC857] hover:bg-[#ffbe3b] text-[#2E4052] font-bold rounded-lg transition-all shadow-sm text-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* 5-Step Progress Lifecycle Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-3">
                Participant Journey Progress
              </span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const isCurrent = idx === activeStage;
                  const isPassed = idx < activeStage;
                  return (
                    <div key={step.id} className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                        isPassed ? 'bg-emerald-600 text-white' :
                        isCurrent ? 'bg-[#2E4052] text-white ring-2 ring-amber-400' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isPassed ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[11px] leading-tight font-medium ${
                        isCurrent ? 'text-gray-900 font-bold' :
                        isPassed ? 'text-emerald-700' :
                        'text-gray-400'
                      }`}>
                        {step.label.split('. ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Submitted Intake Information (All 11 Questions from Doc 2) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-base">Intake Information</h3>
                  {selectedBooking._id && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-900 text-white font-mono font-bold">
                      Ref: #{String(selectedBooking._id).slice(-6).toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    Session #{selectedBooking.sessionNumber || 1}
                  </span>
                </div>
                <div>
                  {selectedBooking.isUnder18 ? (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Under 18 (Minor)
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 18+ (Adult Consent Confirmed)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">1. Your Name</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedBooking.name}</p>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">2. Your Age</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedBooking.age || selectedBooking.ageGroup || 'N/A'}{' '}
                    {selectedBooking.isUnder18 ? <span className="text-amber-700 text-xs">(Minor)</span> : ''}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">3. Where are you currently?</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedBooking.whereCurrently || selectedBooking.currentStage || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">4. School / College / Organisation</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedBooking.institutionOrOrg || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">5. City</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedBooking.city || 'N/A'}</p>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">8. Mobile / WhatsApp Number</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a href={`tel:${selectedBooking.phone}`} className="font-semibold text-gray-900 hover:text-blue-600 flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-gray-500" /> {selectedBooking.phone}
                    </a>
                    {selectedBooking.phone && (
                      <a 
                        href={`https://wa.me/${selectedBooking.phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">9. Email Address</span>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedBooking.email ? (
                      <a href={`mailto:${selectedBooking.email}`} className="text-blue-600 hover:underline">
                        {selectedBooking.email}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">10. How did you hear?</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedBooking.source || 'N/A'}</p>
                </div>

                <div className="md:col-span-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block">11. Referred by</span>
                  <p className="text-gray-900 mt-0.5">{selectedBooking.referredBy || 'None'}</p>
                </div>
              </div>

              {/* 6. What would you like to talk about? */}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                  6. What would you like to talk about?
                </span>
                <div className="bg-amber-50/50 border border-amber-200/70 rounded-lg p-3.5 text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedBooking.topic || selectedBooking.concern || 'Not specified'}
                </div>
              </div>

              {/* 7. What would make this conversation useful for you? */}
              {selectedBooking.usefulGoal && (
                <div>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">
                    7. What would make this conversation useful for you?
                  </span>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-800 text-sm leading-relaxed">
                    {selectedBooking.usefulGoal}
                  </div>
                </div>
              )}

              {/* Under-18 Safeguarding Details */}
              {selectedBooking.isUnder18 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-950 space-y-2">
                  <span className="font-bold block uppercase tracking-wider text-[11px] text-amber-900">
                    Parent / Guardian Safeguarding Details:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div><span className="text-amber-800">Parent Name:</span> <strong>{selectedBooking.parentName || 'N/A'}</strong></div>
                    <div>
                      <span className="text-amber-800">Parent Phone:</span>{' '}
                      <strong>{selectedBooking.parentPhone || 'N/A'}</strong>
                      {selectedBooking.parentPhone && (
                        <a 
                          href={`https://wa.me/${selectedBooking.parentPhone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ml-1 text-emerald-700 underline font-semibold"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                    <div><span className="text-amber-800">Parent Email:</span> <strong>{selectedBooking.parentEmail || 'N/A'}</strong></div>
                  </div>
                  <div>
                    <span className="text-amber-800">Parental Consent:</span>{' '}
                    <span className="font-semibold text-emerald-800">
                      {selectedBooking.parentConsentConfirmed ? '✓ Parent/Guardian consent confirmed' : 'Pending parent consent'}
                    </span>
                  </div>
                </div>
              )}

              {/* Timing Preference */}
              {(selectedBooking.preferredDate || selectedBooking.preferredTime) && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-blue-900">Preferred Slot Requested: </span>
                    {selectedBooking.preferredDate && new Date(selectedBooking.preferredDate).toLocaleDateString()}
                    {selectedBooking.preferredTime && ` • ${selectedBooking.preferredTime}`}
                    <span className="ml-1 text-blue-700">({selectedBooking.timezone || 'Asia/Kolkata'} • IST)</span>
                  </div>
                  <span className="text-blue-700 font-medium">Session #{selectedBooking.sessionNumber || 1}</span>
                </div>
              )}
            </div>

            {/* Google Calendar & Google Meet Automation Control Bar */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        Google Calendar &amp; Google Meet Conference
                      </h3>
                      {selectedBooking.meetingLink &&
                      selectedBooking.meetingLink.startsWith('https://meet.google.com/') ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                          ✓ Meet Link Active
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                          {selectedBooking.calendarEventStatus || 'Not Generated Yet'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedBooking.meetingLink &&
                      selectedBooking.meetingLink.startsWith('https://meet.google.com/')
                        ? `Unique Google Meet conference assigned (${selectedBooking.timezone || 'Asia/Kolkata'} IST).`
                        : selectedBooking.calendarLastError
                        ? `Last Calendar note: ${selectedBooking.calendarLastError}`
                        : 'Confirming this booking or clicking "Generate / Retry Meet Link" creates a Google Calendar event and unique Google Meet room.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {selectedBooking.meetingLink &&
                    selectedBooking.meetingLink.startsWith('https://meet.google.com/') && (
                      <>
                        <a
                          href={selectedBooking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Google Meet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedBooking.meetingLink);
                            setMeetMessage({ type: 'success', text: 'Meet link copied to clipboard!' });
                          }}
                          className="px-3 py-2 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                      </>
                    )}

                  <button
                    type="button"
                    disabled={generatingMeet}
                    onClick={handleGenerateMeetLink}
                    className="px-3.5 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>
                      {generatingMeet
                        ? 'Provisioning Meet...'
                        : selectedBooking.meetingLink
                        ? 'Refresh / Sync Calendar'
                        : 'Generate Google Meet Link'}
                    </span>
                  </button>
                </div>
              </div>

              {selectedBooking.meetingLink && (
                <div className="text-xs font-mono text-emerald-900 bg-white/80 px-3 py-2 rounded-lg border border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="break-all">{selectedBooking.meetingLink}</span>
                  {selectedBooking.calendarHtmlLink && (
                    <a
                      href={selectedBooking.calendarHtmlLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-sans font-semibold inline-flex items-center gap-1"
                    >
                      <span>Open Calendar Event</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {meetMessage && (
                <div
                  className={`text-xs px-3 py-2 rounded-lg font-medium ${
                    meetMessage.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {meetMessage.text}
                </div>
              )}
            </div>

            {/* Pre-Session Continuity Brief (Chronological History & Next-Session Preparation) */}
            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Pre-Session Continuity Brief &amp; Student History
                  </h3>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
                  {continuityData?.totalPreviousSessions
                    ? `${continuityData.totalPreviousSessions} Prior Session(s)`
                    : 'First Session with Student'}
                </span>
              </div>

              {loadingContinuity ? (
                <p className="text-xs text-gray-500">Loading student continuity brief...</p>
              ) : continuityData?.totalPreviousSessions > 0 ? (
                <div className="space-y-3 text-xs">
                  {continuityData.latestSummary?.privateMentorPrepBrief && (
                    <div className="p-3.5 rounded-lg bg-white border border-indigo-200 space-y-1">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-700 block">
                        Private Mentor Preparation Brief (From Last Session)
                      </span>
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {continuityData.latestSummary.privateMentorPrepBrief}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-700 block">
                        Prior Agreed 7-Day Actions &amp; Progress
                      </span>
                      {continuityData.priorCommitments?.length > 0 ? (
                        <ul className="space-y-1.5 text-gray-700">
                          {continuityData.priorCommitments.slice(0, 3).map((c, idx) => (
                            <li key={idx}>
                              <strong>Session #{c.sessionNumber}:</strong> {c.actionAgreed}{' '}
                              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-gray-100 font-semibold">
                                {c.actionStatus}
                              </span>
                              {c.studentReflection && (
                                <p className="text-[11px] text-gray-500 italic mt-0.5">
                                  Student reflection: &ldquo;{c.studentReflection}&rdquo;
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No prior 7-day actions recorded.</p>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-gray-200 space-y-1">
                      <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block">
                        Suggested Opening Questions &amp; Unresolved Topics
                      </span>
                      {continuityData.latestSummary?.suggestedOpeningQuestionsNextSession && (
                        <p className="text-gray-800 whitespace-pre-wrap">
                          <strong>Opening Questions:</strong>{' '}
                          {continuityData.latestSummary.suggestedOpeningQuestionsNextSession}
                        </p>
                      )}
                      {continuityData.latestSummary?.unresolvedQuestionsToRevisit && (
                        <p className="text-gray-700 whitespace-pre-wrap mt-1">
                          <strong>Unresolved to Revisit:</strong>{' '}
                          {continuityData.latestSummary.unresolvedQuestionsToRevisit}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600">
                  This is {selectedBooking.name}&apos;s first recorded session. Once you complete this session and generate a structured summary below, future bookings will automatically display a continuity preparation brief here.
                </p>
              )}
            </div>

            {/* Conversation & Lifecycle Action Controls */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-semibold text-gray-900 text-base">Conversation &amp; Lifecycle Controls</h3>
                <p className="text-xs text-gray-500">Record session status, agreed next action, and 7-day follow-up</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Conversation Status
                  </label>
                  <select 
                    value={editForm.status} 
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white"
                  >
                    <option value="pending">Pending (New Intake)</option>
                    <option value="confirmed">Confirmed (Scheduled — Auto-Creates Meet)</option>
                    <option value="completed">Completed (Conversation Held)</option>
                    <option value="cancelled">Cancelled (Cancels Calendar Event)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    7-Day Follow-up Date
                  </label>
                  <input 
                    type="date" 
                    value={editForm.followUpDate} 
                    onChange={(e) => setEditForm({...editForm, followUpDate: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Scheduled Session Date (Reschedule Syncs Calendar)
                  </label>
                  <input
                    type="date"
                    value={editForm.preferredDate}
                    onChange={(e) => setEditForm({ ...editForm, preferredDate: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Scheduled Time Window (IST)
                  </label>
                  <input
                    type="text"
                    value={editForm.preferredTime}
                    onChange={(e) => setEditForm({ ...editForm, preferredTime: e.target.value })}
                    placeholder="e.g. Afternoon (2:00 PM – 5:00 PM) or 4:00 PM"
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Agreed Next Step (The 7-Day Action)
                  </label>
                  <textarea 
                    value={editForm.actionAgreed} 
                    onChange={(e) => setEditForm({...editForm, actionAgreed: e.target.value})}
                    placeholder="What specific, practical step did the student agree to try in the next 7 days?"
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white" 
                    rows="2"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Action Status
                  </label>
                  <select 
                    value={editForm.actionStatus} 
                    onChange={(e) => setEditForm({...editForm, actionStatus: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Completed (Done)</option>
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Payment / Fee Status
                  </label>
                  <select 
                    value={editForm.paymentStatus} 
                    onChange={(e) => setEditForm({...editForm, paymentStatus: e.target.value})}
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white"
                  >
                    <option value="not_required">Complimentary (Waived / ₹0)</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Payment Due (Pending)</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Outcome &amp; Feedback
                  </label>
                  <textarea 
                    value={editForm.feedback} 
                    onChange={(e) => setEditForm({...editForm, feedback: e.target.value})}
                    placeholder="Outcome of the 7-day follow-up, student reflections, or next conversation need..."
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white" 
                    rows="2"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Shared Summary Notes (Visible to Student on their Mentee Dashboard)
                  </label>
                  <textarea 
                    value={editForm.sharedNotes} 
                    onChange={(e) => setEditForm({...editForm, sharedNotes: e.target.value})}
                    placeholder="Key perspectives or summary points to share with the student on their dashboard..."
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white" 
                    rows="2"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Internal Notes (Deepak Sir&apos;s Private Observations)
                  </label>
                  <textarea 
                    value={editForm.notes} 
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    placeholder="Private notes before or during the conversation..."
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:border-[#2E4052] outline-none text-sm bg-white" 
                    rows="2"
                  />
                </div>
              </div>
            </div>

            {/* 9-Part Post-Session Structured Summary Generator, Editor & Approval */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2E4052]" />
                    <h3 className="font-semibold text-gray-900 text-base">
                      9-Part Post-Session Structured Summary
                    </h3>
                    {continuityData?.currentSummary?.isApproved ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        ✓ Reviewed &amp; Approved
                      </span>
                    ) : continuityData?.currentSummary?.status === 'ready' ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                        Draft Ready for Review
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Participant Consent:{' '}
                    <strong>
                      {selectedBooking.aiNotesConsent !== false
                        ? 'Consented to AI/Meet + Mentor Notes'
                        : 'Mentor-Entered Notes Fallback Only'}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={generatingSummary}
                  onClick={handleGenerateStructuredSummary}
                  className="px-3.5 py-2 rounded-lg bg-[#2E4052] hover:bg-[#1e2c3a] text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  <span>
                    {generatingSummary
                      ? 'Generating 9-Part Summary...'
                      : 'Generate / Refresh 9-Part Summary'}
                  </span>
                </button>
              </div>

              {/* Optional Input Source Selector (Google Meet Notes / Transcript / Mentor Notes) */}
              <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Preferred Summary Input Source:
                  </span>
                  <div className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 text-xs">
                    {[
                      { id: 'mentor_notes', label: 'Mentor Notes (Fallback)' },
                      { id: 'google_meet_notes', label: 'Google Meet Notes' },
                      { id: 'google_meet_transcript', label: 'Meet Transcript' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSummarySourceType(tab.id)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                          summarySourceType === tab.id
                            ? 'bg-[#2E4052] text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(summarySourceType === 'google_meet_notes' ||
                  summarySourceType === 'google_meet_transcript') && (
                  <div>
                    <textarea
                      rows={3}
                      value={summaryRawInput}
                      onChange={(e) => setSummaryRawInput(e.target.value)}
                      placeholder={
                        summarySourceType === 'google_meet_notes'
                          ? 'Paste Google Meet auto-generated notes doc content here...'
                          : 'Paste Google Meet transcript excerpt here...'
                      }
                      className="w-full border border-gray-300 rounded-md p-2 text-xs bg-white outline-none focus:border-[#2E4052]"
                    />
                  </div>
                )}
              </div>

              {summaryNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
                  {summaryNotice}
                </div>
              )}

              {/* 9 Editable Structured Summary Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    2. Student&apos;s Goals &amp; Concerns Explicitly Discussed
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.studentGoalsAndConcerns}
                    onChange={(e) =>
                      setSummaryDraft({ ...summaryDraft, studentGoalsAndConcerns: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    3. Key Topics &amp; Perspectives Explored
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.keyTopicsAndPerspectives}
                    onChange={(e) =>
                      setSummaryDraft({ ...summaryDraft, keyTopicsAndPerspectives: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    4A. Important Observations (Factual Statements)
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.importantObservationsFacts}
                    onChange={(e) =>
                      setSummaryDraft({
                        ...summaryDraft,
                        importantObservationsFacts: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    4B. Important Observations (Mentor Interpretations)
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.importantObservationsInterpretations}
                    onChange={(e) =>
                      setSummaryDraft({
                        ...summaryDraft,
                        importantObservationsInterpretations: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    5. Goals or Actions Agreed Upon by the Student
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.agreedStudentActions}
                    onChange={(e) =>
                      setSummaryDraft({ ...summaryDraft, agreedStudentActions: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    6. Progress Reported on Actions from Previous Session
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.progressFromPreviousSession}
                    onChange={(e) =>
                      setSummaryDraft({
                        ...summaryDraft,
                        progressFromPreviousSession: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    7. Unresolved Questions &amp; Topics to Revisit
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.unresolvedQuestionsToRevisit}
                    onChange={(e) =>
                      setSummaryDraft({
                        ...summaryDraft,
                        unresolvedQuestionsToRevisit: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    8. Suggested Opening Questions for Next Session
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.suggestedOpeningQuestionsNextSession}
                    onChange={(e) =>
                      setSummaryDraft({
                        ...summaryDraft,
                        suggestedOpeningQuestionsNextSession: e.target.value
                      })
                    }
                    className="w-full border border-gray-300 rounded-md p-2 bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-indigo-900 mb-1">
                    9. Short Private Mentor Preparation Brief (Strictly Private to Mentor)
                  </label>
                  <textarea
                    rows={2}
                    value={summaryDraft.privateMentorPrepBrief}
                    onChange={(e) =>
                      setSummaryDraft({ ...summaryDraft, privateMentorPrepBrief: e.target.value })
                    }
                    className="w-full border border-indigo-200 rounded-md p-2 bg-indigo-50/30"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={savingSummary}
                  onClick={() => handleSaveAndApproveSummary(false)}
                  className="px-3.5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700"
                >
                  Save Draft Summary
                </button>
                <button
                  type="button"
                  disabled={savingSummary}
                  onClick={() => handleSaveAndApproveSummary(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{savingSummary ? 'Saving...' : 'Approve & Mark Summary Reviewed'}</span>
                </button>
              </div>
            </div>

            {/* Student's 7-Day Reflection & Past Session History */}
            {selectedBooking.studentReflection && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                  Student&apos;s 7-Day Progress Reflection (Submitted from Dashboard)
                </span>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedBooking.studentReflection}
                </p>
              </div>
            )}

            {Array.isArray(selectedBooking.participantHistory) && selectedBooking.participantHistory.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    Other Sessions with {selectedBooking.name} ({selectedBooking.participantHistory.length})
                  </h3>
                  <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-semibold">
                    Returning Mentee
                  </span>
                </div>
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {selectedBooking.participantHistory.map((h) => (
                    <div key={h._id} className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">
                          Session #{h.sessionNumber || 1} • {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                        <span className="uppercase font-semibold text-gray-600">{h.status}</span>
                      </div>
                      <p className="text-gray-700"><strong>Topic:</strong> {h.topic || 'N/A'}</p>
                      {h.actionAgreed && (
                        <p className="text-emerald-800">
                          <strong>7-Day Action ({h.actionStatus}):</strong> {h.actionAgreed}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Manual Booking Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Add Manual Mentoring Booking"
        actions={
          <>
            <button
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateManualBooking}
              disabled={savingManual}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all shadow-sm text-sm"
            >
              {savingManual ? 'Saving...' : 'Record Booking'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateManualBooking} className="space-y-4">
          <p className="text-xs text-gray-500">
            Record direct consultations, WhatsApp/call bookings, or offline entries so they are tracked on both the Bookings and Payments dashboards.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Participant Name *
              </label>
              <input
                type="text"
                required
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Mobile / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={manualForm.email}
                onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                placeholder="e.g. rahul@example.com"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={manualForm.userType}
                onChange={(e) => setManualForm({ ...manualForm, userType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 outline-none bg-white"
              >
                <option value="student">Student (16-25 yrs)</option>
                <option value="parent">Parent</option>
                <option value="institution">Institution / Educator</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Session Date
              </label>
              <input
                type="date"
                value={manualForm.preferredDate}
                onChange={(e) => setManualForm({ ...manualForm, preferredDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Session Time / Slot
              </label>
              <input
                type="text"
                value={manualForm.preferredTime}
                onChange={(e) => setManualForm({ ...manualForm, preferredTime: e.target.value })}
                placeholder="e.g. 4:00 PM - 4:45 PM"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Session Status
              </label>
              <select
                value={manualForm.status}
                onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 outline-none bg-white"
              >
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Status
              </label>
              <select
                value={manualForm.paymentStatus}
                onChange={(e) => setManualForm({ ...manualForm, paymentStatus: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 outline-none bg-white font-medium"
              >
                <option value="not_required">Complimentary (₹0)</option>
                <option value="paid">Paid (₹ Collected)</option>
                <option value="pending">Payment Due (Pending)</option>
              </select>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Topic / Concern Discussed
              </label>
              <input
                type="text"
                value={manualForm.topic}
                onChange={(e) => setManualForm({ ...manualForm, topic: e.target.value })}
                placeholder="e.g. Career decision post graduation"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Admin Notes
              </label>
              <textarea
                rows={2}
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder="Session insights, next steps or notes..."
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-emerald-600 outline-none"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
