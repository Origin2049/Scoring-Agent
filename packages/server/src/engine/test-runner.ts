import * as path from 'node:path';
import * as fs from 'node:fs';
import { spawn } from 'node:child_process';
import type { AgentMetadata, TestDefinition, TestResult } from '@asp/shared';

interface TestRunResult {
  testDefinitionId: number;
  status: TestResult['status'];
  outputJson?: string;
  errorJson?: string;
  durationMs: number;
  metricsJson?: string;
}

/**
 * Execute all test definitions against the agent in a sandboxed child process.
 */
export async function executeTests(
  agent: AgentMetadata,
  tests: TestDefinition[],
): Promise<TestRunResult[]> {
  const results: TestRunResult[] = [];

  for (const test of tests) {
    const result = await runSingleTest(agent, test);
    results.push(result);
  }

  return results;
}

async function runSingleTest(
  agent: AgentMetadata,
  test: TestDefinition,
): Promise<TestRunResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    try {
      // Check if agent entry file exists
      const entryPath = path.join(agent.extractedPath, agent.entryFile);
      if (!fs.existsSync(entryPath)) {
        resolve({
          testDefinitionId: test.id!,
          status: 'error',
          errorJson: JSON.stringify({ message: `Entry file not found: ${entryPath}` }),
          durationMs: Date.now() - startTime,
        });
        return;
      }

      // Use child_process fork for sandboxed execution
      const sandboxScript = path.join(import.meta.dirname, 'sandbox-worker.js');

      // We'll write the sandbox worker content inline since we need it compiled
      const workerCode = getSandboxWorkerCode();
      const workerPath = path.join(agent.extractedPath, '.sandbox-worker.mjs');
      fs.writeFileSync(workerPath, workerCode, 'utf-8');

      // On Windows, we need to use spawn rather than fork for ESM
      const child = spawn('node', [
        '--max-old-space-size=512',
        workerPath,
        entryPath,
        test.inputJson,
        test.expectedOutputJson || '{}',
        String(test.timeoutMs),
      ], {
        cwd: agent.extractedPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: test.timeoutMs + 5000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
        if (stdout.length > 1024 * 1024) stdout = stdout.substring(0, 1024 * 1024); // Cap at 1MB
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
        if (stderr.length > 1024 * 1024) stderr = stderr.substring(0, 1024 * 1024);
      });

      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        resolve({
          testDefinitionId: test.id!,
          status: 'timeout',
          errorJson: JSON.stringify({ message: `Test timed out after ${test.timeoutMs}ms` }),
          durationMs: Date.now() - startTime,
          outputJson: stdout ? JSON.stringify({ output: stdout.substring(0, 10000) }) : undefined,
        });
      }, test.timeoutMs);

      child.on('close', (code: number | null) => {
        clearTimeout(timeout);
        const durationMs = Date.now() - startTime;

        try {
          // Try to parse the last line of stdout as JSON result
          const lines = stdout.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          let parsedResult: Record<string, unknown> | null = null;

          try {
            parsedResult = JSON.parse(lastLine);
          } catch {
            // Not JSON, use raw output
          }

          if (code === 0 && parsedResult) {
            resolve({
              testDefinitionId: test.id!,
              status: parsedResult.status as TestResult['status'] || 'passed',
              outputJson: JSON.stringify(parsedResult.output || parsedResult),
              durationMs,
              metricsJson: parsedResult.metrics ? JSON.stringify(parsedResult.metrics) : undefined,
            });
          } else {
            resolve({
              testDefinitionId: test.id!,
              status: code === 0 ? 'passed' : 'error',
              outputJson: parsedResult ? JSON.stringify(parsedResult) : stdout
                ? JSON.stringify({ output: stdout.substring(0, 10000) })
                : undefined,
              errorJson: stderr ? JSON.stringify({ stderr: stderr.substring(0, 5000), exitCode: code }) : undefined,
              durationMs,
              metricsJson: parsedResult?.metrics ? JSON.stringify(parsedResult.metrics) : JSON.stringify({
                exitCode: code,
                durationMs,
                hasStderr: stderr.length > 0,
              }),
            });
          }
        } catch (err) {
          resolve({
            testDefinitionId: test.id!,
            status: 'error',
            errorJson: JSON.stringify({ message: (err as Error).message }),
            durationMs,
          });
        }
      });

      child.on('error', (err: Error) => {
        clearTimeout(timeout);
        resolve({
          testDefinitionId: test.id!,
          status: 'error',
          errorJson: JSON.stringify({ message: err.message }),
          durationMs: Date.now() - startTime,
        });
      });
    } catch (err) {
      resolve({
        testDefinitionId: test.id!,
        status: 'error',
        errorJson: JSON.stringify({ message: (err as Error).message }),
        durationMs: Date.now() - startTime,
      });
    }
  });
}

function getSandboxWorkerCode(): string {
  return `
import * as fs from 'node:fs';
import * as path from 'node:path';

const [entryPath, inputJson, expectedJson, timeoutStr] = process.argv.slice(2);

const timeoutMs = parseInt(timeoutStr || '30000', 10);

async function run() {
  const startTime = Date.now();

  // Set a safety timeout
  const safetyTimer = setTimeout(() => {
    console.error('Sandbox: self-terminating due to timeout');
    process.exit(124);
  }, timeoutMs);

  try {
    // Parse inputs
    const input = JSON.parse(inputJson);
    const expected = JSON.parse(expectedJson || '{}');

    // Dynamically import the agent
    const entryAbsPath = path.resolve(entryPath);
    const agentModule = await import('file:///' + entryAbsPath.replace(/\\\\/g, '/'));

    // Find the run function
    const runFn = agentModule.run || agentModule.default?.run || agentModule.default;

    if (typeof runFn !== 'function') {
      throw new Error('Agent does not export a run() function');
    }

    // Execute the agent
    const result = await runFn(input);

    // Collect metrics
    const durationMs = Date.now() - startTime;
    const outputSize = JSON.stringify(result).length;

    const metrics = {
      durationMs,
      outputSize,
      tokenCount: result.metadata?.tokenCount || result.tokenCount || outputSize / 4, // rough estimate
      apiCallCount: result.metadata?.apiCallCount || result.apiCallCount || 1,
      timeToFirstResponseMs: durationMs,
    };

    // Output result as JSON
    process.stdout.write(JSON.stringify({
      status: 'passed',
      output: result,
      metrics,
    }));

    clearTimeout(safetyTimer);
    process.exit(0);
  } catch (err) {
    const durationMs = Date.now() - startTime;

    process.stdout.write(JSON.stringify({
      status: 'error',
      output: null,
      error: {
        message: err.message,
        stack: err.stack?.substring(0, 2000),
      },
      metrics: {
        durationMs,
        errorType: err.name || 'Error',
      },
    }));

    clearTimeout(safetyTimer);
    process.exit(1);
  }
}

run();
`;
}
