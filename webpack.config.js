const path = require('path');
//add html-webpack-plugin
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.js',
        systems_overview: './src/systems_overview.js',
        weekday_batch_sla_view: './src/weekday_batch_sla_view.js',
        weekend_batch_sla_view: './src/weekend_batch_sla_view.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
           {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader']
            }
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: 'Dashboard',
            filename: 'index.html',
            template: './src/index.html',
            chunks: ['index']
        }),
        new HtmlWebpackPlugin({
            title: 'Systems Overview',
            filename: 'systems_overview.html',
            template: './src/systems_overview.html',
            chunks: ['systems_overview']
        }),
        new HtmlWebpackPlugin({
            title: 'Weekday Batch SLA View',
            filename: 'weekday_batch_sla_view.html',
            template: './src/weekday_batch_sla_view.html',
            chunks: ['weekday_batch_sla_view']
        }),
        new HtmlWebpackPlugin({
            title: 'Weekend Batch SLA View',
            filename: 'weekend_batch_sla_view.html',
            template: './src/weekend_batch_sla_view.html',
            chunks: ['weekend_batch_sla_view']
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        open : true
    },
    mode: 'development' // 'production'
}
