document.addEventListener('DOMContentLoaded', function () {
  const playerName = document.body.dataset.playerName;
  const seasonYear = 2025;
  const opponentEl = document.getElementById('opponent');
  const resultEl = document.getElementById('result');
  const statsEls = {
    pts: document.getElementById('pts'),
    reb: document.getElementById('reb'),
    ast: document.getElementById('ast'),
    stl: document.getElementById('stl'),
    blk: document.getElementById('blk'),
    min: document.getElementById('min')
  };

  function showError(message) {
    opponentEl.textContent = message;
    resultEl.textContent = '';
    Object.values(statsEls).forEach(el => {
      if (el) el.textContent = '-';
    });
  }

  if (!playerName) {
    showError('No se especificó el jugador.');
    return;
  }

  function findPlayer(playerData) {
    const players = playerData.league.standard || [];
    return players.find(p => `${p.firstName} ${p.lastName}`.toLowerCase() === playerName.toLowerCase()) || players.find(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(playerName.toLowerCase().split(' ')[-1]));
  }

  function fetchStatsForPlayer(player) {
    return fetch(`https://data.nba.net/prod/v1/2025/players/${player.personId}_gamelog.json`)
      .then(response => response.json());
  }

  function searchPlayers(searchText) {
    return fetch(`https://data.nba.net/prod/v1/2025/players.json`)
      .then(response => response.json());
  }

  searchPlayers(playerName)
    .then(playerData => {
      let player = findPlayer(playerData);
      if (!player) {
        const canonicalName = playerName.replace(/\b(Jr|Sr|II|III|IV)\.?$/i, '').trim();
        return searchPlayers(canonicalName === playerName ? playerName.split(' ').slice(-1)[0] : canonicalName)
          .then(nextData => {
            player = findPlayer(nextData);
            if (!player) {
              throw new Error('Jugador no encontrado');
            }
            return player;
          });
      }
      return player;
    })
    .then(player => fetchStatsForPlayer(player))
    .then(response => response.json())
    .then(statsData => {
      const season = statsData.league.standard || [];
      if (!season.length) {
        showError('No hay estadísticas disponibles para esta temporada.');
        return;
      }
      const latest = season[season.length - 1]; // Assuming sorted by date
      const hTeam = latest.hTeam;
      const vTeam = latest.vTeam;
      const isHome = hTeam.teamId === '1610612750';
      const opponent = isHome ? vTeam.teamName : hTeam.teamName;
      const score = `${hTeam.score}-${vTeam.score}`;
      const result = hTeam.score === vTeam.score ? 'Empate' : (hTeam.score > vTeam.score ? (isHome ? 'Victoria' : 'Derrota') : (isHome ? 'Derrota' : 'Victoria'));
      opponentEl.textContent = `Partido contra: ${opponent}`;
      resultEl.textContent = `Resultado: ${score} (${result})`;
      statsEls.pts.textContent = latest.stats.pts || 0;
      statsEls.reb.textContent = latest.stats.totReb || 0;
      statsEls.ast.textContent = latest.stats.assists || 0;
      statsEls.stl.textContent = latest.stats.steals || 0;
      statsEls.blk.textContent = latest.stats.blocks || 0;
      statsEls.min.textContent = latest.stats.min || 0;
    })
    .catch(error => {
      console.error('Error fetching player stats:', error);
      showError('Error al cargar estadísticas.');
    });
});
