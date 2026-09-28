import os
f = open('src/app/chat/s/[serverName]/page.tsx', 'r')
lines = f.readlines()
f.close()
idx = next(i for i, l in enumerate(lines) if 'form onSubmit={(e) => handleSend(e)}' in l and 'flex items-end' in l)
indent = lines[idx][:len(lines[idx]) - len(lines[idx].lstrip())]
lines.insert(idx, indent + '<ChatGamesBar onLaunchGame={(type) => { setActiveGameType(type); setShowGameLauncher(true); }} channelId={channelId} serverName={serverName} />\n')
f = open('src/app/chat/s/[serverName]/page.tsx', 'w')
f.writelines(lines)
f.close()
print('SUCCESS at line', idx + 1)
