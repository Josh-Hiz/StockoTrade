import yahooFinance from 'yahoo-finance2';
yahooFinance.suppressNotices(['yahooSurvey']) //I gave you your survey, stop sending this message :(

import { ObjectId } from 'mongodb';
import { users } from '../config/mongodb/mongoCollections.js';
import { verifyStockAndUserPartial, verifyId} from '../utils/auth/user_data.js';

//volume must be inputted as a string
const buyStock = async (userId, stock_ticker, volume) => {
	const [verifiedUserId, verifiedStock_Ticker, verifiedVolume] = verifyStockAndUserPartial(userId, stock_ticker, volume)
	const userCollection = await users();
	const userToBuy = await userCollection.findOne({
			_id: new ObjectId(verifiedUserId),
		});
	if (userToBuy === null) throw [404, 'No user found with that ID.'];
	const checkingExists = await yahooFinance.search(verifiedStock_Ticker)
	if (checkingExists.count === 0) throw [404, "Stock Ticker does not exist"]
	
	//confirmed stock and userexists now, getting price
	let gettingPrice = await yahooFinance.quote(verifiedStock_Ticker, {fields: ["regularMarketPrice"]})
	gettingPrice = gettingPrice['regularMarketPrice']
	const buyCost = gettingPrice * verifiedVolume;

	//may have to check for multiplication error
	if (userToBuy.portfolio_information.capital < buyCost) throw [403, "User does not have enough capital to buy and make this trade"]

	//updating tickers, tradehistory, and capital
	//adding new ticker to array and sorting, easier to find
	userToBuy.portfolio_information.tickers.push({stock_ticker: verifiedStock_Ticker, volume: verifiedVolume})
	const newTicker = userToBuy.portfolio_information.tickers.toSorted((a,b) => {
		return a.stock_ticker.localeCompare(b.stock_ticker)
	})

	const now = new Date()
	//adding new trade to front of array, most recent trades on top
	userToBuy.portfolio_information.trade_history.unshift({type: "Buy", stock_ticker: verifiedStock_Ticker,
		 volume: verifiedVolume, value: buyCost.toFixed(4), date: now.toLocaleString()})
	const newTradeHistory = userToBuy.portfolio_information.trade_history
	const newCapital = userToBuy.portfolio_information.capital - buyCost;

	//updating collection
	const newPortfolioInformation = {
		capital: newCapital,
		portfolio_worth: userToBuy.portfolio_information.portfolio_worth,
		tickers: newTicker,
		trade_history: newTradeHistory
	}

	const updatedInfo = await userCollection.findOneAndUpdate({_id: new ObjectId(verifiedUserId)}, {$set: {'portfolio_information': newPortfolioInformation}},{returnDocument: 'after'})
	//could set _id to id right here, idrc right now
	return updatedInfo
	
}

//volume must be inputted as a string
const sellStock = async(userId, stock_ticker, volume) => {
	const [verifiedUserId, verifiedStock_Ticker, verifiedVolume] = verifyStockAndUserPartial(userId, stock_ticker, volume)
	const userCollection = await users();
	const userToSell = await userCollection.findOne({
			_id: new ObjectId(verifiedUserId),
		});
	if (userToSell === null) throw [404, 'No user found with that ID.'];
	const checkingExists = await yahooFinance.search(verifiedStock_Ticker)
	if (checkingExists.count === 0) throw [404, "Stock Ticker does not exist"]
	
	//confirmed stock and userexists now, getting price
	let gettingPrice = await yahooFinance.quote(verifiedStock_Ticker, {fields: ["regularMarketPrice"]})
	gettingPrice = gettingPrice['regularMarketPrice']
	const sellCost = gettingPrice * verifiedVolume;

	//may have to check for multiplication error
	let newTicker = userToSell.portfolio_information.tickers
	const indexOfTicker = newTicker.findIndex((ticker_elem) => ticker_elem.stock_ticker == verifiedStock_Ticker)
	if (newTicker[indexOfTicker].volume < verifiedVolume) throw [403, "User does not have enough owned shares to sell and make this trade"]

	//updating tickers, tradehistory, and capital
	//adding new ticker to array and sorting, easier to find
	if (newTicker[indexOfTicker].volume === verifiedVolume) { //case where selling all of stock, remove it from list
		newTicker.splice(indexOfTicker, 1)
	} else {
		newTicker[indexOfTicker].volume -= verifiedVolume 
	} 

	const now = new Date()
	//adding new trade to front of array, most recent trades on top
	userToSell.portfolio_information.trade_history.unshift({type: "Sell", stock_ticker: verifiedStock_Ticker,
		 volume: verifiedVolume, value: sellCost.toFixed(4), date: now.toLocaleString()})
	const newTradeHistory = userToSell.portfolio_information.trade_history
	const newCapital = userToSell.portfolio_information.capital + sellCost;

	//updating collection
	const newPortfolioInformation = {
		capital: newCapital,
		portfolio_worth: userToSell.portfolio_information.portfolio_worth,
		tickers: newTicker,
		trade_history: newTradeHistory
	}

	const updatedInfo = await userCollection.findOneAndUpdate({_id: new ObjectId(verifiedUserId)}, {$set: {'portfolio_information': newPortfolioInformation}},{returnDocument: 'after'})
	//could set _id to id right here, idrc right now
	return updatedInfo

}

async function getPortfolioWorthOverTime(userId) {
	const verifiedUserId = verifyId(userId)
	const userCollection = await users();
	const userToInspect = await userCollection.findOne({
			_id: new ObjectId(verifiedUserId)
	})	
  	let cash = 100000; //inital amount of money user starts with, is set to 100000 currently
  	const tradeHistory = userToInspect.portfolio_information.trade_history;
  	const tickers = [...new Set(tradeHistory.map(t => t.stock_ticker))];
  	const sortedTrades = [...tradeHistory].sort((a, b) => new Date(a.date) - new Date(b.date)); //need to reverse array since it is stored newest first

  	//getiing full date range from first to last trade
  	const startDate = new Date(sortedTrades[0].date);
  	const endDate = new Date();
  	const dateList = [];
  	for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
		dateList.push(new Date(d).toISOString().split('T')[0]);
  	}

  	//getting price history for each ticker
  	const tickerPrices = {};
  	for (const ticker of tickers) {
    	const history = await yahooFinance.chart(ticker, {
		period1: dateList[0], //first buy
		interval: '1d',
      	//range: '1y', in case we want to restrict it to only 1y or other metric, leaving unlimited for now
	});
    	tickerPrices[ticker] = {};
    	for (const { date, close } of history.quotes) {
      		const d = new Date(date).toISOString().split('T')[0];
      		tickerPrices[ticker][d] = close;
		}
  	}
  	const result = [];
  	const holdings = {};  //{ticker: shares}
  	let tradeIndex = 0;
	const lastKnownPrices = {};

	//main loop for calculating value
  	for (const date of dateList) {
		while (tradeIndex < sortedTrades.length && new Date(sortedTrades[tradeIndex].date).toISOString().split('T')[0] === date) {
			const trade = sortedTrades[tradeIndex];
			const price = tickerPrices[trade.stock_ticker]?.[date];
			if (price !== undefined) {
				const volume = trade.volume;
				const cost = price * volume;
				if (trade.type === 'Buy') {
					if (cash >= cost) {
						holdings[trade.stock_ticker] = (holdings[trade.stock_ticker] || 0) + volume;
						cash -= cost;
					}
				} else if (trade.type === 'Sell') {
					holdings[trade.stock_ticker] = (holdings[trade.stock_ticker] || 0) - volume;
					cash += cost;
				}
			}
			tradeIndex++;
		}

    	//calculating portfolio value
    	let investedValue = 0;
		for (const [ticker, volume] of Object.entries(holdings)) {
  			if (volume <= 0) continue;

  			const priceToday = tickerPrices[ticker]?.[date];
  			if (priceToday !== undefined) {
				lastKnownPrices[ticker] = priceToday;
  			}

 			const priceToUse = lastKnownPrices[ticker];
  			if (priceToUse !== undefined) {
				investedValue += volume * priceToUse;
  			}
		}

		result.push({
			date,
			//both under can be used, but no purpose for them anymore
      		investedValue: parseFloat(investedValue.toFixed(4)),
			cash: parseFloat(cash.toFixed(4)),
			totalValue: parseFloat((cash + investedValue).toFixed(4))
    	});
  	}
  	return result;
}

const getTopPortfolioProfiles = async () => {
	const usersCollection = await users();
	let topProfiles = await usersCollection
		.find(
			{},
			{
				projection: {
					// Just project the username and portfolio
					filler_username: 1,
					'portfolio_information.portfolio_worth': 1,
					_id: 0,
				},
			}
		)
		.sort({ 'portfolio_information.portfolio_worth': -1 })
		.limit(10)
		.toArray();
	topProfiles = topProfiles.map((x) => {
		return {
			username: x.filler_username,
			portfolio_worth: x.portfolio_information.portfolio_worth,
		};
	});
	return topProfiles;
};

console.log(await getTopPortfolioProfiles());

const portfolioDataFunctions = { getTopPortfolioProfiles, buyStock, sellStock, getPortfolioWorthOverTime};

export default portfolioDataFunctions;
