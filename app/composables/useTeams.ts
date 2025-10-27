export const useTeams = () => {
  const searchTeams = async (query: string) => {
    if (!query || query.length < 2) {
      return []
    }

    try {
      const { data } = await useFetch('/api/teams/search', {
        query: { q: query }
      })

      return data.value?.teams || []
    } catch (error) {
      console.error('Failed to search teams:', error)
      return []
    }
  }

  const getTeamById = async (teamId: string | number) => {
    try {
      const { data } = await useFetch(`/api/teams/${teamId}`)
      return data.value
    } catch (error) {
      console.error('Failed to get team:', error)
      return null
    }
  }

  return {
    searchTeams,
    getTeamById
  }
}

