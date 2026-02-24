#!/usr/bin/env node

/**
 * CLI Wrapper for Scorecard Enrichment and Grading
 * 
 * This loads environment variables and runs the TypeScript script
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

// Run the TypeScript script
const scriptPath = path.join(__dirname, 'enrich-and-grade-scorecard.ts');
const args = process.argv.slice(2);

const child = spawn('npx', ['tsx', scriptPath, ...args], {
  stdio: 'inherit',
  env: process.env,
  cwd: path.join(__dirname, '..')
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
