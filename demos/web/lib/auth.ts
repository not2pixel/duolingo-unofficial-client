export interface DemoConfig {
  duolingoToken?: string;
  demoAccessKey?: string;
}

export function getDemoConfig(env: NodeJS.ProcessEnv = process.env): DemoConfig {
  const config: DemoConfig = {};
  if (env.DUOLINGO_TOKEN) config.duolingoToken = env.DUOLINGO_TOKEN;
  if (env.DEMO_ACCESS_KEY) config.demoAccessKey = env.DEMO_ACCESS_KEY;
  return config;
}
