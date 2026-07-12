import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

const migrationFiles = {
  baseline: '20260601170046_baseline_private_beta.sql',
  corrective: '20260612182355_corrective_privileges.sql',
  reservations: '20260612184028_usage_reservations.sql',
  feedback: '20260612184054_feedback_integrity.sql',
} as const

describe('Supabase Database Permission Grants - Static SQL Migration Analysis', () => {
  const migrationsDir = path.resolve(__dirname, '../../supabase/migrations')

  it(`ensures baseline migration ${migrationFiles.baseline} has no unsafe grants to anon/authenticated`, () => {
    const baselineFile = path.join(migrationsDir, migrationFiles.baseline)
    expect(fs.existsSync(baselineFile), 'Baseline migration must exist').toBe(true)

    const sql = fs.readFileSync(baselineFile, 'utf-8')

    // It must not grant REFERENCES, TRIGGER, TRUNCATE, MAINTAIN to anon or authenticated
    const unsafeGrants = [
      /GRANT\s+[^;]*?(REFERENCES|TRIGGER|TRUNCATE|MAINTAIN)[^;]*?TO\s+[^;]*?['"]?(anon|authenticated)['"]?/gi,
      /ALTER\s+DEFAULT\s+PRIVILEGES\s+[^;]*?GRANT\s+[^;]*?(REFERENCES|TRIGGER|TRUNCATE|MAINTAIN)[^;]*?TO\s+[^;]*?['"]?(anon|authenticated)['"]?/gi
    ]

    for (const pattern of unsafeGrants) {
      const match = sql.match(pattern)
      expect(match, `Baseline migration contains unsafe grants or default privileges: ${match}`).toBeNull()
    }

    // It must not grant SELECT on model_profiles to anon or authenticated
    expect(sql).not.toMatch(/GRANT\s+SELECT\s+ON\s+TABLE\s+[^;]*?model_profiles[^;]*?TO\s+[^;]*?['"]?(anon|authenticated)['"]?/i)
  })

  it(`ensures corrective migration ${migrationFiles.corrective} explicitly revokes dangerous privileges and configures the RPC`, () => {
    const correctiveFile = path.join(migrationsDir, migrationFiles.corrective)
    expect(fs.existsSync(correctiveFile), 'Corrective migration file must exist').toBe(true)

    const sql = fs.readFileSync(correctiveFile, 'utf-8')

    // Check that corrective SQL contains the required REVOKE statements
    expect(sql).toContain('REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON ALL TABLES IN SCHEMA "public" FROM "anon", "authenticated";')
    expect(sql).toContain('REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLES FROM "anon"')
    expect(sql).toContain('REVOKE REFERENCES, TRIGGER, TRUNCATE, MAINTAIN ON TABLES FROM "authenticated"')
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE "public"."prompt_analyses" FROM "anon", "authenticated";')
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE "public"."model_profiles" FROM "anon", "authenticated";')
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE "public"."stripe_customers" FROM "anon", "authenticated";')
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE "public"."subscriptions" FROM "anon", "authenticated";')

    // Check that SELECT policies on public tables are dropped
    expect(sql).toContain('DROP POLICY IF EXISTS "allow_public_read_model_profiles" ON "public"."model_profiles";')
    expect(sql).toContain('DROP POLICY IF EXISTS "users_read_own_stripe_customer" ON "public"."stripe_customers";')
    expect(sql).toContain('DROP POLICY IF EXISTS "users_read_own_subscription" ON "public"."subscriptions";')

    // Check that search RPC is created with SECURITY INVOKER and empty search_path
    expect(sql).toContain('CREATE OR REPLACE FUNCTION public.search_user_prompt_history')
    expect(sql).toContain('SECURITY INVOKER')
    expect(sql).toContain("SET search_path = ''")

    // Check that executing privileges are explicitly revoked and granted to service_role with exact signature
    const signature = 'public.search_user_prompt_history(UUID, UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, INTEGER, INTEGER)'
    expect(sql).toContain(`REVOKE EXECUTE ON FUNCTION ${signature} FROM PUBLIC;`)
    expect(sql).toContain(`REVOKE EXECUTE ON FUNCTION ${signature} FROM "anon";`)
    expect(sql).toContain(`REVOKE EXECUTE ON FUNCTION ${signature} FROM "authenticated";`)
    expect(sql).toContain(`GRANT EXECUTE ON FUNCTION ${signature} TO "service_role";`)
  })

  it(`ensures usage_reservations migration ${migrationFiles.reservations} revokes privileges and configures the RPCs`, () => {
    const file = path.join(migrationsDir, migrationFiles.reservations)
    expect(fs.existsSync(file), 'Usage reservations migration must exist').toBe(true)

    const sql = fs.readFileSync(file, 'utf-8')

    // Check table level revokes/grants
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE public.usage_reservations FROM "anon", "authenticated";')
    expect(sql).toContain('GRANT ALL ON TABLE public.usage_reservations TO "service_role";')

    // Check RPC configuration and SECURITY DEFINER
    const rpcs = [
      'public.acquire_usage_reservation',
      'public.complete_usage_reservation',
      'public.release_usage_reservation'
    ]

    for (const rpc of rpcs) {
      expect(sql).toContain(`CREATE OR REPLACE FUNCTION ${rpc}`)
      expect(sql).toContain('SECURITY DEFINER')
      expect(sql).toContain("SET search_path = ''")
    }

    // Check revokes/grants for acquire_usage_reservation
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, TEXT, UUID) FROM PUBLIC;')
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, TEXT, UUID) FROM "anon";')
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, TEXT, UUID) FROM "authenticated";')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.acquire_usage_reservation(UUID, TEXT, UUID) TO "service_role";')

    // Check revokes/grants for complete_usage_reservation
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.complete_usage_reservation(UUID) FROM PUBLIC;')
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.complete_usage_reservation(UUID) FROM "anon";')
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.complete_usage_reservation(UUID) FROM "authenticated";')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.complete_usage_reservation(UUID) TO "service_role";')

    // Check revokes/grants for release_usage_reservation
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.release_usage_reservation(UUID) FROM PUBLIC;')
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.release_usage_reservation(UUID) FROM "anon";')
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION public.release_usage_reservation(UUID) FROM "authenticated";')
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.release_usage_reservation(UUID) TO "service_role";')
  })

  it(`ensures feedback_integrity migration ${migrationFiles.feedback} revokes direct client access to feedback_events`, () => {
    const file = path.join(migrationsDir, migrationFiles.feedback)
    expect(fs.existsSync(file), 'Feedback integrity migration must exist').toBe(true)

    const sql = fs.readFileSync(file, 'utf-8')

    // Check table level revokes/grants for feedback_events
    expect(sql).toContain('REVOKE ALL PRIVILEGES ON TABLE public.feedback_events FROM "anon", "authenticated";')
    expect(sql).toContain('GRANT ALL ON TABLE public.feedback_events TO "service_role";')
  })
})
