import adapter from '@sveltejs/adapter-static';
import { sveltePreprocess } from 'svelte-preprocess';
import { preprocessMeltUI, sequence } from '@melt-ui/pp';

/** @type {import('@sveltejs/kit').Config} */
const configuredBasePath = process.env.CONSOLE_BASE_PATH;
const basePath = configuredBasePath === undefined ? '/console' : configuredBasePath;

const config = {
    preprocess: sequence([
        sveltePreprocess({
            scss: {
                silenceDeprecations: ['legacy-js-api']
            }
        }),
        preprocessMeltUI()
    ]),
    kit: {
        alias: {
            $routes: './src/routes',
            $themes: './src/themes',
            $database:
                './src/routes/(console)/project-[region]-[project]/databases/database-[database]'
        },
        adapter: adapter({
            fallback: 'index.html',
            precompress: true
        }),
        paths: {
            base: basePath
        }
    },
    vitePlugin: {
        inspector: {
            toggleKeyCombo: 'meta-shift-i'
        }
    }
};

export default config;
