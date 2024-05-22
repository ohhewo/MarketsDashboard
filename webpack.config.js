const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'styles.css',
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
            chunks: ['index']
        }),
        new HtmlWebpackPlugin({
            filename: 'systems_overview.html',
            template: 'src/systems_overview.html',
            chunks: ['systems_overview']
        }),
        new HtmlWebpackPlugin({
            filename: 'weekday_batch_sla_view.html',
            template: 'src/weekday_batch_sla_view.html',
            chunks: ['weekday_batch_sla_view']
        }),
        new HtmlWebpackPlugin({
            filename: 'weekend_batch_sla_view.html',
            template: 'src/weekend_batch_sla_view.html',
            chunks: ['weekend_batch_sla_view']
        })
    ],
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
