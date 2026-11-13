const { prisma, toApiResponse } = require('../config/prisma');
const { RedisKeys, getCachedJson, setCachedJson, invalidateCacheKeys } = require('../config/redis');

const DEFAULT_MENTOR_SLUG = 'deepak-sogani';
const DEFAULT_STANDARD_SLOTS = [
  '10:00 AM – 10:45 AM',
  '11:00 AM – 11:45 AM',
  '12:00 PM – 12:45 PM',
  '04:00 PM – 04:45 PM',
  '05:00 PM – 05:45 PM',
  '06:00 PM – 06:45 PM',
  '07:00 PM – 07:45 PM'
];

/**
 * Resolve the authoritative MentorProfile (defaults to Deepak Sogani if mentorProfileId is omitted).
 * Caches in Redis under `cache:mentor:{idOrSlug}` for 15 minutes (900s).
 */
async function getAuthoritativeMentorProfile(mentorProfileIdOrSlug = null) {
  const lookupKey = mentorProfileIdOrSlug || DEFAULT_MENTOR_SLUG;
  const cacheKey = RedisKeys.cacheMentor(lookupKey);

  const cached = await getCachedJson(cacheKey);
  if (cached && cached.id) {
    return cached;
  }

  let profile = null;
  if (mentorProfileIdOrSlug) {
    profile = await prisma.mentorProfile.findFirst({
      where: {
        OR: [{ id: mentorProfileIdOrSlug }, { slug: mentorProfileIdOrSlug }]
      }
    });
  }

  if (!profile) {
    profile = await prisma.mentorProfile.findUnique({
      where: { slug: DEFAULT_MENTOR_SLUG }
    });
  }

  // Self-heal if database was freshly reset
  if (!profile) {
    const mentorUser = await prisma.user.upsert({
      where: { email: 'deepak@unfoldinn.com' },
      update: { userType: 'mentor', isActive: true },
      create: {
        email: 'deepak@unfoldinn.com',
        name: 'Deepak Sogani',
        userType: 'mentor',
        authProvider: 'email',
        onboardingCompleted: true,
        dpdpConsentConfirmed: true,
        dpdpConsentAt: new Date()
      }
    });

    profile = await prisma.mentorProfile.create({
      data: {
        userId: mentorUser.id,
        slug: DEFAULT_MENTOR_SLUG,
        displayName: 'Mr. Deepak Sogani',
        headline: 'Founder & Lead Mentor, Unfoldinn',
        defaultDurationMins: 45,
        bufferMins: 15,
        sessionFee: 500.00,
        timezone: 'Asia/Kolkata',
        standardSlots: DEFAULT_STANDARD_SLOTS,
        isAcceptingBookings: true
      }
    });
  }

  const serialized = toApiResponse(profile);
  await setCachedJson(cacheKey, serialized, 900);
  return serialized;
}

async function invalidateMentorCache(mentorProfileId, slug = DEFAULT_MENTOR_SLUG) {
  await invalidateCacheKeys(
    RedisKeys.cacheMentor(mentorProfileId),
    RedisKeys.cacheMentor(slug)
  );
}

module.exports = {
  DEFAULT_MENTOR_SLUG,
  DEFAULT_STANDARD_SLOTS,
  getAuthoritativeMentorProfile,
  getDefaultMentorProfile: getAuthoritativeMentorProfile,
  invalidateMentorCache
};
