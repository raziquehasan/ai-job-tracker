const fastify = require('fastify');
const cors = require('@fastify/cors');
const multipart = require('@fastify/multipart');
const authRoutes = require('./routes/auth.routes');
const resumeRoutes = require('./routes/resume.routes');
const jobsRoutes = require('./routes/jobs.routes');
const matchRoutes = require('./routes/match.routes');
const assistantRoutes = require('./routes/assistant.routes');
const applicationsRoutes = require('./routes/applications.routes');

function buildApp() {
  const app = fastify({ logger: true });

  // Register CORS
  app.register(cors, {
    origin: true
  });

  // Register multipart for file uploads
  app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  });

  // Register routes with /api prefix
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(resumeRoutes, { prefix: '/api/resume' });
  app.register(jobsRoutes, { prefix: '/api' });
  app.register(matchRoutes, { prefix: '/api/match' });
  app.register(assistantRoutes, { prefix: '/api/assistant' });
  app.register(applicationsRoutes, { prefix: '/api/applications' });

  // Health check route
  app.get('/health', async (request, reply) => {
    return { status: 'ok', message: 'AI Job Tracker API is running' };
  });

  return app;
}

module.exports = buildApp;
