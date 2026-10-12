// CareerSense AI - Skill Curriculum & Learning Plan Definitions
export const SKILL_CURRICULUM = {
  'Docker': {
    title: 'Containerization with Docker & Multi-Stage Builds',
    topics: ['Container Architecture & Isolation Mechanics', 'Dockerfile Directives & Multi-Stage Production Builds', 'Docker Compose Multi-Container Orchestration', 'Image Layer Optimization & Alpine Base Images', 'Volume Persistence & Network Bridges', 'Container Security & Non-Root Execution'],
    project: 'Containerize a full-stack application with isolated frontend, backend, and database networks using Docker Compose and multi-stage caching.',
    outcome: 'Ability to package and deploy repeatable, production-grade microservices into portable containers.',
    resources: ['Docker Official Documentation', 'Play with Docker Labs', 'Docker Deep Dive Guide']
  },
  'Kubernetes': {
    title: 'Kubernetes Container Orchestration & Cluster Management',
    topics: ['Cluster Architecture (Control Plane vs Worker Nodes)', 'Pods, Deployments & ReplicaSets', 'ClusterIP, NodePort & Ingress Controllers', 'ConfigMaps, Secrets & Environment Injection', 'Horizontal Pod Autoscalers (HPA) & Metrics Server', 'Liveness & Readiness Probes for Zero-Downtime Releases'],
    project: 'Deploy and autoscale a containerized API with rolling zero-downtime updates and ingress routing on a local Minikube/K8s cluster.',
    outcome: 'Competence in architecting, autoscaling, and operating cloud-native workloads in Kubernetes.',
    resources: ['Kubernetes Official Docs & Interactive Tutorials', 'Kubernetes the Hard Way (Kelsey Hightower)', 'CNCF Cloud Native Interactive Roadmap']
  },
  'TypeScript': {
    title: 'Strict TypeScript & Enterprise Type Architecture',
    topics: ['Static Typing, Interfaces & Type Aliases', 'Generics, Utility Types (Partial, Pick, Omit) & Conditional Types', 'Discriminated Unions & Exhaustiveness Checking', 'Strict tsconfig Compiler Configurations', 'Type Narrowing, Custom Type Guards & Zod Runtime Parsing', 'Integrating TypeScript with REST and Full-Stack Frameworks'],
    project: 'Refactor an existing JavaScript codebase to strict TypeScript with runtime Zod schema validation and automated type checking.',
    outcome: 'Proficiency in eliminating runtime errors via strict compile-time type safety and advanced generic modeling.',
    resources: ['TypeScript Official Handbook', 'Total TypeScript Tutorials', 'Effective TypeScript Guide']
  },
  'AWS': {
    title: 'AWS Cloud Architecture & Serverless Computing',
    topics: ['Core IAM Roles, Policies & Least Privilege Access', 'Virtual Private Cloud (VPC), Subnets & Security Groups', 'Amazon S3 Bucket Policies & Presigned URLs', 'AWS Lambda Serverless Functions & API Gateway', 'DynamoDB NoSQL vs RDS Relational Databases', 'CloudWatch Alarms, Metric Dashboards & Logging'],
    project: 'Architect a serverless document processing pipeline using S3 event triggers, AWS Lambda, DynamoDB, and API Gateway.',
    outcome: 'Readiness for AWS Cloud Practitioner and Solutions Architect associate-level enterprise workflows.',
    resources: ['AWS Skill Builder Interactive Labs', 'AWS Free Tier Architecture Guides', 'Serverless Framework Quickstart']
  },
  'Redis': {
    title: 'Redis In-Memory Caching & Distributed Data Structures',
    topics: ['In-Memory Data Architecture & Performance Profile', 'Strings, Hashes, Sets, Sorted Sets & HyperLogLogs', 'Cache-Aside Pattern, TTL Expiration & Cache Invalidation', 'Redis Pub/Sub & Stream Messaging', 'Distributed Locks with Redlock Algorithm', 'Redis Sentinel & High-Availability Clusters'],
    project: 'Implement a high-throughput API rate-limiter and cache-aside layer with Redis achieving sub-5ms response latencies.',
    outcome: 'Mastery in building low-latency caching tiers and distributed synchronizations.',
    resources: ['Redis University Interactive Courses', 'Redis Official Commands Reference', 'Distributed Caching Patterns']
  },
  'GraphQL': {
    title: 'GraphQL API Design & Apollo Client Integration',
    topics: ['REST vs GraphQL Architectural Differences', 'Schema Definition Language (SDL), Types & Fields', 'Queries, Mutations & Subscriptions', 'Resolver Architecture & N+1 Problem Prevention (DataLoader)', 'Apollo Server Schema Stitching & Federation', 'Client-side Query Caching with Apollo Client / Urql'],
    project: 'Build a GraphQL microservice API with optimized nested relational queries utilizing DataLoader to eliminate redundant database trips.',
    outcome: 'Proficiency in building declarative, flexible APIs that eliminate over-fetching and under-fetching.',
    resources: ['GraphQL.org Official Documentation', 'Apollo GraphQL Odyssey Tutorials', 'How to GraphQL Interactive Tutorial']
  },
  'CI/CD': {
    title: 'Continuous Integration & Continuous Deployment Pipelines',
    topics: ['Pipeline Automation Concepts & Trigger Workflows', 'GitHub Actions / GitLab CI Workflow Syntax', 'Automated Linting, Unit Testing & Static Code Analysis', 'Docker Image Build, Vulnerability Scan & Registry Push', 'Infrastructure Deployment to Staging/Production', 'Semantic Release & Automated Changelog Generation'],
    project: 'Construct an end-to-end GitHub Actions workflow executing automated linting, pytest suites, container building, and deployment.',
    outcome: 'Readiness to maintain production-grade continuous delivery automation across development teams.',
    resources: ['GitHub Actions Documentation', 'Continuous Delivery by Jez Humble', 'GitLab CI/CD Examples']
  },
  'PostgreSQL': {
    title: 'PostgreSQL Relational Schema Design & Query Tuning',
    topics: ['Advanced SQL Queries, Window Functions & CTEs', 'Relational Schema Normalization & Constraint Design', 'Indexing Strategies (B-Tree, GIN, GiST) & EXPLAIN ANALYZE', 'JSONB Document Storage & Hybrid Relational Queries', 'ACID Transactions, Isolation Levels & Row-Level Locking', 'Database Migrations with Alembic / Prisma'],
    project: 'Design and tune a high-concurrency database schema handling complex analytical aggregation queries in under 50ms.',
    outcome: 'Deep competency in designing performant relational schemas and diagnosing database query bottlenecks.',
    resources: ['PostgreSQL Official Manual', 'Use The Index, Luke (SQL Indexing Guide)', 'PostgreSQL Exercises Interactive']
  },
  'Node.js': {
    title: 'Node.js Backend Architecture & Asynchronous Event Loop',
    topics: ['V8 Engine & libuv Asynchronous Event Loop Architecture', 'Node.js Streams, Buffers & File System Operations', 'RESTful API Engineering with Express & Fastify', 'JWT Authentication, Middleware Chains & Security Headers', 'Error Handling, Logging (Winston/Pino) & Async Boundaries', 'Unit and Integration Testing with Jest and Supertest'],
    project: 'Build a secure, modular REST API server with JWT authentication, role-based access control, and comprehensive integration test coverage.',
    outcome: 'Confidence building scalable, production-ready asynchronous backend microservices.',
    resources: ['Node.js Official Documentation', 'Node.js Design Patterns Book', 'Express.js Security Best Practices']
  },
  'React': {
    title: 'Advanced React Architecture, Hooks & State Management',
    topics: ['Virtual DOM Reconciliation & React Fiber Architecture', 'Custom Hooks, useMemo, useCallback & Performance Tuning', 'Modern Context API & Global State (Zustand/Redux Toolkit)', 'Component Lifecycle, Error Boundaries & Suspense', 'Accessible Component Design & Tailwind CSS Architecture', 'Component Testing with Vitest and React Testing Library'],
    project: 'Architect a responsive, accessible React dashboard with optimistic UI updates, client-side caching, and custom hook abstraction.',
    outcome: 'Mastery in building robust, performant front-end web applications with clean component architecture.',
    resources: ['React.dev Official Documentation', 'Epic React by Kent C. Dodds', 'React Patterns and Clean Architecture']
  },
  'Python': {
    title: 'Idiomatic Python, Advanced Data Structures & Testing',
    topics: ['Pythonic Idioms & Data Structures', 'Object-Oriented Design & Protocols', 'Decorators, Generators & Context Managers', 'Type Hints & Pydantic Validation', 'Virtual Environments & Dependency Management', 'PyTest Test-Driven Development'],
    project: 'Develop an asynchronous CLI tool covered by comprehensive PyTest test suites and automated type validation.',
    outcome: 'Proficiency in writing maintainable, idiomatic, test-covered Python services.',
    resources: ['Python.org Official Documentation', 'Real Python Tutorials', 'Fluent Python Guide']
  },
  'System Design': {
    title: 'System Design & Scalable Distributed Architecture',
    topics: ['Scalability Fundamentals (Vertical vs Horizontal)', 'Load Balancing Algorithms & Reverse Proxies (NGINX)', 'Database Sharding, Partitioning & Read Replicas', 'Asynchronous Processing & Message Queues (RabbitMQ/Kafka)', 'CAP Theorem & Eventual Consistency', 'CDN Edge Caching & Fault Tolerance'],
    project: 'Design and document the end-to-end architecture diagram for a URL shortener service handling 10,000 requests per second.',
    outcome: 'Confidence in architecting fault-tolerant, horizontally scalable web platforms capable of supporting millions of daily users.',
    resources: ['System Design Primer (GitHub)', 'High Scalability Case Studies', 'Designing Data-Intensive Applications']
  },
  'Git': {
    title: 'Git Version Control & Production Collaboration Workflows',
    topics: ['Git Internals & Object Model', 'Branching Models (GitFlow, Trunk-Based)', 'Interactive Rebasing & Clean History', 'Merge Conflict Resolution Strategies', 'Git Hooks & Automated Husky Pre-Commit', 'Semantic Versioning & Release Tagging'],
    project: 'Configure an enterprise GitHub repository with branch protection, PR review templates, and automated CI hooks.',
    outcome: 'Mastery in collaborative git workflows, trunk-based releases, and clean commit history maintenance.',
    resources: ['Pro Git Official Book', 'Atlassian Git Workflows Guide', 'GitHub Skills Interactive Labs']
  },
  'Agile': {
    title: 'Agile Software Engineering & Scrum Sprint Delivery',
    topics: ['Scrum Framework & Sprint Ceremonies', 'User Story Writing & Acceptance Criteria', 'Backlog Grooming & Story Point Estimation', 'Jira / GitHub Projects Sprint Boards', 'Code Review Etiquette & Engineering SLAs', 'CI/CD Automated Deployments in Sprints'],
    project: 'Execute a 2-week simulated sprint in GitHub Projects with user stories, task breakdowns, daily updates, and sprint demo.',
    outcome: 'Practical readiness for professional software team workflows, agile delivery, and cross-functional collaboration.',
    resources: ['Scrum Guide Official', 'Atlassian Agile Coach', 'Google Engineering Practices Guide']
  },
  'JavaScript': {
    title: 'Modern JavaScript (ES6+) & Asynchronous Engine Architecture',
    topics: ['V8 Engine & Call Stack / Event Loop', 'Promises, Async/Await & Microtask Queue', 'Closures, Scope Chain & Lexical Environment', 'Prototypes, Classes & Modern Inheritance', 'DOM Manipulation, Events & Web APIs', 'Functional Utilities & Modern ES Modules'],
    project: 'Build a lightweight, zero-dependency async dashboard consuming public REST APIs with client-side state caching.',
    outcome: 'Deep understanding of JavaScript asynchronous runtime behavior and clean modern ES6+ coding standards.',
    resources: ['MDN JavaScript Deep Dive', 'JavaScript.info Complete Guide', 'You Don\'t Know JS']
  },
  'MySQL': {
    title: 'MySQL Relational Schema Design & Query Optimization',
    topics: ['Relational Schema Normalization (3NF)', 'Complex Multi-Table Joins & Grouping', 'B-Tree Indexing Strategies & EXPLAIN Analysis', 'ACID Transactions & Row-Level Locking', 'Foreign Keys, Cascades & Integrity Constraints', 'Connection Pooling & Database Migrations'],
    project: 'Design, normalize, and index a relational database schema handling concurrent transactional order processing.',
    outcome: 'Proficiency in writing high-performance SQL queries and architecting resilient relational database schemas.',
    resources: ['MySQL Official Documentation', 'Use The Index, Luke (SQL Indexing)', 'High Performance MySQL Guide']
  },
  'Microservices': {
    title: 'Microservices Architecture & Distributed Services',
    topics: ['Domain-Driven Design (DDD) Boundaries', 'API Gateway & Reverse Proxy Patterns', 'Inter-Service Communication (REST & gRPC)', 'Distributed Tracing & Centralized Logging', 'Resilience Patterns (Circuit Breaker, Retries)', 'Event-Driven Decoupling with Message Brokers'],
    project: 'Architect and implement a multi-tier microservices application communicating over an internal network with an API Gateway.',
    outcome: 'Confidence in decomposing monoliths into resilient, decoupled microservices suited for high-availability environments.',
    resources: ['Microservices.io Pattern Language', 'Building Microservices by Sam Newman', 'Distributed Systems Patterns']
  }
};

export function getSkillCurriculum(skillName) {
  if (!skillName) return null;
  const match = Object.keys(SKILL_CURRICULUM).find(
    (k) => k.toLowerCase() === skillName.toLowerCase()
  );
  if (match) return SKILL_CURRICULUM[match];

  return {
    title: `${skillName} Engineering Mastery`,
    topics: [
      `${skillName} Core Architecture & Syntax`,
      `${skillName} Standard Library & Ecosystem`,
      `Design Patterns & Best Practices in ${skillName}`,
      `Testing, Debugging & Performance Optimization in ${skillName}`
    ],
    project: `Build a practical demonstration project leveraging ${skillName} required for industry requisitions.`,
    outcome: `Demonstrated practical competency in ${skillName} with reviewed portfolio code.`,
    resources: [
      `Official ${skillName} Documentation`,
      `Modern ${skillName} Guide for Developers`,
      `Hands-on Community Practice Labs`
    ]
  };
}

