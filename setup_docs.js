const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const docsDir = path.join(projectRoot, 'project_docs');
const localesDir = path.join(projectRoot, 'locales');
const plansDir = path.join(projectRoot, 'plans');

// Create directories
[docsDir, path.join(docsDir, 'CHANGELOG_ARCHIVE'), path.join(docsDir, 'TASKS_ARCHIVE'), localesDir, plansDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Copy rules.txt to .rules
fs.copyFileSync(path.join(projectRoot, 'rules.txt'), path.join(projectRoot, '.rules'));

// Copy VIBE_CODING_GUIDE.txt to project_docs/VIBE_CODING_GUIDE.md
fs.copyFileSync(path.join(projectRoot, 'VIBE_CODING_GUIDE.txt'), path.join(docsDir, 'VIBE_CODING_GUIDE.md'));

// Create locales
fs.writeFileSync(path.join(localesDir, 'tr.js'), 'module.exports = {};\n');
fs.writeFileSync(path.join(localesDir, 'en.js'), 'module.exports = {};\n');

// Create .env and .env.example
fs.writeFileSync(path.join(projectRoot, '.env.example'), '');
fs.writeFileSync(path.join(projectRoot, '.env'), '');

// Append .env to .gitignore if not exists
const gitignorePath = path.join(projectRoot, '.gitignore');
let gitignore = '';
if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf8');
}
if (!gitignore.includes('.env')) {
    fs.appendFileSync(gitignorePath, '\n.env\n');
}

// Parse VIBE_CODING_GUIDE to extract templates
const guideContent = fs.readFileSync(path.join(projectRoot, 'VIBE_CODING_GUIDE.txt'), 'utf8');

const templatesToExtract = [
    'PRD.md', 'SRS.md', 'SAD.md', 'LOCALIZATION.md', 'DEPLOYMENT.md', 
    'PROMPTS_LIBRARY.md', 'DATABASE_SCHEMA.md', 'API_SPECIFICATION.md', 
    'UI_UX_GUIDELINES.md', 'DEVELOPMENT_ROADMAP.md', 'MEMORY.md', 
    'GLOSSARY.md', 'CHANGELOG.md', 'TASKS.md', 'TECHNICAL_DEBT.md', 
    'DECISIONS.md', 'RISKS.md', 'FILE_STRUCTURE.md', 'TESTING_STATUS.md', 
    'ENVIRONMENT.md', 'SECURITY.md'
];

for (const fileName of templatesToExtract) {
    // Regex to find the markdown block after the file name header
    // The guide uses "### filename.md" or similar, followed by "```markdown"
    const regex = new RegExp(`### ${fileName.replace('.', '\\.')}[\\s\\S]*?\`\`\`markdown\\n([\\s\\S]*?)\`\`\``);
    const match = guideContent.match(regex);
    if (match && match[1]) {
        fs.writeFileSync(path.join(docsDir, fileName), match[1].trim() + '\n');
    } else {
        // Fallback if not found
        fs.writeFileSync(path.join(docsDir, fileName), `# ${fileName}\n`);
    }
}

console.log('Documentation structure created successfully.');
