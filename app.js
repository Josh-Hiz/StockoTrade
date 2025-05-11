//my bs just to look at it for now
import yahooFinance from 'yahoo-finance2';
yahooFinance.suppressNotices(['yahooSurvey'])
const results = await yahooFinance.chart('JVSAU', {period1: '2025-05-01', period2: '2025-05-11', interval: '1d'})
//console.log(results)

import express from 'express';
import exphbs from 'express-handlebars';
import morgan from 'morgan';
import logger from './utils/logging/logger.js';
import setupRoutes from './routes/index.js';
import cookieParser from 'cookie-parser';

const rewriteUnsupportedBrowserMethods = (req, res, next) => {
	if (req.body && req.body._method) {
		req.method = req.body._method;
		delete req.body._method;
	}

	// let the next middleware run:
	next();
};

const checkAuthentication = (req, res, next) => {
	const isLoggedIn = req.cookies.isAuthenticated; // Make sure they are logged in
	const userId = req.cookies.userID; // Make sure we have a userID cookies
	if (isLoggedIn && userId && isLoggedIn === 'true' && userId !== 'null') {
		next();
		return;
	} else {
		// If a user isnt auth'd then set some cookies
		const dayFromNow = new Date(new Date().getTime() + 60 * 60 * 24 * 1000)
		res.cookie("isAuthenticated", "false", {expires: dayFromNow});
		res.cookie('userID', "null", {expires: dayFromNow})
	}
	next();
}

// Init app
const app = express();

// Set up logging middleware
const stream = {
	write: (message) => logger.http(message),
};
app.use(morgan('dev', { stream: stream }));

// Setup default middlewares
app.use(cookieParser());
app.use('/public', express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rewriteUnsupportedBrowserMethods);

// Middleware to set default cookies if required
app.all('/', checkAuthentication);
app.all('/login', checkAuthentication)
app.all('/signup', checkAuthentication)
app.all('/dashboard', checkAuthentication)

// Setup templating engine
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Apply remaining routes
setupRoutes(app);

// Begin listening
app.listen(3000, () => {
	console.log('Running StockoTrade server...');
	console.log('StockoTrade running on http://localhost:3000');
});
