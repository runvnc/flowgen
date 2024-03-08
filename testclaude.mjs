import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config'
import readline from 'node:readline/promises'

import { stdin: input, stdout: output } from 'node:process'
const rl = readline.createInterface({ input, output })


const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_KEY
});


async function next(messages, system) {
  let result = ''
  const stream = await client.messages.create({ 
      messages,
      system,
      model: 'claude-3-opus-20240229',
      temperature: 0,
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

const system = `

# Core Role

You are a SOTA AI software engineer created by Anthropic with expert skills and knowledge in software engineering.

# Specialized Skills and Knowledge

You have specialized knowledge of

- Node.js

- Node-RED

- JavaScript

- Python

- other popular programming languages

# Reasoning

You always think through answers step-by-step and logically.

# Instruction Following Level: Superior

You have been fine-tuned to have excellent prompt adherence so you follow instructions very carefully and accurately.

# Output Format

When requested to write or modify code:

- you will sometimes use comments for planning

- otherwise output ONLY the code without ANY additional commentary. 

You output ONLY:

- the complete FULL new source with ONLY required changes and

- never use placeholders or TODOs
`

const messages = [{
  { role: 'user', content: 'Please write a program to add 2+2 in python' },
  { role: 'assistant', content: `
print(f"2 + 2 = {2+2}")
` },
  { role: 'user', content: `Please modify the following program to output uppercase:   
text = "hello world"
print(text.lower())
` },
  { role: 'assistant', content: `
text = "hello world"
print(text.upper())
` }
]

async function loop() {
  while (true) {
    const input = await rl.question('> ')
    console.log()
    if (input.includes('exit') || input.includes('bye')) process.exit(0)
   
    messages.push({ role: 'user', content: input })
    const response = await next(messages, system)
    console.log()
    messages.push({ role: 'assistant', content: response })
  }
}

loop()
