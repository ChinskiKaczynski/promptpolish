import { generateText } from 'ai'
type Usage = Awaited<ReturnType<typeof generateText>>['usage'];
const u: Usage = {
  abc: 123
} as any
console.log(u)
