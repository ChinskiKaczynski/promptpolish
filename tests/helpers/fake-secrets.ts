export function fakeStripeSecretKey(
  mode: 'test' | 'live' = 'test',
): string {
  return ['sk', mode, '51FixtureOnlyNotARealCredential'].join('_')
}

export function fakeStripePublishableKey(
  mode: 'test' | 'live' = 'test',
): string {
  return ['pk', mode, '51FixtureOnlyNotARealCredential'].join('_')
}
