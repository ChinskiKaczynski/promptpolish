// Scratch: inspect generateText return structure
// This file is for local development inspection only.
console.log('Inspecting generateText return structure...')

async function dummy() {
  const result: Record<string, unknown> = {}
  console.log('Result properties:', Object.keys(result))
}
dummy()
