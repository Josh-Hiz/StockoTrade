// File to seed the database with fake users
import { userData, portfolioData } from "../data/index.js";
import { dbConnection, closeConnection } from "../config/mongodb/mongoConnection.js";

const db = await dbConnection();
await db.dropDatabase();

// Create 3 accounts first

const Tanav = await userData.createUser("TanavT", "Tanav", "Thota", "tanavthota@gmail.com", "Password123", "20", "2004-06-24")
const Chris = await userData.createUser("ChrisBrown", "Chris", "Brown", "cbrown19@notstevens.edu", "TestingDIFFERENTPassword098", "21", "2003-10-23")
const Mylo = await userData.createUser("Mylo", "Mylo", "Thota", "randomemail@hotmail.com", "BadPassword1", "21", "2004-01-19")

const Tid = Tanav._id.toString();
const Cid = Chris._id.toString();
const Mid = Mylo._id.toString()

//will add way to add and buy stocks in the past for development not user use prob
// Populate each accounts portfolio information, (use the portfolio functions)
await portfolioData.buyStock(Tid, "AAPL", "12")
await portfolioData.sellStock(Tid, "AAPL", "4")
await portfolioData.sellStock(Tid, "AAPL", "8")
await portfolioData.buyStock(Tid, "DOMO", "107")
await portfolioData.buyStock(Tid, "AAPL", "6")
await portfolioData.buyStock(Tid, "ASST", "200")
await portfolioData.buyStock(Tid, "TPIF", "19")
await portfolioData.sellStock(Tid, "HYMCL", "200")

await portfolioData.buyStock(Cid, "PPTY", "1104")
await portfolioData.buyStock(Cid, "VTWG", "20")
await portfolioData.sellStock(Cid, "PPTY", "293")
await portfolioData.buyStock(Cid, "STE", "210")
await portfolioData.sellStock(Cid, "STE", "21")
await portfolioData.buyStock(Cid, "CXDO", "293")
await portfolioData.buyStock(Cid, "SLNO", "92")
await portfolioData.sellStock(Cid, "PPTY", "200")

await portfolioData.buyStock(Mid, "GME", "900")
await portfolioData.buyStock(Mid, "AMC", "10000")
await portfolioData.buyStock(Mid, "TSLA", "30")
await portfolioData.sellStock(Mid, "TSLA", "30")

console.log("Done seeding")
await closeConnection();