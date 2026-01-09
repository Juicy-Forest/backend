const express = require('express');
const request = require('supertest');
const cors = require('cors');

// Mock http-proxy-middleware
jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: jest.fn((options) => {
    return (req, res, next) => {
      // Store config for testing
      req.proxyConfig = options;
      // Simulate proxy behavior
      if (options.onProxyReq) {
        options.onProxyReq({}, req, res);
      }
      // Simulate service unavailable for error testing
      if (req.headers['x-simulate-error']) {
        options.onError(new Error('Service unavailable'), req, res);
        return;
      }
      res.json({ proxied: true, target: options.target });
    };
  })
}));

// Create a testable app instance
function createApp(servicesConfig = null) {
  const app = express();
  
  const services = servicesConfig || {
    server: {
      url: 'http://localhost:3031',
      routes: ['/users', '/inventory', '/garden', '/section', '/tasks']
    },
    chat: {
      url: 'http://localhost:3033',
      routes: ['/channel']
    },
  };

  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
  }));

  app.get('/health', (req, res) => {
    res.json({ status: 'API Gateway is running' });
  });

  const { createProxyMiddleware } = require('http-proxy-middleware');

  Object.entries(services).forEach(([name, service]) => {
    service.routes.forEach(route => {
      app.use(route, createProxyMiddleware({
        target: service.url,
        xfwd: true,
        changeOrigin: true,
        onProxyReq: (proxyReq, req, res) => {
          console.log(`[Gateway] Proxying ${req.method} ${req.originalUrl} -> ${service.url}`);
        },
        onError: (err, req, res) => {
          console.error(`[Gateway] Error proxying to ${name} service:`, err.message);
          res.status(502).json({ error: `Service ${name} unavailable` });
        }
      }));
    });
  });

  return app;
}

describe('API Gateway', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return status ok on /health endpoint', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'API Gateway is running' });
    });

    it('should respond with correct content-type', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);
    });

    it('should support credentials', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Proxy Routing - Server Service', () => {
    it('should proxy /users route to server service', async () => {
      const response = await request(app)
        .get('/users')
        .expect(200);

      expect(response.body.proxied).toBe(true);
      expect(response.body.target).toBe('http://localhost:3031');
    });

    it('should proxy /inventory route to server service', async () => {
      const response = await request(app)
        .get('/inventory')
        .expect(200);

      expect(response.body.target).toBe('http://localhost:3031');
    });

    it('should proxy /garden route to server service', async () => {
      const response = await request(app)
        .get('/garden')
        .expect(200);

      expect(response.body.target).toBe('http://localhost:3031');
    });

    it('should proxy /section route to server service', async () => {
      const response = await request(app)
        .get('/section')
        .expect(200);

      expect(response.body.target).toBe('http://localhost:3031');
    });

    it('should proxy /tasks route to server service', async () => {
      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body.target).toBe('http://localhost:3031');
    });

    it('should proxy POST requests to server service', async () => {
      const response = await request(app)
        .post('/users')
        .send({ username: 'test' })
        .expect(200);

      expect(response.body.target).toBe('http://localhost:3031');
    });
  });

  describe('Proxy Routing - Chat Service', () => {
    it('should proxy /channel route to chat service', async () => {
      const response = await request(app)
        .get('/channel')
        .expect(200);

      expect(response.body.proxied).toBe(true);
      expect(response.body.target).toBe('http://localhost:3033');
    });

    it('should proxy POST /channel to chat service', async () => {
      const response = await request(app)
        .post('/channel')
        .send({ name: 'general', gardenId: '123' })
        .expect(200);

      expect(response.body.target).toBe('http://localhost:3033');
    });
  });

  describe('Error Handling', () => {
    it('should return 502 when server service is unavailable', async () => {
      const response = await request(app)
        .get('/users')
        .set('X-Simulate-Error', 'true')
        .expect(502);

      expect(response.body).toEqual({ error: 'Service server unavailable' });
    });

    it('should return 502 when chat service is unavailable', async () => {
      const response = await request(app)
        .get('/channel')
        .set('X-Simulate-Error', 'true')
        .expect(502);

      expect(response.body).toEqual({ error: 'Service chat unavailable' });
    });
  });

  describe('Unknown Routes', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);
    });
  });
});

describe('Gateway Configuration', () => {
  it('should use custom service URLs from environment', () => {
    const customServices = {
      server: {
        url: 'http://custom-server:8080',
        routes: ['/users']
      }
    };
    
    const customApp = createApp(customServices);
    
    return request(customApp)
      .get('/users')
      .expect(200)
      .then(response => {
        expect(response.body.target).toBe('http://custom-server:8080');
      });
  });

  it('should support multiple routes per service', () => {
    const services = {
      api: {
        url: 'http://api-server:3000',
        routes: ['/v1', '/v2']
      }
    };
    
    const customApp = createApp(services);
    
    return Promise.all([
      request(customApp).get('/v1').expect(200),
      request(customApp).get('/v2').expect(200)
    ]).then(([v1Response, v2Response]) => {
      expect(v1Response.body.target).toBe('http://api-server:3000');
      expect(v2Response.body.target).toBe('http://api-server:3000');
    });
  });
});

