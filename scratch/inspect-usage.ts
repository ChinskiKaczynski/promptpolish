import { generateText } from 'ai'

console.log('Inspecting generateText return structure...')
// Let's write a dummy function to see what type is inferred
async function dummy() {
  const result: any = {} as any
  console.log('Result properties:', Object.keys(result))
}
dummy()
