$folders = @(
    "server\config",
    "server\core",
    "server\systems",
    "client\css\base",
    "client\css\screens",
    "client\css\hud",
    "client\js\engine",
    "client\js\player",
    "client\js\network",
    "client\js\audio",
    "client\js\ui",
    "client\js\mobile",
    "client\js\utils",
    "client\js\maps\map_01_forest",
    "client\js\maps\map_02_bunker",
    "client\js\maps\shared",
    "client\js\weapons\guns",
    "client\js\weapons\throwables",
    "client\js\weapons\special",
    "client\js\weapons\pickups",
    "client\js\weapons\effects",
    "client\assets\textures\terrain\grass",
    "client\assets\textures\terrain\dirt",
    "client\assets\textures\terrain\rock",
    "client\assets\textures\environment\concrete",
    "client\assets\textures\environment\brick",
    "client\assets\textures\sky",
    "client\assets\textures\weapons",
    "client\assets\sounds\weapons\rifle",
    "client\assets\sounds\weapons\pistol",
    "client\assets\sounds\weapons\shotgun",
    "client\assets\sounds\weapons\grenade",
    "client\assets\sounds\player\footsteps\grass",
    "client\assets\sounds\player\footsteps\concrete",
    "client\assets\sounds\player\hurt",
    "client\assets\sounds\voice\scary",
    "client\assets\sounds\voice\announcer",
    "client\assets\sounds\ambient\forest",
    "client\assets\sounds\ambient\bunker",
    "client\assets\sounds\ui",
    "client\assets\models\weapons",
    "client\assets\models\characters",
    "client\assets\models\environment",
    "client\assets\data"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Force -Path $folder | Out-Null
    Write-Host "Created: $folder" -ForegroundColor Green
}

Write-Host ""
Write-Host "All folders created successfully!" -ForegroundColor Cyan