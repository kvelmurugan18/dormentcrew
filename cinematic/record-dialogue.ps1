param([string[]]$Only)

$ErrorActionPreference='Stop'
$assetDir=(Resolve-Path 'cinematic/assets').Path
$dialogue=node -e "const fs=require('fs');const vm=require('vm');const files=['cinematic/archive-data.js','cinematic/story.js'];console.log(JSON.stringify(vm.runInNewContext(files.map(path=>fs.readFileSync(path,'utf8')).join(String.fromCharCode(10))+';lines')))" | ConvertFrom-Json -AsHashtable
foreach($entry in $dialogue.GetEnumerator()){
  if($Only -and $entry.Key -notin $Only){continue}
  $speaker=New-Object -ComObject SAPI.SpVoice
  $voiceId=if($entry.Value[0] -eq 'YUVA'){'TTS_MS_EN-US_ZIRA_11.0'}else{'TTS_MS_EN-US_DAVID_11.0'}
  try{
    $token=New-Object -ComObject SAPI.SpObjectToken
    $token.SetId("HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech\Voices\Tokens\$voiceId")
    $speaker.Voice=$token
  }catch{ Write-Output "Using system default for $($entry.Key)" }
  $speaker.Rate=if($entry.Value[0] -eq 'E.D.I.T.H.'){-1}else{0}
  $stream=New-Object -ComObject SAPI.SpFileStream
  $stream.Open((Join-Path $assetDir "$($entry.Key).wav"),3,$false)
  try{$speaker.AudioOutputStream=$stream;[void]$speaker.Speak($entry.Value[1])}finally{$stream.Close()}
}
Get-ChildItem cinematic/assets/*.wav | Select-Object Name,Length
