export const useScoring = () => {
  const calculatePoints = (
    prediction: { home: number, away: number },
    result: { home: number, away: number },
    pointsBet: number
  ): number => {
    // Exact score match
    if (prediction.home === result.home && prediction.away === result.away) {
      return 100 * pointsBet
    }

    const predictionDiff = prediction.home - prediction.away
    const resultDiff = result.home - result.away

    // Correct goal difference
    if (predictionDiff === resultDiff) {
      return 50 * pointsBet
    }

    // Correct winner (or draw)
    const predictedWinner = predictionDiff > 0 ? 'home' : predictionDiff < 0 ? 'away' : 'draw'
    const actualWinner = resultDiff > 0 ? 'home' : resultDiff < 0 ? 'away' : 'draw'

    if (predictedWinner === actualWinner) {
      return 30 * pointsBet
    }

    // Wrong prediction - lose bet
    return -pointsBet
  }

  const calculateRank = (
    participants: Array<{ points_earned: number }>
  ): Array<{ rank: number }> => {
    const sortedParticipants = [...participants].sort((a, b) => b.points_earned - a.points_earned)
    
    return sortedParticipants.map((participant, index) => ({
      ...participant,
      rank: index + 1
    }))
  }

  return {
    calculatePoints,
    calculateRank
  }
}

