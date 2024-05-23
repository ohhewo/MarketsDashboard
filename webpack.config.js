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
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 9000,
        headers: {
            'Content-Type': 'text/javascript',
            'Content-Type': 'text/html'
        }
    }
};