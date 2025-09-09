#!/usr/bin/env node

/**
 * AFZ Deployment Configuration Script
 * Helps set up environment variables for different deployment platforms
 */

const fs = require('fs');
const path = require('path');

class AFZDeploymentConfig {
    constructor() {
        this.platforms = ['netlify', 'vercel', 'railway', 'heroku'];
        this.envTemplate = path.join(__dirname, '..', '.env.template');
        this.outputDir = path.join(__dirname, '..', 'deployment-configs');
        
        this.ensureOutputDir();
    }

    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    parseEnvTemplate() {
        if (!fs.existsSync(this.envTemplate)) {
            throw new Error('.env.template file not found');
        }

        const content = fs.readFileSync(this.envTemplate, 'utf8');
        const variables = [];
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key, ...valueParts] = trimmed.split('=');
                const value = valueParts.join('=');
                variables.push({
                    key: key.trim(),
                    value: value.trim(),
                    isPlaceholder: value.includes('your-') || value.includes('demo') || value.includes('sandbox')
                });
            }
        }

        return variables;
    }

    generateNetlifyConfig(variables) {
        const config = {
            build: {
                command: "npm run build",
                publish: ".",
                environment: {}
            },
            redirects: [
                {
                    from: "/api/*",
                    to: "https://your-backend-url.com/api/:splat",
                    status: 200,
                    force: true
                }
            ],
            headers: [
                {
                    for: "/*",
                    values: {
                        "X-Frame-Options": "DENY",
                        "X-XSS-Protection": "1; mode=block",
                        "X-Content-Type-Options": "nosniff",
                        "Referrer-Policy": "strict-origin-when-cross-origin"
                    }
                }
            ]
        };

        // Add environment variables
        variables.forEach(({ key, value }) => {
            config.build.environment[key] = value;
        });

        return config;
    }

    generateVercelConfig(variables) {
        const config = {
            "version": 2,
            "builds": [
                {
                    "src": "index.html",
                    "use": "@vercel/static"
                }
            ],
            "routes": [
                {
                    "src": "/api/(.*)",
                    "dest": "https://your-backend-url.com/api/$1"
                }
            ],
            "headers": [
                {
                    "source": "/(.*)",
                    "headers": [
                        {
                            "key": "X-Content-Type-Options",
                            "value": "nosniff"
                        },
                        {
                            "key": "X-Frame-Options",
                            "value": "DENY"
                        },
                        {
                            "key": "X-XSS-Protection",
                            "value": "1; mode=block"
                        }
                    ]
                }
            ],
            "env": {}
        };

        // Add environment variables
        variables.forEach(({ key, value }) => {
            config.env[key] = value;
        });

        return config;
    }

    generateRailwayConfig(variables) {
        const config = {
            "$schema": "https://railway.app/railway.schema.json",
            "build": {
                "builder": "NIXPACKS"
            },
            "deploy": {
                "startCommand": "npm start",
                "restartPolicyType": "ON_FAILURE",
                "restartPolicyMaxRetries": 10
            }
        };

        return config;
    }

    generateHerokuConfig(variables) {
        const config = {
            "buildpacks": [
                {
                    "url": "heroku/nodejs"
                }
            ],
            "formation": {
                "web": {
                    "quantity": 1,
                    "size": "free"
                }
            },
            "addons": [],
            "env": {}
        };

        // Add environment variables
        variables.forEach(({ key, value }) => {
            config.env[key] = value;
        });

        return config;
    }

    generateDockerConfig(variables) {
        const dockerfile = `
# AFZ Website Production Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S afz -u 1001

# Change ownership
RUN chown -R afz:nodejs /app
USER afz

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
`;

        const dockerCompose = `
version: '3.8'

services:
  afz-website:
    build: .
    ports:
      - "3000:3000"
    environment:
${variables.map(({ key, value }) => `      - ${key}=${value}`).join('\n')}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - afz-network

networks:
  afz-network:
    driver: bridge
`;

        return { dockerfile, dockerCompose };
    }

    generateEnvironmentFiles() {
        const variables = this.parseEnvTemplate();

        // Generate platform-specific configurations
        const configs = {
            'netlify.toml': this.generateNetlifyConfig(variables),
            'vercel.json': this.generateVercelConfig(variables),
            'railway.json': this.generateRailwayConfig(variables),
            'app.json': this.generateHerokuConfig(variables)
        };

        // Generate Docker files
        const dockerFiles = this.generateDockerConfig(variables);

        // Write configuration files
        Object.entries(configs).forEach(([filename, config]) => {
            const filePath = path.join(this.outputDir, filename);
            fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            console.log(`✅ Generated ${filename}`);
        });

        // Write Docker files
        fs.writeFileSync(path.join(this.outputDir, 'Dockerfile'), dockerFiles.dockerfile);
        fs.writeFileSync(path.join(this.outputDir, 'docker-compose.yml'), dockerFiles.dockerCompose);
        console.log('✅ Generated Docker configuration');

        // Generate environment variable lists for manual setup
        this.generateManualSetupGuides(variables);
    }

    generateManualSetupGuides(variables) {
        const requiredVars = variables.filter(v => v.isPlaceholder);
        const optionalVars = variables.filter(v => !v.isPlaceholder);

        const netlifyGuide = `
# Netlify Environment Variables Setup

## Required Variables (Must be configured):
${requiredVars.map(v => `${v.key}=your-actual-value-here`).join('\n')}

## Optional Variables (Have defaults):
${optionalVars.map(v => `${v.key}=${v.value}`).join('\n')}

## Setup Instructions:
1. Go to Netlify Dashboard > Site Settings > Environment Variables
2. Add each variable above with your actual values
3. Redeploy your site

## Build Command: npm run build (if applicable)
## Publish Directory: . (root directory)
`;

        const vercelGuide = `
# Vercel Environment Variables Setup

## Using Vercel CLI:
${requiredVars.map(v => `vercel env add ${v.key}`).join('\n')}

## Using Vercel Dashboard:
1. Go to Project Settings > Environment Variables
2. Add each variable with appropriate environment (Production/Preview/Development)

## Required Variables:
${requiredVars.map(v => `${v.key}=your-actual-value-here`).join('\n')}
`;

        const railwayGuide = `
# Railway Environment Variables Setup

## Using Railway CLI:
${requiredVars.map(v => `railway variables set ${v.key}=your-actual-value`).join('\n')}

## Using Railway Dashboard:
1. Go to Project > Variables
2. Add each environment variable

## Required Variables:
${requiredVars.map(v => `${v.key}=your-actual-value-here`).join('\n')}
`;

        const herokuGuide = `
# Heroku Environment Variables Setup

## Using Heroku CLI:
${requiredVars.map(v => `heroku config:set ${v.key}=your-actual-value --app your-app-name`).join('\n')}

## Using Heroku Dashboard:
1. Go to App > Settings > Config Vars
2. Add each environment variable

## Required Variables:
${requiredVars.map(v => `${v.key}=your-actual-value-here`).join('\n')}
`;

        // Write setup guides
        const guides = {
            'netlify-setup.md': netlifyGuide,
            'vercel-setup.md': vercelGuide,
            'railway-setup.md': railwayGuide,
            'heroku-setup.md': herokuGuide
        };

        Object.entries(guides).forEach(([filename, content]) => {
            fs.writeFileSync(path.join(this.outputDir, filename), content);
        });

        console.log('✅ Generated platform-specific setup guides');
    }

    generateSecurityChecklist() {
        const checklist = `
# AFZ Production Security Checklist

## Environment Variables Security
- [ ] All placeholder values replaced with actual credentials
- [ ] No sensitive data committed to git repository
- [ ] Different keys used for development, staging, and production
- [ ] API keys have appropriate permissions (least privilege)
- [ ] Webhook secrets are randomly generated and secure

## Authentication Security
- [ ] Supabase Row Level Security (RLS) enabled on all tables
- [ ] OAuth redirect URLs configured correctly
- [ ] CORS settings configured for production domains only
- [ ] Session timeout configured appropriately

## Payment Security
- [ ] All payment gateways using production/live credentials
- [ ] Webhook endpoints secured with signature verification
- [ ] SSL/TLS enabled for all payment flows
- [ ] PCI compliance considerations addressed
- [ ] Transaction logging enabled for audit trails

## General Security
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Error handling doesn't expose sensitive information
- [ ] Rate limiting enabled on API endpoints
- [ ] Regular security updates scheduled
- [ ] Backup and disaster recovery plan in place

## Monitoring and Logging
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Failed authentication attempts logged
- [ ] Payment failures monitored and alerted
- [ ] Uptime monitoring configured

## Data Protection
- [ ] GDPR compliance measures implemented
- [ ] Data retention policies configured
- [ ] User data encryption at rest and in transit
- [ ] Regular security audits scheduled
- [ ] Staff training on data protection completed
`;

        fs.writeFileSync(path.join(this.outputDir, 'SECURITY_CHECKLIST.md'), checklist);
        console.log('✅ Generated security checklist');
    }

    run() {
        console.log('🚀 AFZ Deployment Configuration Generator');
        console.log('==========================================');
        
        try {
            this.generateEnvironmentFiles();
            this.generateSecurityChecklist();
            
            console.log('\n✅ All configuration files generated successfully!');
            console.log(`📁 Files created in: ${this.outputDir}`);
            console.log('\n📋 Next Steps:');
            console.log('1. Review generated configuration files');
            console.log('2. Replace placeholder values with actual credentials');
            console.log('3. Choose your deployment platform and follow the setup guide');
            console.log('4. Complete the security checklist before going live');
            
        } catch (error) {
            console.error('❌ Error generating configurations:', error.message);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new AFZDeploymentConfig();
    generator.run();
}

module.exports = AFZDeploymentConfig;