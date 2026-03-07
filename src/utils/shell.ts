import { spawn } from 'child_process';
import { safeLog } from './logger';

export async function spawnCommand(command: string, args: string[] | string | undefined | null): Promise<any> {
    const normalizedArgs = Array.isArray(args) ? args : (args ? [args] : []);
  return new Promise((resolve, reject) => {
    const child = spawn(command, normalizedArgs, {
      cwd: process.cwd(),
      shell: true, // Allow shell features for general commands
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Command execution failed: ${error.message}`));
    });

    child.on('close', (code: number | null) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      } else {
        try {
          // Try to parse JSON if it looks like one
          if (stdout.trim().startsWith('{') || stdout.trim().startsWith('[')) {
            resolve(JSON.parse(stdout));
          } else {
            resolve(stdout.trim());
          }
        } catch (e) {
          resolve(stdout.trim());
        }
      }
    });
  });
}
