import type { Config } from '@react-router/dev/config';

const config: Config = {
	appDirectory: './src/app',
	ssr: true,
};

// Use the Vercel preset when building on Vercel
if (process.env.VERCEL === '1') {
	const { vercelPreset } = await import('@vercel/react-router/vite');
	config.presets = [vercelPreset()];
} else {
	config.prerender = ['/*?'];
}

export default config satisfies Config;
