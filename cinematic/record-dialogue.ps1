$ErrorActionPreference='Stop'
$assetDir=(Resolve-Path 'cinematic/assets').Path
$dialogue=node -e "const fs=require('fs');const vm=require('vm');console.log(JSON.stringify(vm.runInNewContext(fs.readFileSync('cinematic/story.js','utf8')+';lines')))" | ConvertFrom-Json -AsHashtable
foreach($entry in $dialogue.GetEnumerator()){
  $speaker=New-Object -ComObject SAPI.SpVoice
  $voiceId=if($entry.Value[0] -eq 'ARIA'){'TTS_MS_EN-US_ZIRA_11.0'}else{'TTS_MS_EN-US_DAVID_11.0'}
  try{
    $token=New-Object -ComObject SAPI.SpObjectToken
    $token.SetId("HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Speech\Voices\Tokens\$voiceId")
    $speaker.Voice=$token
  }catch{ Write-Output "Using system default for $($entry.Key)" }
  $speaker.Rate=if($entry.Value[0] -eq 'ECHO-7'){-1}else{0}
  $stream=New-Object -ComObject SAPI.SpFileStream
  $stream.Open((Join-Path $assetDir "$($entry.Key).wav"),3,$false)
  try{$speaker.AudioOutputStream=$stream;[void]$speaker.Speak($entry.Value[1])}finally{$stream.Close()}
}
Get-ChildItem cinematic/assets/*.wav | Select-Object Name,Length
