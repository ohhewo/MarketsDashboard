const path = require('path');

module.exports = {
    entry: {
        index: './src/index.js',
        systems_overview: './src/systems_overview.js',
        weekday_batch_sla_view: './src/weekday_batch_sla_view.js',
        weekend_batch_sla_view: './src/weekend_batch_sla_view.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
        },
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        open: true,
    },
    mode: 'development'
};
