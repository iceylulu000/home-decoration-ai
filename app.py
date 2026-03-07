Commit message: Optimize startup time with lazy loading

Extended description:
- Implement lazy loading for main_graph
- Only load heavy dependencies when needed
- Reduce startup time for Vercel Serverless Function
- Fix "response time too long" issue
