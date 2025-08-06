// Cloudflare Worker entry for shadcn-ui MCP
export interface Env {
  GITHUB_TOKEN?: string;
}

const REPO_OWNER = 'shadcn-ui';
const REPO_NAME = 'ui';
const REPO_BRANCH = 'main';
const V4_BASE_PATH = 'apps/v4/registry/new-york-v4';

async function githubFetch(path: string, env: Env): Promise<Response> {
  const headers: Record<string, string> = {
    'User-Agent': 'shadcn-ui-mcp-worker/1.0'
  };
  if (env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${env.GITHUB_TOKEN}`;
  }
  return fetch(path, { headers });
}

async function listComponents(env: Env): Promise<string[]> {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${V4_BASE_PATH}/ui`;
  try {
    const res = await githubFetch(url, env);
    if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
    const data = await res.json() as { type: string, name: string }[];
    return data.filter(item => item.type === 'file' && item.name.endsWith('.tsx'))
               .map(item => item.name.replace('.tsx', ''));
  } catch {
    // Fallback minimal component list when network is unavailable
    console.error('Failed to list components from GitHub, using fallback:', error);
    return ['button', 'input', 'card'];
  }
}

async function getComponentSource(name: string, env: Env): Promise<string> {
  const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${V4_BASE_PATH}/ui/${name}.tsx`;
  const res = await githubFetch(url, env);
  if (!res.ok) throw new Error(`Component ${name} not found`);
  return await res.text();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/components/') && request.method === 'GET') {
        const name = url.pathname.split('/')[2];
        if (!name) {
          return new Response('Bad Request: Component name is missing.', { status: 400 });
        }
        const source = await getComponentSource(name, env);
        return new Response(source, { headers: { 'Content-Type': 'text/plain' } });
      }
      if (url.pathname.startsWith('/components/') && request.method === 'GET') {
        const name = url.pathname.split('/')[2];
        if (!name) {
          return new Response('Bad Request: Component name is missing.', { status: 400 });
        }
        const source = await getComponentSource(name, env);
        return new Response(source, { headers: { 'Content-Type': 'text/plain' } });
      }
      return new Response('Not found', { status: 404 });
    } catch (err: any) {
      return new Response(err.message, { status: 500 });
    }
  }
};
