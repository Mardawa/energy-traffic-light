const { execSync } = require('child_process');
const path = require('path');

const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to execute ${command}`, error);
    return false;
  }
  return true;
};

const repoUrl = 'git@github.com:Mardawa/energy-traffic-light.git';

const main = () => {
  const currentDir = process.cwd();
  const buildDir = path.join(currentDir, 'dist');

  // Build the project
  if (!runCommand('npm run build')) {
    console.log('Build failed');
    return;
  }

  // Navigate to the build directory
  process.chdir(buildDir);

  // Initialize git and force-push to gh-pages branch
  if (!runCommand('git init')) return;
  if (!runCommand('git checkout -b gh-pages')) return;
  if (!runCommand('git add -A')) return;
  if (!runCommand('git commit -m "Deploy to GitHub Pages"')) return;
  if (!runCommand(`git push -f ${repoUrl} gh-pages:gh-pages`)) return;

  // Clean up
  process.chdir(currentDir);
  if (!runCommand(`rm -rf ${buildDir}/.git`)) return;

  console.log('Successfully deployed');
};

main();