// Comprehensive keyword database ported from Python backend

export const PROGRAMMING_LANGUAGES = new Set([
  'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'c', 'go', 'rust', 'swift',
  'kotlin', 'scala', 'ruby', 'php', 'perl', 'r', 'matlab', 'sql', 'html', 'css',
  'shell', 'bash', 'powershell', 'dart', 'objective-c', 'assembly', 'fortran', 'cobol',
  'haskell', 'erlang', 'elixir', 'clojure', 'f#', 'vb.net', 'delphi', 'lua'
]);

export const FRAMEWORKS_LIBRARIES = new Set([
  'react', 'angular', 'vue', 'svelte', 'nextjs', 'nuxtjs', 'gatsby', 'express',
  'fastapi', 'flask', 'django', 'spring', 'laravel', 'rails', 'asp.net', 'blazor',
  'xamarin', 'flutter', 'react native', 'ionic', 'cordova', 'electron', 'tauri',
  'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'matplotlib',
  'seaborn', 'plotly', 'bokeh', 'opencv', 'nltk', 'spacy', 'transformers',
  'bootstrap', 'tailwind', 'material-ui', 'chakra-ui', 'ant-design', 'bulma',
  'foundation', 'semantic-ui', 'jquery', 'lodash', 'moment', 'axios', 'graphql',
  'apollo', 'redux', 'mobx', 'vuex', 'pinia', 'rxjs', 'jest', 'mocha', 'cypress',
  'selenium', 'puppeteer', 'playwright', 'storybook', 'webpack', 'vite', 'rollup',
  'parcel', 'babel', 'eslint', 'prettier', 'husky', 'lint-staged', 'node.js',
  'nodejs', 'unit testing', 'test automation', 'ci/cd'
]);

export const CLOUD_PLATFORMS = new Set([
  'aws', 'azure', 'gcp', 'google cloud', 'digitalocean', 'linode', 'vultr',
  'heroku', 'netlify', 'vercel', 'firebase', 'supabase', 'planetscale',
  'mongodb atlas', 'redis cloud', 'cloudflare', 'fastly', 'cdn'
]);

export const AWS_SERVICES = new Set([
  'ec2', 'lambda', 's3', 'rds', 'dynamodb', 'cloudformation', 'cloudwatch',
  'iam', 'vpc', 'route53', 'cloudfront', 'api gateway', 'sqs', 'sns', 'ses',
  'elastic beanstalk', 'ecs', 'eks', 'fargate', 'ecr', 'codebuild', 'codedeploy',
  'codepipeline', 'cloudtrail', 'config', 'secrets manager', 'parameter store'
]);

export const DATABASES = new Set([
  'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
  'dynamodb', 'sqlite', 'oracle', 'sql server', 'mariadb', 'couchdb',
  'neo4j', 'influxdb', 'prometheus', 'grafana', 'tableau', 'power bi',
  'snowflake', 'bigquery', 'redshift', 'databricks', 'spark'
]);

export const DEVOPS_TOOLS = new Set([
  'docker', 'kubernetes', 'terraform', 'ansible', 'chef', 'puppet', 'vagrant',
  'jenkins', 'gitlab ci', 'github actions', 'circleci', 'travis ci', 'bamboo',
  'octopus deploy', 'azure devops', 'teamcity', 'concourse', 'drone',
  'helm', 'istio', 'prometheus', 'grafana', 'elk stack', 'logstash', 'kibana',
  'datadog', 'new relic', 'splunk', 'nagios', 'zabbix', 'consul', 'vault',
  'nomad', 'packer'
]);

export const VERSION_CONTROL = new Set([
  'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial', 'perforce',
  'azure repos', 'codecommit', 'sourcetree', 'gitkraken', 'tortoisegit'
]);

export const AI_ML_TECHNOLOGIES = new Set([
  'machine learning', 'deep learning', 'neural networks', 'nlp', 'computer vision',
  'reinforcement learning', 'supervised learning', 'unsupervised learning',
  'generative ai', 'genai', 'llm', 'gpt', 'bert', 'transformer', 'attention',
  'lstm', 'cnn', 'rnn', 'gan', 'vae', 'autoencoder', 'clustering', 'classification',
  'regression', 'recommendation systems', 'time series', 'anomaly detection',
  'feature engineering', 'model deployment', 'mlops', 'data science',
  'artificial intelligence', 'prompt engineering', 'fine-tuning', 'rag',
  'vector databases', 'embeddings', 'semantic search', 'chatbots', 'conversational ai',
  'claude', 'claude code', 'openai', 'anthropic', 'hugging face', 'langchain', 'llamaindex'
]);

export const METHODOLOGIES = new Set([
  'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'devops', 'ci/cd', 'tdd',
  'bdd', 'ddd', 'microservices', 'monolith', 'serverless', 'event-driven',
  'soa', 'rest', 'graphql', 'grpc', 'soap', 'api design', 'system design',
  'design patterns', 'solid principles', 'clean code', 'refactoring',
  'code review', 'pair programming', 'mob programming', 'continuous integration',
  'continuous deployment', 'continuous delivery', 'infrastructure as code',
  'gitops', 'blue-green deployment', 'canary deployment', 'feature flags',
  'full stack', 'frontend', 'backend', 'ui', 'apis', 'scalable', 'linting',
  'microservice architecture', 'root cause analysis', 'performance',
  'code generation', 'unit testing', 'test automation'
]);

export const SOFT_SKILLS = new Set([
  'communication', 'leadership', 'teamwork', 'collaboration', 'problem-solving',
  'critical thinking', 'analytical thinking', 'creativity', 'innovation',
  'adaptability', 'flexibility', 'time management', 'project management',
  'organization', 'attention to detail', 'multitasking', 'decision making',
  'conflict resolution', 'negotiation', 'presentation', 'public speaking',
  'mentoring', 'coaching', 'training', 'documentation', 'technical writing',
  'customer service', 'client relations', 'stakeholder management',
  'cross-functional collaboration', 'remote work', 'self-motivated',
  'proactive', 'initiative', 'ownership', 'accountability', 'reliability',
  'punctuality', 'professional', 'ethical', 'integrity', 'empathy',
  'emotional intelligence', 'cultural awareness', 'diversity', 'inclusion'
]);

export const EDUCATION_CERTIFICATIONS = new Set([
  'bachelor', 'master', 'phd', 'associate', 'diploma', 'certificate',
  'computer science', 'software engineering', 'information technology',
  'computer engineering', 'electrical engineering', 'data science',
  'information systems', 'cybersecurity', 'network security',
  'aws certified', 'azure certified', 'google cloud certified',
  'cisco certified', 'comptia', 'cissp', 'cism', 'cisa', 'pmp',
  'scrum master', 'product owner', 'itil', 'togaf', 'cobit',
  'certified kubernetes administrator', 'ckad', 'terraform certified',
  'docker certified', 'jenkins certified', 'mongodb certified',
  'oracle certified', 'microsoft certified', 'salesforce certified',
  "bachelor's degree", "master's degree", 'gpa', 'postgraduate',
  'software engineering degree', 'electrical engineering degree',
  'data science degree'
]);

export const TECHNICAL_CONCEPTS = new Set([
  'algorithms', 'data structures', 'object-oriented programming', 'functional programming',
  'procedural programming', 'concurrent programming', 'parallel programming',
  'distributed systems', 'scalability', 'performance optimization', 'caching',
  'load balancing', 'high availability', 'fault tolerance', 'disaster recovery',
  'backup', 'monitoring', 'logging', 'debugging', 'testing', 'unit testing',
  'integration testing', 'end-to-end testing', 'performance testing',
  'security testing', 'penetration testing', 'vulnerability assessment',
  'code quality', 'static analysis', 'dynamic analysis', 'profiling',
  'benchmarking', 'optimization', 'refactoring', 'legacy code',
  'technical debt', 'code smell', 'clean architecture', 'hexagonal architecture',
  'event sourcing', 'cqrs', 'saga pattern', 'circuit breaker', 'bulkhead',
  'rate limiting', 'throttling', 'backpressure', 'eventual consistency'
]);

export const SECURITY_CONCEPTS = new Set([
  'cybersecurity', 'information security', 'network security', 'application security',
  'cloud security', 'data security', 'privacy', 'gdpr', 'compliance', 'audit',
  'encryption', 'decryption', 'hashing', 'digital signatures', 'certificates',
  'pki', 'ssl', 'tls', 'https', 'oauth', 'jwt', 'saml', 'ldap', 'active directory',
  'authentication', 'authorization', 'access control', 'rbac', 'abac',
  'identity management', 'single sign-on', 'multi-factor authentication',
  'biometrics', 'firewall', 'ids', 'ips', 'siem', 'soc', 'incident response',
  'forensics', 'malware', 'virus', 'trojan', 'ransomware', 'phishing',
  'social engineering', 'penetration testing', 'vulnerability scanning',
  'risk assessment', 'threat modeling', 'security architecture'
]);

export const JOB_FUNCTIONS = new Set([
  'software developer', 'software engineer', 'full stack developer', 'frontend developer',
  'backend developer', 'mobile developer', 'web developer', 'game developer',
  'devops engineer', 'site reliability engineer', 'platform engineer',
  'cloud engineer', 'infrastructure engineer', 'network engineer',
  'security engineer', 'data engineer', 'data scientist', 'data analyst',
  'machine learning engineer', 'ai engineer', 'research scientist',
  'product manager', 'project manager', 'program manager', 'tech lead',
  'team lead', 'engineering manager', 'architect', 'principal engineer',
  'staff engineer', 'consultant', 'analyst', 'specialist', 'administrator',
  'support engineer', 'qa engineer', 'test engineer', 'automation engineer',
  'build engineer', 'release engineer', 'solutions architect',
  'enterprise architect', 'systems architect', 'database administrator',
  'system administrator', 'network administrator', 'security analyst',
  'cybersecurity specialist', 'penetration tester', 'ethical hacker'
]);

export const NOISE_WORDS = new Set([
  'ability', 'access', 'accordance', 'action', 'america', 'applicable', 'application',
  'applying', 'at least', 'attendance', 'basic', 'benefits', 'best', 'building',
  'certain', 'change', 'class', 'company', 'compensation', 'compliance', 'connection',
  'consideration', 'daily', 'deltek', 'employees', 'employment', 'end', 'enthusiasm',
  'equity', 'every', 'experience', 'expertise', 'factors', 'first', 'forbes',
  'glassdoor', 'government', 'haves', 'healthcare', 'holidays', 'immense', 'incentive',
  'individual', 'information', 'interest', 'job-related', 'knowledge', 'known',
  'location', 'measurable', 'millions', 'mindset', 'modern', 'one', 'opportunities',
  'organizations', 'our', 'perks', 'personal', 'practices', 'prior', 'production',
  'productivity', 'professional', 'proficiency', 'project', 'promotion', 'projects',
  'qualifications', 'recent', 'required', 'responsible', 'skills', 'solutions',
  'strong', 'students', 'technical', 'the', 'their', 'this', 'time', 'training',
  'travel', 'u.s.', 'users', 'vacation', 'washington', 'world', 'your', 'plan',
  'insurance', 'tuition', 'reimbursement', 'disability', 'coverage', 'life',
  'privacy', 'notice', 'data', 'controller', 'process', 'statements', 'candidate',
  'protection', 'promotion', 'sold', 'sell', 'provide', 'job', 'application',
  'process', 'range', 'subject', 'takes', 'number', 'determining', 'base',
  'pay', 'such', 'as', 'related', 'eligible', 'additional', 'rewards', 'including',
  'depending', 'nature', 'with', 'have', 'paid', 'well-living', 'programs',
  'short-term', 'long-term', 'requirements', 'no'
]);

// Combined sets for easy lookup
export const ALL_TECHNICAL_TERMS = new Set([
  ...PROGRAMMING_LANGUAGES,
  ...FRAMEWORKS_LIBRARIES,
  ...CLOUD_PLATFORMS,
  ...AWS_SERVICES,
  ...DATABASES,
  ...DEVOPS_TOOLS,
  ...VERSION_CONTROL,
  ...AI_ML_TECHNOLOGIES,
  ...METHODOLOGIES,
  ...TECHNICAL_CONCEPTS,
  ...SECURITY_CONCEPTS
]);

export const ALL_SKILLS = new Set([...ALL_TECHNICAL_TERMS, ...SOFT_SKILLS]);
export const ALL_QUALIFICATIONS = new Set([...EDUCATION_CERTIFICATIONS]);

// Category classification functions
export function isTechnicalTerm(term: string): boolean {
  return ALL_TECHNICAL_TERMS.has(term.toLowerCase());
}

export function isSoftSkill(term: string): boolean {
  return SOFT_SKILLS.has(term.toLowerCase());
}

export function isQualification(term: string): boolean {
  return ALL_QUALIFICATIONS.has(term.toLowerCase());
}

export function isNoiseWord(term: string): boolean {
  return NOISE_WORDS.has(term.toLowerCase());
}

export function isJobFunction(term: string): boolean {
  return JOB_FUNCTIONS.has(term.toLowerCase());
}

export function getKeywordCategory(term: string): 'technical' | 'softSkill' | 'qualification' | 'jobFunction' | 'other' {
  const termLower = term.toLowerCase();
  
  if (ALL_TECHNICAL_TERMS.has(termLower)) {
    return 'technical';
  } else if (SOFT_SKILLS.has(termLower)) {
    return 'softSkill';
  } else if (ALL_QUALIFICATIONS.has(termLower)) {
    return 'qualification';
  } else if (JOB_FUNCTIONS.has(termLower)) {
    return 'jobFunction';
  } else {
    return 'other';
  }
}

// Keyword variations and normalization
export const KEYWORD_VARIATIONS: Record<string, string[]> = {
  'javascript': ['js', 'node.js', 'nodejs'],
  'typescript': ['ts'],
  'python': ['py'],
  'react': ['reactjs', 'react.js'],
  'angular': ['angularjs', 'angular.js'],
  'vue': ['vuejs', 'vue.js'],
  'aws': ['amazon web services'],
  'gcp': ['google cloud platform'],
  'azure': ['microsoft azure'],
  'postgresql': ['postgres'],
  'mongodb': ['mongo'],
  'mysql': ['my sql'],
  'docker': ['containerization'],
  'kubernetes': ['k8s'],
  'jenkins': ['ci/cd'],
  'git': ['version control'],
  'agile': ['scrum'],
  'machine learning': ['ml', 'artificial intelligence', 'ai'],
  'artificial intelligence': ['ai', 'machine learning', 'ml'],
  'devops': ['dev ops'],
  'rest api': ['restful', 'api'],
  'graphql': ['graph ql'],
  'sql': ['database'],
  'nosql': ['no sql'],
  'ci/cd': ['continuous integration', 'continuous deployment'],
  'full stack': ['fullstack', 'full-stack'],
  'frontend': ['front-end', 'front end'],
  'backend': ['back-end', 'back end'],
  'node.js': ['nodejs', 'node js'],
  'next.js': ['nextjs', 'next js'],
  'c++': ['cpp', 'c plus plus'],
  'c#': ['csharp', 'c sharp']
};

export function generateKeywordVariations(keyword: string): string[] {
  const variations: string[] = [keyword];
  const keywordLower = keyword.toLowerCase();
  
  // Add known variations
  if (KEYWORD_VARIATIONS[keywordLower]) {
    variations.push(...KEYWORD_VARIATIONS[keywordLower]);
  }
  
  // Add plural/singular variations
  if (keyword.endsWith('s') && keyword.length > 3) {
    variations.push(keyword.slice(0, -1)); // Remove 's'
  } else {
    variations.push(keyword + 's'); // Add 's'
  }
  
  return [...new Set(variations)]; // Remove duplicates
}

export function normalizeKeyword(keyword: string): string {
  // Remove extra whitespace
  let normalized = keyword.trim().toLowerCase();
  
  // Handle common variations
  const replacements: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'nodejs': 'node.js',
    'node js': 'node.js',
    'reactjs': 'react',
    'react js': 'react',
    'amazon web services': 'aws',
    'ci cd': 'ci/cd',
    'cicd': 'ci/cd',
    'ml': 'machine learning',
    'ai': 'artificial intelligence',
    'fullstack': 'full stack',
    'full-stack': 'full stack',
    'front-end': 'frontend',
    'front end': 'frontend',
    'back-end': 'backend',
    'back end': 'backend',
    'nextjs': 'next.js',
    'next js': 'next.js',
    'cpp': 'c++',
    'c plus plus': 'c++',
    'csharp': 'c#',
    'c sharp': 'c#'
  };
  
  return replacements[normalized] || normalized;
}