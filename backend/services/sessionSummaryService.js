const crypto = require('crypto');
const Booking = require('../models/Booking');
const SessionSummary = require('../models/SessionSummary');

const UNAVAILABLE_TEXT = 'Unavailable — not explicitly recorded in session notes.';

function computeParticipantKey(booking) {
  if (booking.userId) return `uid:${booking.userId}`;
  if (booking.email) return `email:${String(booking.email).trim().toLowerCase()}`;
  const digits = String(booking.phone || '').replace(/[^0-9]/g, '').slice(-10);
  return `phone:${digits || 'unknown'}`;
}

function extractTaggedSection(text, labels) {
  if (!text) return '';
  for (const label of labels) {
    const regex = new RegExp(
      `(?:^|\\n)\\s*(?:#+\\s*|\\*\\*)?${label}(?:\\*\\*)?\\s*[:\\-]\\s*([\\s\\S]*?)(?=\\n\\s*(?:#+\\s*|\\*\\*)?[A-Za-z ]{3,35}(?:\\*\\*)?\\s*[:\\-]|$)`,
      'i'
    );
    const match = text.match(regex);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
  }
  return '';
}

/**
 * Deterministic, Zero-Hallucination Structured Summary Builder
 * Never invents student statements, diagnoses, emotions, or commitments.
 * Marks missing information explicitly as unavailable.
 */
function buildDeterministicSummary({
  booking,
  previousBooking,
  rawNotesText,
  sourceType
}) {
  const cleanNotes = String(rawNotesText || '').trim();

  // 2. Goals and concerns explicitly discussed
  const explicitGoals =
    extractTaggedSection(cleanNotes, ['Goals', 'Concerns', 'Goals & Concerns', 'Topic']) ||
    [
      booking.topic ? `Intake Topic: ${booking.topic.trim()}` : '',
      booking.usefulGoal ? `Desired Session Goal: ${booking.usefulGoal.trim()}` : ''
    ]
      .filter(Boolean)
      .join(' | ') ||
    UNAVAILABLE_TEXT;

  // 3. Key topics and perspectives explored
  const keyPerspectives =
    extractTaggedSection(cleanNotes, ['Key Topics', 'Perspectives', 'Discussion', 'Summary']) ||
    (booking.sharedNotes ? booking.sharedNotes.trim() : '') ||
    (cleanNotes ? cleanNotes.slice(0, 800) : UNAVAILABLE_TEXT);

  // 4. Important observations (Factual statements vs. Mentor interpretations)
  const factualFromNotes =
    extractTaggedSection(cleanNotes, ['Facts', 'Factual Statements', 'Student Stated']) ||
    [
      booking.whereCurrently ? `Current stage: ${booking.whereCurrently}` : '',
      booking.institutionOrOrg ? `Institution: ${booking.institutionOrOrg}` : '',
      booking.topic ? `Stated concern: ${booking.topic}` : ''
    ]
      .filter(Boolean)
      .join(' • ') ||
    UNAVAILABLE_TEXT;

  const interpretationsFromNotes =
    extractTaggedSection(cleanNotes, [
      'Mentor Interpretation',
      'Interpretations',
      'Observations',
      'Mentor Notes'
    ]) ||
    (booking.notes ? booking.notes.trim() : '') ||
    UNAVAILABLE_TEXT;

  // 5. Goals or actions agreed upon by the student
  const agreedActions =
    (booking.actionAgreed && booking.actionAgreed.trim()) ||
    extractTaggedSection(cleanNotes, ['Agreed Action', '7-Day Action', 'Next Step', 'Action']) ||
    UNAVAILABLE_TEXT;

  // 6. Progress reported on actions from the previous session
  let progressFromPrevious = UNAVAILABLE_TEXT;
  if (previousBooking) {
    const parts = [];
    if (previousBooking.actionAgreed) {
      parts.push(
        `Previous Session #${previousBooking.sessionNumber || 1} Action: "${previousBooking.actionAgreed}" (Status: ${
          previousBooking.actionStatus || 'not-started'
        })`
      );
    }
    if (previousBooking.studentReflection) {
      parts.push(`Student Reflection: "${previousBooking.studentReflection}"`);
    }
    if (parts.length > 0) {
      progressFromPrevious = parts.join(' — ');
    }
  } else {
    progressFromPrevious = 'Not applicable — this is the first recorded session for this student.';
  }

  // 7. Unresolved questions and topics to revisit
  const unresolvedQuestions =
    extractTaggedSection(cleanNotes, [
      'Unresolved',
      'Unresolved Questions',
      'To Revisit',
      'Open Questions',
      'Follow Up'
    ]) ||
    (booking.feedback ? booking.feedback.trim() : '') ||
    UNAVAILABLE_TEXT;

  // 8. Suggested opening questions for the next session
  const suggestedOpeningQuestions = [];
  if (agreedActions && agreedActions !== UNAVAILABLE_TEXT) {
    suggestedOpeningQuestions.push(
      `How did trying out your 7-day step ("${agreedActions.slice(0, 90)}") go over the past week?`
    );
  }
  if (unresolvedQuestions && unresolvedQuestions !== UNAVAILABLE_TEXT) {
    suggestedOpeningQuestions.push(
      `Last time we noted "${unresolvedQuestions.slice(0, 90)}" to revisit — how are you thinking about that today?`
    );
  }
  if (booking.topic) {
    suggestedOpeningQuestions.push(
      `What has shifted for you regarding "${booking.topic.slice(0, 80)}" since our Session #${
        booking.sessionNumber || 1
      } conversation?`
    );
  }
  if (suggestedOpeningQuestions.length === 0) {
    suggestedOpeningQuestions.push(
      'What has been on your mind since our last conversation, and what would make today most useful for you?'
    );
  }

  // 9. Short private mentor preparation brief
  const prepBriefParts = [
    `Session #${booking.sessionNumber || 1} (${sourceType.replace(/_/g, ' ')}) with ${booking.name}.`,
    booking.topic ? `Primary focus: ${booking.topic.slice(0, 140)}.` : '',
    agreedActions !== UNAVAILABLE_TEXT
      ? `Check in on agreed 7-day action: ${agreedActions.slice(0, 140)}.`
      : 'No 7-day action was recorded yet; establish a concrete 7-day next step in the upcoming session.'
  ].filter(Boolean);

  return {
    goalsAndConcernsDiscussed: explicitGoals,
    keyTopicsAndPerspectives: keyPerspectives,
    importantObservations: {
      factualStatements: factualFromNotes,
      mentorInterpretations: interpretationsFromNotes
    },
    agreedActions,
    progressFromPreviousSession: progressFromPrevious,
    unresolvedQuestions,
    suggestedOpeningQuestions,
    privateMentorPrepBrief: prepBriefParts.join(' ')
  };
}

/**
 * Optional Gemini API Structured Summary (Used only if GEMINI_API_KEY is configured AND consent is recorded)
 */
async function tryGeminiStructuredSummary({
  booking,
  previousBooking,
  rawNotesText
}) {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!geminiKey || !booking.aiNotesConsent) return null;

  const prompt = [
    'You are a careful, neutral assistant for Unfoldinn, a human-led student mentoring platform.',
    'Summarize the provided session notes/transcript into strict JSON with the exact keys below.',
    'CRITICAL RULES:',
    '- NEVER invent student statements, diagnoses, emotions, commitments, or progress.',
    '- Distinguish factual statements from mentor interpretations.',
    `- If any field is not explicitly present in the input, set its value to "${UNAVAILABLE_TEXT}".`,
    '- Do NOT use the data for any purpose other than this JSON output.',
    '',
    `Student Name: ${booking.name}`,
    `Session Number: ${booking.sessionNumber || 1}`,
    `Intake Topic: ${booking.topic || 'Unavailable'}`,
    `Desired Goal: ${booking.usefulGoal || 'Unavailable'}`,
    `Agreed 7-Day Action Field: ${booking.actionAgreed || 'Unavailable'}`,
    `Shared Mentor Notes Field: ${booking.sharedNotes || 'Unavailable'}`,
    `Private Mentor Notes Field: ${booking.notes || 'Unavailable'}`,
    previousBooking
      ? `Previous Session #${previousBooking.sessionNumber || 1} Agreed Action: ${
          previousBooking.actionAgreed || 'None'
        } (Status: ${previousBooking.actionStatus || 'not-started'}, Student Reflection: ${
          previousBooking.studentReflection || 'None'
        })`
      : 'Previous Session: None (First session)',
    `Raw Session Notes / Transcript:\n${rawNotesText || 'None'}`,
    '',
    'Return ONLY valid JSON matching:',
    JSON.stringify({
      goalsAndConcernsDiscussed: 'string',
      keyTopicsAndPerspectives: 'string',
      importantObservations: {
        factualStatements: 'string',
        mentorInterpretations: 'string'
      },
      agreedActions: 'string',
      progressFromPreviousSession: 'string',
      unresolvedQuestions: 'string',
      suggestedOpeningQuestions: ['string'],
      privateMentorPrepBrief: 'string'
    })
  ].join('\n');

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        geminiKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const textOut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOut) return null;
    const parsed = JSON.parse(textOut);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (err) {
    console.warn('[SessionSummaryService] Optional Gemini parse fallback to deterministic:', err.message);
    return null;
  }
}

/**
 * Generate or update the structured post-session summary for a booking.
 * - Priority order of sources:
 *   1. Google Meet-generated notes (`meetNotesText`)
 *   2. Google Meet transcript (`meetTranscriptText`)
 *   3. Mentor-entered session notes (`mentorNotesText` or `booking.notes` / `booking.sharedNotes`)
 */
async function generateSessionSummaryForBooking(
  bookingId,
  {
    meetNotesText = '',
    meetTranscriptText = '',
    mentorNotesText = '',
    forceRegenerate = false
  } = {}
) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  // Determine input source based on availability and participant consent
  let sourceType = 'mentor_notes';
  let combinedRawInput = '';

  const canUseAiTranscriptSources = Boolean(booking.aiNotesConsent);

  if (canUseAiTranscriptSources && meetNotesText && String(meetNotesText).trim()) {
    sourceType = 'google_meet_notes';
    combinedRawInput = String(meetNotesText).trim();
  } else if (canUseAiTranscriptSources && meetTranscriptText && String(meetTranscriptText).trim()) {
    sourceType = 'google_meet_transcript';
    combinedRawInput = String(meetTranscriptText).trim();
  } else {
    sourceType = 'mentor_notes';
    combinedRawInput = [
      mentorNotesText ? String(mentorNotesText).trim() : '',
      booking.sharedNotes ? `Shared Summary: ${booking.sharedNotes}` : '',
      booking.notes ? `Mentor Notes: ${booking.notes}` : '',
      booking.actionAgreed ? `Agreed Action: ${booking.actionAgreed}` : '',
      booking.feedback ? `Outcome/Feedback: ${booking.feedback}` : ''
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  const hashPayload = `${sourceType}||${combinedRawInput}||${booking.topic || ''}||${
    booking.actionAgreed || ''
  }||${booking.sharedNotes || ''}||${booking.notes || ''}`;
  const sourceHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

  // Check if an identical summary is already generated (prevents duplicate processing)
  const existingSummary = await SessionSummary.findOne({ bookingId: booking._id });
  if (
    existingSummary &&
    !forceRegenerate &&
    existingSummary.sourceHash === sourceHash &&
    ['ready', 'reviewed'].includes(existingSummary.status)
  ) {
    return {
      summary: existingSummary,
      deduplicated: true
    };
  }

  // Find immediate previous session for this student to report progress on previous actions
  const participantKey = computeParticipantKey(booking);
  const orFilters = [];
  if (booking.userId) orFilters.push({ userId: booking.userId });
  if (booking.email) orFilters.push({ email: booking.email.toLowerCase() });
  if (booking.phone) {
    const digits = String(booking.phone).replace(/[^0-9]/g, '').slice(-10);
    if (digits.length === 10) orFilters.push({ phone: { $regex: digits + '$' } });
  }

  const previousBooking =
    orFilters.length > 0
      ? await Booking.findOne({
          _id: { $ne: booking._id },
          $or: orFilters,
          status: { $ne: 'cancelled' },
          createdAt: { $lt: booking.createdAt || new Date() }
        }).sort({ createdAt: -1 })
      : null;

  // Mark summary as processing
  booking.summaryStatus = 'processing';
  await booking.save();

  try {
    let structured = await tryGeminiStructuredSummary({
      booking,
      previousBooking,
      rawNotesText: combinedRawInput
    });
    let generationMethod = 'gemini_assisted';

    if (!structured) {
      structured = buildDeterministicSummary({
        booking,
        previousBooking,
        rawNotesText: combinedRawInput,
        sourceType
      });
      generationMethod = 'deterministic_structured';
    }

    const summaryDoc = await SessionSummary.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $set: {
          bookingId: booking._id,
          userId: booking.userId || null,
          participantKey,
          studentName: booking.name,
          studentEmail: booking.email || '',
          sessionNumber: booking.sessionNumber || 1,
          sessionDate: booking.scheduledStartAt || booking.preferredDate || booking.createdAt || new Date(),
          status: existingSummary?.status === 'reviewed' ? 'reviewed' : 'ready',
          sourceType,
          consentRecorded: Boolean(booking.aiNotesConsent),
          consentMode: booking.aiNotesConsent ? 'ai_notes_consented' : 'mentor_notes_fallback',
          rawSourceText: combinedRawInput,
          sourceHash,
          goalsAndConcernsDiscussed:
            structured.goalsAndConcernsDiscussed || UNAVAILABLE_TEXT,
          keyTopicsAndPerspectives:
            structured.keyTopicsAndPerspectives || UNAVAILABLE_TEXT,
          importantObservations: {
            factualStatements:
              structured.importantObservations?.factualStatements || UNAVAILABLE_TEXT,
            mentorInterpretations:
              structured.importantObservations?.mentorInterpretations || UNAVAILABLE_TEXT
          },
          agreedActions: structured.agreedActions || UNAVAILABLE_TEXT,
          progressFromPreviousSession:
            structured.progressFromPreviousSession || UNAVAILABLE_TEXT,
          unresolvedQuestions: structured.unresolvedQuestions || UNAVAILABLE_TEXT,
          suggestedOpeningQuestions: Array.isArray(structured.suggestedOpeningQuestions)
            ? structured.suggestedOpeningQuestions
            : [],
          privateMentorPrepBrief:
            structured.privateMentorPrepBrief || UNAVAILABLE_TEXT,
          generationMethod,
          lastError: null
        }
      },
      { upsert: true, new: true }
    );

    booking.summaryId = summaryDoc._id;
    booking.summaryStatus = summaryDoc.status;
    await booking.save();

    return {
      summary: summaryDoc,
      deduplicated: false
    };
  } catch (err) {
    booking.summaryStatus = 'failed';
    await booking.save();
    await SessionSummary.findOneAndUpdate(
      { bookingId: booking._id },
      {
        $set: {
          bookingId: booking._id,
          participantKey,
          studentName: booking.name,
          status: 'failed',
          lastError: err.message
        }
      },
      { upsert: true }
    );
    throw err;
  }
}

/**
 * Review, edit, correct, and approve a SessionSummary (Mentor / Admin Only)
 */
async function updateAndApproveSessionSummary(bookingId, updates = {}, adminId = null) {
  let summary = await SessionSummary.findOne({ bookingId });
  if (!summary) {
    const gen = await generateSessionSummaryForBooking(bookingId, {
      mentorNotesText: updates.mentorNotesText || ''
    });
    summary = gen.summary;
  }

  const allowedFields = [
    'goalsAndConcernsDiscussed',
    'keyTopicsAndPerspectives',
    'agreedActions',
    'progressFromPreviousSession',
    'unresolvedQuestions',
    'suggestedOpeningQuestions',
    'privateMentorPrepBrief'
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      summary[field] = updates[field];
    }
  }

  // Support UI alias fields seamlessly
  if (updates.studentGoalsAndConcerns !== undefined) {
    summary.goalsAndConcernsDiscussed = updates.studentGoalsAndConcerns;
  }
  if (updates.agreedStudentActions !== undefined) {
    summary.agreedActions = updates.agreedStudentActions;
  }
  if (updates.unresolvedQuestionsToRevisit !== undefined) {
    summary.unresolvedQuestions = updates.unresolvedQuestionsToRevisit;
  }
  if (updates.suggestedOpeningQuestionsNextSession !== undefined) {
    summary.suggestedOpeningQuestions = Array.isArray(updates.suggestedOpeningQuestionsNextSession)
      ? updates.suggestedOpeningQuestionsNextSession
      : String(updates.suggestedOpeningQuestionsNextSession)
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
  }
  if (updates.importantObservationsFacts !== undefined) {
    summary.importantObservations.factualStatements = updates.importantObservationsFacts;
  }
  if (updates.importantObservationsInterpretations !== undefined) {
    summary.importantObservations.mentorInterpretations =
      updates.importantObservationsInterpretations;
  }

  if (updates.importantObservations && typeof updates.importantObservations === 'object') {
    if (updates.importantObservations.factualStatements !== undefined) {
      summary.importantObservations.factualStatements =
        updates.importantObservations.factualStatements;
    }
    if (updates.importantObservations.mentorInterpretations !== undefined) {
      summary.importantObservations.mentorInterpretations =
        updates.importantObservations.mentorInterpretations;
    }
  }

  if (updates.approve === true || updates.status === 'reviewed') {
    summary.status = 'reviewed';
    summary.isApproved = true;
    summary.reviewedByAdminId = adminId;
    summary.reviewedAt = new Date();
  }

  summary.generationMethod = 'manual_mentor_edit';
  await summary.save();

  await Booking.findByIdAndUpdate(bookingId, {
    summaryId: summary._id,
    summaryStatus: summary.status
  });

  return summary;
}

/**
 * Build a concise Pre-Session Continuity Brief across all chronological sessions for a student
 * (Mentor / Admin Only)
 */
async function getStudentContinuityBrief(bookingId) {
  const targetBooking = await Booking.findById(bookingId).lean();
  if (!targetBooking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  const orFilters = [];
  if (targetBooking.userId) orFilters.push({ userId: targetBooking.userId });
  if (targetBooking.email) orFilters.push({ email: targetBooking.email.toLowerCase() });
  if (targetBooking.phone) {
    const digits = String(targetBooking.phone).replace(/[^0-9]/g, '').slice(-10);
    if (digits.length === 10) orFilters.push({ phone: { $regex: digits + '$' } });
  }

  const allBookings =
    orFilters.length > 0
      ? await Booking.find({ $or: orFilters }).sort({ createdAt: 1 }).lean()
      : [targetBooking];

  const bookingIds = allBookings.map((b) => b._id);
  const summaries = await SessionSummary.find({ bookingId: { $in: bookingIds } })
    .sort({ sessionDate: 1 })
    .lean();

  const summaryByBookingId = new Map(summaries.map((s) => [String(s.bookingId), s]));

  const chronologicalTimeline = allBookings.map((b, index) => {
    const s = summaryByBookingId.get(String(b._id)) || null;
    return {
      bookingId: b._id,
      sessionNumber: b.sessionNumber || index + 1,
      date: b.scheduledStartAt || b.preferredDate || b.createdAt,
      status: b.status,
      topic: b.topic || b.concern || '',
      actionAgreed: b.actionAgreed || s?.agreedActions || '',
      actionStatus: b.actionStatus || 'not-started',
      studentReflection: b.studentReflection || '',
      meetingLink: b.meetingLink || null,
      summaryStatus: b.summaryStatus || (s ? s.status : 'none'),
      summary: s
    };
  });

  const previousSessions = chronologicalTimeline.filter(
    (item) => String(item.bookingId) !== String(targetBooking._id)
  );
  const lastSession =
    previousSessions.length > 0 ? previousSessions[previousSessions.length - 1] : null;

  const openActions = previousSessions
    .filter((s) => s.actionAgreed && s.actionAgreed !== UNAVAILABLE_TEXT && s.actionStatus !== 'done' && s.actionStatus !== 'completed')
    .map((s) => ({
      sessionNumber: s.sessionNumber,
      action: s.actionAgreed,
      status: s.actionStatus,
      studentReflection: s.studentReflection
    }));

  const unresolvedToRevisit = previousSessions
    .map((s) => s.summary?.unresolvedQuestions)
    .filter((q) => q && q !== UNAVAILABLE_TEXT);

  const suggestedOpeners =
    lastSession?.summary?.suggestedOpeningQuestions?.length > 0
      ? lastSession.summary.suggestedOpeningQuestions
      : lastSession?.actionAgreed
      ? [
          `In Session #${lastSession.sessionNumber}, you agreed to try: "${lastSession.actionAgreed}". How did that go?`
        ]
      : [
          `Welcome to Session #${targetBooking.sessionNumber || 1}. What would make our conversation today most valuable for you?`
        ];

  const currentSummaryObj = summaryByBookingId.get(String(targetBooking._id)) || null;
  const latestPreviousSummary = lastSession?.summary || null;

  return {
    studentName: targetBooking.name,
    studentEmail: targetBooking.email || '',
    studentPhone: targetBooking.phone || '',
    totalSessionsCount: chronologicalTimeline.length,
    totalPreviousSessions: previousSessions.length,
    currentBookingSummary: currentSummaryObj,
    currentSummary: currentSummaryObj,
    latestSummary: latestPreviousSummary,
    priorCommitments: previousSessions
      .filter((s) => s.actionAgreed && s.actionAgreed !== UNAVAILABLE_TEXT)
      .map((s) => ({
        sessionNumber: s.sessionNumber,
        actionAgreed: s.actionAgreed,
        actionStatus: s.actionStatus,
        studentReflection: s.studentReflection
      })),
    continuityPrepBrief: {
      isReturningStudent: previousSessions.length > 0,
      lastSessionDate: lastSession ? lastSession.date : null,
      lastSessionTopic: lastSession ? lastSession.topic : null,
      lastMentorPrepBrief: lastSession?.summary?.privateMentorPrepBrief || null,
      openCommitments: openActions,
      unresolvedQuestionsToRevisit: unresolvedToRevisit,
      suggestedOpeningQuestions: suggestedOpeners
    },
    chronologicalTimeline
  };
}

module.exports = {
  UNAVAILABLE_TEXT,
  generateSessionSummaryForBooking,
  updateAndApproveSessionSummary,
  getStudentContinuityBrief
};
