const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { prisma, ensurePostgresEngineConstraints } = require('../config/prisma');
const { initRedis, RedisKeys, acquireRedisSlotHold, releaseRedisSlotHold } = require('../config/redis');

// Load current Mongoose models to read existing MongoDB data
const backupModelsDir = path.join(__dirname, '..', 'models');
const LegacyAdmin = require(path.join(backupModelsDir, 'Admin'));
const LegacyUser = require(path.join(backupModelsDir, 'User'));
const LegacySetting = require(path.join(backupModelsDir, 'Setting'));
const LegacyPlan = require(path.join(backupModelsDir, 'SubscriptionPlan'));
const LegacyCoupon = require(path.join(backupModelsDir, 'Coupon'));
const LegacyResource = require(path.join(backupModelsDir, 'Resource'));
const LegacyOpportunity = require(path.join(backupModelsDir, 'Opportunity'));
const LegacyTestimonial = require(path.join(backupModelsDir, 'Testimonial'));
const LegacyNewsletter = require(path.join(backupModelsDir, 'Newsletter'));
const LegacyContact = require(path.join(backupModelsDir, 'Contact'));
const LegacyInstitution = require(path.join(backupModelsDir, 'InstitutionalEnquiry'));
const LegacySupportTicket = require(path.join(backupModelsDir, 'SupportTicket'));
const LegacyGoogleIntegration = require(path.join(backupModelsDir, 'GoogleIntegration'));

const DEFAULT_STANDARD_SLOTS = [
  '10:00 AM – 10:45 AM',
  '11:00 AM – 11:45 AM',
  '12:00 PM – 12:45 PM',
  '04:00 PM – 04:45 PM',
  '05:00 PM – 05:45 PM',
  '06:00 PM – 06:45 PM',
  '07:00 PM – 07:45 PM'
];

async function runMigration() {
  console.log('========================================================================');
  console.log('🐘 + 🐠 INITIALIZING NEON POSTGRESQL 18, REDIS CLOUD & DATA MIGRATION');
  console.log('========================================================================\n');

  // 1. Apply Native PostgreSQL Engine Constraints (btree_gist + CHECKs)
  console.log('[1/5] Applying native PostgreSQL engine constraints (btree_gist & CHECKs)...');
  await ensurePostgresEngineConstraints();
  console.log('  -> PostgreSQL constraints verified & active ✅\n');

  // 2. Verify Redis Cloud Connection & Lua CAD Script
  console.log('[2/5] Connecting to Redis Cloud & verifying Lua Compare-and-Delete...');
  const redis = initRedis();
  await new Promise((r) => setTimeout(r, 1500));
  const pong = await redis.ping();
  const hold = await acquireRedisSlotHold('test-mentor', '2099-01-01T10:00', 30);
  const wrongTokenRelease = await releaseRedisSlotHold('test-mentor', '2099-01-01T10:00', 'wrong-token');
  const rightTokenRelease = await releaseRedisSlotHold('test-mentor', '2099-01-01T10:00', hold.lockToken);
  console.log(`  -> Redis PING: ${pong} | Acquired: ${hold.acquired} | Wrong-Token CAD Blocked: ${!wrongTokenRelease} | Right-Token CAD Released: ${rightTokenRelease} ✅\n`);

  // 3. Ensure Default Lead Mentor User & MentorProfile (Deepak Sogani)
  console.log('[3/5] Provisioning authoritative Lead Mentor Profile (Deepak Sogani)...');
  let mentorUser = await prisma.user.upsert({
    where: { email: 'deepak@unfoldinn.com' },
    update: {
      name: 'Deepak Sogani',
      userType: 'mentor',
      onboardingCompleted: true,
      isActive: true
    },
    create: {
      email: 'deepak@unfoldinn.com',
      name: 'Deepak Sogani',
      userType: 'mentor',
      authProvider: 'email',
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      dpdpConsentConfirmed: true,
      dpdpConsentAt: new Date(),
      city: 'Jaipur',
      institutionOrOrg: 'Unfoldinn'
    }
  });

  const leadMentorProfile = await prisma.mentorProfile.upsert({
    where: { userId: mentorUser.id },
    update: {
      displayName: 'Mr. Deepak Sogani',
      standardSlots: DEFAULT_STANDARD_SLOTS,
      isAcceptingBookings: true
    },
    create: {
      userId: mentorUser.id,
      slug: 'deepak-sogani',
      displayName: 'Mr. Deepak Sogani',
      headline: 'Founder & Lead Mentor, Unfoldinn',
      bio: 'Mentoring young people aged 16–25 across career clarity, life transitions, and personal growth.',
      specializations: ['Youth Mentoring', 'Career Clarity', 'Life Transitions', 'Higher Education'],
      languages: ['English', 'Hindi'],
      defaultDurationMins: 45,
      bufferMins: 15,
      sessionFee: 500.00,
      timezone: 'Asia/Kolkata',
      standardSlots: DEFAULT_STANDARD_SLOTS,
      isAcceptingBookings: true
    }
  });

  // Seed recurring weekly MentorAvailability (Mon–Sun 10:00–20:00)
  for (let day = 0; day <= 6; day++) {
    await prisma.mentorAvailability.upsert({
      where: {
        mentorProfileId_dayOfWeek_startTime_endTime: {
          mentorProfileId: leadMentorProfile.id,
          dayOfWeek: day,
          startTime: '10:00',
          endTime: '20:00'
        }
      },
      update: { slotLabels: DEFAULT_STANDARD_SLOTS, isActive: true },
      create: {
        mentorProfileId: leadMentorProfile.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '20:00',
        slotLabels: DEFAULT_STANDARD_SLOTS,
        isActive: true
      }
    });
  }
  console.log(`  -> Lead MentorProfile ready: ${leadMentorProfile.displayName} (id=${leadMentorProfile.id}) ✅\n`);

  // 4. Connect to MongoDB Atlas to migrate existing data
  console.log('[4/5] Connecting to MongoDB Atlas to migrate existing records to Neon PostgreSQL...');
  await mongoose.connect(process.env.MONGODB_URI);

  // 4a. Admins
  const mongoAdmins = await LegacyAdmin.find({}).lean();
  for (const a of mongoAdmins) {
    await prisma.admin.upsert({
      where: { email: a.email.toLowerCase() },
      update: {
        name: a.name,
        passwordHash: a.password,
        role: a.role === 'superadmin' ? 'superadmin' : 'admin',
        isActive: a.isActive !== false
      },
      create: {
        email: a.email.toLowerCase(),
        name: a.name,
        passwordHash: a.password,
        role: a.role === 'superadmin' ? 'superadmin' : 'admin',
        isActive: a.isActive !== false,
        lastLogin: a.lastLogin || null
      }
    });
  }
  console.log(`  -> Migrated Admins: ${mongoAdmins.length}`);

  // 4b. Settings
  const mongoSettings = await LegacySetting.find({}).lean();
  for (const s of mongoSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {
        value: s.value,
        description: s.description || null,
        updatedBy: s.updatedBy || 'migration'
      },
      create: {
        key: s.key,
        value: s.value,
        description: s.description || null,
        updatedBy: s.updatedBy || 'migration'
      }
    });
  }
  console.log(`  -> Migrated Settings: ${mongoSettings.length}`);

  // 4c. Subscription Plans
  const mongoPlans = await LegacyPlan.find({}).lean();
  for (const p of mongoPlans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        subtitle: p.subtitle || null,
        description: p.description || null,
        planType: p.planType,
        sessionsCount: p.sessionsCount,
        durationDays: p.durationDays || 30,
        price: Number(p.price || 0),
        originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
        badgeText: p.badgeText || null,
        features: Array.isArray(p.features) ? p.features : [],
        isPopular: Boolean(p.isPopular),
        isActive: p.isActive !== false,
        sortOrder: p.sortOrder || 0
      },
      create: {
        code: p.code,
        name: p.name,
        subtitle: p.subtitle || null,
        description: p.description || null,
        planType: p.planType,
        sessionsCount: p.sessionsCount,
        durationDays: p.durationDays || 30,
        price: Number(p.price || 0),
        originalPrice: p.originalPrice != null ? Number(p.originalPrice) : null,
        badgeText: p.badgeText || null,
        features: Array.isArray(p.features) ? p.features : [],
        isPopular: Boolean(p.isPopular),
        isActive: p.isActive !== false,
        sortOrder: p.sortOrder || 0
      }
    });
  }
  console.log(`  -> Migrated SubscriptionPlans: ${mongoPlans.length}`);

  // 4d. Coupons
  const mongoCoupons = await LegacyCoupon.find({}).lean();
  for (const c of mongoCoupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        description: c.description || '',
        discountType: c.discountType === 'FLAT' ? 'FLAT' : 'PERCENTAGE',
        discountValue: Number(c.discountValue || 10),
        applicableTo: ['ALL', 'SINGLE_SESSION', 'SUBSCRIPTION'].includes(c.applicableTo) ? c.applicableTo : 'ALL',
        maxUses: c.maxUses || null,
        maxUsesPerUser: c.maxUsesPerUser ?? 1,
        usedCount: c.usedCount || 0,
        expiresAt: c.expiresAt || null,
        isActive: c.isActive !== false
      },
      create: {
        code: c.code,
        description: c.description || '',
        discountType: c.discountType === 'FLAT' ? 'FLAT' : 'PERCENTAGE',
        discountValue: Number(c.discountValue || 10),
        applicableTo: ['ALL', 'SINGLE_SESSION', 'SUBSCRIPTION'].includes(c.applicableTo) ? c.applicableTo : 'ALL',
        maxUses: c.maxUses || null,
        maxUsesPerUser: c.maxUsesPerUser ?? 1,
        usedCount: c.usedCount || 0,
        expiresAt: c.expiresAt || null,
        isActive: c.isActive !== false
      }
    });
  }
  console.log(`  -> Migrated Coupons: ${mongoCoupons.length}`);

  // 4e. Resources
  const mongoResources = await LegacyResource.find({}).lean();
  for (const r of mongoResources) {
    await prisma.resource.upsert({
      where: { slug: r.slug },
      update: {
        title: r.title,
        category: r.category,
        excerpt: String(r.excerpt || '').slice(0, 300),
        content: r.content,
        readingTime: r.readingTime || r.readTime || 5,
        readTime: r.readTime || r.readingTime || 5,
        author: r.author || 'Deepak Sogani',
        isPublished: Boolean(r.isPublished),
        tags: Array.isArray(r.tags) ? r.tags : []
      },
      create: {
        title: r.title,
        slug: r.slug,
        category: r.category,
        excerpt: String(r.excerpt || '').slice(0, 300),
        content: r.content,
        readingTime: r.readingTime || r.readTime || 5,
        readTime: r.readTime || r.readingTime || 5,
        author: r.author || 'Deepak Sogani',
        isPublished: Boolean(r.isPublished),
        tags: Array.isArray(r.tags) ? r.tags : []
      }
    });
  }
  console.log(`  -> Migrated Resources: ${mongoResources.length}`);

  // 4f. Opportunities
  const mongoOpps = await LegacyOpportunity.find({}).lean();
  const existingOppsCount = await prisma.opportunity.count();
  if (existingOppsCount === 0 && mongoOpps.length > 0) {
    for (const o of mongoOpps) {
      await prisma.opportunity.create({
        data: {
          name: o.name,
          category: o.category,
          bestFor: o.bestFor || null,
          eligibility: o.eligibility || null,
          whatItOffers: o.whatItOffers,
          locationMode: o.locationMode || null,
          location: o.location || null,
          deadline: o.deadline || null,
          costFunding: o.costFunding || o.costOrFunding || o.funding || null,
          costOrFunding: o.costOrFunding || o.costFunding || o.funding || null,
          funding: o.funding || o.costFunding || null,
          officialSource: o.officialSource || null,
          whyUseful: o.whyUseful || null,
          suggestedNextStep: o.suggestedNextStep || null,
          lastVerified: o.lastVerified || new Date(),
          isActive: o.isActive !== false,
          isFeatured: Boolean(o.isFeatured)
        }
      });
    }
  }
  console.log(`  -> Migrated Opportunities: ${mongoOpps.length}`);

  // 4g. Testimonials
  const mongoTestimonials = await LegacyTestimonial.find({}).lean();
  const existingTestCount = await prisma.testimonial.count();
  if (existingTestCount === 0 && mongoTestimonials.length > 0) {
    for (const t of mongoTestimonials) {
      await prisma.testimonial.create({
        data: {
          name: t.name,
          role: t.role || null,
          quote: String(t.quote || '').slice(0, 1000),
          isApproved: Boolean(t.isApproved),
          isFeatured: Boolean(t.isFeatured),
          order: t.order || 0
        }
      });
    }
  }
  console.log(`  -> Migrated Testimonials: ${mongoTestimonials.length}`);

  // 4h. Newsletters
  const mongoNewsletters = await LegacyNewsletter.find({}).lean();
  for (const n of mongoNewsletters) {
    await prisma.newsletter.upsert({
      where: { email: n.email.toLowerCase() },
      update: { name: n.name || null, isActive: n.isActive !== false },
      create: { email: n.email.toLowerCase(), name: n.name || null, isActive: n.isActive !== false }
    });
  }
  console.log(`  -> Migrated Newsletters: ${mongoNewsletters.length}`);

  // 4i. Google Integration
  const mongoGoogle = await LegacyGoogleIntegration.findOne({ key: 'primary_mentor_calendar' })
    .select('+refreshTokenEncrypted +accessTokenEncrypted +pendingOAuthStateHash')
    .lean();
  if (mongoGoogle) {
    await prisma.googleIntegration.upsert({
      where: { key: 'primary_mentor_calendar' },
      update: {
        status: mongoGoogle.status || 'disconnected',
        connectedEmail: mongoGoogle.connectedEmail || '',
        connectedName: mongoGoogle.connectedName || '',
        calendarId: mongoGoogle.calendarId || 'primary',
        scopes: Array.isArray(mongoGoogle.scopes) ? mongoGoogle.scopes : [],
        refreshTokenEncrypted: mongoGoogle.refreshTokenEncrypted || null,
        accessTokenEncrypted: mongoGoogle.accessTokenEncrypted || null,
        tokenExpiryDate: mongoGoogle.tokenExpiryDate || null,
        connectedAt: mongoGoogle.connectedAt || null,
        lastUsedAt: mongoGoogle.lastUsedAt || null
      },
      create: {
        key: 'primary_mentor_calendar',
        status: mongoGoogle.status || 'disconnected',
        connectedEmail: mongoGoogle.connectedEmail || '',
        connectedName: mongoGoogle.connectedName || '',
        calendarId: mongoGoogle.calendarId || 'primary',
        scopes: Array.isArray(mongoGoogle.scopes) ? mongoGoogle.scopes : [],
        refreshTokenEncrypted: mongoGoogle.refreshTokenEncrypted || null,
        accessTokenEncrypted: mongoGoogle.accessTokenEncrypted || null,
        tokenExpiryDate: mongoGoogle.tokenExpiryDate || null,
        connectedAt: mongoGoogle.connectedAt || null,
        lastUsedAt: mongoGoogle.lastUsedAt || null
      }
    });
    console.log('  -> Migrated GoogleIntegration: 1');
  }

  // 4j. Users
  const mongoUsers = await LegacyUser.find({}).select('+passwordHash').lean();
  for (const u of mongoUsers) {
    await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        googleId: u.googleId || undefined,
        passwordHash: u.passwordHash || undefined,
        name: u.name,
        avatar: u.avatar || '',
        onboardingCompleted: Boolean(u.onboardingCompleted),
        onboardingCompletedAt: u.onboardingCompletedAt || null,
        phone: u.phone || null,
        phoneVerified: Boolean(u.phoneVerified),
        whatsapp: u.whatsapp || null,
        age: u.age || null,
        ageGroup: u.ageGroup || null,
        isUnder18: Boolean(u.isUnder18),
        parentName: u.parentName || null,
        parentPhone: u.parentPhone || null,
        parentEmail: u.parentEmail || null,
        parentRelation: u.parentRelation || null,
        parentConsentConfirmed: Boolean(u.parentConsentConfirmed),
        dpdpConsentConfirmed: Boolean(u.dpdpConsentConfirmed),
        dpdpConsentAt: u.dpdpConsentAt || null,
        whereCurrently: u.whereCurrently || null,
        institutionOrOrg: u.institutionOrOrg || null,
        city: u.city || null,
        hasUsedFreeSession: Boolean(u.hasUsedFreeSession),
        totalSessionsCompleted: u.totalSessionsCompleted || 0
      },
      create: {
        email: u.email.toLowerCase(),
        googleId: u.googleId || null,
        passwordHash: u.passwordHash || null,
        name: u.name,
        avatar: u.avatar || '',
        authProvider: ['google', 'email', 'both'].includes(u.authProvider) ? u.authProvider : 'email',
        onboardingCompleted: Boolean(u.onboardingCompleted),
        onboardingCompletedAt: u.onboardingCompletedAt || null,
        userType: ['student', 'parent', 'institution', 'other'].includes(u.userType) ? u.userType : 'student',
        phone: u.phone || null,
        phoneVerified: Boolean(u.phoneVerified),
        whatsapp: u.whatsapp || null,
        age: u.age || null,
        ageGroup: u.ageGroup || null,
        isUnder18: Boolean(u.isUnder18),
        parentName: u.parentName || null,
        parentPhone: u.parentPhone || null,
        parentEmail: u.parentEmail || null,
        parentRelation: u.parentRelation || null,
        parentConsentConfirmed: Boolean(u.parentConsentConfirmed),
        dpdpConsentConfirmed: Boolean(u.dpdpConsentConfirmed),
        dpdpConsentAt: u.dpdpConsentAt || null,
        whereCurrently: u.whereCurrently || null,
        institutionOrOrg: u.institutionOrOrg || null,
        city: u.city || null,
        hasUsedFreeSession: Boolean(u.hasUsedFreeSession),
        totalSessionsCompleted: u.totalSessionsCompleted || 0
      }
    });
  }
  console.log(`  -> Migrated Users: ${mongoUsers.length}`);

  console.log('\n[5/5] Recording AuditLog entry in Neon PostgreSQL...');
  await prisma.auditLog.create({
    data: {
      actorRole: 'system',
      action: 'NEON_POSTGRES_INITIAL_MIGRATION_COMPLETED',
      entityType: 'System',
      metadata: {
        admins: mongoAdmins.length,
        settings: mongoSettings.length,
        plans: mongoPlans.length,
        resources: mongoResources.length,
        opportunities: mongoOpps.length,
        testimonials: mongoTestimonials.length,
        users: mongoUsers.length
      }
    }
  });

  console.log('\n========================================================================');
  console.log('✅ NEON POSTGRESQL + REDIS CLOUD INITIALIZATION & MIGRATION COMPLETE!');
  console.log('========================================================================');

  await mongoose.disconnect();
  await prisma.$disconnect();
  redis.disconnect();
}

runMigration().catch((err) => {
  console.error('MIGRATION FAILED:', err);
  process.exit(1);
});
