import React, { useState, useEffect, useMemo } from 'react';

interface Player {
  id: number;
  name: string;
  ping: number;
  identifiers: string[];
  endpoint: string;
}

interface ServerData {
  dynamic: any;
  players: Player[];
}

interface PlayerWithDiscord extends Player {
  discordId?: string;
  discordAvatar?: string;
}

const fetchDiscordAvatar = async (discordId: string): Promise<string | undefined> => {
  try {
    const corsProxy = 'https://corsproxy.io/?';
    const response = await fetch(`${corsProxy}https://itools.zone/fivem/a.php?user_id=${discordId}`, {
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.id && data.avatar) {
        return `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;
      }
    }
  } catch (error) {
    console.warn('Error fetching Discord profile:', error);
  }

  return `https://cdn.discordapp.com/avatars/${discordId}/avatar.png`;
};

const App: React.FC = () => {
  const [serverIp, setServerIp] = useState('');
  const [serverPort, setServerPort] = useState('30120');
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithDiscord | null>(null);
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');

  const [allPlayers, setAllPlayers] = useState<PlayerWithDiscord[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [showLoading, setShowLoading] = useState(false);
  const [notifications, setNotifications] = useState<{ id: number, type: 'success' | 'error', message: string }[]>([]);
  const [serverHistory, setServerHistory] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 20;
  const [showSettingsModal, setShowSettingsModal] = useState(false);


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ipParam = urlParams.get('ip_address');
    const portParam = urlParams.get('port');

    if (ipParam) setServerIp(ipParam);
    if (portParam) setServerPort(portParam);

    // Set initial theme to dark by default
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    setCurrentTheme(savedTheme);

    // Load server history from localStorage
    const savedHistory = localStorage.getItem('serverHistory');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setServerHistory(history);
      } catch (error) {
        console.warn('Failed to parse server history:', error);
      }
    }
  }, []);

  const changeTheme = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
    setCurrentTheme(theme);

    // Force re-render by updating body class
    document.body.className = theme === 'dark' ? 'dark' : '';
  };

  const addToServerHistory = (serverAddress: string) => {
    const fullAddress = `${serverAddress}:${serverPort}`;
    setServerHistory(prev => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter(addr => addr !== fullAddress);
      // Add to beginning of array (most recent first)
      const newHistory = [fullAddress, ...filtered].slice(0, 5); // Keep only last 5

      // Save to localStorage
      localStorage.setItem('serverHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const selectFromHistory = (historyItem: string) => {
    const [ip, port] = historyItem.split(':');
    setServerIp(ip);
    setServerPort(port || '30120');
  };

  const addNotification = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const removeFromHistory = (historyItem: string) => {
    setServerHistory(prev => {
      const newHistory = prev.filter(item => item !== historyItem);
      localStorage.setItem('serverHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearAllHistory = () => {
    setServerHistory([]);
    localStorage.removeItem('serverHistory');
  };

  useEffect(() => {
    const processPlayers = async () => {
      if (!serverData?.players) {
        setAllPlayers([]);
        setIsLoadingPlayers(false);
        return;
      }

      setIsLoadingPlayers(true);

      const playersWithDiscordIds = serverData.players.map(player => {
        const discordIdentifier = player.identifiers.find(id => id.startsWith('discord:'));
        const discordId = discordIdentifier ? discordIdentifier.replace('discord:', '') : undefined;

        return {
          ...player,
          discordId,
          discordAvatar: undefined
        };
      });

      setAllPlayers(playersWithDiscordIds);
      setIsLoadingPlayers(false);

      const loadAvatars = async () => {
        const batchSize = 5; // Increased for better performance

        for (let i = 0; i < playersWithDiscordIds.length; i += batchSize) {
          const batch = playersWithDiscordIds.slice(i, i + batchSize);

          const batchResults = await Promise.all(
            batch.map(async (player) => {
              if (!player.discordId) return player;

              try {
                const discordAvatar = await fetchDiscordAvatar(player.discordId);
                return { ...player, discordAvatar };
              } catch (error) {
                // Reduced console warnings for better performance
                return player;
              }
            })
          );

          setAllPlayers(prevPlayers => {
            const updatedPlayers = [...prevPlayers];
            batchResults.forEach(updatedPlayer => {
              const index = updatedPlayers.findIndex(p => p.id === updatedPlayer.id);
              if (index !== -1) {
                updatedPlayers[index] = updatedPlayer;
              }
            });
            return updatedPlayers;
          });

          if (i + batchSize < playersWithDiscordIds.length) {
            await new Promise(resolve => setTimeout(resolve, 100)); // Faster loading
          }
        }
      };

      loadAvatars();
    };

    processPlayers();
  }, [serverData]);

  // Use useMemo for better performance
  const filteredPlayers = useMemo(() => {
    return allPlayers
      .filter(player => {
        const nameMatch = searchName === '' || player.name.toLowerCase().includes(searchName.toLowerCase());
        const idMatch = searchId === '' || player.id.toString().includes(searchId);
        return nameMatch && idMatch;
      })
      .sort((a, b) => a.id - b.id); // Sort by ID from low to high
  }, [allPlayers, searchName, searchId]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * playersPerPage;
    return filteredPlayers.slice(startIndex, startIndex + playersPerPage);
  }, [filteredPlayers, currentPage, playersPerPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchId]);

  // Function to change page and scroll to first player
  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to first player in the table
    setTimeout(() => {
      const firstPlayerRow = document.querySelector('[data-player-table] tbody tr:first-child');
      if (firstPlayerRow) {
        firstPlayerRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback to table header if no players
        const tableHeader = document.querySelector('[data-player-table] thead');
        if (tableHeader) {
          tableHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }, 150); // Slightly longer delay to ensure DOM update
  };

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettingsModal) {
        const target = event.target as Element;
        if (!target.closest('[data-settings-dropdown]')) {
          setShowSettingsModal(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettingsModal]);

  const fetchServerData = async () => {
    if (!serverIp.trim()) {
      addNotification('error', 'Please enter server IP or domain');
      return;
    }

    // Show loading indicator
    setShowLoading(true);

    try {
      const corsProxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/'
      ];

      const targetUrl = `https://itools.zone/fivem/?ip_address=${encodeURIComponent(serverIp)}&port=${encodeURIComponent(serverPort)}`;

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const corsProxy of corsProxies) {
        try {
          const proxyUrl = corsProxy.includes('allorigins')
            ? `${corsProxy}${encodeURIComponent(targetUrl)}`
            : `${corsProxy}${targetUrl}`;

          response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
          });

          if (response.ok) {
            break;
          }
        } catch (error) {
          lastError = error as Error;
          console.warn(`CORS proxy ${corsProxy} failed:`, error);
          continue;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('All CORS proxies failed');
      }

      const data = await response.json();

      // Check if response contains error
      if (data.error) {
        throw new Error(data.error);
      }

      // Check if data has expected structure
      if (!data.players || !Array.isArray(data.players)) {
        throw new Error('Invalid server response format');
      }

      setServerData(data);
      setSelectedPlayer(null);

      // Add to server history
      addToServerHistory(serverIp);

      // Hide loading and show success notification
      setShowLoading(false);
      addNotification('success', `Successfully connected! Found ${data.players.length} players online`);

    } catch (error) {
      console.error('Error fetching server data:', error);

      let errorMessage = 'Unable to connect to server';

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          errorMessage = 'Connection timeout. Please try again.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Server does not allow cross-origin requests';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to API. Please try again.';
        } else if (error.message.includes('Cannot fetch data from API')) {
          errorMessage = 'Server API is currently unavailable. Please check the server address and try again.';
        } else if (error.message.includes('Invalid server response')) {
          errorMessage = 'Server returned invalid data format. Please verify the server address.';
        } else {
          errorMessage = error.message;
        }
      }

      // Hide loading and show error notification
      setShowLoading(false);
      addNotification('error', errorMessage);
    }
  };

  const handlePlayerClick = (player: PlayerWithDiscord) => {
    setSelectedPlayer(player);
  };

  // Loading Indicator Component
  const LoadingIndicator = () => (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 flex items-center space-x-3 border border-slate-200 dark:border-slate-700">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Connecting...</span>
      </div>
    </div>
  );

  // Notification Component
  const NotificationList = () => (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm rounded-lg shadow-lg p-4 flex items-start space-x-3 border animate-in slide-in-from-right duration-300 ${notification.type === 'success'
            ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700'
            }`}
        >
          <div className="flex-shrink-0">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${notification.type === 'success'
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
              }`}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className={`flex-shrink-0 rounded-md p-1.5 inline-flex ${notification.type === 'success'
              ? 'text-green-400 hover:bg-green-100 dark:hover:bg-green-800'
              : 'text-red-400 hover:bg-red-100 dark:hover:bg-red-800'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );

  // Settings Dropdown Component
  const SettingsDropdown = () => (
    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
      <div className="p-3">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Theme</div>
        <div className="space-y-1">
          <button
            onClick={() => {
              changeTheme('light');
              setShowSettingsModal(false);
            }}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md ${currentTheme === 'light'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
            <span>Light</span>
          </button>

          <button
            onClick={() => {
              changeTheme('dark');
              setShowSettingsModal(false);
            }}
            className={`w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md ${currentTheme === 'dark'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            <span>Dark</span>
          </button>
        </div>
      </div>
    </div>
  );


  /*
  const LoadingModal = () => {

    const icons = ['🔌', '�,', '✅', '�'];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Connecting to Server
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Please wait while we fetch the server data...
              </p>
            </div>


          </div>
        </div>
      </div>
    );
  };

  const SuccessModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Connection Successful!
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {modalMessage}
          </p>
          <button
            onClick={() => setShowSuccessModal(false)}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium py-2 px-6 rounded-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );

  const ErrorModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Connection Failed
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {modalMessage}
          </p>
          <button
            onClick={() => setShowErrorModal(false)}
            className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium py-2 px-6 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
  */

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 hide-scrollbar">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                FiveM Player Monitor By บาร็อง อิสหาด
              </h1>
            </div>

            <div className="flex items-center relative" data-settings-dropdown>
              <button
                onClick={() => setShowSettingsModal(!showSettingsModal)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {showSettingsModal && <SettingsDropdown />}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Server Connection */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Server Connection
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Server Address
                  </label>
                  <input
                    type="text"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchServerData()}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                             bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="เช่น play.st20.app or 127.0.0.1"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={serverPort}
                    onChange={(e) => setServerPort(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchServerData()}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                             bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder-slate-400 dark:placeholder-slate-500"
                    placeholder="30120"
                    min="1"
                    max="65535"
                  />
                </div>

                <button
                  onClick={fetchServerData}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 
                           rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Connect to Server
                </button>

                {/* Server History */}
                {serverHistory.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        📋 Recent Servers
                      </label>
                      <button
                        onClick={clearAllHistory}
                        className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-1">
                      {serverHistory.map((historyItem, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                        >
                          <button
                            onClick={() => selectFromHistory(historyItem)}
                            className="flex-1 text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600 rounded-l-lg
                                     text-slate-700 dark:text-slate-300"
                          >
                            🌐 {historyItem}
                          </button>
                          <button
                            onClick={() => removeFromHistory(historyItem)}
                            className="px-2 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 rounded-r-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Server Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Server Information
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-64 overflow-y-auto hide-scrollbar">
                <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {serverData?.dynamic ? JSON.stringify(serverData.dynamic, null, 2) : 'No data available'}
                </pre>
              </div>
            </div>

            {/* Player Details */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">
                Player Details
              </h3>
              {selectedPlayer ? (
                <div className="space-y-4">
                  {selectedPlayer.discordAvatar && (
                    <div className="flex justify-center">
                      <img
                        src={selectedPlayer.discordAvatar}
                        alt="Discord Avatar"
                        className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-600"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">ID:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedPlayer.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Name:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{selectedPlayer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Ping:</span>
                      <span className={`font-medium ${selectedPlayer.ping < 50 ? 'text-green-600' :
                        selectedPlayer.ping < 100 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {selectedPlayer.ping}ms
                      </span>
                    </div>
                    {selectedPlayer.endpoint && !selectedPlayer.endpoint.startsWith('127.0.0.1') && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Endpoint:</span>
                        <span className="font-mono text-xs text-slate-900 dark:text-white">{selectedPlayer.endpoint}</span>
                      </div>
                    )}
                    {selectedPlayer.discordId && (
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Discord:</span>
                        <span className="font-mono text-xs text-slate-900 dark:text-white">{selectedPlayer.discordId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Click on a player to view details
                </p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700" data-section="online-players">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
                    Online Players
                    {isLoadingPlayers && (
                      <div className="ml-2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </h2>
                  {filteredPlayers.length > 0 && (
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium px-2.5 py-0.5 rounded-full">
                      {filteredPlayers.length} / {serverData?.players.length || 0}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                               bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Search by name..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                               bg-white dark:bg-slate-700 text-slate-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent
                               placeholder-slate-400 dark:placeholder-slate-500"
                      placeholder="Search by ID..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-mono text-sm">#</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto hide-scrollbar">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" data-player-table>
                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Ping
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedPlayers.length > 0 ? (
                        paginatedPlayers.map((player) => (
                          <tr
                            key={player.id}
                            onClick={() => handlePlayerClick(player)}
                            className={`cursor-pointer transition-colors ${selectedPlayer?.id === player.id
                              ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  {player.discordAvatar ? (
                                    <img
                                      className="h-8 w-8 rounded-full"
                                      src={player.discordAvatar}
                                      alt=""
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTggMTJDMTAuMjA5MSAxMiAxMiAxMC4yMDkxIDEyIDhDMTIgNS43OTA5IDEwLjIwOTEgNCA4IDRDNS43OTA5IDQgNCA1Ljc5MDkgNCA4QzQgMTAuMjA5MSA1Ljc5MDkgMTIgOCAxMloiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                                      }}
                                    />
                                  ) : player.discordId ? (
                                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                      <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                                    {player.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white table-text-white">
                                {player.id}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium table-text-white ${player.ping < 50
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-white'
                                : player.ping < 100
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-white'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-white'
                                }`}>
                                {player.ping}ms
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center">
                            <div className="text-slate-500 dark:text-slate-400">
                              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <p className="text-sm">
                                {serverData ? 'Not Found Data' : 'Not Found Data'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredPlayers.length > playersPerPage && (
                  <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700 dark:text-slate-300">
                        Showing {((currentPage - 1) * playersPerPage) + 1} to {Math.min(currentPage * playersPerPage, filteredPlayers.length)} of {filteredPlayers.length} players
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => changePage(Math.max(currentPage - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => changePage(pageNum)}
                                className={`px-3 py-1 text-sm rounded-md ${currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => changePage(Math.min(currentPage + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {showLoading && <LoadingIndicator />}
      <NotificationList />


    </div>
  );
};

export default App;