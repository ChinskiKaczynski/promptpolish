import { runRetentionCleanup } from '../lib/privacy/retention'

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run') || process.env.DRY_RUN === 'true'

  console.log(`[Retention CLI]: Starting database cleanup... Mode: ${isDryRun ? 'DRY RUN' : 'ACTIVE DELETE'}`)

  try {
    const result = await runRetentionCleanup({ dryRun: isDryRun })

    console.log('\n======================================')
    console.log(`  Retention Cleanup Execution Summary  `)
    console.log('======================================')
    console.log(`* Mode:                 ${result.dryRun ? 'DRY RUN (Preview Only)' : 'ACTIVE DELETE (Permanent)'}`)
    console.log(`* Prompt Analyses:      ${result.promptAnalysesDeleted} row(s) ${result.dryRun ? 'would be deleted' : 'deleted'}`)
    console.log(`* Usage Events:         ${result.usageEventsDeleted} row(s) ${result.dryRun ? 'would be deleted' : 'deleted'}`)
    console.log(`* Feedback Events:      ${result.feedbackEventsDeleted} row(s) ${result.dryRun ? 'would be deleted' : 'deleted'}`)
    console.log('======================================')
    
    if (result.dryRun) {
      console.log('[Retention CLI]: Dry run complete. No changes were made to the database.')
    } else {
      console.log('[Retention CLI]: Database cleanup completed successfully.')
    }
  } catch (error: any) {
    console.error('[Retention CLI Error]: Cleanup failed with an error:', error.message || error)
    process.exit(1)
  }
}

main()
