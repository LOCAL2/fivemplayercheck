import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

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
    const response = await fetch(`https://itools.zone/fivem/a.php?user_id=${discordId}`);
    const data = await response.json();

    if (data.id && data.avatar) {
      return `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`;
    }
  } catch (error) {
    console.error('Error fetching Discord profile:', error);
  }

  // Fallback to direct Discord CDN
  return `https://cdn.discordapp.com/avatars/${discordId}/avatar.png`;
};

const App: React.FC = () => {
  const [serverIp, setServerIp] = useState('');
  const [serverPort, setServerPort] = useState('30120');
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithDiscord | null>(null);
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerWithDiscord[]>([]);

  // Get URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ipParam = urlParams.get('ip_address');
    const portParam = urlParams.get('port');

    if (ipParam) {
      setServerIp(ipParam);
    }
    if (portParam) {
      setServerPort(portParam);
    }
  }, []);

  // Filter players based on search criteria
  useEffect(() => {
    const processPlayers = async () => {
      if (!serverData?.players) {
        setFilteredPlayers([]);
        return;
      }

      const playersWithDiscord = await Promise.all(
        serverData.players.map(async (player) => {
          const discordIdentifier = player.identifiers.find(id => id.startsWith('discord:'));
          const discordId = discordIdentifier ? discordIdentifier.replace('discord:', '') : undefined;

          let discordAvatar: string | undefined = undefined;
          if (discordId) {
            discordAvatar = await fetchDiscordAvatar(discordId);
          }

          return {
            ...player,
            discordId,
            discordAvatar
          };
        })
      );

      const filtered = playersWithDiscord.filter(player => {
        const nameMatch = searchName === '' || player.name.toLowerCase().includes(searchName.toLowerCase());
        const idMatch = searchId === '' || player.id.toString().includes(searchId);
        return nameMatch && idMatch;
      });

      setFilteredPlayers(filtered);
    };

    processPlayers();
  }, [serverData, searchName, searchId]);

  const fetchServerData = async () => {
    if (!serverIp.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: 'กรุณากรอก IP หรือ Domain'
      });
      return;
    }

    // Show loading alert
    Swal.fire({
      title: 'กำลังโหลดข้อมูล...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // Use CORS proxy service to bypass CORS restrictions
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const targetUrl = `https://itools.zone/fivem/?ip_address=${encodeURIComponent(serverIp)}&port=${encodeURIComponent(serverPort)}`;
      
      const response = await fetch(`${corsProxy}${encodeURIComponent(targetUrl)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ServerData = await response.json();
      setServerData(data);
      setSelectedPlayer(null);

      Swal.close();

      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: `พบผู้เล่น ${data.players.length} คน`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error fetching server data:', error);

      let errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';

      if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorMessage = 'เซิร์ฟเวอร์ไม่อนุญาตให้เข้าถึงจากเว็บไซต์นี้ (CORS)';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาลองใหม่อีกครั้ง';
        } else {
          errorMessage = error.message;
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: errorMessage
      });
    }
  };

  const handlePlayerClick = (player: PlayerWithDiscord) => {
    setSelectedPlayer(player);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          FiveM Server Player Checker
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Server Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">ข้อมูลเซิร์ฟเวอร์</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IP / Domain
                  </label>
                  <input
                    type="text"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="เช่น 127.0.0.1 หรือ server.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={serverPort}
                    onChange={(e) => setServerPort(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="30120"
                  />
                </div>

                <button
                  onClick={fetchServerData}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 font-medium"
                >
                  Fetch Data
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Data & Player Profile Section */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Server Dynamic Data */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">ข้อมูลเซิร์ฟเวอร์</h3>
                <div className="json-viewer max-h-64 overflow-y-auto">
                  {serverData?.dynamic ? (
                    <pre>{JSON.stringify(serverData.dynamic, null, 2)}</pre>
                  ) : (
                    <p className="text-gray-500">ยังไม่มีข้อมูล</p>
                  )}
                </div>
              </div>

              {/* Selected Player Profile */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">รายละเอียดผู้เล่น</h3>
                {selectedPlayer ? (
                  <div className="space-y-4">
                    {selectedPlayer.discordAvatar && (
                      <div className="flex justify-center">
                        <img
                          src={selectedPlayer.discordAvatar}
                          alt="Discord Avatar"
                          className="w-16 h-16 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <p><strong>ID:</strong> {selectedPlayer.id}</p>
                      <p><strong>ชื่อ:</strong> {selectedPlayer.name}</p>
                      <p><strong>Ping:</strong> {selectedPlayer.ping}ms</p>
                      <p><strong>Endpoint:</strong> {selectedPlayer.endpoint}</p>
                      {selectedPlayer.discordId && (
                        <p><strong>Discord ID:</strong> {selectedPlayer.discordId}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">คลิกชื่อผู้เล่นเพื่อดูรายละเอียด</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player Table Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">รายชื่อผู้เล่น</h2>

          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหาตามชื่อ
              </label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอกชื่อผู้เล่น"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหาตาม ID
              </label>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="กรอก ID ผู้เล่น"
              />
            </div>
          </div>

          {/* Players Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avatar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ping
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <tr
                      key={player.id}
                      onClick={() => handlePlayerClick(player)}
                      className="hover:bg-gray-50 cursor-pointer transition duration-150"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        {player.discordAvatar ? (
                          <img
                            src={player.discordAvatar}
                            alt="Discord Avatar"
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNEMUQ1REIiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI4IiB5PSI4Ij4KPHBhdGggZD0iTTggMTJDMTAuMjA5MSAxMiAxMiAxMC4yMDkxIDEyIDhDMTIgNS43OTA5IDEwLjIwOTEgNCA4IDRDNS43OTA5IDQgNCA1Ljc5MDkgNCA4QzQgMTAuMjA5MSA1Ljc5MDkgMTIgOCAxMloiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+Cjwvc3ZnPgo=';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs text-gray-600">?</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {player.id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.ping}ms
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      {serverData ? 'ไม่พบผู้เล่นที่ตรงกับเงื่อนไขการค้นหา' : 'ยังไม่มีข้อมูลผู้เล่น'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredPlayers.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              แสดง {filteredPlayers.length} จาก {serverData?.players.length || 0} ผู้เล่น
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;