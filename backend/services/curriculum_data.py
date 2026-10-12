"""
Comprehensive Technical Curricula & Educational Knowledge Base
CareerSense AI - Final Year Engineering Project

Contains production-grade syllabi, learning objectives, documentation links,
code exercises, mini-projects, and 5-question technical quizzes (80% passing threshold)
for all roadmap milestones:
- Node.js
- Express.js
- REST APIs
- Agile & Scrum
- Docker
- Microservices
- AWS
- CI/CD
- plus foundational skills (React, TypeScript, MySQL, Python, System Design, JavaScript)
"""

SKILL_PREREQUISITES = {
    'Express.js': ['Node.js'],
    'REST APIs': ['Express.js', 'Node.js'],
    'Agile & Scrum': ['REST APIs'],
    'Agile': ['REST APIs'],
    'Docker': ['Agile & Scrum', 'Agile', 'REST APIs'],
    'Microservices': ['Docker', 'REST APIs'],
    'AWS': ['Microservices', 'Docker'],
    'CI/CD': ['AWS', 'Docker'],
    'TypeScript': ['JavaScript'],
    'React': ['JavaScript'],
    'Redux': ['React'],
    'Next.js': ['React', 'JavaScript'],
    'Vue.js': ['JavaScript'],
    'NestJS': ['Node.js', 'TypeScript'],
    'Django': ['Python'],
    'Flask': ['Python'],
    'FastAPI': ['Python'],
    'Kubernetes': ['Docker'],
    'Microsoft Azure': ['Docker'],
    'Google Cloud (GCP)': ['Docker'],
    'Terraform': ['AWS', 'Docker'],
    'GraphQL': ['REST APIs', 'Node.js'],
    'Redis': ['Node.js', 'Python', 'Database'],
    'Machine Learning': ['Python', 'Pandas', 'NumPy'],
    'Deep Learning': ['Machine Learning', 'TensorFlow', 'PyTorch'],
    'System Design': ['REST APIs', 'Docker', 'Database', 'Microservices']
}

SKILL_CURRICULUM = {
    'Node.js': {
        'title': 'Node.js Asynchronous Runtime & Backend Engineering',
        'objectives': [
            'Understand the V8 JavaScript engine and non-blocking event loop phases (timers, I/O polling, check, close).',
            'Utilize core Node.js modules (fs, path, events, http, stream) for high-throughput server-side I/O.',
            'Implement asynchronous patterns using Promises, async/await, and EventEmitter safely with zero unhandled rejections.',
            'Structure and package production applications with modern ES modules, npm dependencies, and clustering.'
        ],
        'topics': [
            'V8 Engine & Non-Blocking Event Loop Architecture',
            'Node.js Core Modules (fs, path, events, streams)',
            'Asynchronous Flow Control & Error Boundaries',
            'Process Clustering, Streams & Production Memory Tuning'
        ],
        'syllabus': [
            {
                'module_title': 'Module 1: The Event Loop & Asynchronous Runtime',
                'key_concepts': ['Call Stack & Task Queues', 'process.nextTick vs setImmediate', 'Microtasks vs Macrotasks', 'Thread Pool (libuv)'],
                'deep_dive': 'Node.js runs single-threaded JavaScript code on top of libuv, which delegates asynchronous operations (file system, DNS, crypto) to a background thread pool. Timers execute in the Timers phase, while I/O callbacks run in the Poll phase.',
                'code_snippet': """// Demonstration of Event Loop Phase Priority
const fs = require('fs');

console.log('1. Synchronous start');

setTimeout(() => console.log('2. setTimeout (Timer Phase)'), 0);
setImmediate(() => console.log('3. setImmediate (Check Phase)'));
process.nextTick(() => console.log('4. process.nextTick (Microtask - Highest Priority)'));
Promise.resolve().then(() => console.log('5. Promise.then (Microtask)'));

fs.readFile(__filename, () => {
  console.log('6. fs.readFile callback (I/O Poll Phase)');
  setImmediate(() => console.log('7. setImmediate inside I/O callback runs before setTimeout'));
  setTimeout(() => console.log('8. setTimeout inside I/O callback'), 0);
});

console.log('9. Synchronous end');"""
            },
            {
                'module_title': 'Module 2: Streams & Buffer Memory Management',
                'key_concepts': ['Readable & Writable Streams', 'Transform Streams', 'Stream Pipelining', 'Handling Backpressure'],
                'deep_dive': 'Buffering large files in memory with fs.readFile causes memory spikes and process crashes. Streams process data chunk-by-chunk in buffers, providing constant low memory overhead regardless of file size.',
                'code_snippet': """// Memory-Efficient Stream Pipeline with Error Handling
const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream/promises');

async function compressLogFile(sourcePath, destPath) {
  try {
    const readStream = fs.createReadStream(sourcePath);
    const gzipStream = zlib.createGzip();
    const writeStream = fs.createWriteStream(destPath);

    // pipeline handles backpressure, closes descriptors & cleans up on error
    await pipeline(readStream, gzipStream, writeStream);
    console.log(`Successfully compressed ${sourcePath} -> ${destPath}`);
  } catch (err) {
    console.error('Compression pipeline failed:', err.message);
    throw err;
  }
}"""
            },
            {
                'module_title': 'Module 3: EventEmitter & Custom Event Architecture',
                'key_concepts': ['Observer Pattern', 'Custom EventEmitter Classes', 'Memory Leak Warnings', 'Once vs On Listeners'],
                'deep_dive': 'Node.js core modules inherit from EventEmitter. Emitting events decouples producers from consumers, enabling event-driven architecture, modular logging, and decoupling business workflows.',
                'code_snippet': """// Decoupled Order Processing Event Emitter
const EventEmitter = require('events');

class OrderProcessor extends EventEmitter {
  processOrder(order) {
    console.log(`Processing order #${order.id}...`);
    this.emit('order:created', order);
    
    // Simulate payment verification
    setTimeout(() => {
      this.emit('order:paid', { orderId: order.id, amount: order.total });
    }, 100);
  }
}

const processor = new OrderProcessor();
processor.on('order:created', (order) => console.log('Emailing receipt to:', order.email));
processor.on('order:paid', (data) => console.log('Updating inventory for order:', data.orderId));

processor.processOrder({ id: 'ORD-991', total: 149.99, email: 'candidate@careersense.ai' });"""
            },
            {
                'module_title': 'Module 4: Clustering & Multi-Core Scaling',
                'key_concepts': ['Cluster Module', 'Worker Threads vs Process Forking', 'Zero-Downtime Reloads', 'Process Managers (PM2)'],
                'deep_dive': 'Because Node.js runs on a single main thread, a single process cannot utilize multiple CPU cores. The cluster module forks worker processes that share the same server port through IPC socket handoff.',
                'code_snippet': """// Multi-Process Node.js Cluster Scaffold
const cluster = require('cluster');
const http = require('http');
const os = require('os');

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary master ${process.pid} is orchestrating ${numCPUs} workers...`);
  for (let i = 0; i < numCPUs; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`Worker ${worker.process.pid} died. Spawning replacement...`);
    cluster.fork();
  });
} else {
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', workerPid: process.pid }));
  }).listen(8000);
}"""
            }
        ],
        'resources': [
            {'name': 'Node.js Official Documentation', 'url': 'https://nodejs.org/docs/latest/api/', 'description': 'Complete reference for Node.js standard runtime modules.'},
            {'name': 'MDN Server-Side JavaScript', 'url': 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs', 'description': 'Foundational architecture and server-side JavaScript guide.'},
            {'name': 'Node.js Event Loop Visualizer Guide', 'url': 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick', 'description': 'Deep dive into libuv, microtasks, and timer phases.'}
        ],
        'exercises': [
            {
                'title': 'Exercise 1: Transform Stream Line Counter',
                'scenario': 'Create a custom Transform stream that counts non-empty lines in an input stream and prepends line numbers to output chunks.',
                'starter_code': """const { Transform } = require('stream');

class LineNumberer extends Transform {
  constructor(options) {
    super(options);
    this.lineNumber = 1;
  }
  _transform(chunk, encoding, callback) {
    // TODO: Split chunk into lines and prepend line numbers
    callback();
  }
}""",
                'solution': """const { Transform } = require('stream');

class LineNumberer extends Transform {
  constructor(options) {
    super(options);
    this.lineNumber = 1;
  }
  _transform(chunk, encoding, callback) {
    const lines = chunk.toString().split('\\n');
    const numbered = lines.map(line => `${this.lineNumber++}: ${line}`).join('\\n');
    this.push(numbered);
    callback();
  }
}"""
            },
            {
                'title': 'Exercise 2: Resilient Asynchronous Retry Wrapper',
                'scenario': 'Write a higher-order function retryAsync(fn, maxRetries, delayMs) that retries a rejected promise with exponential backoff.',
                'starter_code': """async function retryAsync(asyncFn, retries = 3, delay = 500) {
  // TODO: implement retry loop with exponential delay
}""",
                'solution': """async function retryAsync(asyncFn, retries = 3, delay = 500) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await asyncFn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt - 1)));
    }
  }
}"""
            }
        ],
        'project': 'High-Throughput Streaming File Transformer Microservice with Worker Clustering & Graceful Shutdown',
        'outcome': 'Mastery of server-side JavaScript programming, event-driven architecture, and scalable microservice design.',
        'quiz': [
            {
                'id': 1,
                'question': 'Which phase of the Node.js event loop executes callbacks scheduled by process.nextTick()?',
                'options': [
                    'The Timers phase alongside setTimeout callbacks',
                    'Immediately after the current operation finishes, before entering the next phase of the event loop',
                    'The I/O Poll phase after libuv completes network sockets',
                    'The Close Callbacks phase at the very end of the cycle'
                ],
                'correct_index': 1,
                'explanation': 'process.nextTick() is not technically part of the event loop phases; the nextTickQueue is processed immediately after the current operation finishes, resolving before microtasks and before any event loop phase transitions.'
            },
            {
                'id': 2,
                'question': 'Why is stream.pipeline() preferred over readable.pipe(writable) in production applications?',
                'options': [
                    'pipeline() runs on worker threads for 4x higher performance',
                    'pipeline() properly cleans up stream resources and automatically handles errors, while .pipe() does not forward errors to the destination',
                    'pipeline() compresses all data with GZIP automatically',
                    'readable.pipe() has been deprecated and removed in modern Node.js versions'
                ],
                'correct_index': 1,
                'explanation': 'If an error occurs midway through readable.pipe(writable), the destination stream remains open and can cause memory/file descriptor leaks. stream.pipeline() forwards errors and cleanly closes all stream descriptors.'
            },
            {
                'id': 3,
                'question': 'What is the primary difference between setImmediate() and setTimeout(fn, 0)?',
                'options': [
                    'setTimeout(0) always executes before setImmediate() under all circumstances',
                    'setImmediate() is designed to run in the Check phase after the Poll phase, whereas setTimeout(0) runs in the Timers phase',
                    'setImmediate() blocks the event loop until worker threads finish',
                    'setTimeout(0) is only supported in web browsers, not Node.js'
                ],
                'correct_index': 1,
                'explanation': 'setImmediate() runs in the Check phase of the event loop (directly following the I/O Poll phase). When called within an I/O callback, setImmediate() is guaranteed to execute before any timer callback scheduled in the same turn.'
            },
            {
                'id': 4,
                'question': 'Which Node.js mechanism should you use to utilize all available CPU cores for a web server?',
                'options': [
                    'Wrapping all route handlers with async/await',
                    'The cluster module or process managers like PM2 to fork multiple worker processes sharing a single port',
                    'Increasing the libuv thread pool size via UV_THREADPOOL_SIZE=128',
                    'Using setInterval with 0 delay'
                ],
                'correct_index': 1,
                'explanation': 'Because Node.js executes JavaScript on a single thread, clustering forks multiple child processes that share the same listening socket, distributing incoming TCP connections across all available CPU cores.'
            },
            {
                'id': 5,
                'question': 'What happens if a Promise rejection is not handled by a .catch() handler in modern Node.js (v16+)?',
                'options': [
                    'Node.js automatically retries the rejected promise after 1 second',
                    'The error is silently ignored and suppressed',
                    'The process emits unhandledRejection and terminates with a non-zero exit code by default',
                    'The process freezes indefinitely'
                ],
                'correct_index': 2,
                'explanation': 'Modern Node.js versions terminate the process with an exit status code of 1 on unhandled promise rejections, preventing applications from running in an inconsistent or zombie state.'
            }
        ]
    },
    'Express.js': {
        'title': 'Express.js Framework & Modular Web Application Architecture',
        'objectives': [
            'Architect clean web applications using MVC / Controller-Service-Repository patterns.',
            'Build reusable custom middleware pipelines for authentication, request logging, and rate limiting.',
            'Implement centralized error handling with custom HttpError classes and semantic status codes.',
            'Harden Express apps with Helmet, CORS configuration, and body size limits against security attacks.'
        ],
        'topics': [
            'Express Application Lifecycle & Routing Hierarchies',
            'Custom Middleware Pipelines & Error Handling Signatures',
            'Controller-Service Pattern & Dependency Separation',
            'Production Hardening: Helmet, CORS & Security Safeguards'
        ],
        'syllabus': [
            {
                'module_title': 'Module 1: Modular Routing & Controller Structure',
                'key_concepts': ['express.Router()', 'Route Parameters & Regex Matching', 'Controller Decoupling', 'REST Resource Hierarchy'],
                'deep_dive': 'Large applications should never define routes in app.js. Instead, express.Router() groups resource-specific endpoints into modular controllers mounted with clear route prefixes.',
                'code_snippet': """// Modular Router Definition: routes/users.js
const express = require('express');
const router = express.Router();

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserService.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err); // Forward to global error handler
  }
});

module.exports = router;"""
            },
            {
                'module_title': 'Module 2: Middleware Pipeline Architecture',
                'key_concepts': ['Request-Response Cycle', 'next() and next(err) Semantics', 'Authentication Middleware', 'Third-Party Middleware (CORS, Morgan)'],
                'deep_dive': 'An Express application is essentially a stack of middleware functions. Each function can inspect req, modify res, end the cycle, or call next() to yield to the next handler.',
                'code_snippet': """// Production JWT Authentication Middleware
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user claims to request
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;"""
            },
            {
                'module_title': 'Module 3: Centralized Error Handling Middleware',
                'key_concepts': ['4-Parameter Middleware Signature (err, req, res, next)', 'Custom AppError Hierarchy', 'Operational vs Programmer Errors', 'Stack Trace Sanitization'],
                'deep_dive': 'Error handling middleware must accept exactly 4 arguments: (err, req, res, next). Express inspects function.length; without 4 parameters, it treats it as normal middleware and errors bypass it.',
                'code_snippet': """// Centralized Global Error Handler
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  if (statusCode === 500) {
    console.error('Unhandled System Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = { AppError, errorHandler };"""
            },
            {
                'module_title': 'Module 4: Security Hardening & Rate Limiting',
                'key_concepts': ['Helmet Header Hardening', 'CORS Whitelisting', 'express-rate-limit', 'Payload Body Caps'],
                'deep_dive': 'Express applications must disable X-Powered-By, enforce Content-Security-Policy with Helmet, restrict CORS origins, and cap JSON payloads to 10kb to defend against Denial-of-Service attacks.',
                'code_snippet': """// Security Hardening Configuration
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5275', credentials: true }));
app.use(express.json({ limit: '10kb' })); // Mitigate huge body DoS

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);"""
            }
        ],
        'resources': [
            {'name': 'Express.js Official Documentation', 'url': 'https://expressjs.com/', 'description': 'Complete guide for Express routing, middleware, and APIs.'},
            {'name': 'Express Production Security Best Practices', 'url': 'https://expressjs.com/en/advanced/best-practice-security.html', 'description': 'Security hardening guide including Helmet, TLS, and dependencies.'},
            {'name': 'OWASP Node.js Security Cheat Sheet', 'url': 'https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html', 'description': 'Security checklist for Node/Express web services.'}
        ],
        'exercises': [
            {
                'title': 'Exercise 1: Role-Based Authorization Middleware',
                'scenario': 'Create an authorizeRoles(...allowedRoles) middleware factory that checks if req.user.role exists in the allowed roles list.',
                'starter_code': """function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // TODO: Verify req.user and check role inclusion
  };
}""",
                'solution': """function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}"""
            },
            {
                'title': 'Exercise 2: Async Route Wrapper (Async Handler)',
                'scenario': 'Write an asyncHandler wrapper that catches rejected promises from async controller methods and passes the error to next().',
                'starter_code': """const asyncHandler = (fn) => (req, res, next) => {
  // TODO: wrap fn execution in Promise.resolve
};""",
                'solution': """const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};"""
            }
        ],
        'project': 'Modular Express Authentication & Role-Based Resource Microservice with Global Error Handling',
        'outcome': 'Proficiency in building clean, decoupled, and secure web services following standard MVC/Service architectural patterns.',
        'quiz': [
            {
                'id': 1,
                'question': 'How does Express identify that a middleware function is an error-handling middleware?',
                'options': [
                    'By checking if the function returns an instance of Error',
                    'By inspecting the function arity: error middleware must accept exactly 4 arguments (err, req, res, next)',
                    'By registering it with app.useError() instead of app.use()',
                    'By naming the function errorHandler'
                ],
                'correct_index': 1,
                'explanation': 'Express uses JavaScript function arity (fn.length === 4) to distinguish error-handling middleware from regular middleware. If you only provide (err, req, res), Express treats it as normal middleware and bypasses it during error bubbling.'
            },
            {
                'id': 2,
                'question': 'What happens if you invoke next(err) with an argument inside an Express middleware?',
                'options': [
                    'Express retries the middleware after 500ms',
                    'Express immediately stops processing normal middleware and jumps straight to the next registered 4-parameter error handler',
                    'Express crashes the Node.js process immediately',
                    'The browser receives a 200 OK with the error message in the payload'
                ],
                'correct_index': 1,
                'explanation': 'Passing any argument to next() (except the string "route") instructs Express that an error occurred, skipping all remaining regular middleware in the stack and jumping directly to the error handling middleware.'
            },
            {
                'id': 3,
                'question': 'Why should you include helmet middleware at the top of your Express application pipeline?',
                'options': [
                    'Helmet speeds up JSON serialization by 30%',
                    'Helmet sets essential HTTP security headers (HSTS, Content-Security-Policy, X-Content-Type-Options) and removes X-Powered-By',
                    'Helmet automatically connects to a Redis cache',
                    'Helmet manages database connection pooling'
                ],
                'correct_index': 1,
                'explanation': 'Helmet automatically secures HTTP headers against common web vulnerabilities like clickjacking, MIME-type sniffing, cross-site scripting (XSS), and hides the Express server signature.'
            },
            {
                'id': 4,
                'question': 'What is the purpose of route parameters in Express (e.g. app.get("/users/:id"))?',
                'options': [
                    'To automatically generate SQL queries for users',
                    'To capture dynamic values from the URL path, accessible via req.params.id',
                    'To read values from the query string (e.g. ?id=123)',
                    'To validate the JSON request body'
                ],
                'correct_index': 1,
                'explanation': 'Colon-prefixed path segments are route parameters. Express extracts their values and populates them on the req.params object for controller access.'
            },
            {
                'id': 5,
                'question': 'What HTTP status code should your Express API return when a required JWT token is absent from the request headers?',
                'options': [
                    '403 Forbidden',
                    '401 Unauthorized',
                    '400 Bad Request',
                    '404 Not Found'
                ],
                'correct_index': 1,
                'explanation': 'HTTP 401 Unauthorized is the semantic standard when authentication is required and has either failed or not yet been provided. 403 Forbidden is used when authentication is verified but permissions are insufficient.'
            }
        ]
    },
    'REST APIs': {
        'title': 'RESTful API Architecture & Secure Service Design',
        'objectives': [
            'Design scalable, resource-oriented APIs adhering to Roy Fielding\'s REST architectural constraints.',
            'Apply correct HTTP status codes (200, 201, 204, 400, 401, 403, 404, 409, 422, 500) and idempotent methods.',
            'Implement stateless JWT authentication, bearer token parsing, and role-based permissions.',
            'Structure standardized JSON response envelopes, pagination, sorting, and OpenAPI/Swagger documentation.'
        ],
        'topics': [
            'REST Constraints & Resource-Oriented URL Modeling',
            'HTTP Methods, Idempotency & Semantic Status Codes',
            'Stateless Authentication, Bearer Tokens & Security Patterns',
            'Pagination (Cursor vs Offset), Filtering & OpenAPI Specs'
        ],
        'syllabus': [
            {
                'module_title': 'Module 1: REST Architectural Constraints & URL Design',
                'key_concepts': ['Client-Server Separation', 'Statelessness', 'Cacheability', 'Uniform Interface & Resource URIs'],
                'deep_dive': 'REST URIs represent resources (nouns, plural), never actions (verbs). Avoid /getUser or /deleteItem. Use /users/:id with GET and DELETE methods instead.',
                'code_snippet': """// Clean RESTful URI Structure
// Good RESTful Design:
// GET    /api/v1/resumes           -> List resumes
// POST   /api/v1/resumes           -> Create new resume
// GET    /api/v1/resumes/:id       -> Get specific resume
// PUT    /api/v1/resumes/:id       -> Full replacement of resume
// PATCH  /api/v1/resumes/:id       -> Partial update of resume
// DELETE /api/v1/resumes/:id       -> Remove resume
// GET    /api/v1/resumes/:id/skills-> Nested sub-resource skills"""
            },
            {
                'module_title': 'Module 2: HTTP Methods, Idempotency & Status Codes',
                'key_concepts': ['Safe Methods (GET, HEAD)', 'Idempotent Methods (PUT, DELETE)', 'Non-Idempotent (POST)', 'Status Code Families (2xx, 4xx, 5xx)'],
                'deep_dive': 'An idempotent HTTP method produces identical server state regardless of whether called once or ten times. PUT and DELETE are idempotent; POST creates duplicate resources on repeated calls.',
                'code_snippet': """// Standardized Status Code Mapping
// 200 OK: Successful read or non-creation update
// 201 Created: New resource successfully created (include Location header)
// 204 No Content: Successful deletion with no body returned
// 400 Bad Request: Malformed JSON or syntax failure
// 401 Unauthorized: Missing or invalid authentication token
// 403 Forbidden: Authenticated user lacks permission
// 404 Not Found: Requested resource URI does not exist
// 409 Conflict: Duplicate key or conflicting state
// 422 Unprocessable Entity: Schema validation error (e.g. invalid email format)
// 500 Internal Server Error: Unhandled server crash"""
            },
            {
                'module_title': 'Module 3: Response Envelope & Pagination Strategies',
                'key_concepts': ['Standardized Response Schema', 'Offset vs Cursor Pagination', 'Meta & Links Envelopes', 'Filtering & Sorting'],
                'deep_dive': 'Cursor-based pagination (using indexed created_at or IDs) provides O(1) database lookups and avoids page-drift issues when records are concurrently added, unlike traditional OFFSET/LIMIT.',
                'code_snippet': """// Standard API Response Structure
{
  "success": true,
  "data": [
    { "id": 101, "role": "Full Stack Developer", "score": 88 }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total_records": 142,
    "has_next_page": true,
    "next_cursor": "eyJpZCI6MTAxfQ=="
  }
}"""
            },
            {
                'module_title': 'Module 4: API Documentation with OpenAPI / Swagger',
                'key_concepts': ['OpenAPI 3.0 Specification', 'Swagger UI Integration', 'Request/Response Schema Contracts', 'Postman Collection Exports'],
                'deep_dive': 'Production APIs must publish formal OpenAPI specifications. This enables automated client SDK generation, interactive Swagger exploration, and contract testing between frontend and backend teams.',
                'code_snippet': """// OpenAPI 3.0 Path Definition (YAML snippet)
paths:
  /api/v1/resumes:
    post:
      summary: Upload and analyze candidate resume
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                resume_file:
                  type: string
                  format: binary
      responses:
        '201':
          description: Resume parsed successfully
        '422':
          description: Validation failure - file must be PDF"""
            }
        ],
        'resources': [
            {'name': 'RESTful Web Services Best Practices (Mozilla)', 'url': 'https://developer.mozilla.org/en-US/docs/Glossary/REST', 'description': 'REST architectural guide and HTTP resource design principles.'},
            {'name': 'OWASP REST API Security Cheat Sheet', 'url': 'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html', 'description': 'Production API security checklist, authentication, and input validation.'},
            {'name': 'OpenAPI 3.0 Specification Guide', 'url': 'https://swagger.io/specification/', 'description': 'Standard contract format for describing RESTful APIs.'}
        ],
        'exercises': [
            {
                'title': 'Exercise 1: Standardized REST Error Formatter',
                'scenario': 'Write a Python or JS utility function format_rest_error(status_code, message, errors_list) returning an RFC 7807 problem details JSON envelope.',
                'starter_code': """def format_rest_error(status_code: int, message: str, errors: list = None) -> dict:
    # TODO: Build RFC 7807 compliant dictionary
    pass""",
                'solution': """def format_rest_error(status_code: int, message: str, errors: list = None) -> dict:
    return {
        "success": False,
        "status": status_code,
        "title": message,
        "errors": errors or [],
        "timestamp": "2026-10-10T00:00:00Z"
    }"""
            },
            {
                'title': 'Exercise 2: Cursor Pagination Query Generator',
                'scenario': 'Write a query generator function that parses cursor parameters and constructs SQL clauses with index-friendly WHERE id > cursor LIMIT N.',
                'starter_code': """def build_cursor_query(table: str, cursor_id: int = None, limit: int = 20) -> str:
    # TODO: construct parameterized SQL
    pass""",
                'solution': """def build_cursor_query(table: str, cursor_id: int = None, limit: int = 20) -> str:
    if cursor_id:
        return f"SELECT * FROM {table} WHERE id > {int(cursor_id)} ORDER BY id ASC LIMIT {int(limit)}"
    return f"SELECT * FROM {table} ORDER BY id ASC LIMIT {int(limit)}" """
            }
        ],
        'project': 'Production-Ready Job Application Portal REST API with JWT Auth, Validation & Swagger Docs',
        'outcome': 'Ability to design, build, secure, and document scalable RESTful web APIs matching enterprise industry standards.',
        'quiz': [
            {
                'id': 1,
                'question': 'Which of the following HTTP methods is idempotent according to the HTTP/1.1 specification?',
                'options': [
                    'POST',
                    'PUT',
                    'PATCH (by definition non-idempotent without specific constraints)',
                    'CONNECT'
                ],
                'correct_index': 1,
                'explanation': 'PUT is idempotent: sending the exact same PUT replacement request 1 time or 10 times results in the exact same state on the server. POST is not idempotent as it creates new sub-resources on each call.'
            },
            {
                'id': 2,
                'question': 'What is the most appropriate HTTP status code to return when a client sends valid JSON that fails domain validation (e.g. age must be >= 18)?',
                'options': [
                    '404 Not Found',
                    '422 Unprocessable Entity (or 400 Bad Request)',
                    '500 Internal Server Error',
                    '204 No Content'
                ],
                'correct_index': 1,
                'explanation': '422 Unprocessable Entity indicates that the server understands the content type and syntax, but cannot process the contained instructions due to semantic validation rules.'
            },
            {
                'id': 3,
                'question': 'In a RESTful architecture, why should URLs contain nouns rather than verbs (e.g., /resumes rather than /getResumes)?',
                'options': [
                    'Because web browsers cannot execute URLs containing verbs',
                    'Because the HTTP method (GET, POST, DELETE) already represents the action, while the URI represents the resource entity',
                    'Because nouns take up fewer bytes in HTTP headers',
                    'Because search engine crawlers ignore verbs'
                ],
                'correct_index': 1,
                'explanation': 'REST relies on the Uniform Interface constraint: the URI identifies the resource (a noun), while standardized HTTP verbs specify the operation to perform on that resource.'
            },
            {
                'id': 4,
                'question': 'What major advantage does cursor-based pagination have over offset-based pagination (OFFSET 1000 LIMIT 20) in high-traffic APIs?',
                'options': [
                    'Cursor pagination does not require an indexed database column',
                    'Cursor pagination avoids performance degradation on large offsets and prevents page-drift/duplicate records caused by concurrent inserts',
                    'Cursor pagination is only compatible with MongoDB, not MySQL',
                    'Offset pagination is deprecated in SQL standards'
                ],
                'correct_index': 1,
                'explanation': 'OFFSET N forces the database engine to scan and discard N rows, causing severe O(N) degradation on deep pages. Furthermore, if records are inserted concurrently, offset pagination causes items to shift and repeat across pages.'
            },
            {
                'id': 5,
                'question': 'What header is used to pass a JSON Web Token (JWT) in standard REST API requests?',
                'options': [
                    'Authentication: Token <jwt>',
                    'Authorization: Bearer <jwt>',
                    'X-JWT-Signature: <jwt>',
                    'Proxy-Authenticate: <jwt>'
                ],
                'correct_index': 1,
                'explanation': 'RFC 6750 specifies the standard Authorization header with the Bearer authentication scheme for passing access tokens: Authorization: Bearer <token>.'
            }
        ]
    },
    'Agile & Scrum': {
        'title': 'Agile Software Engineering & Scrum Sprint Delivery',
        'objectives': [
            'Master Scrum ceremonies (Sprint Planning, Daily Standup, Sprint Review, Retrospective).',
            'Write clear User Stories adhering to INVEST criteria and define comprehensive Definitions of Done (DoD).',
            'Estimate story points using Planning Poker, Fibonacci scale, and track team velocity.',
            'Manage collaborative GitHub Projects / Jira boards, branch naming conventions, and Pull Request engineering SLAs.'
        ],
        'topics': [
            'Scrum Framework Roles, Ceremonies & Artifacts',
            'User Stories, INVEST Criteria & Definition of Done',
            'Relative Estimation (Fibonacci) & Sprint Velocity Metrics',
            'Engineering SLAs, Git PR Review Standards & CI Workflows'
        ],
        'syllabus': [
            {
                'module_title': 'Module 1: The Scrum Framework Architecture',
                'key_concepts': ['Three Roles (PO, Scrum Master, Developers)', 'Four Ceremonies', 'Three Artifacts (Product Backlog, Sprint Backlog, Increment)', 'Empiricism (Transparency, Inspection, Adaptation)'],
                'deep_dive': 'Scrum is an iterative framework built on empiricism. Sprints are fixed-length timeboxes (typically 2 weeks). The Product Owner owns WHAT to build; Developers own HOW to build it; the Scrum Master facilitates the process.',
                'code_snippet': """// Scrum Sprint Cycle Summary
// 1. Sprint Planning (Day 1): Define Sprint Goal & commit to Backlog items
// 2. Daily Standup (15 min daily): 
//    - What did I complete yesterday?
//    - What will I complete today?
//    - Any blockers impeding progress?
// 3. Sprint Review (Last Day): Live product demo to stakeholders
// 4. Sprint Retrospective (Last Day): Team reflection: What went well? What to improve?"""
            },
            {
                'module_title': 'Module 2: Writing Production User Stories (INVEST)',
                'key_concepts': ['User Story Format (As a... I want... So that...)', 'INVEST Quality Checklist', 'Acceptance Criteria (Gherkin syntax)', 'Definition of Done (DoD)'],
                'deep_dive': 'User stories must be INVEST: Independent, Negotiable, Valuable, Estimable, Small, and Testable. Acceptance criteria define boundary conditions using Given-When-Then syntax.',
                'code_snippet': """# Production User Story Template
Title: Candidate PDF Resume Upload & Instant ATS Parsing

As a registered job seeker,
I want to upload my resume PDF in the CareerSense AI analyzer,
So that I receive an immediate breakdown of my skills and ATS score.

Acceptance Criteria:
Scenario: Successful PDF Parse
  Given I am logged into my CareerSense dashboard
  When I drag and drop a valid PDF under 5MB
  Then the system displays an animated analysis pipeline
  And persists parsed skills to my MySQL candidate profile
  And redirects to the Resume Intelligence score card

Definition of Done (DoD):
  [x] Unit tests pass with >= 85% coverage
  [x] Pull request reviewed and approved by peer
  [x] Linting and build pipeline pass green
  [x] Verified in staging environment"""
            },
            {
                'module_title': 'Module 3: Relative Estimation & Sprint Velocity',
                'key_concepts': ['Story Points vs Hours', 'Fibonacci Scale (1, 2, 3, 5, 8, 13)', 'Planning Poker', 'Burndown Charts & Velocity Tracking'],
                'deep_dive': 'Story points estimate relative effort, complexity, and uncertainty—not hours. A 5-point story is roughly 2.5x the effort of a 2-point story regardless of who develops it.',
                'code_snippet': """// Velocity Calculation Example
// Sprint 1 Completed Points: 28
// Sprint 2 Completed Points: 32
// Sprint 3 Completed Points: 30
// Average Team Velocity = (28 + 32 + 30) / 3 = 30 points / sprint
// Planned Backlog for Sprint 4 should not exceed 30 story points."""
            },
            {
                'module_title': 'Module 4: Professional Git PR Collaboration & Code Review SLAs',
                'key_concepts': ['Trunk-Based / Feature Branching', 'PR Description Templates', 'Constructive Code Review SLAs', 'Automated CI Quality Gates'],
                'deep_dive': 'Engineering teams enforce clear PR standards: small diffs (< 400 lines), descriptive PR descriptions, passing automated CI tests, and peer approvals before merging to main.',
                'code_snippet': """# Pull Request Template (.github/pull_request_template.md)
## Description
Brief summary of changes made in this branch.

## Linked Issue
Fixes #42 (Jira/GitHub issue number)

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)

## Checklist
- [ ] Code follows project styling guidelines
- [ ] Added unit tests covering all edge cases
- [ ] No regression warnings or console errors"""
            }
        ],
        'resources': [
            {'name': 'The Official Scrum Guide (2020)', 'url': 'https://scrumguides.org/scrum-guide.html', 'description': 'The definitive reference guide written by Scrum co-creators Ken Schwaber and Jeff Sutherland.'},
            {'name': 'Atlassian Agile Coach', 'url': 'https://www.atlassian.com/agile', 'description': 'Comprehensive tutorials on Scrum, Kanban, user stories, and agile project delivery.'},
            {'name': 'Google Engineering Practices: Code Review', 'url': 'https://google.github.io/eng-practices/review/', 'description': 'Google standards for reviewing code, giving constructive feedback, and maintaining velocity.'}
        ],
        'exercises': [
            {
                'title': 'Exercise 1: Gherkin Acceptance Criteria Drafting',
                'scenario': 'Write a comprehensive Gherkin scenario (Given/When/Then) for a user attempting to reset their password with an expired token.',
                'starter_code': """Feature: Password Reset
  Scenario: Expired reset token handling
    # TODO: Write Given, When, Then steps""",
                'solution': """Feature: Password Reset
  Scenario: Expired reset token handling
    Given a user clicks a password reset link older than 15 minutes
    When the reset password page loads
    Then the system displays an error message "Reset link has expired"
    And offers a button to "Request a New Reset Link"
    And prevents new password form submission"""
            },
            {
                'title': 'Exercise 2: Story Point Estimation Exercise',
                'scenario': 'Given a baseline 2-point story: "Add a copy button to code blocks", estimate the story points for: "Implement OAuth2 Google Sign-in with database user creation and session token generation". Justify using complexity, effort, and risk.',
                'starter_code': """// Estimated Points: ?
// Rationale:""",
                'solution': """// Estimated Points: 5 or 8 points
// Rationale:
// Complexity: High (integrating external OAuth2 protocol, handling callback redirects, error edge cases).
// Effort: Medium-High (configuring Google Cloud credentials, writing user lookups/inserts, generating JWT tokens).
// Risk/Uncertainty: High (security token management, third-party network failure).
// Roughly 3x to 4x the effort of a simple UI copy button."""
            }
        ],
        'project': 'Simulate 2-Week Agile Sprint with GitHub Projects Board, User Stories, PR Reviews & Burndown Tracking',
        'outcome': 'Practical readiness for professional software team workflows, agile delivery, and cross-functional collaboration.',
        'quiz': [
            {
                'id': 1,
                'question': 'Who is responsible for prioritizing and maintaining the items in the Product Backlog in Scrum?',
                'options': [
                    'The Scrum Master',
                    'The Product Owner',
                    'The Lead Architect',
                    'The Engineering Manager'
                ],
                'correct_index': 1,
                'explanation': 'The Product Owner is solely accountable for maximizing the value of the product and managing the Product Backlog, including content, ordering, and transparency.'
            },
            {
                'id': 2,
                'question': 'What does the "I" stand for in the INVEST criteria for agile user stories?',
                'options': [
                    'Immediate',
                    'Independent',
                    'Iterative',
                    'Intricate'
                ],
                'correct_index': 1,
                'explanation': 'INVEST stands for: Independent (can be developed and released without tight coupling to other stories), Negotiable, Valuable, Estimable, Small, and Testable.'
            },
            {
                'id': 3,
                'question': 'During a Daily Standup meeting, what are the three standard questions each team member answers?',
                'options': [
                    'How many hours did I log? Did I finish my tickets? Who is responsible for blockers?',
                    'What did I accomplish yesterday? What do I plan to accomplish today? Are there any blockers or impediments in my way?',
                    'What bugs did I introduce? When will the sprint end? Who approved my PR?',
                    'Did the build pass? What is the current velocity? What is our budget?'
                ],
                'correct_index': 1,
                'explanation': 'The Daily Standup focuses on inspect-and-adapt progress toward the Sprint Goal: what was done yesterday, what will be done today, and any impediments or blockers.'
            },
            {
                'id': 4,
                'question': 'What is the primary difference between the Sprint Review and the Sprint Retrospective?',
                'options': [
                    'The Sprint Review inspects the product increment with stakeholders; the Retrospective inspects team process, tools, and relationships to identify continuous improvements',
                    'Sprint Review is only for managers; Retrospective is only for QA engineers',
                    'Sprint Review takes place at the beginning of the sprint; Retrospective takes place at mid-sprint',
                    'There is no difference; they are alternative names for the same ceremony'
                ],
                'correct_index': 0,
                'explanation': 'Sprint Review focuses on the PRODUCT (demonstrating completed work to stakeholders and gathering feedback). Sprint Retrospective focuses on the PROCESS (how the team collaborated and what can be improved in the next sprint).'
            },
            {
                'id': 5,
                'question': 'What is the definition of "Definition of Done" (DoD)?',
                'options': [
                    'The date when the developer pushes their branch to GitHub',
                    'A shared, formal checklist of quality criteria that an increment must satisfy before being considered complete and releasable',
                    'When the customer approves the initial wireframe mockup',
                    'When all story points for the quarter have been assigned'
                ],
                'correct_index': 1,
                'explanation': 'The Definition of Done is a formal agreement on the quality standards required for the product increment (e.g. code written, unit tested, reviewed, documented, and passing CI/CD) before it can be considered done.'
            }
        ]
    },
    'Docker': {
        'title': 'Docker Containerization & Multi-Container Systems',
        'objectives': [
            'Understand Linux namespaces, cgroups, and container virtualization versus virtual machines.',
            'Write optimized, secure, multi-stage Dockerfiles with minimal image footprints and non-root users.',
            'Orchestrate multi-service environments (Frontend, API, DB) using Docker Compose with internal networks.',
            'Manage container networking, health checks, environment secrets, and persistent named volumes.'
        ],
        'topics': [
            'Docker Engine Architecture, Namespaces & cgroups',
            'Production Dockerfiles & Multi-Stage Image Builds',
            'Docker Compose Multi-Container Orchestration',
            'Volumes, Networking, Container Healthchecks & Security'
        ],
        'syllabus': [
            {
                'module_title': 'Module 1: Container Architecture & The Docker Engine',
                'key_concepts': ['Containers vs Hypervisor Virtual Machines', 'Linux Namespaces (PID, NET, MNT)', 'Control Groups (cgroups)', 'Union File Systems & Image Layers'],
                'deep_dive': 'Containers are isolated Linux processes sharing the host kernel via namespaces (which provide isolation) and cgroups (which enforce CPU/memory limits). They boot in milliseconds compared to heavy VMs.',
                'code_snippet': """# Inspecting Docker Image Layers and History
docker image history node:18-alpine

# Running an interactive lightweight container with memory limit
docker run -it --rm --name test-sandbox -m 256m --memory-swap 256m alpine:3.19 sh"""
            },
            {
                'module_title': 'Module 2: Production Multi-Stage Dockerfiles',
                'key_concepts': ['Multi-Stage Builds', 'Layer Caching Strategy', '.dockerignore Optimization', 'Non-Root Security Context'],
                'deep_dive': 'Multi-stage builds separate the build environment (compilers, devDependencies) from the lean runtime image. Ordering instructions from least frequently changed to most frequently changed maximizes layer cache reuse.',
                'code_snippet': """# Multi-Stage Node.js Production Dockerfile
# Stage 1: Build Dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --production

# Stage 2: Minimal Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Never run containers as root!
USER node

COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]"""
            },
            {
                'module_title': 'Module 3: Multi-Container Orchestration with Docker Compose',
                'key_concepts': ['docker-compose.yml Syntax', 'Bridge Networks & Service Discovery', 'Named Volumes vs Bind Mounts', 'depends_on with Condition: service_healthy'],
                'deep_dive': 'Docker Compose orchestrates multi-container applications on an isolated bridge network. Containers resolve peer services by service name using embedded DNS (e.g. connecting to mysql:3306).',
                'code_snippet': """# Production Docker Compose Architecture
version: '3.8'

services:
  db:
    image: mysql:8.0
    container_name: careersense-db
    environment:
      MYSQL_ROOT_PASSWORD: rootsecretpassword
      MYSQL_DATABASE: careersense_ai
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - internal-net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: careersense-api
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: mysql+pymysql://root:rootsecretpassword@db:3306/careersense_ai
    networks:
      - internal-net
    ports:
      - "5000:5000"

volumes:
  mysql_data:

networks:
  internal-net:
    driver: bridge"""
            },
            {
                'module_title': 'Module 4: Storage, Networking & Production Security',
                'key_concepts': ['Data Persistence across Container Reboots', 'Host Ports vs Container Ports', 'Secrets Management', 'Vulnerability Scanning with Docker Scout'],
                'deep_dive': 'Container writable layers are ephemeral; destroying a container deletes all modified files. Named volumes store database files directly on the host Docker storage directory, surviving container lifecycle events.',
                'code_snippet': """# Managing Docker Volumes & Vulnerability Audits
# Create and inspect persistent named volume
docker volume create db_storage
docker volume inspect db_storage

# Scan local image for CVE security vulnerabilities
docker scout quickview careersense-api:latest"""
            }
        ],
        'resources': [
            {'name': 'Docker Official Documentation', 'url': 'https://docs.docker.com/', 'description': 'The official guide to Docker Engine, Dockerfiles, Compose, and CLI tools.'},
            {'name': 'Best Practices for Writing Dockerfiles', 'url': 'https://docs.docker.com/develop/develop-images/dockerfile_best-practices/', 'description': 'Official recommendations on caching, multi-stage builds, and small images.'},
            {'name': 'Docker Compose Specification', 'url': 'https://docs.docker.com/compose/compose-file/', 'description': 'Reference manual for docker-compose.yml properties, volumes, and networks.'}
        ],
        'exercises': [
            {
                'title': 'Exercise 1: Create an Optimized .dockerignore',
                'scenario': 'Create a production .dockerignore file preventing local dependencies, environment secrets, and git metadata from leaking into the build context.',
                'starter_code': """# .dockerignore
# TODO: add necessary ignore rules""",
                'solution': """# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
*.md
coverage
dist"""
            },
            {
                'title': 'Exercise 2: Docker Compose Healthcheck Configuration',
                'scenario': 'Configure a healthcheck for an Express or Flask backend that curls http://localhost:5000/api/health every 15 seconds.',
                'starter_code': """# docker-compose healthcheck snippet
    healthcheck:
      # TODO: define test, interval, timeout, retries""",
                'solution': """    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 10s"""
            }
        ],
        'project': 'Containerize Full-Stack CareerSense AI Application with Docker Compose, Persistent MySQL & NGINX',
        'outcome': 'Ability to package and deploy multi-tier web applications in isolated, reproducible Docker containers for any cloud host.',
        'quiz': [
            {
                'id': 1,
                'question': 'What is the primary benefit of a multi-stage Docker build?',
                'options': [
                    'It runs containers across multiple cloud providers simultaneously',
                    'It keeps the final production image lightweight and secure by discarding build tools, compilers, and devDependencies from earlier stages',
                    'It enables hot reloading in production environments',
                    'It automatically converts JavaScript into native machine code'
                ],
                'correct_index': 1,
                'explanation': 'Multi-stage builds allow you to use large images with SDKs and compilers during the build stage, and then copy only the compiled artifacts into a minimal production runtime image (like alpine), dramatically shrinking image size and attack surface.'
            },
            {
                'id': 2,
                'question': 'Why should you COPY package.json and run npm install BEFORE copying the rest of your application source code in a Dockerfile?',
                'options': [
                    'npm install fails if other source files are already present',
                    'To leverage Docker layer caching: dependencies are only re-installed when package.json changes, making subsequent code builds instant',
                    'It is a mandatory syntax requirement of the Dockerfile spec',
                    'To prevent git commits from modifying node_modules'
                ],
                'correct_index': 1,
                'explanation': 'Docker caches each instruction layer. If you copy package.json first and run npm install, Docker reuses that cached layer as long as package.json has not changed, skipping the slow dependency install step on source code edits.'
            },
            {
                'id': 3,
                'question': 'How do two containers in the same user-defined Docker Compose bridge network resolve each other\'s IP addresses?',
                'options': [
                    'By hardcoding the host computer\'s localhost:3000 IP address',
                    'Using Docker\'s internal embedded DNS server that automatically resolves peer service names (e.g. http://db:3306)',
                    'Through external public DNS servers like 8.8.8.8',
                    'Containers cannot communicate over Docker bridge networks'
                ],
                'correct_index': 1,
                'explanation': 'Docker Compose creates a custom bridge network where an embedded DNS server automatically maps container and service names (like "db" or "backend") to their assigned internal container IP addresses.'
            },
            {
                'id': 4,
                'question': 'What happens to data stored inside a container\'s writable layer when the container is deleted (docker rm)?',
                'options': [
                    'The data is automatically saved to the host Desktop folder',
                    'The data is permanently lost unless stored in a mounted Docker Volume or Bind Mount',
                    'The data is pushed to Docker Hub automatically',
                    'Docker saves a zip snapshot in /tmp'
                ],
                'correct_index': 1,
                'explanation': 'The writable layer on top of an image is ephemeral and tied to the lifecycle of that specific container. When the container is destroyed, its writable layer is deleted. Persistent data must be mapped to named volumes.'
            },
            {
                'id': 5,
                'question': 'Why is running a container with USER node (non-root) strongly recommended in production?',
                'options': [
                    'Non-root users execute JavaScript 15% faster',
                    'To prevent privilege escalation attacks: if an attacker exploits a web vulnerability to gain a container shell, they will not have root privileges on the host kernel',
                    'The Docker daemon rejects containers started by root',
                    'Non-root users bypass container memory limits'
                ],
                'correct_index': 1,
                'explanation': 'Running containers as root poses a severe security risk. If a container breakout vulnerability occurs, the attacker inherits root privileges on the host system. Non-root execution strictly limits attack capabilities.'
            }
        ]
    },
    'Microservices': {
        'title': 'Microservices Architecture & Distributed Systems',
        'objectives': [
            'Decompose monolithic architectures into autonomous services using Domain-Driven Design (DDD) bounded contexts.',
            'Implement API Gateway routing, centralized token verification, and rate limiting.',
            'Design asynchronous event-driven messaging pipelines using message queues to decouple services.',
            'Implement resilience patterns: Circuit Breakers, Exponential Backoff, and Distributed Tracing (OpenTelemetry).'
        ],
        'topics': [
            'Monolith Decomposition & Bounded Contexts (DDD)',
            'API Gateway Pattern & Service Communication (REST vs gRPC)',
            'Asynchronous Messaging & Eventual Consistency (Saga Pattern)',
            'Resilience Patterns: Circuit Breakers, Retries & Distributed Tracing'
        ],
        'syllabus': [
            {
                'module_title': 'Module 1: Monolith Decomposition & Bounded Contexts',
                'key_concepts': ['Domain-Driven Design (DDD)', 'Bounded Contexts', 'Database-per-Service Pattern', 'Strangler Fig Pattern'],
                'deep_dive': 'Microservices must be autonomous and independently deployable. The cardinal rule of microservices is the Database-per-Service pattern: no service should directly query another service\'s database.',
                'code_snippet': """// Domain Boundaries in CareerSense AI:
// 1. Auth Service: User credentials, JWT issuance, profile ownership
// 2. Resume Intelligence Service: PDF extraction, NLP embeddings, score calculation
// 3. Job Match Service: Job description ingestion, TF-IDF cosine comparison
// 4. Learning Roadmap Service: Personalized milestones, task tracking, quiz grading"""
            },
            {
                'module_title': 'Module 2: API Gateway & Inter-Service Communication',
                'key_concepts': ['API Gateway Responsibilities', 'Synchronous HTTP/REST vs gRPC Protobuf', 'Request Routing & Load Balancing', 'Cross-Cutting Concerns (Auth, Rate Limits)'],
                'deep_dive': 'An API Gateway sits between external clients and internal microservices. It handles client authentication, SSL termination, and rate limiting, routing requests to internal private network endpoints.',
                'code_snippet': """// Reverse Proxy / API Gateway Routing Concept (Node.js)
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Route to Auth Service
app.use('/api/auth', createProxyMiddleware({ target: 'http://auth-service:5001', changeOrigin: true }));

// Route to Resume Analysis Service
app.use('/api/resume', createProxyMiddleware({ target: 'http://resume-service:5002', changeOrigin: true }));

// Route to Career Roadmap Service
app.use('/api/career-roadmap', createProxyMiddleware({ target: 'http://roadmap-service:5003', changeOrigin: true }));

app.listen(8080, () => console.log('API Gateway running on port 8080'));"""
            },
            {
                'module_title': 'Module 3: Asynchronous Messaging & The Saga Pattern',
                'key_concepts': ['Event-Driven Architecture', 'Message Brokers (RabbitMQ / Kafka / Redis Streams)', 'Eventual Consistency vs ACID', 'Saga Orchestration vs Choreography'],
                'deep_dive': 'Distributed transactions spanning multiple databases cannot use traditional ACID locks without severe performance bottlenecks. The Saga pattern executes a sequence of local transactions, triggering compensating transactions on failure.',
                'code_snippet': """// Event-Driven Decoupled Workflow
// 1. Candidate uploads resume -> Resume Service stores PDF and emits 'resume.uploaded'
// 2. Job Match Service consumes 'resume.uploaded' and re-computes similarity match
// 3. Roadmap Service consumes 'resume.analyzed' and generates personalized milestones
// 4. Notification Service consumes 'roadmap.ready' and emails the candidate"""
            },
            {
                'module_title': 'Module 4: Resilience & The Circuit Breaker Pattern',
                'key_concepts': ['Cascading Failures', 'Circuit Breaker States (Closed, Open, Half-Open)', 'Exponential Backoff with Jitter', 'OpenTelemetry Tracing Headers'],
                'deep_dive': 'When an upstream service slows or crashes, calling services can exhaust their thread pools waiting for timeouts, collapsing the entire system. A Circuit Breaker trips to OPEN after consecutive errors, failing fast without hitting the dying service.',
                'code_snippet': """// Circuit Breaker State Machine Concept
class CircuitBreaker {
  constructor(failureThreshold = 5, cooldownPeriodMs = 10000) {
    this.failureThreshold = failureThreshold;
    this.cooldownPeriodMs = cooldownPeriodMs;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(action) {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit Breaker OPEN: Service temporarily unavailable');
      }
    }

    try {
      const result = await action();
      this.reset();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.cooldownPeriodMs;
      console.warn('Circuit breaker tripped to OPEN state');
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}"""
            }
        ],
        'resources': [
            {'name': 'Microservices.io Pattern Language', 'url': 'https://microservices.io/patterns/', 'description': 'The definitive catalog of microservices architecture patterns by Chris Richardson.'},
            {'name': 'Microsoft Cloud Design Patterns: Circuit Breaker', 'url': 'https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker', 'description': 'Deep architectural overview of handling transient faults and circuit states.'},
            {'name': 'OpenTelemetry Distributed Tracing', 'url': 'https://opentelemetry.io/docs/concepts/signals/traces/', 'description': 'Standards for tracing distributed HTTP requests across microservice boundaries.'}
        ],
        'exercises': [
            {
                'title': 'Exercise 1: Trace Context Header Propagation',
                'scenario': 'Write a middleware function that extracts incoming traceparent headers (or generates a new trace ID) and attaches it to outbound HTTP client request headers.',
                'starter_code': """function traceMiddleware(req, res, next) {
  // TODO: Extract or generate trace_id and attach to req.traceId
  next();
}""",
                'solution': """const crypto = require('crypto');

function traceMiddleware(req, res, next) {
  const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
  req.traceId = traceId;
  res.setHeader('x-trace-id', traceId);
  next();
}"""
            },
            {
                'title': 'Exercise 2: Fallback Cache Handler for Failing Services',
                'scenario': 'Implement a fallback wrapper that attempts an upstream service call and, on failure, returns stale cached data from Redis with a warning header.',
                'starter_code': """async function fetchWithFallback(liveFetchFn, cacheKey) {
  // TODO: try live fetch, catch error and return cached fallback
}""",
                'solution': """async function fetchWithFallback(liveFetchFn, cacheKey, redisClient) {
  try {
    const data = await liveFetchFn();
    await redisClient.set(cacheKey, JSON.stringify(data), 'EX', 3600);
    return { data, isStale: false };
  } catch (err) {
    const cached = await redisClient.get(cacheKey);
    if (cached) return { data: JSON.parse(cached), isStale: true };
    throw err;
  }
}"""
            }
        ],
        'project': 'Distributed Multi-Tier Microservices Platform with API Gateway, Order Processing & Circuit Breaker',
        'outcome': 'Confidence in decomposing monoliths into resilient, decoupled microservices suited for high-availability environments.',
        'quiz': [
            {
                'id': 1,
                'question': 'What is the "Database-per-Service" pattern in microservices architecture, and why is it essential?',
                'options': [
                    'Every microservice must use a different database engine (e.g. MySQL, MongoDB, Redis)',
                    'Each microservice owns its own private database; no other service may directly query its tables, ensuring loose coupling and independent schema evolution',
                    'All microservices connect to one shared database table to maximize join performance',
                    'Databases must be rebooted every time a service restarts'
                ],
                'correct_index': 1,
                'explanation': 'In the Database-per-Service pattern, each microservice encapsulates its own persistent store. Other services must interact solely through published public APIs, preventing tight database coupling and enabling independent deployment and scaling.'
            },
            {
                'id': 2,
                'question': 'What are the three operational states of a Circuit Breaker pattern?',
                'options': [
                    'Active, Inactive, Deprecated',
                    'Closed (normal operations), Open (failing fast without calling upstream), and Half-Open (trial requests to test recovery)',
                    'Synchronous, Asynchronous, Queued',
                    'Primary, Secondary, Standby'
                ],
                'correct_index': 1,
                'explanation': 'Closed passes requests through normally; Open fails fast immediately to prevent cascading crashes when failure thresholds are exceeded; Half-Open allows limited probe requests through after a timeout to check if the upstream service has recovered.'
            },
            {
                'id': 3,
                'question': 'How does the Saga pattern maintain data consistency across distributed microservice databases without distributed 2-Phase Commit (2PC) locks?',
                'options': [
                    'By running all transactions in a single global database transaction',
                    'By executing a sequence of local transactions where each step updates its local DB, publishing events that trigger the next step, and executing compensating transactions if a step fails',
                    'By ignoring failures and treating all distributed writes as fire-and-forget',
                    'By taking hourly database snapshots'
                ],
                'correct_index': 1,
                'explanation': 'The Saga pattern achieves eventual consistency across services by executing local transactions. If any step fails, the saga executes compensating transactions that undo the changes made by preceding steps.'
            },
            {
                'id': 4,
                'question': 'What is the role of an API Gateway in a microservices architecture?',
                'options': [
                    'It acts as the single entry point for clients, routing requests to internal services, and handling cross-cutting concerns like authentication, SSL termination, and rate limiting',
                    'It compiles frontend React JSX files on the server',
                    'It serves as the main SQL database driver',
                    'It manages local git repositories'
                ],
                'correct_index': 0,
                'explanation': 'An API Gateway shields clients from internal microservices decomposition by providing a unified facade. It routes requests, terminates SSL, validates authentication tokens, and applies rate limiting.'
            },
            {
                'id': 5,
                'question': 'Why is gRPC (using Protocol Buffers) often preferred over REST/JSON for internal inter-service communication between microservices?',
                'options': [
                    'Protocol Buffers serialize binary data with significantly smaller payloads, lower CPU overhead, and compile-time type safety over HTTP/2 multiplexed streams',
                    'gRPC does not require a network connection',
                    'REST APIs cannot be run inside Docker containers',
                    'gRPC is an official requirement of the W3C standard'
                ],
                'correct_index': 0,
                'explanation': 'gRPC uses binary Protocol Buffers serialization rather than verbose text JSON, resulting in much smaller payloads and faster serialization. Running over HTTP/2, it supports multiplexed streams and bidirectional streaming.'
            }
        ]
    },
    'AWS': {
        'title': 'AWS Cloud Architecture & Scalable Deployment',
        'objectives': [
            'Configure Identity and Access Management (IAM) users, roles, least-privilege policies, and security groups.',
            'Provision, configure, and secure Amazon EC2 compute instances with NGINX reverse proxies and SSL certificates.',
            'Store, serve, and protect application media assets using Amazon S3 buckets and CloudFront CDN distribution.',
            'Deploy managed relational databases using Amazon RDS MySQL with automated daily snapshots and connection pooling.'
        ],
        'topics': [
            'IAM Roles, Least-Privilege Policies & Security Groups',
            'Amazon EC2 Compute Instances, SSH Keys & NGINX Reverse Proxy',
            'Amazon S3 Object Storage, Bucket Policies & CloudFront CDN',
            'Amazon RDS Managed MySQL Databases & Cloud Production Deployment'
        ],
        'syllabus': [
            {
                'module_title': 'Module 1: Cloud Security Fundamentals & IAM',
                'key_concepts': ['AWS Shared Responsibility Model', 'IAM Users, Groups & Roles', 'Least Privilege Principle', 'Security Groups vs Network ACLs'],
                'deep_dive': 'Never use the AWS root account for daily operations. Create IAM roles with tightly scoped JSON policy permissions and attach them directly to EC2 instances to avoid baking static API keys into code.',
                'code_snippet': """// Least-Privilege IAM Policy for S3 Resume Bucket
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ResumeUploads",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::careersense-resumes-prod/*"
    }
  ]
}"""
            },
            {
                'module_title': 'Module 2: Amazon EC2 Compute & Production Host Configuration',
                'key_concepts': ['AMI Selection (Ubuntu 22.04 LTS)', 'Instance Types (t3.micro / t3.small)', 'SSH Keypair Authentication', 'NGINX Reverse Proxy & Certbot Let\'s Encrypt'],
                'deep_dive': 'EC2 provides resizable compute capacity in the cloud. We configure an Ubuntu instance, lock down Security Groups to port 80/443 (HTTP/HTTPS) and port 22 (SSH), and run NGINX to reverse-proxy traffic to backend node processes.',
                'code_snippet': """# NGINX Configuration on EC2 (/etc/nginx/sites-available/careersense)
server {
    listen 80;
    server_name api.careersense.ai;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}"""
            },
            {
                'module_title': 'Module 3: Amazon S3 & CloudFront Global CDN',
                'key_concepts': ['S3 Buckets & Object Storage', 'Pre-Signed URLs for Secure Client Uploads', 'Block Public Access Configuration', 'CloudFront Low-Latency Edge Caching'],
                'deep_dive': 'Storing user resumes or PDFs on local EC2 disk is brittle (lost when instances terminate). Storing assets in Amazon S3 provides 99.999999999% (11 9s) durability. CloudFront caches assets at edge locations worldwide.',
                'code_snippet': """# Generating an S3 Pre-Signed Upload URL in Python (Boto3)
import boto3
from botocore.config import Config

s3_client = boto3.client('s3', region_name='us-east-1', config=Config(signature_version='s3v4'))

def generate_presigned_upload_url(bucket_name, object_key, expires_in=300):
    url = s3_client.generate_presigned_url(
        'put_object',
        Params={'Bucket': bucket_name, 'Key': object_key, 'ContentType': 'application/pdf'},
        ExpiresIn=expires_in
    )
    return url"""
            },
            {
                'module_title': 'Module 4: Amazon RDS Managed Databases & Cloud Architecture',
                'key_concepts': ['Managed MySQL Instance Provisioning', 'Multi-AZ Deployments for High Availability', 'Automated Backups & Point-in-Time Recovery', 'VPC Private Subnet Security'],
                'deep_dive': 'Amazon RDS automates hardware provisioning, database setup, patching, and backups. Placing RDS in private VPC subnets ensures database ports (3306) are never directly exposed to the public internet.',
                'code_snippet': """# Secure Cloud Production Environment Variables (.env)
DATABASE_URL=mysql+pymysql://careersense_app:SecureRDSSecret@careersense-db.c9k4x.us-east-1.rds.amazonaws.com:3306/careersense_ai
AWS_STORAGE_BUCKET_NAME=careersense-resumes-prod
AWS_DEFAULT_REGION=us-east-1
CDN_DOMAIN=https://d123456abcdef8.cloudfront.net"""
            }
        ],
        'resources': [
            {'name': 'AWS Skill Builder Official Modules', 'url': 'https://skillbuilder.aws/', 'description': 'Free interactive learning courses and cloud architecture pathways.'},
            {'name': 'AWS Well-Architected Framework', 'url': 'https://aws.amazon.com/architecture/well-architected/', 'description': 'Architectural best practices for security, reliability, performance, and cost.'},
            {'name': 'Amazon EC2 Linux User Guide', 'url': 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/', 'description': 'Complete guide to launching, configuring, and connecting to EC2 instances.'}
        ],
        'exercises': [
            {
                'title': 'Exercise 1: Security Group Rules Configuration',
                'scenario': 'Define the minimal inbound security group rules for an EC2 web server running NGINX with SSH access restricted to your admin IP address (203.0.113.4).',
                'starter_code': """# Inbound Rules:
# Type | Protocol | Port Range | Source
# ------------------------------------""",
                'solution': """# Inbound Rules:
# HTTP  | TCP | 80  | 0.0.0.0/0 (Anywhere IPv4)
# HTTPS | TCP | 443 | 0.0.0.0/0 (Anywhere IPv4)
# SSH   | TCP | 22  | 203.0.113.4/32 (Admin Specific IP Only)"""
            },
            {
                'title': 'Exercise 2: S3 Pre-Signed Download Generator',
                'scenario': 'Write a Python function using boto3 that generates a secure pre-signed download URL valid for 10 minutes (600 seconds).',
                'starter_code': """def get_secure_download_url(bucket: str, key: str) -> str:
    # TODO: generate presigned get_object URL
    pass""",
                'solution': """import boto3

def get_secure_download_url(bucket: str, key: str) -> str:
    s3 = boto3.client('s3')
    return s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': bucket, 'Key': key},
        ExpiresIn=600
    )"""
            }
        ],
        'project': 'Deploy CareerSense AI Full-Stack Application on AWS EC2 with S3 File Storage & Amazon RDS MySQL',
        'outcome': 'Proficiency in configuring scalable AWS cloud infrastructure, security groups, and automated production deployment.',
        'quiz': [
            {
                'id': 1,
                'question': 'Under the AWS Shared Responsibility Model, which of the following is the customer\'s responsibility when using Amazon EC2?',
                'options': [
                    'Physical data center security and physical server hardware maintenance',
                    'Guest operating system security patches, application configuration, and firewall (Security Group) rules',
                    'Decommissioning old storage disks and shredding drives',
                    'Global undersea fiber-optic cable maintenance'
                ],
                'correct_index': 1,
                'explanation': 'AWS is responsible for security OF the cloud (physical facilities, hardware, hypervisors), while the customer is responsible for security IN the cloud (guest OS updates, applications, IAM, and firewall rules).'
            },
            {
                'id': 2,
                'question': 'Why are IAM Roles preferred over hardcoded IAM User Access Keys when granting EC2 instances access to Amazon S3?',
                'options': [
                    'IAM Roles do not support permissions',
                    'IAM Roles provide temporary rotating credentials automatically via instance metadata without storing sensitive keys in code or files',
                    'IAM Roles are twice as fast as IAM Users',
                    'IAM Users cannot connect to S3'
                ],
                'correct_index': 1,
                'explanation': 'Attaching an IAM Role to an EC2 instance allows AWS to automatically rotate and issue temporary security credentials to the instance, eliminating the catastrophic risk of accidentally leaking hardcoded API keys on GitHub.'
            },
            {
                'id': 3,
                'question': 'What is the primary architectural difference between an AWS Security Group and a Network ACL (NACL)?',
                'options': [
                    'Security Groups are stateful (inbound traffic response is automatically allowed outbound); NACLs are stateless and operate at the subnet level',
                    'Security Groups only work on Windows servers',
                    'NACLs are managed by Google Cloud',
                    'There is no difference between them'
                ],
                'correct_index': 0,
                'explanation': 'Security Groups are stateful firewalls operating at the instance/ENI level (if inbound traffic is allowed, corresponding outbound response traffic is automatically permitted). NACLs are stateless rules evaluated at the subnet boundary.'
            },
            {
                'id': 4,
                'question': 'How does an S3 Pre-Signed URL allow secure client uploads without making the entire bucket publicly readable/writable?',
                'options': [
                    'It permanently changes bucket permissions to public for 5 minutes',
                    'It encodes a temporary cryptographic signature using server IAM credentials that grants access only to a specific object key for a limited expiration window',
                    'It bypasses Amazon S3 security policies entirely',
                    'It requires the user to log in with an AWS root account password'
                ],
                'correct_index': 1,
                'explanation': 'Pre-signed URLs include authentication query parameters generated using the server\'s IAM credentials, allowing an unauthenticated client to upload or download only the specified object for a strict time window.'
            },
            {
                'id': 5,
                'question': 'Where should you place your Amazon RDS database instance in a secure VPC architecture?',
                'options': [
                    'In a public subnet with an open 0.0.0.0/0 security group rule on port 3306',
                    'In a private subnet with no public IP address, accessible only by security group rules permitting traffic from the EC2 backend server',
                    'Directly on the client user\'s mobile phone',
                    'On an unencrypted FTP server'
                ],
                'correct_index': 1,
                'explanation': 'Database instances should always reside in private subnets with no public internet routing. Security groups must restrict database access solely to backend application servers located within the authorized VPC.'
            }
        ]
    },
    'CI/CD': {
        'title': 'Continuous Integration & Continuous Deployment Pipelines',
        'objectives': [
            'Automate the software delivery lifecycle from git commit to verified cloud release.',
            'Write automated GitHub Actions workflows with event triggers, matrix test jobs, and dependencies.',
            'Integrate automated linting, unit test execution, and multi-stage Docker container image builds.',
            'Securely manage production deployment secrets and implement automated zero-downtime releases.'
        ],
        'topics': [
            'CI/CD Core Philosophies & Branching Strategies',
            'GitHub Actions Workflow Syntax, Runners & Triggers',
            'Automated Unit/Integration Testing & Docker Image Registries',
            'Secrets Management, SSH Deployment & Production Release Automation'
        ],
        'syllabus': [
            {
                'module_title': 'Module 1: CI/CD Fundamentals & Pipeline Architecture',
                'key_concepts': ['Continuous Integration vs Delivery vs Deployment', 'Shift-Left Testing', 'Trunk-Based Development', 'Pipeline Stages (Lint -> Test -> Build -> Deploy)'],
                'deep_dive': 'Continuous Integration validates every commit with automated builds and test suites. Continuous Delivery keeps the artifact in a deployable state; Continuous Deployment automatically releases passing artifacts directly to production.',
                'code_snippet': """// Typical CI/CD Pipeline Lifecycle:
// 1. Developer pushes commit to branch 'feature/resume-parser'
// 2. GitHub Actions fires 'pull_request' trigger:
//    - Stage 1: ESLint & Flake8 syntax checks
//    - Stage 2: PyTest & Jest automated test suites
//    - Stage 3: Build Docker container image
// 3. PR approved & merged into 'main':
//    - Stage 4: Push tagged image to Docker Hub / AWS ECR
//    - Stage 5: Deploy container to production cloud server"""
            },
            {
                'module_title': 'Module 2: GitHub Actions Workflow Syntax & Runners',
                'key_concepts': ['.github/workflows/ YAML files', 'Events (push, pull_request, workflow_dispatch)', 'Jobs & Dependency Chaining (needs: ...)', 'Actions Marketplace & actions/checkout'],
                'deep_dive': 'Workflows are declared in YAML. Each workflow contains one or more jobs that run in parallel by default on isolated VM runners (e.g. ubuntu-latest). The needs keyword chains jobs sequentially.',
                'code_snippet': """# .github/workflows/ci.yml
name: CareerSense CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install Frontend Dependencies
        run: cd frontend && npm ci

      - name: Run Frontend Lint & Build
        run: cd frontend && npm run build"""
            },
            {
                'module_title': 'Module 3: Docker Registry Publishing & Image Tagging',
                'key_concepts': ['Container Registries (Docker Hub / GitHub GHCR)', 'Semantic Versioning Tags (v1.0.0, sha-...)', 'GitHub Secrets Vault', 'Docker Buildx Caching'],
                'deep_dive': 'Never store credentials in code or YAML. GitHub Secrets encrypts environment variables (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN). Docker Buildx utilizes GitHub cache layers to speed up builds by 80%.',
                'code_snippet': """# Docker Build and Publish Job in GitHub Actions
  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/careersense-api:latest"""
            },
            {
                'module_title': 'Module 4: Automated Cloud Deployment & Zero-Downtime Rollouts',
                'key_concepts': ['SSH Remote Dispatch with appleboy/ssh-action', 'Docker Compose Pull & Up', 'Zero-Downtime Rolling Restarts', 'Rollback Strategies on Failure'],
                'deep_dive': 'Once a verified container is pushed to the registry, the deployment step SSHs into the production EC2 instance, pulls the latest image, runs database migrations, and performs a graceful rolling restart.',
                'code_snippet': """# Deploy Step via SSH to Cloud Server
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Execute Remote SSH Deployment
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_PRIVATE_KEY }}
          script: |
            cd /opt/careersense
            docker compose pull backend
            docker compose up -d --no-deps backend
            docker system prune -f"""
            }
        ],
        'resources': [
            {'name': 'GitHub Actions Official Documentation', 'url': 'https://docs.github.com/en/actions', 'description': 'Complete reference manual for GitHub Actions workflow syntax, triggers, and runners.'},
            {'name': 'Continuous Delivery Handbook', 'url': 'https://continuousdelivery.com/', 'description': 'Principles and practices of automated software release management by Jez Humble.'},
            {'name': 'OWASP CI/CD Security Top 10', 'url': 'https://owasp.org/www-project-top-10-ci-cd-security-risks/', 'description': 'Security guide on protecting pipeline secrets and dependencies.'}
        ],
        'exercises': [
            {
                'title': 'Exercise 1: Job Dependency Chaining Syntax',
                'scenario': 'Write a GitHub Actions snippet where job "deploy" runs only if both jobs "frontend-test" and "backend-test" pass successfully.',
                'starter_code': """jobs:
  frontend-test:
    runs-on: ubuntu-latest
  backend-test:
    runs-on: ubuntu-latest
  deploy:
    # TODO: add dependency condition""",
                'solution': """jobs:
  frontend-test:
    runs-on: ubuntu-latest
  backend-test:
    runs-on: ubuntu-latest
  deploy:
    needs: [frontend-test, backend-test]
    runs-on: ubuntu-latest"""
            },
            {
                'title': 'Exercise 2: Secret Environment Variable Injection',
                'scenario': 'Write a step in a GitHub Action that passes an encrypted secret DATABASE_PASSWORD to a database migration command.',
                'starter_code': """      - name: Run Migrations
        # TODO: pass secret environment variable
        run: flask db upgrade""",
                'solution': """      - name: Run Migrations
        env:
          DATABASE_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}
        run: flask db upgrade"""
            }
        ],
        'project': 'Production Multi-Stage GitHub Actions CI/CD Pipeline Automating Testing, Docker Builds & Cloud Deploy',
        'outcome': 'Ability to automate the software delivery lifecycle from git commit to verified cloud release.',
        'quiz': [
            {
                'id': 1,
                'question': 'What is the primary difference between Continuous Delivery and Continuous Deployment?',
                'options': [
                    'Continuous Delivery is for mobile apps; Continuous Deployment is for web apps',
                    'In Continuous Delivery, releasing to production requires manual human approval, whereas in Continuous Deployment every passing build is released automatically without human intervention',
                    'Continuous Deployment does not run automated tests',
                    'Continuous Delivery uses Jenkins; Continuous Deployment uses GitHub Actions'
                ],
                'correct_index': 1,
                'explanation': 'In Continuous Delivery, software is automatically built and tested to ensure it is always ready to deploy, but the actual production release requires a manual trigger. In Continuous Deployment, every change that passes tests is deployed automatically.'
            },
            {
                'id': 2,
                'question': 'Which keyword in GitHub Actions workflow syntax specifies that a job must wait for another job to complete successfully before starting?',
                'options': [
                    'depends_on',
                    'needs',
                    'after',
                    'requires'
                ],
                'correct_index': 1,
                'explanation': 'In GitHub Actions, the needs keyword specifies prerequisite jobs (e.g. needs: [lint, test]). By default, jobs run in parallel unless chained with needs.'
            },
            {
                'id': 3,
                'question': 'Where should sensitive cloud credentials (such as AWS keys or database passwords) be stored in a GitHub repository?',
                'options': [
                    'In a public config.json file in the repository root',
                    'In encrypted GitHub Actions Secrets (Settings -> Secrets and variables -> Actions)',
                    'In commit messages',
                    'In the README.md file'
                ],
                'correct_index': 1,
                'explanation': 'GitHub Actions Secrets securely encrypts sensitive values. Secret values are never exposed in logs (automatically masked) and can only be decrypted by runners during workflow execution.'
            },
            {
                'id': 4,
                'question': 'What is the benefit of caching npm dependencies in GitHub Actions using actions/setup-node cache: "npm"?',
                'options': [
                    'It prevents npm from charging credit card fees',
                    'It reuses downloaded node_modules packages between runs, reducing pipeline execution time from minutes to seconds',
                    'It skips executing JavaScript unit tests',
                    'It runs tests on older Node.js versions'
                ],
                'correct_index': 1,
                'explanation': 'Caching the package-lock dependencies avoids downloading hundreds of megabytes over the network on every commit, speeding up CI builds and conserving runner minutes.'
            },
            {
                'id': 5,
                'question': 'What happens if any single step inside a GitHub Actions job fails with an exit code other than 0?',
                'options': [
                    'The runner continues executing all remaining steps as if nothing happened',
                    'The job fails immediately, stops executing subsequent steps, and marks the workflow run as failed',
                    'The workflow automatically creates a pull request fixing the error',
                    'The repository is deleted'
                ],
                'correct_index': 1,
                'explanation': 'By default, any step that exits with a non-zero exit code marks the job as failed and immediately terminates further step execution, preventing broken builds or failing tests from proceeding to deployment.'
            }
        ]
    }
}

def get_skill_curriculum(skill_name: str) -> dict:
    """
    Retrieves the rich curriculum for a skill or dynamically synthesizes
    a structured learning module with objectives, 4 syllabus modules,
    documentation links, 2 coding exercises, and a 5-question technical quiz.
    """
    if not skill_name:
        skill_name = "General Software Engineering"

    # Normalize skill name lookup
    clean_name = skill_name.strip()
    synonyms = {
        'Agile': 'Agile & Scrum',
        'Node': 'Node.js',
        'NodeJS': 'Node.js',
        'Express': 'Express.js',
        'ExpressJS': 'Express.js',
        'REST': 'REST APIs',
        'RESTful APIs': 'REST APIs',
        'API Design': 'REST APIs',
        'Microservice': 'Microservices',
        'Amazon Web Services': 'AWS'
    }
    canonical = synonyms.get(clean_name, clean_name)

    if canonical in SKILL_CURRICULUM:
        return SKILL_CURRICULUM[canonical]

    # Generate tailored dynamic curriculum if skill is outside the core catalog
    return {
        'title': f'{clean_name} Applied Engineering & Architecture',
        'objectives': [
            f'Master foundational principles and operational architecture of {clean_name}.',
            f'Implement clean coding patterns, error handling, and performance optimization in {clean_name}.',
            f'Integrate {clean_name} into modern full-stack workflows with automated unit tests.',
            f'Deploy and configure {clean_name} in production-ready software environments.'
        ],
        'topics': [
            f'{clean_name} Core Concepts & Architecture',
            f'{clean_name} Standard Ecosystem & Patterns',
            f'Production Implementation & Best Practices with {clean_name}',
            f'Testing, Security & Scalability Tuning for {clean_name}'
        ],
        'syllabus': [
            {
                'module_title': f'Module 1: Foundations & Architecture of {clean_name}',
                'key_concepts': ['Core Terminology', 'System Architecture', 'Lifecycle & Protocols', 'Tooling Setup'],
                'deep_dive': f'Deep understanding of {clean_name} architecture, core data structures, execution context, and how it interacts within the modern software stack.',
                'code_snippet': f'// {clean_name} Reference Implementation\nconsole.log("Initialized {clean_name} module with strict validation.");'
            },
            {
                'module_title': f'Module 2: Practical Syntax & Core Design Patterns',
                'key_concepts': ['Design Patterns', 'Idiomatic APIs', 'Input Validation', 'Error Boundaries'],
                'deep_dive': f'Best practices for writing modular, maintainable, and readable code utilizing {clean_name}.',
                'code_snippet': f'// {clean_name} Idiomatic Pattern\nfunction processData(input) {{\n  if (!input) throw new Error("Invalid payload");\n  return {{ status: "ok", processed: true }};\n}}'
            },
            {
                'module_title': f'Module 3: Integration & Asynchronous Workflows',
                'key_concepts': ['External Integrations', 'State Management', 'Data Flow', 'API Contracts'],
                'deep_dive': f'Connecting {clean_name} with databases, REST APIs, and background task queues safely.',
                'code_snippet': f'// Asynchronous Handler with {clean_name}\nasync function executeService() {{\n  const result = await fetch("/api/data");\n  return result.json();\n}}'
            },
            {
                'module_title': f'Module 4: Production Hardening, Testing & Monitoring',
                'key_concepts': ['Unit & Integration Testing', 'Security Hardening', 'Observability', 'Performance Tuning'],
                'deep_dive': f'Ensuring high reliability and automated test coverage for {clean_name} deployments.',
                'code_snippet': f'// Production Verification Test\ndescribe("{clean_name} Suite", () => {{\n  it("verifies expected output", () => {{\n    expect(true).toBe(true);\n  }});\n}});'
            }
        ],
        'resources': [
            {'name': f'Official {clean_name} Documentation', 'url': f'https://www.google.com/search?q={clean_name}+official+documentation', 'description': f'Official reference manual and getting started guides for {clean_name}.'},
            {'name': f'Modern {clean_name} Architecture Guide', 'url': f'https://www.google.com/search?q={clean_name}+best+practices+guide', 'description': f'Community guidelines, patterns, and design principles.'},
            {'name': f'{clean_name} Security & Performance Handbook', 'url': f'https://www.google.com/search?q={clean_name}+security+best+practices', 'description': f'Production checklist for hardening {clean_name}.'}
        ],
        'exercises': [
            {
                'title': f'Exercise 1: {clean_name} Core Pattern Implementation',
                'scenario': f'Implement a reusable helper leveraging {clean_name} with input sanitization and error boundaries.',
                'starter_code': f'function handle{clean_name.replace(" ", "")}(data) {{\n  // TODO: implement core {clean_name} handler\n}}',
                'solution': f'function handle{clean_name.replace(" ", "")}(data) {{\n  if (!data) throw new Error("Payload required");\n  return {{ success: true, timestamp: Date.now() }};\n}}'
            },
            {
                'title': f'Exercise 2: {clean_name} Automated Verification Test',
                'scenario': f'Write an automated test validating edge cases and error responses in your {clean_name} module.',
                'starter_code': f'// TODO: write test case for {clean_name}',
                'solution': f'test("validates {clean_name} input correctly", () => {{\n  expect(() => handle{clean_name.replace(" ", "")}(null)).toThrow();\n}});'
            }
        ],
        'project': f'Build and Deploy a Production Mini-Project Demonstrating Core Mastery of {clean_name}',
        'outcome': f'Demonstrated practical competence in {clean_name} with functional, reviewed portfolio code.',
        'quiz': [
            {
                'id': 1,
                'question': f'What is the primary architectural purpose of {clean_name} in modern software engineering?',
                'options': [
                    f'To provide scalable, maintainable capabilities for solving core domain challenges in {clean_name}',
                    f'To replace relational SQL databases entirely',
                    f'To eliminate the need for version control systems',
                    f'To bypass automated security checks'
                ],
                'correct_index': 0,
                'explanation': f'{clean_name} provides specialized capabilities and architecture designed to solve specific scalability, reliability, and engineering challenges efficiently.'
            },
            {
                'id': 2,
                'question': f'Which best practice is recommended when configuring {clean_name} for production environments?',
                'options': [
                    'Hardcoding secret API keys directly inside source code files',
                    'Injecting environment variables, configuring logging, and enforcing strict input validation',
                    'Disabling error logging to reduce file disk usage',
                    'Running all services with root administrative privileges'
                ],
                'correct_index': 1,
                'explanation': 'Production environments require decoupling configuration into environment variables, validating all input payloads, and maintaining structured observability and logging.'
            },
            {
                'id': 3,
                'question': f'How should error handling be structured when working with {clean_name}?',
                'options': [
                    'Silently swallowing exceptions using empty catch blocks',
                    'Catching exceptions, logging contextual diagnostics, and providing semantic error responses to clients',
                    'Terminating the operating system immediately on any error',
                    'Displaying raw database stack traces directly to end users'
                ],
                'correct_index': 1,
                'explanation': 'Robust error handling captures runtime exceptions, sanitizes sensitive internal stack traces from public responses, and logs diagnostic context for engineering teams.'
            },
            {
                'id': 4,
                'question': f'Why is automated testing critical when developing services utilizing {clean_name}?',
                'options': [
                    'Tests prevent regression bugs, verify edge cases, and validate contracts before production deployment',
                    'Tests are required by web browsers to load web pages',
                    'Automated tests reduce internet bandwidth usage',
                    'Testing eliminates the need for code review'
                ],
                'correct_index': 0,
                'explanation': 'Automated test suites catch regressions, verify boundary conditions, and give engineering teams confidence to refactor and deploy code reliably.'
            },
            {
                'id': 5,
                'question': f'What is the recommended approach for managing dependencies related to {clean_name}?',
                'options': [
                    'Copying raw code files manually from external blogs',
                    'Using package managers (npm, pip, docker) with lockfiles to ensure deterministic, reproducible builds',
                    'Never updating dependencies after initial creation',
                    'Storing dependencies in unversioned zip archives'
                ],
                'correct_index': 1,
                'explanation': 'Package managers with lockfiles (package-lock.json, poetry.lock, requirements.txt) ensure deterministic, repeatable installations across local development, CI pipelines, and production servers.'
            }
        ]
    }

