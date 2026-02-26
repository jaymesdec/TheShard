import type { Config } from '@react-router/dev/config';

const config: Config = {
	appDirectory: './src/app',
	ssr: true,
};

// Only prerender locally (Vercel uses a custom build script)
if (process.env.VERCEL !== '1') {
	config.prerender = ['/*?'];
}

export default config satisfies Config;
