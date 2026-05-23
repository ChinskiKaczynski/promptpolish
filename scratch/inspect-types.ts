import { generateText } from 'ai'
type Usage = Awaited<ReturnType<typeof generateText>>['usage'];
const u = {
  abc: 123
} as unknown as Usage
console.log(u)
