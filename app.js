const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const convertResponseIntoRequiredResponseForApi1 = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

// initialize db and server
const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server started!!')
    })
  } catch (e) {
    console.log(`ERROR : ${e.message}`)
  }
}

initializeDbAndServer() //initialization completed....

// api 1 Returns a list of all the players in the player table
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    select
        *
    from
        player_details;
    `
  const playersArray = await db.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer =>
      convertResponseIntoRequiredResponseForApi1(eachPlayer),
    ),
  )
}) // api 1 done

// api 2 Returns a specific player based on the player ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
  select 
    *
  from
    player_details
  where
    player_id = ${playerId};
  `
  const player = await db.get(getPlayerQuery)
  response.send(convertResponseIntoRequiredResponseForApi1(player))
}) //api 2 done

// api 3 Updates the details of a specific player based on the player ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updatePlayerQuery = `
  update player_details set 
  player_name = '${playerName}'
  where
    player_id = ${playerId};
  `
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
}) // api 3 done

// api 4 Returns the match details of a specific match
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchDetailsQuery = `
  select
    match_id as matchId,
    match,
    year
  from
    match_details
  where
    match_id = ${matchId};
  `
  const matchDetails = await db.get(getMatchDetailsQuery)
  response.send(matchDetails)
}) //api 4 done

// api 5 Returns a list of all the matches of a player
/* [
  { 
    matchId: 1,
    match: "SRH vs MI",
    year: 2016
  }, ...
]*/
app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
  select
    md.match_id as matchId,
    md.match,
    md.year
  from
    player_details as pd inner join player_match_score as pms on pd.player_id = pms.player_id inner join match_details as md on pms.match_id = md.match_id
  where
    pd.player_id = ${playerId};    
  `
  const playerMatchesArray = await db.all(getPlayerMatchesQuery)
  response.send(playerMatchesArray)
}) //api 5 done

// api 6 Returns a list of players of a specific match
/*[
  { 
    playerId: 2,
    playerName: "Joseph"
  },
  ...
] */
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
  select
  pd.player_id as playerId,
  pd.player_name as playerName

  from
    player_details as pd inner join player_match_score as pms on pd.player_id = pms.player_id inner join match_details as md on pms.match_id = md.match_id
  where
    md.match_id = ${matchId};
  `
  const matchPlayersArray = await db.all(getMatchPlayersQuery)
  response.send(matchPlayersArray)
}) //api 6 done

// api 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
/* Response : {
  playerId: 1,
  playerName: "Ram"
  totalScore: 3453,
  totalFours: 342,
  totalSixes: 98
} */
app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getStatisticsOfPlayerQuery = `
    select
      pd.player_id as playerId,
      pd.player_name as playerName,
      sum(score) as totalScore,
      sum(fours) as totalFours,
      sum(sixes) as totalSixes
    from
      player_details as pd inner join player_match_score as pms on pd.player_id = pms.player_id
    where
      pd.player_id = ${playerId};
  `
  const Statistics = await db.get(getStatisticsOfPlayerQuery)
  response.send(Statistics)
}) // api 7 done

module.exports = app
