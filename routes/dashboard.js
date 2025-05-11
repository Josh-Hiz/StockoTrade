import { Router } from 'express';
import { userData, portfolioData } from '../data/index.js';
import { verifyId } from '../utils/auth/user_data.js';
const router = Router();

router.route('/:id').get(async (req, res) => {
	const isLoggedIn = req.cookies.isAuthenticated;
	const userId = req.cookies.userID;
	req.params.id = verifyId(req.params.id)
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
		return res.status(200).render('dashboard', { isLoggedIn: true, username: user.filler_username, scriptPaths: ['dashboard.js'], outsidePaths: ['https://d3js.org/d3.v7.min.js'],
			 title: "dashboard", capital: user.portfolio_information.capital.toFixed(4), portfolio_worth: user.portfolio_information.portfolio_worth.toFixed(4),
			 tickers: user.portfolio_information.tickers, trade_history: user.portfolio_information.trade_history, userId: req.params.id.toString()});
	} else {
		return res.status(200).redirect('/');
	}
});
router.route('/chart/:id').get(async (req,res) => {
	//console.log("Route reached")
	req.params.id = verifyId(req.params.id)
	const result = await portfolioData.getPortfolioWorthOverTime(req.params.id)
	res.json(result)
});

router.route('/portfolio/worth/:id').post(async (req,res) => {

});

export default router;
