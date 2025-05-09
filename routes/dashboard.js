import { Router } from 'express';
import { userData, portfolioData } from '../data/index.js';
const router = Router();

router.route('/:id').get(async (req, res) => {
	const isLoggedIn = req.cookies.isAuthenticated;
	const userId = req.cookies.userID;
	if (req.params.id !== userId) {
		return res.status(404).render('error', {
			errorCode: 404,
			title: '404',
			errorMessage: 'Unauthorized account access attempt.',
		});
	}

	if (isLoggedIn && userId && isLoggedIn === 'true' && userId !== 'null') {
		// The dashboard (by the end of the project) will take in alot of parameters of
		// statistics calculated in realtime
		const user = await userData.getUserById(req.params.id)
		return res.status(200).render('dashboard', { isLoggedIn: true, username: user.filler_username, scriptPaths: ['dashboard.js'], title: "dashboard", 
			capital: user.portfolio_information.capital.toFixed(4), portfolio_worth: user.portfolio_information.portfolio_worth, tickers: user.portfolio_information.tickers, trade_history: user.portfolio_information.trade_history});
	} else {
		return res.status(200).redirect('/');
	}
});

router.route('/portfolio/worth/:id').post(async (req,res) => {

});

export default router;
