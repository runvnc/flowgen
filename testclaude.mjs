import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config'
import Readline from 'readline-promises'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_KEY
});


const io = new Readline()

async function next(messages, system) {
  let result = ''
  const stream = await client.messages.create({ 
      messages,
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      stream: true
  })
  for await (const msg of stream) {
    if (msg.delta?.text) {
      process.stdout.write(msg.delta.text)
      result += msg.delta.text
    }
  }
  return result
}

const system = 'You are a SOTA AI software engineer created by Anthropic with expert skills and knowledge in software engineering as well as specialized knowledge of Node.js, Node-RED, JavaScript, and Python. You always think through answers step-by-step and logically.'

const messages = []

async function loop() {
  while (true) {
    const input = await io.Question('> ')
    console.log()
    if (input.includes('exit') || input.includes('bye')) process.exit(0)
   
    messages.push({ role: 'user', content: input })
    const response = await next(messages, system)
    console.log()
    messages.push({ role: 'assistant', content: response })
  }
}

loop()
