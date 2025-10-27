export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchTerm = query.q as string

  if (!searchTerm) {
    return { teams: [] }
  }

  const config = useRuntimeConfig()

  // For now, return some popular football teams
  // In production, you would integrate with a football API like API-Football
  
  const popularTeams = [
    'Real Madrid', 'Barcelona', 'Manchester United', 'Liverpool', 'Manchester City',
    'Chelsea', 'Arsenal', 'Tottenham', 'Paris Saint-Germain', 'Bayern Munich',
    'Borussia Dortmund', 'Juventus', 'Inter Milan', 'AC Milan', 'Atletico Madrid',
    'Valencia', 'Sevilla', 'Atletico Madrid', 'Roma', 'Napoli', 'Lyon', 'Marseille',
    'Ajax', 'Porto', 'Benfica', 'Celtic', 'Rangers', 'PSV Eindhoven', 'Feyenoord'
  ]

  // Filter teams by search term
  const matchedTeams = popularTeams
    .filter(team => team.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 10)

  return {
    teams: matchedTeams.map((name, index) => ({
      id: index,
      name,
      league: 'Various'
    }))
  }
})

