const { PrismaClient, Prisma } = require('@prisma/client');

// Singleton Prisma Client for Neon PostgreSQL (Elephant Layer)
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.__unfoldinnPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__unfoldinnPrisma = prisma;
}

/**
 * Apply native PostgreSQL engine constraints (btree_gist overlap exclusion & CHECK constraints)
 * Idempotent: safe to run on startup or after migrations.
 */
async function ensurePostgresEngineConstraints() {
  const statements = [
    `CREATE EXTENSION IF NOT EXISTS btree_gist;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'slot_locks_no_mentor_time_overlap') THEN
        ALTER TABLE "slot_locks"
        ADD CONSTRAINT "slot_locks_no_mentor_time_overlap"
        EXCLUDE USING gist (
          "mentorProfileId" WITH =,
          tsrange("startAt", "endAt", '[)') WITH &&
        ) WHERE ("status" IN ('confirmed', 'pending_payment'));
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_mentor_time_overlap') THEN
        ALTER TABLE "bookings"
        ADD CONSTRAINT "bookings_no_mentor_time_overlap"
        EXCLUDE USING gist (
          "mentorProfileId" WITH =,
          tsrange("scheduledStartAt", "scheduledEndAt", '[)') WITH &&
        ) WHERE ("status" IN ('pending', 'confirmed') AND "scheduledStartAt" IS NOT NULL AND "scheduledEndAt" IS NOT NULL);
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_order_purpose_target') THEN
        ALTER TABLE "payment_orders"
        ADD CONSTRAINT "chk_payment_order_purpose_target"
        CHECK (
          ("purpose" = 'single_booking' AND "bookingId" IS NOT NULL AND "userSubscriptionId" IS NULL) OR
          ("purpose" = 'subscription_purchase' AND "userSubscriptionId" IS NOT NULL AND "bookingId" IS NULL) OR
          ("purpose" = 'support_contribution' AND "bookingId" IS NULL AND "userSubscriptionId" IS NULL)
        );
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payment_order_amounts_non_negative') THEN
        ALTER TABLE "payment_orders"
        ADD CONSTRAINT "chk_payment_order_amounts_non_negative"
        CHECK ("baseAmount" >= 0 AND "discountAmount" >= 0 AND "expectedAmount" >= 0 AND "paidAmount" >= 0 AND "refundedAmount" >= 0);
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_subscription_credits_balance') THEN
        ALTER TABLE "user_subscriptions"
        ADD CONSTRAINT "chk_subscription_credits_balance"
        CHECK ("totalCredits" >= 1 AND "usedCredits" >= 0 AND "remainingCredits" >= 0 AND ("usedCredits" + "remainingCredits" = "totalCredits"));
      END IF;
    END $$;`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_coupon_used_count_non_negative') THEN
        ALTER TABLE "coupons"
        ADD CONSTRAINT "chk_coupon_used_count_non_negative"
        CHECK ("usedCount" >= 0 AND ("maxUses" IS NULL OR "maxUses" <= 0 OR "usedCount" <= "maxUses"));
      END IF;
    END $$;`
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn('[PostgreSQL Constraint Notice]:', err.message);
    }
  }
}

/**
 * Pure API Boundary Serializer:
 * - Keeps PostgreSQL & Prisma 100% pure with `id` (UUID) and `Decimal(12,2)`.
 * - At the HTTP JSON response boundary, converts Prisma.Decimal to Number and maps `_id: obj.id`
 *   only for frontend compatibility so existing UI components never break.
 */
function toApiResponse(val) {
  if (val === null || val === undefined) return val;
  if (val instanceof Date) return val;
  if (Prisma.Decimal.isDecimal(val) || (val && typeof val === 'object' && val.constructor?.name === 'Decimal')) {
    return Number(val.toString());
  }
  if (Array.isArray(val)) {
    return val.map(toApiResponse);
  }
  if (typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = toApiResponse(v);
    }
    if (out.id && !out._id) {
      out._id = out.id;
    }
    return out;
  }
  return val;
}

module.exports = {
  prisma,
  Prisma,
  ensurePostgresEngineConstraints,
  toApiResponse
};
