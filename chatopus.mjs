import Anthropic from '@anthropic-ai/sdk';
import 'dotenv/config'
import readline from 'node:readline/promises'
import fs from 'fs/promises'
import path from 'path'

import { stdin, stdout } from 'node:process'
const rl = readline.createInterface({ 
  input: stdin,
  output:stdout,
  terminal: true
})


const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_KEY
});

const YELLOW = '\x1b[33m';
const GREEN =  '\x1b[32m';
const RESET =  '\x1b[0m';

async function promptClaude(messages, system) {
  let result = ''
  const stream = await client.messages.create({ 
      messages,
      system,
      model: 'claude-3-opus-20240229',
      //model: 'claude-3-haiku-20240307',
      //model: 'claude-3-sonnet-20240229',
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

- otherwise output ONLY the code (with filename if writing file), without ANY additional commentary. 

For your output:

- IMPORTANT: assume code should be written to a file unless specified otherwise

- IMPORTANT: if you want the code to be written to a file, include a markdown code block with a filename and code comment at the top of the block, like this:

\`\`\`
// filename: example.js
console.log("This code will be written to example.js");
\`\`\`

- unless otherwise stated, it must be the complete FULL new source with ONLY required changes

- never use placeholders or TODOs

`

const messages = [
]

const commands = {
  add: async (messages, filename) => {
    let text = await fs.readFile(filename)
    const msg = `Contents of file [${filename}] for reference (no action or commentary needed at this time): \n\n${text}`
    messages.push({role: 'user', content: msg})
    return await promptClaude(messages, system)
  }
}

async function processCodeBlocks(response) {
  const codeBlockRegex = /\`\`\`(?:\w+)?\n\/\/ filename: ([\w\-./]+)\n([\s\S]*?)\`\`\`/g;
  let match;
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const filename = match[1];
    const code = match[2];
    await createBackup(filename);
    await fs.writeFile(filename, code);
    console.log(`File ${filename} has been created or updated.`);
  }
}

async function createBackup(filename) {
  const backupDir = '.backup';
  const backupFilename = `${filename}.${Date.now()}.bak`;
  const backupPath = path.join(backupDir, backupFilename);
  
  try {
    await fs.mkdir(backupDir, { recursive: true });
    await fs.copyFile(filename, backupPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error creating backup for ${filename}:`, err);
    }
  }
}

async function processInput(text, messages) {
  let lines = text.split('\n')
  for (let line of lines) {
    if (line.startsWith('/')) {
      let parts = line.substr(1).split(' ')
      const cmd = parts[0]
      parts.shift()
      const args = parts
      const response = await commands[cmd](messages, ...args)
      messages.push({ role: 'assistant', content: response });
      return response
    }
  }

  messages.push({ role: 'user', content: text });
  const response = await promptClaude(messages, system);
  await processCodeBlocks(response);
  messages.push({ role: 'assistant', content: response });
  return response;
}

async function loop() {
  while (true) {
    const input = await rl.question(GREEN + '> ' + YELLOW)
    console.log(RESET)
    if (input.includes('exit') || input.includes('bye')) process.exit(0)
    let response = await processInput(input, messages)
    console.log()
    console.log()
  }
}

loop()

