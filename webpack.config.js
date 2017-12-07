// path library allows you to combine directories and filenames into paths

const path = require('path');
const baseDirectory = __dirname;
const webpack = require('webpack');

module.exports = {
	devtool: 'cheap-module-eval-source-map',
	context: path.resolve(__dirname, 'src'),
	entry: './index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js'
	},
	resolve: {
		extensions: ['.js']
	},
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/
			}
		]
	},
	devServer: {
		contentBase: path.resolve(__dirname, 'src'),
		publicPath: '/dist'
	}
};
