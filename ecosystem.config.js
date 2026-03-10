module.exports = {
    apps: [
        {
            // ─── AI 시뮬레이션 엔진 ───────────────────────────────────
            name: 'city-engine',
            script: 'simulation-engine.ts',
            interpreter: 'ts-node',
            interpreter_args: '--project tsconfig.server.json',
            watch: false,
            autorestart: true,
            restart_delay: 3000,
            max_restarts: 50,
            min_uptime: '10s',
            env: {
                NODE_ENV: 'production',
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            error_file: 'logs/city-engine-error.log',
            out_file: 'logs/city-engine-out.log',
        },
    ],
};
