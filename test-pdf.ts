import fs from 'node:fs';
import { parseTransactionsPDF } from './src/lib/localParser.ts';

// Need to mock File for Node.js
class MockFile {
  buffer: Buffer;
  name: string;
  constructor(buffer: Buffer, name: string) {
    this.buffer = buffer;
    this.name = name;
  }
  async arrayBuffer() {
    return this.buffer.buffer.slice(this.buffer.byteOffset, this.buffer.byteOffset + this.buffer.byteLength);
  }
}

async function run() {
  const buffer = fs.readFileSync('Loanaccount20260628112142154.pdf');
  const file = new MockFile(buffer, 'test.pdf') as unknown as File;
  const txs = await parseTransactionsPDF(file);
  console.log(`Found ${txs.length} transactions`);
  for (const tx of txs) {
    console.log(`- ${tx.date}: ${tx.amount} (${tx.description})`);
  }
}

run().catch(console.error);
